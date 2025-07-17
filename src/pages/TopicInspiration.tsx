import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { 
  Plus, 
  Trash2, 
  RefreshCw,
  Loader2,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Globe,
  User,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Search,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { validateURL, getPlatformPlaceholder } from '../lib/urlValidator'
import { createError, handleError, formatErrorForDisplay, logError, ERROR_CODES, AppError } from '../lib/errorHandler'
import { saveData, loadData, removeData } from '../lib/storage'

interface InspirationSource {
  id: string
  type: 'youtube' | 'linkedin' | 'twitter' | 'instagram' | 'tiktok' | 'website' | 'blog'
  url: string
  name: string
  description?: string
  lastScraped?: Date
  status: 'active' | 'inactive' | 'error'
}

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
  originalContent?: string
  performanceIndicators?: string
}

interface WritingProfile {
  id: string
  name: string
  tone: string
  style: string
  keyPhrases: string[]
  sampleContent: string
  platforms: string[]
  createdAt: Date
}

const sourceTypes = [
  { id: 'youtube', name: 'YouTube Channel', icon: Youtube, color: 'bg-red-500' },
  { id: 'linkedin', name: 'LinkedIn Profile', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'twitter', name: 'X Profile', icon: Twitter, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram Profile', icon: Instagram, color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok Profile', icon: Video, color: 'bg-red-500' },
  { id: 'website', name: 'Website/Blog', icon: Globe, color: 'bg-green-600' },
  { id: 'blog', name: 'Blog RSS', icon: BookOpen, color: 'bg-purple-600' }
]

export function TopicInspiration() {
  const [activeTab, setActiveTab] = useState('profile')
  const [inspirationSources, setInspirationSources] = useState<InspirationSource[]>([])
  const [topicIdeas, setTopicIdeas] = useState<TopicIdea[]>([])
  const [writingProfiles, setWritingProfiles] = useState<WritingProfile[]>([])
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false)
  
  // Form states
  const [newSourceType, setNewSourceType] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [newSourceName, setNewSourceName] = useState('')
  const [profileContent, setProfileContent] = useState('')
  const [profileName, setProfileName] = useState('')
  
  // Error states
  const [urlValidationError, setUrlValidationError] = useState<AppError | null>(null)
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)
  const [urlValidationStatus, setUrlValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  
  const { toast } = useToast()

  // Load data from storage
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load inspiration sources
        const savedSources = await loadData<InspirationSource[]>('inspirationSources', [])
        if (savedSources) {
          setInspirationSources(savedSources)
        }
        
        // Load topic ideas
        const savedTopics = await loadData<TopicIdea[]>('topicIdeas', [])
        if (savedTopics) {
          const parsedTopics = savedTopics.map((topic: any) => ({
            ...topic,
            createdAt: new Date(topic.createdAt)
          }))
          setTopicIdeas(parsedTopics)
        }
        
        // Load writing profiles
        const savedProfiles = await loadData<WritingProfile[]>('writingProfiles', [])
        if (savedProfiles) {
          const parsedProfiles = savedProfiles.map((profile: any) => ({
            ...profile,
            createdAt: new Date(profile.createdAt)
          }))
          setWritingProfiles(parsedProfiles)
        }
        
      } catch (error) {
        const appError = handleError(error, {
          component: 'TopicInspiration',
          action: 'loadData',
          data: {},
          timestamp: new Date()
        })
        
        logError(appError)
        
        const errorDisplay = formatErrorForDisplay(appError)
        toast({
          title: errorDisplay.title,
          description: errorDisplay.description,
          variant: "destructive"
        })
      }
    }
    
    loadAllData()
  }, [toast])

  // Save data to storage with debouncing
  useEffect(() => {
    const saveSources = async () => {
      try {
        await saveData('inspirationSources', inspirationSources)
      } catch (error) {
        logError(handleError(error))
      }
    }
    
    if (inspirationSources.length > 0) {
      const timeoutId = setTimeout(saveSources, 500) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [inspirationSources])

  useEffect(() => {
    const saveTopics = async () => {
      try {
        await saveData('topicIdeas', topicIdeas)
      } catch (error) {
        logError(handleError(error))
      }
    }
    
    if (topicIdeas.length > 0) {
      const timeoutId = setTimeout(saveTopics, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [topicIdeas])

  useEffect(() => {
    const saveProfiles = async () => {
      try {
        await saveData('writingProfiles', writingProfiles)
      } catch (error) {
        logError(handleError(error))
      }
    }
    
    if (writingProfiles.length > 0) {
      const timeoutId = setTimeout(saveProfiles, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [writingProfiles])

  // URL validation effect
  useEffect(() => {
    if (!newSourceUrl.trim()) {
      setUrlValidationStatus('idle')
      setUrlValidationError(null)
      return
    }

    const validateUrlAsync = async () => {
      setIsValidatingUrl(true)
      setUrlValidationStatus('validating')
      
      try {
        // Add a small delay to avoid excessive validation calls
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const validation = validateURL(newSourceUrl, newSourceType)
        
        if (validation.isValid) {
          setUrlValidationStatus('valid')
          setUrlValidationError(null)
          
          // Update URL with normalized version if available
          if (validation.normalizedUrl && validation.normalizedUrl !== newSourceUrl) {
            setNewSourceUrl(validation.normalizedUrl)
          }
        } else {
          setUrlValidationStatus('invalid')
          setUrlValidationError(createError(ERROR_CODES.URL_INVALID_FORMAT, {
            originalUrl: newSourceUrl,
            error: validation.error
          }))
        }
      } catch (error) {
        setUrlValidationStatus('invalid')
        setUrlValidationError(handleError(error))
      } finally {
        setIsValidatingUrl(false)
      }
    }

    const timeoutId = setTimeout(validateUrlAsync, 500) // Debounce validation
    return () => clearTimeout(timeoutId)
  }, [newSourceUrl, newSourceType])

  const handleAddSource = async () => {
    try {
      // Validate required fields
      if (!newSourceType) {
        throw createError(ERROR_CODES.FORM_REQUIRED_FIELD, { field: 'Source Type' })
      }
      
      if (!newSourceUrl.trim()) {
        throw createError(ERROR_CODES.FORM_REQUIRED_FIELD, { field: 'URL' })
      }
      
      if (!newSourceName.trim()) {
        throw createError(ERROR_CODES.FORM_REQUIRED_FIELD, { field: 'Display Name' })
      }

      // Validate URL
      const validation = validateURL(newSourceUrl, newSourceType)
      if (!validation.isValid) {
        throw createError(ERROR_CODES.URL_INVALID_FORMAT, {
          originalUrl: newSourceUrl,
          error: validation.error
        })
      }

      // Check for duplicates
      const isDuplicate = inspirationSources.some(source => 
        source.url === (validation.normalizedUrl || newSourceUrl) ||
        source.name.toLowerCase() === newSourceName.toLowerCase()
      )
      
      if (isDuplicate) {
        throw createError(ERROR_CODES.FORM_DUPLICATE_ENTRY, {
          message: 'A source with this URL or name already exists'
        })
      }
      
      const newSource: InspirationSource = {
        id: Date.now().toString(),
        type: newSourceType as InspirationSource['type'],
        url: validation.normalizedUrl || newSourceUrl,
        name: newSourceName,
        status: 'active'
      }

      setInspirationSources(prev => [...prev, newSource])
      
      // Reset form
      setNewSourceType('')
      setNewSourceUrl('')
      setNewSourceName('')
      setUrlValidationStatus('idle')
      setUrlValidationError(null)
      
      toast({
        title: "Source Added!",
        description: `${newSourceName} has been added to your inspiration sources`
      })
      
    } catch (error) {
      const appError = handleError(error, {
        component: 'TopicInspiration',
        action: 'addSource',
        data: { type: newSourceType, url: newSourceUrl, name: newSourceName },
        timestamp: new Date()
      })
      
      logError(appError)
      
      const errorDisplay = formatErrorForDisplay(appError)
      toast({
        title: errorDisplay.title,
        description: errorDisplay.description,
        variant: "destructive"
      })
    }
  }

  const handleRemoveSource = async (id: string) => {
    try {
      const sourceToRemove = inspirationSources.find(source => source.id === id)
      if (!sourceToRemove) {
        throw createError(ERROR_CODES.UNKNOWN_ERROR, {
          message: 'Source not found'
        })
      }

      setInspirationSources(prev => prev.filter(source => source.id !== id))
      
      toast({
        title: "Source Removed",
        description: `${sourceToRemove.name} has been removed from your inspiration sources`
      })
      
    } catch (error) {
      const appError = handleError(error, {
        component: 'TopicInspiration',
        action: 'removeSource',
        data: { id },
        timestamp: new Date()
      })
      
      logError(appError)
      
      const errorDisplay = formatErrorForDisplay(appError)
      toast({
        title: errorDisplay.title,
        description: errorDisplay.description,
        variant: "destructive"
      })
    }
  }

  const handleAnalyzeProfile = async () => {
    if (!profileContent.trim() || !profileName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both profile name and content",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzingProfile(true)

    try {
      const analysisPrompt = `Analyze this content to understand the writing style, tone, and characteristics:

Content: ${profileContent}

Please provide:
1. Writing tone (professional, casual, humorous, etc.)
2. Writing style characteristics
3. Key phrases or expressions commonly used
4. Recommended platforms based on style
5. Content themes and topics

Format as JSON with keys: tone, style, keyPhrases, platforms, themes`

      const { text } = await blink.ai.generateText({
        prompt: analysisPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 800
      })

      // Try to parse JSON response
      let analysis
      try {
        analysis = JSON.parse(text)
      } catch {
        // Fallback if not valid JSON
        analysis = {
          tone: "Professional",
          style: "Informative and engaging",
          keyPhrases: ["Let's explore", "In my experience", "What I've learned"],
          platforms: ["LinkedIn", "Newsletter"],
          themes: ["Business", "Technology", "Growth"]
        }
      }

      const newProfile: WritingProfile = {
        id: Date.now().toString(),
        name: profileName,
        tone: analysis.tone || "Professional",
        style: analysis.style || "Informative and engaging",
        keyPhrases: analysis.keyPhrases || [],
        sampleContent: profileContent,
        platforms: analysis.platforms || [],
        createdAt: new Date()
      }

      setWritingProfiles(prev => [...prev, newProfile])
      
      // Reset form
      setProfileContent('')
      setProfileName('')
      
      toast({
        title: "Profile Analyzed!",
        description: `Writing profile "${profileName}" has been created`
      })

    } catch (error) {
      console.error('Profile analysis error:', error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze writing profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzingProfile(false)
    }
  }

  const handleGenerateTopics = async () => {
    if (inspirationSources.length === 0) {
      toast({
        title: "No Sources",
        description: "Please add inspiration sources first",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingTopics(true)

    try {
      const newTopics: TopicIdea[] = []

      // Process each source to extract high-performing content
      for (const source of inspirationSources.slice(0, 5)) { // Process up to 5 sources
        try {
          // Scrape content from source
          const { markdown, extract } = await blink.data.scrape(source.url)
          const content = markdown || extract.text || ''

          if (content.length < 100) continue // Skip if not enough content

          // Enhanced prompt to analyze engagement and extract best-performing topics
          const analysisPrompt = `Analyze this ${source.type} content from ${source.name} and extract the TOP 10 highest-performing topics based on engagement indicators:

Content: ${content.substring(0, 4000)}

Instructions:
1. Look for engagement indicators like:
   - High like/reaction counts
   - Many comments or shares
   - View counts (for videos)
   - Engagement metrics mentioned
   - Popular hashtags
   - Viral content patterns

2. For LinkedIn: Look for posts with high engagement, comments, shares
3. For YouTube: Look for videos with high view counts, likes, comments
4. For Instagram: Look for posts with high likes, comments, saves
5. For TikTok: Look for videos with high views, likes, shares
6. For Twitter/X: Look for tweets with high retweets, likes, replies
7. For websites/blogs: Look for popular articles, trending topics

Extract the 10 BEST performing topics and format as JSON array with:
- title: Engaging, clickable title based on high-performing content
- description: Why this topic performed well
- originalContent: Brief excerpt from the original high-performing post/video
- keywords: Relevant hashtags and keywords from successful content
- difficulty: easy/medium/hard
- engagement: Estimated engagement score (1-10) based on actual performance
- performanceIndicators: What made this content successful (likes, shares, comments, etc.)

Focus on PROVEN high-performing content, not generic topic ideas.`

          const { text } = await blink.ai.generateText({
            prompt: analysisPrompt,
            model: 'gpt-4o-mini',
            maxTokens: 2000
          })

          // Parse response
          let topics
          try {
            topics = JSON.parse(text)
            if (!Array.isArray(topics)) {
              topics = [topics]
            }
          } catch {
            // Fallback - try to extract topics from content manually
            const fallbackPrompt = `From this ${source.type} content, identify 3 topics that likely had high engagement:

${content.substring(0, 1000)}

Return as JSON array with title, description, keywords, engagement (1-10).`

            try {
              const { text: fallbackText } = await blink.ai.generateText({
                prompt: fallbackPrompt,
                model: 'gpt-4o-mini',
                maxTokens: 800
              })
              topics = JSON.parse(fallbackText)
            } catch {
              topics = [{
                title: `High-Performing Content from ${source.name}`,
                description: "Topic extracted from successful content",
                keywords: ["trending", "popular"],
                difficulty: "medium",
                engagement: 8,
                performanceIndicators: "Based on content analysis"
              }]
            }
          }

          // Add topics to collection with enhanced data
          topics.slice(0, 10).forEach((topic: any) => {
            newTopics.push({
              id: `${Date.now()}-${Math.random()}`,
              title: topic.title || `High-Performing Topic from ${source.name}`,
              description: topic.description || "Topic based on successful content",
              source: source.name,
              sourceUrl: source.url,
              keywords: Array.isArray(topic.keywords) ? topic.keywords : [],
              trending: topic.engagement > 7, // Mark as trending if high engagement
              difficulty: topic.difficulty || 'medium',
              estimatedEngagement: Math.min(topic.engagement || 8, 10), // Cap at 10
              createdAt: new Date(),
              // Additional data for high-performing topics
              originalContent: topic.originalContent,
              performanceIndicators: topic.performanceIndicators
            })
          })

        } catch (error) {
          console.error(`Error processing source ${source.name}:`, error)
          // Update source status
          setInspirationSources(prev => 
            prev.map(s => s.id === source.id ? { ...s, status: 'error' } : s)
          )
        }
      }

      if (newTopics.length > 0) {
        // Sort by engagement score (highest first)
        const sortedTopics = newTopics.sort((a, b) => b.estimatedEngagement - a.estimatedEngagement)
        setTopicIdeas(prev => [...sortedTopics, ...prev])
        
        toast({
          title: "High-Performing Topics Extracted!",
          description: `Found ${newTopics.length} topics based on engagement analysis`
        })
      } else {
        toast({
          title: "No High-Performing Topics Found",
          description: "Unable to extract engagement data from current sources",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Topic generation error:', error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze engagement data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingTopics(false)
    }
  }

  const handleRemoveTopic = (id: string) => {
    setTopicIdeas(prev => prev.filter(topic => topic.id !== id))
  }

  const handleRemoveProfile = (id: string) => {
    setWritingProfiles(prev => prev.filter(profile => profile.id !== id))
  }

  const handleGenerateContent = async (topic: TopicIdea) => {
    if (writingProfiles.length === 0) {
      toast({
        title: "No Writing Profile",
        description: "Please create a writing profile first to generate content",
        variant: "destructive"
      })
      return
    }

    // Use the first writing profile for now (could be enhanced to let user choose)
    const profile = writingProfiles[0]

    try {
      const contentPrompt = `Based on this high-performing topic and writing profile, create content for different social media platforms:

TOPIC DETAILS:
- Title: ${topic.title}
- Description: ${topic.description}
- Source: ${topic.source}
- Keywords: ${topic.keywords.join(', ')}
- Performance Indicators: ${topic.performanceIndicators || 'High engagement'}
${topic.originalContent ? `- Original Content Reference: ${topic.originalContent}` : ''}

WRITING PROFILE:
- Tone: ${profile.tone}
- Style: ${profile.style}
- Key Phrases: ${profile.keyPhrases.join(', ')}
- Sample Content: ${profile.sampleContent.substring(0, 500)}

INSTRUCTIONS:
Create content for each platform following best practices and the writing profile:

1. LinkedIn Post (professional, engaging, with call-to-action)
2. X/Twitter Thread (3-5 tweets, engaging hooks)
3. Instagram Caption (visual storytelling, hashtags)
4. Newsletter Section (detailed, informative)
5. TikTok/Short Video Script (engaging, trendy)

For each platform, incorporate:
- The writing tone and style from the profile
- Key phrases naturally
- Platform-specific best practices
- The high-performing elements from the original topic

Format as JSON with keys: linkedin, twitter, instagram, newsletter, tiktok`

      const { text } = await blink.ai.generateText({
        prompt: contentPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 2500
      })

      // Try to parse the response
      let generatedContent
      try {
        generatedContent = JSON.parse(text)
      } catch {
        // Fallback if parsing fails
        generatedContent = {
          linkedin: `${topic.title}\n\n${topic.description}\n\nWhat are your thoughts on this?`,
          twitter: `🧵 Thread about ${topic.title}\n\n1/ ${topic.description}`,
          instagram: `${topic.title} ✨\n\n${topic.description}\n\n${topic.keywords.map(k => `#${k}`).join(' ')}`,
          newsletter: `## ${topic.title}\n\n${topic.description}`,
          tiktok: `Hook: ${topic.title}\n\nScript: ${topic.description}`
        }
      }

      // Create content drafts for each platform and save to scheduler
      const platforms = ['linkedin', 'twitter', 'instagram', 'newsletter', 'tiktok']
      const contentDrafts = platforms.map(platform => ({
        id: `${Date.now()}-${platform}-${Math.random()}`,
        topicId: topic.id,
        title: topic.title,
        content: generatedContent[platform] || `Content for ${platform} based on: ${topic.title}\n\n${topic.description}`,
        platform: platform,
        status: 'draft' as const,
        createdAt: new Date(),
        lastModified: new Date()
      }))

      // Save to localStorage for scheduler to pick up
      const existingDrafts = JSON.parse(localStorage.getItem('contentDrafts') || '[]')
      const updatedDrafts = [...contentDrafts, ...existingDrafts]
      localStorage.setItem('contentDrafts', JSON.stringify(updatedDrafts))

      toast({
        title: "Content Generated!",
        description: `Created ${platforms.length} content drafts for "${topic.title}". Redirecting to scheduler...`
      })

      // Navigate to scheduler after a short delay
      setTimeout(() => {
        window.location.href = '/schedule'
      }, 1500)

    } catch (error) {
      console.error('Content generation error:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getSourceIcon = (type: string) => {
    const sourceType = sourceTypes.find(s => s.id === type)
    return sourceType ? sourceType.icon : Globe
  }

  const getSourceColor = (type: string) => {
    const sourceType = sourceTypes.find(s => s.id === type)
    return sourceType ? sourceType.color : 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Topic Inspiration</h1>
        <p className="text-muted-foreground mt-2">
          Discover trending topics and analyze your writing style
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Writing Profile</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Inspiration Sources</span>
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Topic Ideas</span>
          </TabsTrigger>
        </TabsList>

        {/* Writing Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Analyze Writing Style</CardTitle>
                <CardDescription>
                  Provide URLs or content to understand your writing style and tone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Profile Name</Label>
                  <Input
                    id="profile-name"
                    placeholder="My LinkedIn Style"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>

                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Paste Content</TabsTrigger>
                    <TabsTrigger value="url">Add URLs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-content">Sample Content</Label>
                      <Textarea
                        id="profile-content"
                        placeholder="Paste your newsletter, blog posts, or social media content here..."
                        value={profileContent}
                        onChange={(e) => setProfileContent(e.target.value)}
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide multiple examples for better analysis
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Add Your Content URLs</Label>
                        <p className="text-xs text-muted-foreground">
                          Add URLs to your LinkedIn posts, newsletters, blog articles, etc.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="https://linkedin.com/posts/yourpost or newsletter URL..."
                            value={newSourceUrl}
                            onChange={(e) => setNewSourceUrl(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              if (newSourceUrl.trim()) {
                                setProfileContent(prev => 
                                  prev + (prev ? '\n\n' : '') + `URL: ${newSourceUrl}`
                                )
                                setNewSourceUrl('')
                              }
                            }}
                            disabled={!newSourceUrl.trim()}
                            size="sm"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {profileContent && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Added URLs:</p>
                          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {profileContent}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={handleAnalyzeProfile}
                  disabled={isAnalyzingProfile || !profileContent.trim() || !profileName.trim()}
                  className="w-full"
                >
                  {isAnalyzingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Writing Style
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Writing Profiles</CardTitle>
                <CardDescription>
                  Your analyzed writing styles and characteristics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {writingProfiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No writing profiles yet</p>
                    <p className="text-sm">Analyze your content to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {writingProfiles.map((profile) => (
                      <div key={profile.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{profile.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {profile.tone} • {profile.style}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProfile(profile.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Key Phrases:</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.keyPhrases.slice(0, 3).map((phrase, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {phrase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Platforms:</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.platforms.slice(0, 3).map((platform, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inspiration Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Source */}
            <Card>
              <CardHeader>
                <CardTitle>Add Inspiration Source</CardTitle>
                <CardDescription>
                  Add social profiles, channels, and websites to scrape for topic ideas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {sourceTypes.map((type) => (
                      <Button
                        key={type.id}
                        variant={newSourceType === type.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewSourceType(type.id)}
                        className="justify-start"
                      >
                        <div className={`w-4 h-4 ${type.color} rounded mr-2 flex items-center justify-center`}>
                          <type.icon className="w-3 h-3 text-white" />
                        </div>
                        {type.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {newSourceType && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="source-url">URL</Label>
                      <div className="relative">
                        <Input
                          id="source-url"
                          placeholder={getPlatformPlaceholder(newSourceType)}
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          className={`pr-10 ${
                            urlValidationStatus === 'valid' ? 'border-green-500' :
                            urlValidationStatus === 'invalid' ? 'border-red-500' : ''
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {urlValidationStatus === 'validating' && (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                          {urlValidationStatus === 'valid' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {urlValidationStatus === 'invalid' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      {urlValidationError && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>URL Validation Error</AlertTitle>
                          <AlertDescription className="space-y-2">
                            <p>{urlValidationError.details || urlValidationError.message}</p>
                            {urlValidationError.suggestions && urlValidationError.suggestions.length > 0 && (
                              <div>
                                <p className="font-medium text-sm">Suggestions:</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {urlValidationError.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {urlValidationStatus === 'valid' && !urlValidationError && (
                        <Alert className="mt-2 border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            URL is valid and ready to use
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source-name">Display Name</Label>
                      <Input
                        id="source-name"
                        placeholder="e.g., Tech Influencer, Marketing Blog"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleAddSource}
                  disabled={
                    !newSourceType || 
                    !newSourceUrl.trim() || 
                    !newSourceName.trim() ||
                    urlValidationStatus === 'invalid' ||
                    urlValidationStatus === 'validating'
                  }
                  className="w-full"
                >
                  {urlValidationStatus === 'validating' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Source
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sources</CardTitle>
                <CardDescription>
                  Your inspiration sources for topic generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inspirationSources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No inspiration sources yet</p>
                    <p className="text-sm">Add sources to start generating topics</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inspirationSources.map((source) => {
                      const Icon = getSourceIcon(source.type)
                      const color = getSourceColor(source.type)
                      
                      return (
                        <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${color} rounded flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{source.name}</p>
                              <p className="text-sm text-muted-foreground">{source.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={source.status === 'active' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {source.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(source.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveSource(source.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topic Ideas Tab */}
        <TabsContent value="topics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">High-Performing Topics</h2>
              <p className="text-sm text-muted-foreground">
                Topics extracted from your inspiration sources based on engagement stats
              </p>
            </div>
            <Button 
              onClick={handleGenerateTopics}
              disabled={isGeneratingTopics || inspirationSources.length === 0}
            >
              {isGeneratingTopics ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Extract Best Topics
                </>
              )}
            </Button>
          </div>

          {topicIdeas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No high-performing topics yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add inspiration sources and extract topics based on engagement stats
                </p>
                <Button 
                  onClick={() => setActiveTab('sources')}
                  variant="outline"
                >
                  Add Sources First
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicIdeas.map((topic) => (
                <Card key={topic.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base leading-tight mb-2">
                          {topic.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          {topic.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              High Engagement
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {topic.difficulty}
                          </Badge>
                          <Badge variant="default" className="text-xs bg-green-600">
                            {topic.estimatedEngagement}/10
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveTopic(topic.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {topic.description}
                    </p>
                    
                    {topic.performanceIndicators && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-800 mb-1">Why it performed well:</p>
                        <p className="text-xs text-green-700">{topic.performanceIndicators}</p>
                      </div>
                    )}

                    {topic.originalContent && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Original content:</p>
                        <p className="text-xs text-blue-700 line-clamp-2">{topic.originalContent}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {topic.keywords.slice(0, 4).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>From: {topic.source}</span>
                        <a 
                          href={topic.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => handleGenerateContent(topic)}
                        size="sm"
                        className="w-full"
                        disabled={writingProfiles.length === 0}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Content
                      </Button>
                      {writingProfiles.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Create a writing profile first
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}