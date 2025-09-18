import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!password) {
      toast.error('Please enter a password')
      return
    }

    setIsLoading(true)
    
    // Simulate authentication - in real app, this would validate against a secure backend
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (password === 'cortana' || password.length >= 6) {
      toast.success('Welcome to Cortana')
      onLogin()
    } else {
      toast.error('Invalid password. Use "cortana" or any 6+ character password.')
    }
    
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-accent/10 rounded-full">
              <Sparkle size={32} className="text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Cortana AI Assistant
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your password to access your AI assistant
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" 
              />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 focus:border-accent"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Demo: Use "cortana" or any password with 6+ characters
            </p>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Access Cortana'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}