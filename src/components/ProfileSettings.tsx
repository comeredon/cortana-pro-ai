import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { toast } from 'sonner'
import { User, Robot, Sliders } from '@phosphor-icons/react'

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

export default function ProfileSettings() {
  const [preferences, setPreferences] = useLocalStorage<AIPreferences>('cortana-ai-preferences', defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)

  const currentPreferences = preferences || defaultPreferences

  const updatePreference = (key: keyof AIPreferences, value: string | boolean) => {
    setPreferences(current => ({
      ...(current || defaultPreferences),
      [key]: value
    }))
    setHasChanges(true)
  }

  const savePreferences = () => {
    toast.success('AI preferences saved successfully')
    setHasChanges(false)
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
    setHasChanges(true)
    toast.info('Preferences reset to defaults')
  }

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <User size={20} className="text-accent" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
              <User size={24} className="text-accent" />
            </div>
            <div>
              <p className="font-medium">Welcome to Cortana</p>
              <p className="text-sm text-muted-foreground">Customize your AI assistant experience</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Robot size={20} className="text-primary" />
            AI Assistant Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personality */}
          <div className="space-y-2">
            <Label htmlFor="personality">Personality Style</Label>
            <Select value={currentPreferences.personality} onValueChange={(value) => updatePreference('personality', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select personality style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional & Formal</SelectItem>
                <SelectItem value="friendly">Friendly & Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                <SelectItem value="calm">Calm & Measured</SelectItem>
                <SelectItem value="witty">Witty & Humorous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Response Length */}
          <div className="space-y-2">
            <Label htmlFor="responseLength">Response Length</Label>
            <Select value={currentPreferences.responseLength} onValueChange={(value) => updatePreference('responseLength', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select response length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief & Concise</SelectItem>
                <SelectItem value="medium">Medium Detail</SelectItem>
                <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Formality Level */}
          <div className="space-y-2">
            <Label htmlFor="formality">Communication Style</Label>
            <Select value={currentPreferences.formality} onValueChange={(value) => updatePreference('formality', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select formality level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Very Formal</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="casual">Casual & Relaxed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={currentPreferences.voice} onValueChange={(value) => updatePreference('voice', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US-AriaNeural">Aria (Female, Natural)</SelectItem>
                <SelectItem value="en-US-JennyNeural">Jenny (Female, Assistant)</SelectItem>
                <SelectItem value="en-US-GuyNeural">Guy (Male, Conversational)</SelectItem>
                <SelectItem value="en-US-DavisNeural">Davis (Male, Professional)</SelectItem>
                <SelectItem value="en-US-AmberNeural">Amber (Female, Warm)</SelectItem>
                <SelectItem value="en-US-AnaNeural">Ana (Female, Young)</SelectItem>
                <SelectItem value="en-US-BrandonNeural">Brandon (Male, Young)</SelectItem>
                <SelectItem value="en-US-ChristopherNeural">Christopher (Male, Mature)</SelectItem>
                <SelectItem value="en-US-CoraNeural">Cora (Female, Calm)</SelectItem>
                <SelectItem value="en-US-ElizabethNeural">Elizabeth (Female, Professional)</SelectItem>
                <SelectItem value="en-US-EricNeural">Eric (Male, Clear)</SelectItem>
                <SelectItem value="en-US-JacobNeural">Jacob (Male, Friendly)</SelectItem>
                <SelectItem value="en-US-JaneNeural">Jane (Female, Neutral)</SelectItem>
                <SelectItem value="en-US-JasonNeural">Jason (Male, Energetic)</SelectItem>
                <SelectItem value="en-US-MichelleNeural">Michelle (Female, Expressive)</SelectItem>
                <SelectItem value="en-US-MonicaNeural">Monica (Female, Confident)</SelectItem>
                <SelectItem value="en-US-NancyNeural">Nancy (Female, Mature)</SelectItem>
                <SelectItem value="en-US-RogerNeural">Roger (Male, Authority)</SelectItem>
                <SelectItem value="en-US-SaraNeural">Sara (Female, Bright)</SelectItem>
                <SelectItem value="en-US-SteffanNeural">Steffan (Male, Articulate)</SelectItem>
                <SelectItem value="en-US-TonyNeural">Tony (Male, Deep)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the voice that Cortana will use for spoken responses
            </p>
          </div>

          <Separator />

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="customPrompt"
              placeholder="Add any specific instructions for how Cortana should behave or respond..."
              value={currentPreferences.customPrompt}
              onChange={(e) => updatePreference('customPrompt', e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be included in every conversation with Cortana
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Audio Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sliders size={20} className="text-accent" />
            Voice & Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="voiceEnabled">Enable Voice Responses</Label>
              <p className="text-sm text-muted-foreground">Allow Cortana to speak responses aloud</p>
            </div>
            <Switch
              id="voiceEnabled"
              checked={currentPreferences.voiceEnabled}
              onCheckedChange={(checked) => updatePreference('voiceEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoSpeak">Auto-speak Responses</Label>
              <p className="text-sm text-muted-foreground">Automatically speak responses without manual trigger</p>
            </div>
            <Switch
              id="autoSpeak"
              checked={currentPreferences.autoSpeak}
              onCheckedChange={(checked) => updatePreference('autoSpeak', checked)}
              disabled={!currentPreferences.voiceEnabled}
            />
          </div>

          {currentPreferences.voiceEnabled && (
            <>
              <Separator />
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Selected Voice:</strong> {
                    currentPreferences.voice === 'en-US-AriaNeural' ? 'Aria (Female, Natural)' :
                    currentPreferences.voice === 'en-US-JennyNeural' ? 'Jenny (Female, Assistant)' :
                    currentPreferences.voice === 'en-US-GuyNeural' ? 'Guy (Male, Conversational)' :
                    currentPreferences.voice === 'en-US-DavisNeural' ? 'Davis (Male, Professional)' :
                    currentPreferences.voice === 'en-US-AmberNeural' ? 'Amber (Female, Warm)' :
                    currentPreferences.voice === 'en-US-AnaNeural' ? 'Ana (Female, Young)' :
                    currentPreferences.voice === 'en-US-BrandonNeural' ? 'Brandon (Male, Young)' :
                    currentPreferences.voice === 'en-US-ChristopherNeural' ? 'Christopher (Male, Mature)' :
                    currentPreferences.voice === 'en-US-CoraNeural' ? 'Cora (Female, Calm)' :
                    currentPreferences.voice === 'en-US-ElizabethNeural' ? 'Elizabeth (Female, Professional)' :
                    currentPreferences.voice === 'en-US-EricNeural' ? 'Eric (Male, Clear)' :
                    currentPreferences.voice === 'en-US-JacobNeural' ? 'Jacob (Male, Friendly)' :
                    currentPreferences.voice === 'en-US-JaneNeural' ? 'Jane (Female, Neutral)' :
                    currentPreferences.voice === 'en-US-JasonNeural' ? 'Jason (Male, Energetic)' :
                    currentPreferences.voice === 'en-US-MichelleNeural' ? 'Michelle (Female, Expressive)' :
                    currentPreferences.voice === 'en-US-MonicaNeural' ? 'Monica (Female, Confident)' :
                    currentPreferences.voice === 'en-US-NancyNeural' ? 'Nancy (Female, Mature)' :
                    currentPreferences.voice === 'en-US-RogerNeural' ? 'Roger (Male, Authority)' :
                    currentPreferences.voice === 'en-US-SaraNeural' ? 'Sara (Female, Bright)' :
                    currentPreferences.voice === 'en-US-SteffanNeural' ? 'Steffan (Male, Articulate)' :
                    currentPreferences.voice === 'en-US-TonyNeural' ? 'Tony (Male, Deep)' :
                    'Unknown Voice'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Change voice selection in AI Assistant Preferences above
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button 
          onClick={savePreferences}
          disabled={!hasChanges}
          className="bg-accent hover:bg-accent/90"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  )
}