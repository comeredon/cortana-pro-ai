import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MagnifyingGlass, Trash, User, Robot, Calendar } from '@phosphor-icons/react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { toast } from 'sonner'

interface Message {
  id: string
  text: string
  sender: 'user' | 'cortana'
  timestamp: Date
  isAudio?: boolean
}

export default function ConversationHistory() {
  const [messages, setMessages] = useLocalStorage<Message[]>('cortana-messages', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const filteredMessages = (messages || []).filter(message => {
    const matchesSearch = !searchTerm || 
      message.text.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !selectedDate || 
      new Date(message.timestamp).toDateString() === new Date(selectedDate).toDateString()
    
    return matchesSearch && matchesDate
  })

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      setMessages([])
      toast.success('Conversation history cleared')
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const messageGroups = groupMessagesByDate(filteredMessages)

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-green-400/20 rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlass 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/50 border-green-400/30 text-white placeholder-gray-400"
            />
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-black/50 border-green-400/30 text-white"
          />
          <Button 
            variant="destructive" 
            size="sm"
            onClick={clearHistory}
            disabled={!messages || messages.length === 0}
            className="whitespace-nowrap"
          >
            <Trash size={16} className="mr-2" />
            Clear All
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total messages: {messages?.length || 0}</span>
          <span>Showing: {filteredMessages.length}</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-6 pb-8">
          {Object.keys(messageGroups).length === 0 ? (
            <div className="bg-gray-900/30 border border-green-400/20 rounded-lg p-12 text-center">
              <div className="text-gray-400 space-y-4">
                <div className="text-6xl mb-6">🎙️</div>
                <h3 className="text-xl font-light text-green-400">
                  {searchTerm || selectedDate ? 
                    'No messages found' :
                    'No conversations yet'
                  }
                </h3>
                {!searchTerm && !selectedDate && (
                  <div className="space-y-2 text-sm max-w-md mx-auto">
                    <p>Click the glowing green halo on the main screen to start talking with Cortana</p>
                    <p className="text-xs text-gray-500">All your voice transcripts and AI responses will appear here with full session memory</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            Object.entries(messageGroups)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayMessages]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-border flex-1"></div>
                    <Badge variant="secondary" className="px-3 py-1">
                      {formatDate(date)}
                    </Badge>
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  
                  <div className="space-y-4 px-2">
                    {dayMessages
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((message) => (
                        <div 
                          key={message.id}
                          className={`${
                            message.sender === 'user' 
                              ? 'ml-12 mr-4 bg-blue-500/10 border-blue-400/30' 
                              : 'mr-12 ml-4 bg-green-500/10 border-green-400/30'
                          } border rounded-lg transition-all duration-200 hover:border-opacity-50 backdrop-blur-sm`}
                        >
                          <div className="p-6">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                message.sender === 'user' 
                                  ? 'bg-accent/20' 
                                  : 'bg-primary/20'
                              }`}>
                                {message.sender === 'user' ? (
                                  <User size={16} className="text-accent" />
                                ) : (
                                  <Robot size={16} className="text-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium">
                                    {message.sender === 'user' ? 'You' : 'Cortana'}
                                  </span>
                                  {message.isAudio && (
                                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                                      🎙️ Voice
                                    </Badge>
                                  )}
                                  {message.id?.startsWith('broadcast-') && (
                                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400">
                                      📡 PubSub
                                    </Badge>
                                  )}
                                  {!message.isAudio && !message.id?.startsWith('broadcast-') && message.sender === 'user' && (
                                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400">
                                      📝 STT
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
    </div>
  )
}