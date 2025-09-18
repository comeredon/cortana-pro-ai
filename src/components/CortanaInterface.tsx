import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SignOut, Microphone, ClockCounterClockwise, CaretDown, TestTube } from '@phosphor-icons/react'
import VoiceChat from './VoiceChat'
import ConversationHistory from './ConversationHistory'
import ProfileSettings from './ProfileSettings'

import { toast } from 'sonner'

interface CortanaInterfaceProps {
  onLogout: () => void
}

export default function CortanaInterface({ onLogout }: CortanaInterfaceProps) {
  const [activeTab, setActiveTab] = useState('voice')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)

  // Connection testing functionality has been integrated into the main WebPubSub client
  useEffect(() => {
    setConnectionTested(true)
  }, [])

  const handleTestConnection = async () => {
    toast.info('🧪 Connection testing is now integrated into the main client')
    console.log('WebPubSub connection status is available in the Voice Chat tab')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-card/50 rounded-lg p-2 -ml-2 transition-colors">
                <Avatar className="h-10 w-10 bg-accent/20 border-2 border-accent/30 hover:border-accent/50 transition-all">
                  <AvatarFallback className="text-accent font-semibold text-sm">
                    C
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <div>
                    <h1 className="font-semibold text-foreground">Cortana</h1>
                    <p className="text-sm text-muted-foreground">AI Assistant</p>
                  </div>
                  <CaretDown size={16} className="text-muted-foreground" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-accent/20 border-2 border-accent/30">
                    <AvatarFallback className="text-accent font-semibold">
                      C
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-foreground">Cortana</h2>
                    <p className="text-sm text-muted-foreground">AI Assistant Profile</p>
                  </div>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <ProfileSettings />
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestConnection}
              className="text-muted-foreground hover:text-foreground"
            >
              <TestTube size={18} className="mr-2" />
              Test Connection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <SignOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Microphone size={18} />
              Voice Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <ClockCounterClockwise size={18} />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice" className="mt-0">
            <VoiceChat />
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <ConversationHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}