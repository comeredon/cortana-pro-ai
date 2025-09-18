import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Microphone, Stop, Waveform } from '@phosphor-icons/react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { toast } from 'sonner'
import { useDirectWebPubSubClient, DirectWebPubSubMessage } from '../hooks/useDirectWebPubSubClientBrowser'
import { AIMessage } from '../services/aiService'

// Speech Recognition types for browser API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

// Use AIMessage from service layer
type Message = AIMessage

interface AIPreferences {
  personality: string
  responseLength: string
  formality: string
  voice: string
  customPrompt: string
  voiceEnabled: boolean
  autoSpeak: boolean
}

const defaultPreferences: AIPreferences = {
  personality: 'professional',
  responseLength: 'medium',
  formality: 'balanced',
  voice: 'en-US-AriaNeural',
  customPrompt: '',
  voiceEnabled: true,
  autoSpeak: true
}

export default function VoiceChatSimple() {
  const [messages, setMessages] = useLocalStorage<Message[]>('cortana-messages', [])
  const [preferences] = useLocalStorage<AIPreferences>('cortana-ai-preferences', defaultPreferences)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])  

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isInitializingRef = useRef<boolean>(false)
  const connectionStateRef = useRef({ isConnected: false, lastUpdate: 0 })
  
  // Generate unique instance ID to prevent duplicate broadcasts from multiple browser tabs/instances
  const instanceIdRef = useRef<string>(
    `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )
  
  // Track last processed transcript to prevent rapid duplicates
  const lastProcessedRef = useRef<{ text: string; timestamp: number } | null>(null)
  
  // Track good morning greeting state
  const [isAwaitingDailyActivities, setIsAwaitingDailyActivities] = useState(false)
  
  // Create ref for speakMessage to avoid circular dependencies
  const speakMessageRef = useRef<((text: string) => Promise<void>) | null>(null)

  const currentPreferences = preferences || defaultPreferences

  // Handle incoming Simple WebSocket messages
  const handleWebSocketMessage = useCallback((message: DirectWebPubSubMessage) => {
    console.log('📨 Received WebSocket message:', message)
    
    // Check if this is a group message with text content
    if (message.type === 'group-message' && message.payload) {
      let messageText = ''
      
      try {
        const messageData = message.payload.message || message.payload.data || message.payload
        
        // Skip our own message echoes by checking if we just sent this same text
        const recentSentMessage = lastProcessedRef.current
        if (recentSentMessage && 
            typeof messageData === 'string' && 
            messageData === recentSentMessage.text && 
            (Date.now() - recentSentMessage.timestamp) < 10000) {
          console.log('🔄 Skipping own message echo:', messageData)
          return
        }
        
        // Additional check: skip if this looks like user input (short, conversational)
        if (typeof messageData === 'string' && messageData.length < 100 && 
            (messageData.toLowerCase().includes('good morning') || 
             messageData.toLowerCase().includes('hello') ||
             messageData.toLowerCase().includes('hi there'))) {
          console.log('🔄 Skipping likely user message:', messageData)
          return
        }
        
        // Parse JSON format similar to sendToGroup structure
        if (typeof messageData === 'string') {
          try {
            const parsedData = JSON.parse(messageData)
            console.log('📋 Parsed JSON message:', parsedData)
            
            // Extract text from the JSON structure
            if (parsedData.data) {
              messageText = parsedData.data
            } else if (parsedData.text) {
              messageText = parsedData.text
            } else {
              messageText = messageData // Fallback to raw string
            }
          } catch (parseError) {
            console.log('📝 Message is plain text, not JSON:', messageData)
            messageText = messageData // Not JSON, use as plain text
          }
        } else if (messageData && typeof messageData === 'object') {
          // Already parsed object
          messageText = messageData.data || messageData.text || JSON.stringify(messageData)
        } else {
          messageText = String(messageData || '')
        }
        
        console.log('💬 Extracted message text:', messageText)
        
        // Create a new received message
        const receivedMessage: Message = {
          id: message.id || `received-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: messageText,
          sender: 'cortana', // Received messages are from other users/system
          timestamp: new Date(message.timestamp || Date.now()),
          isAudio: false,
          processing: false
        }
        
        console.log('💬 Adding received message to chat:', receivedMessage)
        setMessages(currentMessages => [...(currentMessages || []), receivedMessage])
        
        // Speak the received message aloud using Azure TTS
        console.log('🔊 Calling speakMessage directly with text:', messageText.substring(0, 50) + '...')
        speakMessage(messageText)
        
        // If we're awaiting daily activities, this is probably the response we're waiting for
        if (isAwaitingDailyActivities) {
          console.log('📋 Daily activities received! Reading aloud...')
          setIsAwaitingDailyActivities(false) // Reset the flag
          toast.success('Daily activities received!')
        } else {
          // Show notification for regular received message
          toast.info('New message received!')
        }
        
      } catch (error) {
        console.error('❌ Error processing received message:', error)
      }
    }
  }, [setMessages, isAwaitingDailyActivities, setIsAwaitingDailyActivities])

  // Handle Simple WebSocket errors
  const handleWebSocketError = useCallback((error: any) => {
    console.error('Simple WebSocket error:', error)
    toast.error('Connection error. Please check your network.')
  }, [])

  console.log('VoiceChatSimple: About to initialize Simple WebSocket client...')
  
  // Azure Web PubSub client connection
  const {
    isConnected,
    isConnecting,
    connectionError,
    sendMessage,
    sendToGroup,
    connect,
    disconnect
  } = useDirectWebPubSubClient(
    {
      endpoint: import.meta.env.VITE_WEBPUBSUB_ENDPOINT || 'https://cortanawps.webpubsub.azure.com',
      hubName: import.meta.env.VITE_WEBPUBSUB_HUB_NAME || 'cortana',
      userId: 'cortana-ui',
      clientUrl: import.meta.env.VITE_WEBPUBSUB_CLIENT_URL, // JWT token URL
      groups: ['cortana-users'] // Join this group for messaging
    },
    handleWebSocketMessage,
    handleWebSocketError
  )
  
  console.log('VoiceChatSimple: Simple WebSocket client initialized. IsConnected:', isConnected, 'IsConnecting:', isConnecting)
  
  // Update connection state ref to persist across re-renders
  useEffect(() => {
    connectionStateRef.current = { 
      isConnected, 
      lastUpdate: Date.now() 
    }
  
  }, [isConnected, isConnecting])

  // Attempt connection once on component mount
  useEffect(() => {
    if (!isConnected && !isConnecting && !connectionError) {
      console.log('🔌 Attempting single Simple WebSocket connection...')
      connect().catch(error => {
        console.error('❌ Connection attempt failed:', error)
      })
    }
  }, [isConnected, isConnecting, connectionError, connect])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        console.log('🧹 Cleaning up speech recognition on unmount')
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  // Note: Pending transcript retry mechanism disabled to prevent duplicate messages
  // Backend API is reliable enough that we don't need retry queuing

  // Initialize speech recognition for voice-to-text
  const startRecording = useCallback(async () => {
    if (isRecording || isInitializingRef.current) {
      console.log('⚠️ Already recording or initializing, ignoring click')
      return
    }

    isInitializingRef.current = true

    try {
      console.log('🎤 START RECORDING BUTTON CLICKED')
      
      // Check if Speech Recognition is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.error('❌ Speech Recognition not supported')
        toast.error('Speech Recognition not supported in this browser')
        isInitializingRef.current = false
        return
      }
      
      console.log('✅ Speech Recognition is supported')
      console.log('🔍 Browser info:', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        vendor: navigator.vendor
      })
      
      // Check for microphone permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Microphone permission granted')
        stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      } catch (permError) {
        console.error('❌ Microphone permission denied:', permError)
        toast.error('Microphone access is required. Please allow microphone permissions and try again.')
        isInitializingRef.current = false
        return
      }

      // Set recording state after permissions are confirmed
      setIsRecording(true)

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configure recognition - try minimal settings first
      try {
        recognition.continuous = true  // Keep listening until manually stopped
        recognition.interimResults = true
        console.log('✅ Continuous and interimResults set successfully')
      } catch (configError) {
        console.log('⚠️ Advanced features not supported, using basic mode')
        recognition.continuous = false
        recognition.interimResults = false
      }
      
      // Don't set language at all - let browser use its absolute default
      console.log('🌐 Using browser default language (no explicit language set)')
      
      console.log('⚙️ Speech Recognition configured:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        defaultLang: recognition.lang || 'browser-default',
        browserLanguage: navigator.language,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      })

      recognition.onstart = () => {
        console.log('🎙️ Speech recognition started successfully!')
        // isRecording is already set to true above
        toast.info('Listening... Speak now!')
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Show interim results for user feedback
        if (interimTranscript) {
          console.log('�️ Speaking:', interimTranscript)
        }

        // Only process final results to avoid duplicates
        if (finalTranscript.trim()) {
          console.log('✅ Final transcript:', finalTranscript)
          processTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error)
        setIsRecording(false)
        setIsTranscribing(false)
        isInitializingRef.current = false
        
        if (event.error === 'no-speech') {
          toast.info('No speech detected. Please try again.')
        } else if (event.error === 'network') {
          toast.error('Network error. Please check your connection.')
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone permissions.')
        } else if (event.error === 'language-not-supported') {
          toast.error('Speech recognition language not supported. Try using a different browser.')
        } else {
          toast.error(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        console.log('🔚 Speech recognition ended')
        
        // If we're supposed to be recording but recognition ended unexpectedly, restart it
        if (isRecording && !isInitializingRef.current) {
          console.log('🔄 Recognition ended unexpectedly, restarting...')
          try {
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.start()
                console.log('✅ Recognition restarted successfully')
              }
            }, 100) // Small delay to avoid rapid restart issues
          } catch (restartError) {
            console.log('❌ Could not restart recognition:', restartError)
            setIsRecording(false)
            setIsTranscribing(false)
            isInitializingRef.current = false
            toast.info('Microphone stopped')
          }
        } else {
          setIsRecording(false)
          setIsTranscribing(false)
          isInitializingRef.current = false
          toast.info('Stopped listening')
        }
      }

      // Start recognition
      console.log('🚀 Starting speech recognition...')
      recognition.start()
      console.log('✅ Speech recognition start() called')
      isInitializingRef.current = false

    } catch (error) {
      console.error('❌ Error starting speech recognition:', error)
      toast.error('Failed to start voice recognition. Please try again.')
      setIsRecording(false)
      isInitializingRef.current = false
    }
  }, [isRecording]) // Add dependency array for useCallback

  const stopRecording = useCallback(() => {
    console.log('🛑 STOP RECORDING BUTTON CLICKED')
    if (recognitionRef.current) {
      console.log('🛑 Stopping speech recognition')
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setIsTranscribing(false)
    isInitializingRef.current = false
  }, [])

  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      // No text detected - handled silently
      return
    }

    // Prevent duplicate processing of the same transcript within 2 seconds
    const now = Date.now()
    if (lastProcessedRef.current && 
        lastProcessedRef.current.text === transcript.trim() && 
        (now - lastProcessedRef.current.timestamp) < 2000) {
      console.log('🚫 Duplicate transcript detected, skipping:', transcript)
      return
    }

    // Update last processed tracker
    lastProcessedRef.current = { text: transcript.trim(), timestamp: now }

    setIsTranscribing(true)
    
    try {
      console.log('📝 Processing transcript:', transcript)
      
      // Add user message with the transcript
      const userMessage: Message = {
        id: Date.now().toString(),
        text: transcript,
        sender: 'user',
        timestamp: new Date(),
        isAudio: false, // This is now text, not audio
        processing: false
      }
      
      setMessages(currentMessages => [...(currentMessages || []), userMessage])
      
      // Send transcript directly via Simple WebSocket (immediate delivery)
      try {
        console.log('🎙️ Broadcasting voice transcript via WebPubSub...')
        
        // Send the transcript text directly as the message data
        console.log('📤 Sending transcript text to cortana-users group:', transcript)
        console.log('🔍 Connection status (state):', { isConnected, isConnecting, connectionError })
        console.log('🔍 Connection status (ref):', connectionStateRef.current)
        
        // Check both state and ref for connection (handle React timing issues)
        const actuallyConnected = isConnected || connectionStateRef.current.isConnected
        const recentConnection = (Date.now() - connectionStateRef.current.lastUpdate) < 5000 // Within last 5 seconds
        
        console.log('🔍 Connection check:', { 
          actuallyConnected, 
          recentConnection, 
          timeSinceLastUpdate: Date.now() - connectionStateRef.current.lastUpdate 
        })
        
        if (!actuallyConnected) {
          console.error('❌ Cannot send message: WebPubSub not connected')
          console.log('🔍 Connection details:', { 
            stateConnected: isConnected, 
            refConnected: connectionStateRef.current.isConnected,
            isConnecting, 
            connectionError 
          })
          
          // If we had a recent connection, try anyway (might be a timing issue)
          if (recentConnection) {
            console.log('⚠️ Recent connection detected, attempting send anyway...')
          } else {
            toast.error('Not connected to WebPubSub. Please wait for connection and try again.')
            return
          }
        }
        
        // Debug the client state before sending
        console.log('🔍 Debug info before sending:', {
          isConnected,
          isConnecting,
          connectionError,
          sendToGroupType: typeof sendToGroup,
          transcriptText: transcript
        })
        
      // Check for good morning greeting before sending
      const isGoodMorningMessage = transcript.toLowerCase().includes('good morning')
      
      // Send the transcript text directly (not wrapped in JSON)
      await sendToGroup('cortana-users', transcript, 'text')
      console.log('✅ sendToGroup call completed successfully')
      
      // Add the sent message to local messages array
      const sentMessage: Message = {
        id: `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: transcript,
        sender: 'user',
        timestamp: new Date(),
        isAudio: true, // This was a voice message
        processing: false
      }
      
      console.log('💬 Adding sent voice message to chat:', sentMessage)
      setMessages(currentMessages => [...(currentMessages || []), sentMessage])
      
      // Handle good morning greeting - just wait for WebPubSub response
      if (isGoodMorningMessage) {
        console.log('🌅 Good morning greeting detected! Waiting for daily activities from WebPubSub...')
        setIsAwaitingDailyActivities(true)
        console.log('⏳ Now listening for incoming daily activities message...')
      }
      
      // Record this message for echo detection
      lastProcessedRef.current = { text: transcript, timestamp: Date.now() }
      
      console.log('📊 VOICE TRANSCRIPT BROADCAST: "' + transcript + '" - SUCCESS! ✅')
      toast.success('Voice message sent!')
        
      } catch (error) {
        console.error('❌ Failed to broadcast voice transcript:', error)
        console.error('❌ Error details:', error)
        
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message)
          console.error('❌ Error stack:', error.stack)
          toast.error(`Failed to send voice message: ${error.message}`)
        } else {
          toast.error('Failed to send voice message')
        }
      }
      
    } catch (error) {
      console.error('Error processing transcript:', error)
      // Voice processing error - handled silently
    } finally {
      setIsTranscribing(false)
    }
  }, [isConnected, isConnecting, connectionError, sendToGroup]) // Add dependencies

  // Azure AI Speech Services TTS function for high-quality voice synthesis
  const speakMessage = useCallback(async (text: string) => {
    console.log('🎤 speakMessage function called with text:', text.substring(0, 50) + '...')
    
    try {
      console.log('🔍 Importing Azure Speech SDK...')
      // Import Azure Speech SDK dynamically (browser-compatible)
      const speechSdk = await import('microsoft-cognitiveservices-speech-sdk')
      console.log('✅ Azure Speech SDK imported successfully')
      
      // Azure Speech Service configuration from environment variables
      const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const serviceRegion = import.meta.env.VITE_AZURE_SPEECH_REGION
      
      console.log('🔑 Speech key available:', !!speechKey, 'Region:', serviceRegion)
      
      if (!speechKey || !serviceRegion) {
        console.error('❌ Missing Azure Speech configuration:', { speechKey: !!speechKey, serviceRegion })
        throw new Error('Azure Speech Service configuration not found')
      }
      
      console.log('✅ Azure Speech configuration validated')
      
      // Create speech configuration
      const speechConfig = speechSdk.SpeechConfig.fromSubscription(speechKey, serviceRegion)
      
      // Use Jenny Neural voice with assistant style (Cortana-like experience)
      speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural' // Cortana-style AI assistant voice
      
      // Universal audio configuration that works across all browsers
      console.log('🔊 Creating universal audio configuration')
      const audioConfig = speechSdk.AudioConfig.fromDefaultSpeakerOutput()
      
      // Create the speech synthesizer
      const synthesizer = new speechSdk.SpeechSynthesizer(speechConfig, audioConfig)
      
      console.log('🔊 Azure AI Speech: Starting synthesis for:', text.substring(0, 50) + '...')
      
      // Ensure audio context is active (required for some browsers)
      try {
        // Create a dummy audio context to ensure browser audio permissions
        const testContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (testContext.state === 'suspended') {
          await testContext.resume()
        }
        testContext.close()
        console.log('✅ Audio context verified')
      } catch (contextError) {
        console.log('⚠️ Audio context warning (may still work):', contextError)
      }
      
      // Create SSML with balanced cheerful style for natural, positive Cortana experience
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
          <voice name="en-US-JennyNeural">
            <mstts:express-as style="friendly" styledegree="1.3">
              ${text}
            </mstts:express-as>
          </voice>
        </speak>
      `

      // Direct Azure TTS synthesis using default speaker output
      console.log('🎵 Using Azure TTS with default audio output')
      
      // Synthesize the speech using SSML with direct audio output
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === speechSdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('🔊 Azure AI Speech: Jenny Neural synthesis completed successfully')
          } else {
            console.error('❌ Azure AI Speech synthesis failed:', result.errorDetails)
          }
          synthesizer.close()
        },
        (error) => {
          console.error('❌ Azure AI Speech synthesis error:', error)
          synthesizer.close()
        }
      )
      
    } catch (error) {
      console.error('❌ Error with Azure AI Speech Services:', error)
      console.log('🔄 Falling back to Safari-compatible browser TTS...')
      
      // Safari-compatible fallback to browser TTS
      if (window.speechSynthesis) {
        // Ensure synthesis is ready
        window.speechSynthesis.cancel()
        
        // Wait a bit for Safari to be ready
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.pitch = 1.0  
          utterance.volume = 1.0
          
          // Use a more natural voice if available
          const voices = window.speechSynthesis.getVoices()
          const femaleVoice = voices.find(voice => 
            voice.name.includes('Samantha') || 
            voice.name.includes('Karen') || 
            voice.name.includes('Female') ||
            voice.name.includes('Susan') ||
            voice.name.toLowerCase().includes('female')
          )
          
          if (femaleVoice) {
            utterance.voice = femaleVoice
            console.log('🎤 Using browser voice:', femaleVoice.name)
          }
          
          // Add event listeners for debugging
          utterance.onstart = () => console.log('🎤 Browser TTS started')
          utterance.onend = () => console.log('🎤 Browser TTS completed')
          utterance.onerror = (e) => console.error('❌ Browser TTS error:', e)
          
          console.log('🎤 Starting Safari browser TTS...')
          window.speechSynthesis.speak(utterance)
        }, 100)
      } else {
        console.error('❌ No speech synthesis available')
      }
    }
  }, [])

  // Enhanced speech function with customizable style and degree for special occasions
  const speakMessageWithStyle = useCallback(async (text: string, style: string = "friendly", styleDegree: string = "1.3") => {
    try {
      // Import Azure Speech SDK dynamically (browser-compatible)
      const speechSdk = await import('microsoft-cognitiveservices-speech-sdk')
      
      // Azure Speech Service configuration from environment variables
      const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const serviceRegion = import.meta.env.VITE_AZURE_SPEECH_REGION
      
      if (!speechKey || !serviceRegion) {
        throw new Error('Azure Speech Service configuration not found')
      }
      
      // Create speech configuration
      const speechConfig = speechSdk.SpeechConfig.fromSubscription(speechKey, serviceRegion)
      
      // Use Jenny Neural voice with custom style
      speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural'
      
      // Create audio configuration for speaker output
      const audioConfig = speechSdk.AudioConfig.fromDefaultSpeakerOutput()
      
      // Create the speech synthesizer
      const synthesizer = new speechSdk.SpeechSynthesizer(speechConfig, audioConfig)
      
      console.log(`🔊 Azure AI Speech: Starting ${style} synthesis for:`, text.substring(0, 50) + '...')
      
      // Create SSML with custom style and degree
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
          <voice name="en-US-JennyNeural">
            <mstts:express-as style="${style}" styledegree="${styleDegree}">
              ${text}
            </mstts:express-as>
          </voice>
        </speak>
      `

      // Synthesize the speech using SSML
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === speechSdk.ResultReason.SynthesizingAudioCompleted) {
            console.log(`🔊 Azure AI Speech: ${style} synthesis completed successfully`)
          } else {
            console.error('❌ Azure AI Speech synthesis failed:', result.errorDetails)
          }
          synthesizer.close()
        },
        (error) => {
          console.error('❌ Azure AI Speech synthesis error:', error)
          synthesizer.close()
        }
      )
      
    } catch (error) {
      console.error('❌ Error with Azure AI Speech Services:', error)
      console.log('🔄 Falling back to regular speakMessage...')
      
      // Fallback to regular speakMessage if this fails
      speakMessage(text)
    }
  }, [speakMessage])

  // Advanced speech function with mixed styles within the same message
  const speakMessageWithMixedStyles = useCallback(async (textParts: {text: string, style?: string, degree?: string}[]) => {
    try {
      // Import Azure Speech SDK dynamically (browser-compatible)
      const speechSdk = await import('microsoft-cognitiveservices-speech-sdk')
      
      // Azure Speech Service configuration from environment variables
      const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const serviceRegion = import.meta.env.VITE_AZURE_SPEECH_REGION
      
      if (!speechKey || !serviceRegion) {
        throw new Error('Azure Speech Service configuration not found')
      }
      
      // Create speech configuration
      const speechConfig = speechSdk.SpeechConfig.fromSubscription(speechKey, serviceRegion)
      speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural'
      
      // Create audio configuration for speaker output
      const audioConfig = speechSdk.AudioConfig.fromDefaultSpeakerOutput()
      
      // Create the speech synthesizer
      const synthesizer = new speechSdk.SpeechSynthesizer(speechConfig, audioConfig)
      
      // Build SSML with multiple style sections
      const styleParts = textParts.map(part => {
        const style = part.style || 'friendly'
        const degree = part.degree || '1.3'
        return `<mstts:express-as style="${style}" styledegree="${degree}">${part.text}</mstts:express-as>`
      }).join(' ')
      
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
          <voice name="en-US-JennyNeural">
            ${styleParts}
          </voice>
        </speak>
      `
      
      console.log('🎭 Azure AI Speech: Mixed-style synthesis starting...')
      
      // Synthesize the speech using SSML
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === speechSdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('🎭 Azure AI Speech: Mixed-style synthesis completed successfully')
          } else {
            console.error('❌ Azure AI Speech synthesis failed:', result.errorDetails)
          }
          synthesizer.close()
        },
        (error) => {
          console.error('❌ Azure AI Speech synthesis error:', error)
          synthesizer.close()
        }
      )
      
    } catch (error) {
      console.error('❌ Error with mixed-style Azure AI Speech:', error)
      console.log('🔄 Falling back to regular speakMessage...')
      
      // Fallback to regular speech with combined text
      const combinedText = textParts.map(part => part.text).join(' ')
      speakMessage(combinedText)
    }
  }, [speakMessage])

  // Intelligent function to analyze received text and apply dynamic voice styling
  const speakReceivedMessageWithDynamicStyles = useCallback(async (text: string) => {
    try {
      // Split text into sentences and analyze each for appropriate voice style
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      
      const styledParts = sentences.map(sentence => {
        const trimmedSentence = sentence.trim()
        if (!trimmedSentence) return null
        
        // Add punctuation back if needed
        const finalSentence = trimmedSentence + (trimmedSentence.match(/[.!?]$/) ? '' : '.')
        
        // Analyze sentence content and determine appropriate style
        const lowerSentence = trimmedSentence.toLowerCase()
        
        // Greetings and positive openings - cheerful
        if (lowerSentence.includes('good morning') || 
            lowerSentence.includes('hello') ||
            lowerSentence.includes('have a great') ||
            lowerSentence.includes('wishing you') ||
            lowerSentence.includes('hope you') ||
            lowerSentence.includes('enjoy')) {
          return { text: finalSentence, style: 'cheerful', degree: '1.4' }
        }
        
        // Weather information - friendly but informative
        if (lowerSentence.includes('weather') || 
            lowerSentence.includes('temperature') ||
            lowerSentence.includes('rain') ||
            lowerSentence.includes('cloudy') ||
            lowerSentence.includes('sunny') ||
            lowerSentence.includes('degrees')) {
          return { text: finalSentence, style: 'friendly', degree: '1.2' }
        }
        
        // Schedule and appointments - professional but warm
        if (lowerSentence.includes('schedule') ||
            lowerSentence.includes('appointment') ||
            lowerSentence.includes('meeting') ||
            lowerSentence.includes('office') ||
            lowerSentence.includes('plan to leave') ||
            lowerSentence.includes('time') && (lowerSentence.includes('am') || lowerSentence.includes('pm'))) {
          return { text: finalSentence, style: 'assistant', degree: '1.1' }
        }
        
        // Important reminders and advice - slightly more serious but caring
        if (lowerSentence.includes('remember') ||
            lowerSentence.includes('don\'t forget') ||
            lowerSentence.includes('make sure') ||
            lowerSentence.includes('important') ||
            lowerSentence.includes('please') ||
            lowerSentence.includes('should')) {
          return { text: finalSentence, style: 'empathetic', degree: '1.3' }
        }
        
        // Suggestions and recommendations - helpful and friendly
        if (lowerSentence.includes('suggest') ||
            lowerSentence.includes('recommend') ||
            lowerSentence.includes('might') ||
            lowerSentence.includes('consider') ||
            lowerSentence.includes('try')) {
          return { text: finalSentence, style: 'hopeful', degree: '1.2' }
        }
        
        // Closing remarks and offers to help - warm and inviting
        if (lowerSentence.includes('let me know') ||
            lowerSentence.includes('if you need') ||
            lowerSentence.includes('help') ||
            lowerSentence.includes('anything else') ||
            lowerSentence.includes('feel free')) {
          return { text: finalSentence, style: 'friendly', degree: '1.4' }
        }
        
        // Exciting or positive content - excited
        if (lowerSentence.includes('great') ||
            lowerSentence.includes('excellent') ||
            lowerSentence.includes('wonderful') ||
            lowerSentence.includes('perfect') ||
            lowerSentence.includes('amazing')) {
          return { text: finalSentence, style: 'excited', degree: '1.3' }
        }
        
        // Default to friendly for neutral content
        return { text: finalSentence, style: 'friendly', degree: '1.2' }
        
      }).filter(Boolean) as {text: string, style: string, degree: string}[]
      
      console.log('🎭 Dynamic styling analysis:', styledParts.map(p => `"${p.text.substring(0, 30)}..." → ${p.style}(${p.degree})`))
      
      // Use the mixed-styles function to speak with dynamic voice changes
      if (styledParts.length > 0) {
        speakMessageWithMixedStyles(styledParts)
      }
      
    } catch (error) {
      console.error('❌ Error in dynamic styling analysis:', error)
      // Fallback to regular speech
      if (speakMessageRef.current) {
        speakMessageRef.current(text)
      }
    }
  }, [speakMessageWithMixedStyles, speakMessageRef])

  // Update the speakMessage ref when the function is defined
  useEffect(() => {
    speakMessageRef.current = speakMessage
  }, [speakMessage])

  return (
    <div 
      className="w-full h-screen flex flex-col items-center justify-center space-y-8"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      
      {/* Main Voice Button with Halo Effect */}
      <div className="relative flex items-center justify-center">
        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isTranscribing}
          className={`h-32 w-32 rounded-full transition-all duration-300 relative z-10 flex items-center justify-center ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isRecording ? (
            <Stop size={72} className="text-white" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }} />
          ) : (
            <Microphone size={72} className="text-white" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }} />
          )}
        </Button>
      </div>

      {/* Status Text - Only show when actively recording or processing */}
      {(isRecording || isProcessing || isTranscribing) && (
        <div className="text-center space-y-3 max-w-md flex flex-col items-center justify-center">
          {isRecording ? (
            <div className="flex items-center justify-center gap-3">
              <Waveform size={32} className="text-cyan-400 animate-pulse" />
              <span className="text-2xl font-light text-cyan-400">Listening...</span>
            </div>
          ) : (isProcessing || isTranscribing) ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="text-xl font-light text-cyan-400">
                {isTranscribing ? 'Processing...' : 'Thinking...'}
              </span>
            </div>
          ) : null}
        </div>
      )}



    </div>
  )
}