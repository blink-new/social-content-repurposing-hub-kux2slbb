import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Separator } from '../components/ui/separator'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Settings as SettingsIcon, Bell, Shield, Palette, User, Globe, BookOpen, Plus, X } from 'lucide-react'
import { useState } from 'react'

export function Settings() {
  const [linkedinProfile, setLinkedinProfile] = useState('')
  const [newsletterUrl, setNewsletterUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [topicUrls, setTopicUrls] = useState<string[]>([''])

  const addTopicUrl = () => {
    setTopicUrls([...topicUrls, ''])
  }

  const removeTopicUrl = (index: number) => {
    setTopicUrls(topicUrls.filter((_, i) => i !== index))
  }

  const updateTopicUrl = (index: number, value: string) => {
    const updated = [...topicUrls]
    updated[index] = value
    setTopicUrls(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application preferences
        </p>
      </div>

      {/* AI Personalization Section - Full Width */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>AI Personalization</span>
          </CardTitle>
          <CardDescription>
            Help AI write content in your voice and style by providing your profiles and inspiration sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin-profile">LinkedIn Profile URL</Label>
              <Input
                id="linkedin-profile"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinProfile}
                onChange={(e) => setLinkedinProfile(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                AI will analyze your LinkedIn posts to learn your writing style
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newsletter-url">Newsletter URL</Label>
              <Input
                id="newsletter-url"
                type="url"
                placeholder="https://yoursubstack.com or newsletter URL"
                value={newsletterUrl}
                onChange={(e) => setNewsletterUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                AI will study your newsletter tone and content structure
              </p>
            </div>
          </div>

          <Separator />

          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Content Language</span>
            </Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">🇺🇸 English</SelectItem>
                <SelectItem value="french">🇫🇷 French</SelectItem>
                <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the language for AI-generated content
            </p>
          </div>

          <Separator />

          {/* Topic Inspiration Sources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Topic Inspiration Sources</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopicUrl}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Source</span>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Add URLs from YouTube, LinkedIn profiles, social accounts, or any content you want AI to learn from
            </p>

            <div className="space-y-3">
              {topicUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or any social URL"
                    value={url}
                    onChange={(e) => updateTopicUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  {topicUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTopicUrl(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Personalization Settings</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>Account Settings</span>
            </CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Your Name" />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your content
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Conversion Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when content conversion is complete
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Scheduling Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders for scheduled posts
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly performance summaries
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Platform Connections</span>
            </CardTitle>
            <CardDescription>
              Connect your social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'LinkedIn', connected: true, color: 'bg-blue-600' },
              { name: 'X (Twitter)', connected: false, color: 'bg-black' },
              { name: 'Instagram', connected: true, color: 'bg-pink-500' },
              { name: 'TikTok', connected: false, color: 'bg-red-500' },
              { name: 'Threads', connected: false, color: 'bg-purple-500' }
            ].map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${platform.color} rounded-lg`}></div>
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button variant={platform.connected ? "outline" : "default"} size="sm">
                  {platform.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch to dark theme
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Drafts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save your work
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Smart Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  AI-powered content suggestions
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <select className="w-full p-2 border rounded-lg">
                <option>GPT-4 Mini (Recommended)</option>
                <option>GPT-4</option>
                <option>Claude Sonnet</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}