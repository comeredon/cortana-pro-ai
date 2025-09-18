import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChatText, ArrowLeft } from '@phosphor-icons/react'
import VoiceChatSimple from './components/VoiceChatSimple'
import ConversationHistory from './components/ConversationHistory'

function App() {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      {/* Always keep VoiceChatSimple mounted to maintain WebPubSub connection */}
      <div style={{ display: showHistory ? 'none' : 'block' }}>
        <div className="min-h-screen bg-black relative">
          {/* Navigation Buttons */}
          <div className="absolute top-16 right-16 z-20 flex flex-col gap-3">
            <Button
              onClick={() => {
                console.log('Messages button clicked!')
                setShowHistory(true)
              }}
              variant="ghost"
              size="sm"
              className="text-green-400 hover:text-green-300 hover:bg-green-400/10 cursor-pointer px-4 py-2"
              style={{
                position: 'relative',
                zIndex: 1000,
                pointerEvents: 'auto'
              }}
            >
              <ChatText size={20} className="mr-2" />
              Messages
            </Button>
          </div>

          {/* Voice Chat Interface - Let it handle its own centering */}
          <VoiceChatSimple />
        </div>
      </div>
      
      {/* History overlay when showing history */}
      {showHistory && (
        <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
          {/* Header with Back Button */}
          <header className="flex-shrink-0 p-8 pb-6 border-b border-green-400/20">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <Button
                onClick={() => setShowHistory(false)}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 hover:bg-green-400/10 px-4 py-2"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Cortana
              </Button>
              <h1 className="text-xl font-light text-green-400">Voice Transcripts</h1>
              <div className="w-32"></div> {/* Spacer for centering */}
            </div>
          </header>
          
          {/* Conversation History Content - Make it properly scrollable */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full p-8 pt-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <ConversationHistory />
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  )
}

export default App