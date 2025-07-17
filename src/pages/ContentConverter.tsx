import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { 
  RefreshCw, 
  Link as LinkIcon, 
  FileText, 
  Copy,
  Check,
  Loader2,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  Mail,
  MessageCircle,
  Settings,
  Image,
  Play
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

const platforms = [
  { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'twitter', name: 'X Thread', icon: Twitter, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram Post', icon: Instagram, color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok Script', icon: Video, color: 'bg-red-500' },
  { id: 'threads', name: 'Threads Post', icon: MessageCircle, color: 'bg-purple-500' },
  { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'bg-green-600' }
]

export function ContentConverter() {
  const [inputType, setInputType] = useState<'text' | 'url'>('text')
  const [inputContent, setInputContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [results, setResults] = useState<Record<string, string>>({})
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [useCustomPrompts, setUseCustomPrompts] = useState(false)
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({})
  const [generatingCarousel, setGeneratingCarousel] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleCopy = async (platformId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedStates(prev => ({ ...prev, [platformId]: true }))
      toast({
        title: "Copied!",
        description: "Content copied to clipboard"
      })
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [platformId]: false }))
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      })
    }
  }

  const getPlatformPrompt = (platform: string, originalContent: string) => {
    // Use custom prompt if available and enabled
    if (useCustomPrompts && customPrompts[platform]) {
      return `${customPrompts[platform]}\n\nContent to convert:\n${originalContent}`
    }
    
    const defaultPrompts = {
      linkedin: `Transform this content into a professional LinkedIn post that drives engagement. Follow these guidelines:
- Start with a compelling hook or question
- Use short paragraphs for readability
- Include 3-5 relevant hashtags at the end
- Add a call-to-action (comment, share, connect)
- Keep it under 1,300 characters
- Use professional but conversational tone

Content to transform:
${originalContent}`,
      
      twitter: `Convert this content into an engaging X (Twitter) thread. Follow these rules:
- Start with a strong hook in the first tweet
- Break into multiple tweets, each under 280 characters
- Number the tweets (1/n, 2/n, etc.)
- Use line breaks for readability
- Include relevant hashtags (2-3 max per tweet)
- End with a call-to-action
- Use emojis sparingly but effectively

Content to transform:
${originalContent}`,
      
      instagram: `Create an Instagram post caption that maximizes engagement:
- Start with an attention-grabbing first line
- Tell a story or share insights
- Use line breaks for visual appeal
- Include 5-10 relevant hashtags
- Add a clear call-to-action
- Keep it authentic and relatable
- Consider adding emoji for personality

Content to transform:
${originalContent}`,
      
      tiktok: `Create a TikTok video script that's engaging and trendy:
- Hook viewers in the first 3 seconds
- Structure as scenes with clear transitions
- Include trending phrases or sounds references
- Add text overlay suggestions
- Include call-to-actions (like, follow, comment)
- Keep it entertaining and fast-paced
- Suggest visual elements or props

Content to transform:
${originalContent}`,
      
      threads: `Convert this into a Threads post that feels authentic and conversational:
- Use a casual, friendly tone
- Keep it relatable and personal
- Use natural language and contractions
- Include relevant hashtags (2-4 max)
- Encourage discussion with questions
- Keep it under 500 characters for optimal engagement

Content to transform:
${originalContent}`,
      
      newsletter: `Transform this into a newsletter section with these elements:
- Compelling subject line suggestion
- Brief introduction/hook
- Main content organized in clear sections
- Key takeaways or bullet points
- Clear call-to-action
- Professional but friendly tone
- Include suggested images or graphics

Content to transform:
${originalContent}`
    }
    return defaultPrompts[platform as keyof typeof defaultPrompts] || originalContent
  }

  const generateCarouselImages = async (platform: string, content: string) => {
    setGeneratingCarousel(prev => ({ ...prev, [platform]: true }))
    
    try {
      // Extract key points from content for carousel slides
      const slidePrompt = `Based on this content, create 3-5 key points that would work well as carousel slides for ${platform}. Each point should be concise and visually engaging:\n\n${content}`
      
      const { text: slidePoints } = await blink.ai.generateText({
        prompt: slidePrompt,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })
      
      // Generate images for each slide
      const slides = slidePoints.split('\n').filter(line => line.trim()).slice(0, 5)
      const imagePromises = slides.map(async (slide, index) => {
        const imagePrompt = `Create a modern, clean ${platform} carousel slide design with the text: "${slide}". Use vibrant colors, modern typography, and professional design. Make it visually appealing and on-brand.`
        
        const { data } = await blink.ai.generateImage({
          prompt: imagePrompt,
          size: platform === 'instagram' ? '1024x1024' : '1024x1792',
          quality: 'high',
          n: 1
        })
        
        return {
          slide: slide,
          imageUrl: data[0].url,
          index: index + 1
        }
      })
      
      const carouselImages = await Promise.all(imagePromises)
      
      // Update results with carousel info
      setResults(prev => ({
        ...prev,
        [`${platform}_carousel`]: JSON.stringify({
          slides: carouselImages,
          originalContent: content
        })
      }))
      
      toast({
        title: "Carousel Generated!",
        description: `Created ${carouselImages.length} slides for ${platform}`
      })
      
    } catch (error) {
      console.error('Carousel generation error:', error)
      toast({
        title: "Carousel Error",
        description: "Failed to generate carousel images",
        variant: "destructive"
      })
    } finally {
      setGeneratingCarousel(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleConvert = async () => {
    // Validate input content
    if (!inputContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide content to convert",
        variant: "destructive"
      })
      return
    }

    if (inputContent.trim().length < 20) {
      toast({
        title: "Content Too Short",
        description: "Please provide at least 20 characters of content",
        variant: "destructive"
      })
      return
    }

    // Validate platform selection
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to convert to",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    setResults({})

    try {
      let contentToConvert = inputContent

      // If URL input, extract content first
      if (inputType === 'url') {
        try {
          // Validate URL format first
          if (!inputContent.startsWith('http://') && !inputContent.startsWith('https://')) {
            throw new Error('URL must start with http:// or https://')
          }
          
          const url = new URL(inputContent)
          
          toast({
            title: "Extracting Content",
            description: "Fetching content from URL..."
          })
          
          // Try multiple extraction methods for better reliability
          let extractedContent = ''
          
          try {
            // Method 1: Try scraping first
            const { markdown, extract } = await blink.data.scrape(inputContent)
            extractedContent = markdown || extract?.text || ''
          } catch (scrapeError) {
            console.warn('Scraping failed, trying extraction:', scrapeError)
            
            try {
              // Method 2: Fallback to direct extraction
              extractedContent = await blink.data.extractFromUrl(inputContent)
            } catch (extractError) {
              console.error('Both scraping and extraction failed:', extractError)
              throw new Error('Unable to extract content from this URL. The site may be blocking access or the content may not be publicly available.')
            }
          }
          
          if (!extractedContent || extractedContent.trim().length < 20) {
            throw new Error('No meaningful content could be extracted from this URL. Please try a different URL or paste the content directly.')
          }
          
          contentToConvert = extractedContent
          
          toast({
            title: "Content Extracted",
            description: `Successfully extracted ${contentToConvert.length} characters`
          })
          
        } catch (error) {
          console.error('URL extraction error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Failed to extract content from URL'
          toast({
            title: "URL Extraction Failed",
            description: errorMessage,
            variant: "destructive"
          })
          setIsConverting(false)
          return
        }
      }

      // Show conversion progress
      toast({
        title: "Converting Content",
        description: `Generating content for ${selectedPlatforms.length} platform(s)...`
      })

      // Convert for each selected platform with better error handling
      const conversions = await Promise.allSettled(
        selectedPlatforms.map(async (platform) => {
          const prompt = getPlatformPrompt(platform, contentToConvert)
          const { text } = await blink.ai.generateText({
            prompt,
            model: 'gpt-4o-mini',
            maxTokens: 1000
          })
          return { platform, content: text }
        })
      )

      const newResults: Record<string, string> = {}
      let successCount = 0
      let errorCount = 0

      conversions.forEach((result, index) => {
        const platform = selectedPlatforms[index]
        if (result.status === 'fulfilled') {
          newResults[platform] = result.value.content
          successCount++
        } else {
          console.error(`Error converting for ${platform}:`, result.reason)
          newResults[platform] = `Error generating content for ${platform}. Please try again.`
          errorCount++
        }
      })

      setResults(newResults)
      
      if (successCount > 0) {
        toast({
          title: "Conversion Complete!",
          description: `Successfully converted content for ${successCount} platform(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        })
      } else {
        toast({
          title: "Conversion Failed",
          description: "Failed to convert content for all platforms. Please try again.",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Converter</h1>
        <p className="text-muted-foreground mt-2">
          Transform your content for different social media platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input Content</CardTitle>
            <CardDescription>
              Paste your content or provide a URL to extract from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'text' | 'url')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>URL</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="text-input">Content</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste your content here... 

Examples:
• Blog post content
• Newsletter text
• Social media post
• Article excerpt
• Product description
• Event announcement"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 20 characters required for conversion
                </p>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="url-input">URL</Label>
                <Input
                  id="url-input"
                  placeholder="https://example.com/article"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Supported URL types:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Blog posts and articles</li>
                    <li>LinkedIn posts and articles</li>
                    <li>Medium articles</li>
                    <li>News articles</li>
                    <li>Company pages and press releases</li>
                    <li>Product pages</li>
                  </ul>
                  <p className="mt-2 text-amber-600">
                    Note: Some social media posts may be private or require login
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePlatformToggle(platform.id)}
                    className="justify-start"
                  >
                    <div className={`w-4 h-4 ${platform.color} rounded mr-2 flex items-center justify-center`}>
                      <platform.icon className="w-3 h-3 text-white" />
                    </div>
                    {platform.name}
                  </Button>
                ))}
              </div>
              {selectedPlatforms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedPlatforms.map((platformId) => {
                    const platform = platforms.find(p => p.id === platformId)
                    return platform ? (
                      <Badge key={platformId} variant="secondary">
                        {platform.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Custom Prompts Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="custom-prompts"
                  checked={useCustomPrompts}
                  onChange={(e) => setUseCustomPrompts(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="custom-prompts" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Use Custom Prompts</span>
                </Label>
              </div>
              
              {useCustomPrompts && (
                <div className="space-y-3 border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Customize how content is converted for each platform
                  </p>
                  {selectedPlatforms.map((platformId) => {
                    const platform = platforms.find(p => p.id === platformId)
                    if (!platform) return null
                    
                    return (
                      <div key={platformId} className="space-y-2">
                        <Label className="flex items-center space-x-2">
                          <div className={`w-4 h-4 ${platform.color} rounded flex items-center justify-center`}>
                            <platform.icon className="w-3 h-3 text-white" />
                          </div>
                          <span>{platform.name} Prompt</span>
                        </Label>
                        <Textarea
                          placeholder={`Custom prompt for ${platform.name}...`}
                          value={customPrompts[platformId] || ''}
                          onChange={(e) => setCustomPrompts(prev => ({
                            ...prev,
                            [platformId]: e.target.value
                          }))}
                          rows={3}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleConvert} 
                disabled={isConverting || !inputContent.trim() || selectedPlatforms.length === 0}
                className="w-full"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert Content
                  </>
                )}
              </Button>
              
              {/* Quick Test Button */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputType('text')
                  setInputContent('Artificial Intelligence is revolutionizing how we work and live. From automating routine tasks to enabling breakthrough discoveries in medicine and science, AI is becoming an essential tool for innovation. However, we must ensure AI development remains ethical and beneficial for all humanity.')
                  setSelectedPlatforms(['linkedin', 'twitter'])
                }}
                className="w-full text-xs"
              >
                Load Test Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Converted Content</CardTitle>
            <CardDescription>
              AI-optimized content for each platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(results).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Converted content will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPlatforms.map((platformId) => {
                  const platform = platforms.find(p => p.id === platformId)
                  const content = results[platformId]
                  
                  if (!platform || !content) return null

                  // Check if this is a carousel result
                  const carouselKey = `${platformId}_carousel`
                  const carouselData = results[carouselKey]
                  
                  return (
                    <div key={platformId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 ${platform.color} rounded flex items-center justify-center`}>
                            <platform.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(platformId === 'instagram' || platformId === 'tiktok') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateCarouselImages(platformId, content)}
                              disabled={generatingCarousel[platformId]}
                            >
                              {generatingCarousel[platformId] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Image className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(platformId, content)}
                          >
                            {copiedStates[platformId] ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded p-3 mb-3">
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-xs text-muted-foreground">
                          <span>{content.length} characters</span>
                          <span>{content.split(/\s+/).length} words</span>
                        </div>
                      </div>
                      
                      {/* Show carousel if available */}
                      {carouselData && (() => {
                        try {
                          const carousel = JSON.parse(carouselData)
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 text-sm font-medium">
                                <Image className="w-4 h-4" />
                                <span>Generated Carousel ({carousel.slides.length} slides)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {carousel.slides.map((slide: any) => (
                                  <div key={slide.index} className="space-y-2">
                                    <img 
                                      src={slide.imageUrl} 
                                      alt={`Slide ${slide.index}`}
                                      className="w-full h-32 object-cover rounded border"
                                    />
                                    <p className="text-xs text-muted-foreground">{slide.slide}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        } catch (e) {
                          return null
                        }
                      })()}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}