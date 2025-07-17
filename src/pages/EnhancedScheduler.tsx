import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2,
  Edit,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Mail,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  Lightbulb,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Settings,
  Filter
} from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-red-500' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'bg-purple-500' },
  { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'bg-green-600' }
]

interface TopicIdea {
  id: string
  title: string
  description: string
  source: string
  sourceUrl: string
  keywords: string[]
  trending: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedEngagement: number
  createdAt: Date
}

interface ContentDraft {
  id: string
  topicId?: string
  title: string
  content: string
  platform: string
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'failed'
  scheduledDate?: Date
  createdAt: Date
  lastModified: Date
  previewGenerated?: boolean
}

interface ScheduleSlot {
  id: string
  platform: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  time: string // HH:MM format
  isActive: boolean
  contentType?: string
}

export function EnhancedScheduler() {
  const [activeTab, setActiveTab] = useState('topics')
  const [topicIdeas, setTopicIdeas] = useState<TopicIdea[]>([])
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  
  // Form states
  const [selectedTopic, setSelectedTopic] = useState<TopicIdea | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const { toast } = useToast()

  // Load data from localStorage
  useEffect(() => {
    const savedTopics = localStorage.getItem('topicIdeas')
    const savedDrafts = localStorage.getItem('contentDrafts')
    const savedSlots = localStorage.getItem('scheduleSlots')
    
    if (savedTopics) {
      try {
        const parsed = JSON.parse(savedTopics).map((topic: any) => ({
          ...topic,
          createdAt: new Date(topic.createdAt)
        }))
        setTopicIdeas(parsed)
      } catch (error) {
        console.error('Error loading topics:', error)
      }
    }
    
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts).map((draft: any) => ({
          ...draft,
          createdAt: new Date(draft.createdAt),
          lastModified: new Date(draft.lastModified),
          scheduledDate: draft.scheduledDate ? new Date(draft.scheduledDate) : undefined
        }))
        setContentDrafts(parsed)
        
        // Check if there are new drafts (created in the last 5 seconds) and switch to drafts tab
        const recentDrafts = parsed.filter((draft: any) => 
          new Date().getTime() - new Date(draft.createdAt).getTime() < 5000
        )
        if (recentDrafts.length > 0 && activeTab !== 'drafts') {
          setActiveTab('drafts')
          toast({
            title: "New Content Ready!",
            description: `${recentDrafts.length} content drafts are ready for review and scheduling`
          })
        }
      } catch (error) {
        console.error('Error loading drafts:', error)
      }
    }
    
    if (savedSlots) {
      try {
        setScheduleSlots(JSON.parse(savedSlots))
      } catch (error) {
        console.error('Error loading schedule slots:', error)
      }
    }
  }, [activeTab, toast])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('contentDrafts', JSON.stringify(contentDrafts))
  }, [contentDrafts])

  useEffect(() => {
    localStorage.setItem('scheduleSlots', JSON.stringify(scheduleSlots))
  }, [scheduleSlots])

  const handleGenerateContent = async (topic: TopicIdea, platform: string) => {
    setIsGeneratingContent(true)
    
    try {
      // Get writing profiles for style reference
      const savedProfiles = localStorage.getItem('writingProfiles')
      let writingStyle = ''
      
      if (savedProfiles) {
        try {
          const profiles = JSON.parse(savedProfiles)
          if (profiles.length > 0) {
            const profile = profiles[0] // Use first profile
            writingStyle = `\n\nWriting Style Guidelines:
- Tone: ${profile.tone}
- Style: ${profile.style}
- Key phrases to use: ${profile.keyPhrases.join(', ')}
- Platform preferences: ${profile.platforms.join(', ')}`
          }
        } catch (error) {
          console.error('Error loading writing profiles:', error)
        }
      }

      const contentPrompt = `Create engaging ${platform} content based on this topic:

Topic: ${topic.title}
Description: ${topic.description}
Keywords: ${topic.keywords.join(', ')}
Source: ${topic.source}

Platform: ${platform}
${writingStyle}

Requirements:
- Make it platform-specific and optimized for ${platform}
- Include relevant hashtags and mentions
- Make it engaging and actionable
- Follow ${platform} best practices
- Keep appropriate length for the platform

Generate compelling content that would perform well on ${platform}.`

      const { text } = await blink.ai.generateText({
        prompt: contentPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 800
      })

      const newDraft: ContentDraft = {
        id: Date.now().toString(),
        topicId: topic.id,
        title: topic.title,
        content: text,
        platform: platform,
        status: 'draft',
        createdAt: new Date(),
        lastModified: new Date()
      }

      setContentDrafts(prev => [newDraft, ...prev])
      
      toast({
        title: "Content Generated!",
        description: `${platform} content created for "${topic.title}"`
      })

      // Switch to drafts tab
      setActiveTab('drafts')

    } catch (error) {
      console.error('Content generation error:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleUpdateDraft = (draft: ContentDraft, updates: Partial<ContentDraft>) => {
    setContentDrafts(prev => 
      prev.map(d => 
        d.id === draft.id 
          ? { ...d, ...updates, lastModified: new Date() }
          : d
      )
    )
  }

  const handleScheduleDraft = (draft: ContentDraft) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select date and time",
        variant: "destructive"
      })
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    handleUpdateDraft(draft, {
      status: 'scheduled',
      scheduledDate: scheduledDateTime
    })

    setShowScheduleForm(false)
    setSelectedDate(undefined)
    setSelectedTime('')

    toast({
      title: "Content Scheduled!",
      description: `Scheduled for ${format(scheduledDateTime, 'PPP p')}`
    })
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      toast({
        title: "Copied!",
        description: "Content copied to clipboard"
      })
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      })
    }
  }

  const handleDeleteDraft = (id: string) => {
    setContentDrafts(prev => prev.filter(draft => draft.id !== id))
    toast({
      title: "Draft Deleted",
      description: "Content draft has been removed"
    })
  }

  const getStatusIcon = (status: ContentDraft['status']) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'published':
        return <Send className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ContentDraft['status']) => {
    const variants = {
      draft: 'secondary',
      ready: 'default',
      scheduled: 'default',
      published: 'secondary',
      failed: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const filteredDrafts = contentDrafts.filter(draft => {
    if (platformFilter !== 'all' && draft.platform !== platformFilter) return false
    if (statusFilter !== 'all' && draft.status !== statusFilter) return false
    return true
  })

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedWeek),
    end: endOfWeek(selectedWeek)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Scheduler</h1>
        <p className="text-muted-foreground mt-2">
          Manage topics, create content, and schedule posts across platforms
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="topics" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Topics</span>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Drafts</span>
            {contentDrafts.filter(draft => 
              new Date().getTime() - new Date(draft.createdAt).getTime() < 10000
            ).length > 0 && (
              <Badge variant="default" className="ml-1 text-xs bg-green-600 text-white h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {contentDrafts.filter(draft => 
                  new Date().getTime() - new Date(draft.createdAt).getTime() < 10000
                ).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Available Topics</h2>
              <p className="text-sm text-muted-foreground">
                Select topics to generate content for different platforms
              </p>
            </div>
            <Button onClick={() => window.location.href = '/inspiration'} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add More Topics
            </Button>
          </div>

          {topicIdeas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No topics available</h3>
                <p className="text-muted-foreground mb-4">
                  Generate topic ideas from your inspiration sources first
                </p>
                <Button onClick={() => window.location.href = '/inspiration'}>
                  Go to Topic Inspiration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicIdeas.map((topic) => (
                <Card key={topic.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base leading-tight mb-2">
                      {topic.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {topic.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {topic.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{keyword}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        From: {topic.source} • Engagement: {topic.estimatedEngagement}/10
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Generate content for:</Label>
                        <div className="grid grid-cols-2 gap-1">
                          {platforms.slice(0, 4).map((platform) => (
                            <Button
                              key={platform.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateContent(topic, platform.id)}
                              disabled={isGeneratingContent}
                              className="text-xs h-8"
                            >
                              <div className={`w-3 h-3 ${platform.color} rounded mr-1 flex items-center justify-center`}>
                                <platform.icon className="w-2 h-2 text-white" />
                              </div>
                              {platform.name.split(' ')[0]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Content Drafts</h2>
              <p className="text-sm text-muted-foreground">
                Review, edit, and schedule your generated content
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredDrafts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Edit className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No content drafts</h3>
                <p className="text-muted-foreground mb-4">
                  Generate content from topics to get started
                </p>
                <Button onClick={() => setActiveTab('topics')} variant="outline">
                  Generate Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDrafts.map((draft) => {
                const platform = platforms.find(p => p.id === draft.platform)
                if (!platform) return null

                // Check if this is a recently generated draft (within last 10 seconds)
                const isNew = new Date().getTime() - new Date(draft.createdAt).getTime() < 10000

                return (
                  <Card key={draft.id} className={isNew ? 'ring-2 ring-primary/50 bg-primary/5' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center`}>
                            <platform.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-base">{draft.title}</CardTitle>
                              {isNew && (
                                <Badge variant="default" className="text-xs bg-green-600 text-white">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(draft.status)}
                              <span className="text-xs text-muted-foreground">
                                {format(draft.lastModified, 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(draft.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(draft.content, draft.id)}
                          >
                            {copiedStates[draft.id] ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDraft(draft)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded p-4 mb-4 border-l-4" style={{ borderLeftColor: platform.color.replace('bg-', '#') }}>
                        <div className="text-sm leading-relaxed">
                          {draft.content.length > 400 ? (
                            <>
                              <div className="whitespace-pre-wrap">
                                {draft.content.substring(0, 400)}
                              </div>
                              <button 
                                className="text-primary hover:underline text-xs mt-2"
                                onClick={() => setEditingDraft(draft)}
                              >
                                Read more...
                              </button>
                            </>
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {draft.content}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {draft.status === 'scheduled' && draft.scheduledDate && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled for {format(draft.scheduledDate, 'PPP p')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {draft.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDraft(draft, { status: 'ready' })}
                            >
                              Mark Ready
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDraft(draft)
                                setShowScheduleForm(true)
                              }}
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Schedule
                            </Button>
                          </>
                        )}
                        
                        {draft.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingDraft(draft)
                              setShowScheduleForm(true)
                            }}
                          >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Schedule Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Scheduled Content</h2>
            <p className="text-sm text-muted-foreground">
              Manage your scheduled posts and publishing times
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {contentDrafts.filter(d => d.status === 'scheduled').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No scheduled posts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contentDrafts
                      .filter(d => d.status === 'scheduled' && d.scheduledDate)
                      .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
                      .slice(0, 5)
                      .map((draft) => {
                        const platform = platforms.find(p => p.id === draft.platform)
                        if (!platform || !draft.scheduledDate) return null

                        return (
                          <div key={draft.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className={`w-6 h-6 ${platform.color} rounded flex items-center justify-center`}>
                              <platform.icon className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{draft.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(draft.scheduledDate, 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Drafts</span>
                    <span className="text-sm font-medium">
                      {contentDrafts.filter(d => d.status === 'draft').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ready</span>
                    <span className="text-sm font-medium">
                      {contentDrafts.filter(d => d.status === 'ready').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Scheduled</span>
                    <span className="text-sm font-medium">
                      {contentDrafts.filter(d => d.status === 'scheduled').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Published</span>
                    <span className="text-sm font-medium">
                      {contentDrafts.filter(d => d.status === 'published').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Content Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Visual overview of your scheduled content
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              >
                Previous Week
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              >
                Next Week
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day) => {
                  const dayPosts = contentDrafts.filter(draft => 
                    draft.status === 'scheduled' && 
                    draft.scheduledDate &&
                    format(draft.scheduledDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                  )

                  return (
                    <div key={day.toISOString()} className="space-y-2">
                      <div className="text-center">
                        <p className="text-sm font-medium">{format(day, 'EEE')}</p>
                        <p className="text-lg font-bold">{format(day, 'd')}</p>
                      </div>
                      
                      <div className="space-y-1 min-h-[200px]">
                        {dayPosts.map((post) => {
                          const platform = platforms.find(p => p.id === post.platform)
                          if (!platform || !post.scheduledDate) return null

                          return (
                            <div
                              key={post.id}
                              className="p-2 rounded border text-xs"
                              style={{ borderLeftColor: platform.color.replace('bg-', '#') }}
                            >
                              <div className="flex items-center space-x-1 mb-1">
                                <div className={`w-3 h-3 ${platform.color} rounded`}>
                                  <platform.icon className="w-2 h-2 text-white" />
                                </div>
                                <span className="font-medium">{format(post.scheduledDate, 'HH:mm')}</span>
                              </div>
                              <p className="truncate">{post.title}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Draft Modal */}
      {editingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Content</CardTitle>
              <CardDescription>
                Modify your content before scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingDraft.title}
                  onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editingDraft.content}
                  onChange={(e) => setEditingDraft({ ...editingDraft, content: e.target.value })}
                  rows={12}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    handleUpdateDraft(editingDraft, {
                      title: editingDraft.title,
                      content: editingDraft.content
                    })
                    setEditingDraft(null)
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingDraft(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && editingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule Content</CardTitle>
              <CardDescription>
                Choose when to publish this content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleScheduleDraft(editingDraft)}
                  disabled={!selectedDate || !selectedTime}
                >
                  Schedule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleForm(false)
                    setEditingDraft(null)
                    setSelectedDate(undefined)
                    setSelectedTime('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}