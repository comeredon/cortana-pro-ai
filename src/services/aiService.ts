// Moved WebSocketMessage interface here since useWebSocket was removed
export interface WebSocketMessage {
  id: string
  type: 'text' | 'audio' | 'system' | 'error'
  payload: any
  timestamp: number
}

export interface AIMessage {
  id: string
  text: string
  sender: 'user' | 'cortana'
  timestamp: Date
  isAudio?: boolean
  audioUrl?: string
  processing?: boolean
}

export interface AIPreferences {
  personality: string
  responseLength: string
  formality: string
  voice: string
  customPrompt: string
  voiceEnabled: boolean
  autoSpeak: boolean
}

export interface AIServiceConfig {
  websocketUrl: string
  apiKey?: string
  userId?: string
  sessionId?: string
  accessToken?: string
  hub?: string
  negotiateUrl?: string
  azureResourceName?: string
  connectionString?: string
}

export class AIService {
  private config: AIServiceConfig
  private messageQueue: WebSocketMessage[] = []
  private isProcessing = false

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  // Create a message for the AI
  createTextMessage(text: string, preferences: AIPreferences, messageId?: string): WebSocketMessage {
    return {
      id: messageId || crypto.randomUUID(),
      type: 'text',
      payload: {
        text,
        preferences,
        userId: this.config.userId,
        sessionId: this.config.sessionId,
        metadata: {
          personality: preferences.personality,
          responseLength: preferences.responseLength,
          formality: preferences.formality,
          voice: preferences.voice,
          customPrompt: preferences.customPrompt,
          timestamp: Date.now()
        }
      },
      timestamp: Date.now()
    }
  }

  // Create an audio message for the AI
  createAudioMessage(audioBlob: Blob, preferences: AIPreferences, messageId?: string): Promise<WebSocketMessage> {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        
        const message: WebSocketMessage = {
          id: messageId || crypto.randomUUID(),
          type: 'audio',
          payload: {
            audio: base64Audio,
            mimeType: audioBlob.type || 'audio/wav',
            size: audioBlob.size,
            duration: this.estimateAudioDuration(audioBlob),
            preferences,
            userId: this.config.userId,
            sessionId: this.config.sessionId,
            metadata: {
              personality: preferences.personality,
              responseLength: preferences.responseLength,
              formality: preferences.formality,
              voice: preferences.voice,
              customPrompt: preferences.customPrompt,
              timestamp: Date.now(),
              audioFormat: audioBlob.type || 'audio/wav'
            }
          },
          timestamp: Date.now()
        }
        
        resolve(message)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Process incoming WebSocket messages
  processIncomingMessage(message: WebSocketMessage): AIMessage | null {
    switch (message.type) {
      case 'text':
        return {
          id: message.id,
          text: message.payload.text || message.payload.content || '',
          sender: 'cortana',
          timestamp: new Date(message.timestamp),
          isAudio: false
        }

      case 'audio':
        // Handle audio response from AI
        const audioUrl = this.createAudioUrl(message.payload.audio, message.payload.mimeType)
        return {
          id: message.id,
          text: message.payload.transcript || message.payload.text || '[Audio Response]',
          sender: 'cortana',
          timestamp: new Date(message.timestamp),
          isAudio: true,
          audioUrl
        }

      case 'system':
        // Handle system messages (status updates, etc.)
        if (message.payload?.type === 'processing') {
          return {
            id: message.id,
            text: 'Processing your request...',
            sender: 'cortana',
            timestamp: new Date(message.timestamp),
            processing: true
          }
        }
        break

      case 'error':
        return {
          id: message.id,
          text: message.payload.error || 'An error occurred while processing your request.',
          sender: 'cortana',
          timestamp: new Date(message.timestamp)
        }

      default:
        console.warn('Unknown message type:', message.type)
        return null
    }

    return null
  }

  // Create a user message from text input
  createUserMessage(text: string, messageId?: string): AIMessage {
    return {
      id: messageId || crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
      isAudio: false
    }
  }

  // Create a user message from audio input
  createUserAudioMessage(text: string, audioUrl?: string, messageId?: string): AIMessage {
    return {
      id: messageId || crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
      isAudio: true,
      audioUrl
    }
  }

  // Convert base64 audio to blob URL for playback
  private createAudioUrl(base64Audio: string, mimeType: string): string {
    try {
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType || 'audio/wav' })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Failed to create audio URL:', error)
      return ''
    }
  }

  // Estimate audio duration (rough calculation)
  private estimateAudioDuration(audioBlob: Blob): number {
    // This is a rough estimate - actual duration would require audio analysis
    // Assuming 16kHz, 16-bit mono audio: ~32KB per second
    const bytesPerSecond = 32000
    return Math.round(audioBlob.size / bytesPerSecond)
  }

  // Text-to-speech using Web Speech API as fallback
  async speakText(text: string, preferences: AIPreferences): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1

      // Try to set the voice based on preference
      const voices = speechSynthesis.getVoices()
      const preferredVoice = this.findPreferredVoice(voices, preferences.voice)
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (error) => reject(error)

      speechSynthesis.speak(utterance)
    })
  }

  // Find preferred voice from available voices
  private findPreferredVoice(voices: SpeechSynthesisVoice[], voicePreference: string): SpeechSynthesisVoice | null {
    // Map Microsoft voice names to characteristics
    const voiceMap: Record<string, { gender: 'male' | 'female', qualities: string[] }> = {
      'en-US-AriaNeural': { gender: 'female', qualities: ['natural', 'conversational'] },
      'en-US-JennyNeural': { gender: 'female', qualities: ['helpful', 'assistant'] },
      'en-US-GuyNeural': { gender: 'male', qualities: ['conversational', 'approachable'] },
      'en-US-DavisNeural': { gender: 'male', qualities: ['professional'] },
      'en-US-AmberNeural': { gender: 'female', qualities: ['warm', 'friendly'] },
      'en-US-AnaNeural': { gender: 'female', qualities: ['youthful', 'energetic'] },
      'en-US-BrandonNeural': { gender: 'male', qualities: ['young', 'modern'] },
      'en-US-ChristopherNeural': { gender: 'male', qualities: ['mature', 'wisdom'] },
      'en-US-CoraNeural': { gender: 'female', qualities: ['calm', 'soothing'] },
      'en-US-ElizabethNeural': { gender: 'female', qualities: ['professional', 'articulate'] }
    }

    const preference = voiceMap[voicePreference]
    if (!preference) {
      // Fallback to any English voice
      return voices.find(voice => voice.lang.startsWith('en')) || null
    }

    // Try to find a voice that matches the gender preference
    const genderMatch = voices.find(voice => {
      const name = voice.name.toLowerCase()
      if (preference.gender === 'female') {
        return (name.includes('female') || name.includes('woman') || 
                name.includes('aria') || name.includes('jenny') || 
                name.includes('amber') || name.includes('ana') || 
                name.includes('cora') || name.includes('elizabeth')) &&
               voice.lang.startsWith('en')
      } else {
        return (name.includes('male') || name.includes('man') ||
                name.includes('guy') || name.includes('davis') ||
                name.includes('brandon') || name.includes('christopher')) &&
               voice.lang.startsWith('en')
      }
    })

    return genderMatch || voices.find(voice => voice.lang.startsWith('en')) || null
  }

  // Generate session ID
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Update configuration
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): AIServiceConfig {
    return { ...this.config }
  }
}

// Default configuration
export const createAIService = (config?: Partial<AIServiceConfig>): AIService => {
  const defaultConfig: AIServiceConfig = {
    websocketUrl: 'wss://your-azure-webpubsub.webpubsub.azure.com/client/hubs/cortana',
    userId: localStorage.getItem('cortana-user-id') || `user_${Date.now()}`,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hub: 'cortana',
    ...config
  }

  // Store user ID in localStorage
  if (defaultConfig.userId && !localStorage.getItem('cortana-user-id')) {
    localStorage.setItem('cortana-user-id', defaultConfig.userId)
  }

  return new AIService(defaultConfig)
}