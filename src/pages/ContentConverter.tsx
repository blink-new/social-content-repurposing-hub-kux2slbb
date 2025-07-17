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
      linkedin: `Convert this content into a professional LinkedIn post. Make it engaging, professional, and include relevant hashtags. Keep it concise but informative:\n\n${originalContent}`,
      twitter: `Convert this content into an engaging X (Twitter) thread. Break it into multiple tweets if needed, each under 280 characters. Use engaging hooks and relevant hashtags:\n\n${originalContent}`,
      instagram: `Convert this content into an Instagram post with engaging caption. Include relevant hashtags and make it visually appealing. Focus on storytelling. For carousel posts, structure content in slides:\n\n${originalContent}`,
      tiktok: `Convert this content into a TikTok video script. Make it engaging, trendy, and include hooks, transitions, and call-to-actions. Focus on entertainment value. Structure as scenes for video creation:\n\n${originalContent}`,
      threads: `Convert this content into a Threads post. Make it conversational, engaging, and authentic. Keep the tone casual but informative:\n\n${originalContent}`,
      newsletter: `Convert this content into a newsletter format. Include a compelling subject line, structured sections, and a clear call-to-action:\n\n${originalContent}`
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
    if (!inputContent.trim() || selectedPlatforms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide content and select at least one platform",
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
          // Validate URL format
          const url = new URL(inputContent)
          
          // Try scraping first for better content extraction
          const { markdown, extract } = await blink.data.scrape(inputContent)
          
          // Use markdown content if available, otherwise fall back to extract
          contentToConvert = markdown || extract.text || 'No content could be extracted from this URL'
          
          if (!contentToConvert || contentToConvert.trim().length < 50) {
            // Fallback to extractFromUrl if scraping didn't get enough content
            const fallbackContent = await blink.data.extractFromUrl(inputContent)
            contentToConvert = fallbackContent || contentToConvert
          }
          
        } catch (error) {
          console.error('URL extraction error:', error)
          toast({
            title: "URL Error",
            description: "Failed to extract content from URL. Please check the URL and try again.",
            variant: "destructive"
          })
          setIsConverting(false)
          return
        }
      }

      // Convert for each selected platform
      const conversions = await Promise.all(
        selectedPlatforms.map(async (platform) => {
          try {
            const prompt = getPlatformPrompt(platform, contentToConvert)
            const { text } = await blink.ai.generateText({
              prompt,
              model: 'gpt-4o-mini',
              maxTokens: 1000
            })
            return { platform, content: text }
          } catch (error) {
            console.error(`Error converting for ${platform}:`, error)
            return { platform, content: 'Error generating content for this platform.' }
          }
        })
      )

      const newResults: Record<string, string> = {}
      conversions.forEach(({ platform, content }) => {
        newResults[platform] = content
      })

      setResults(newResults)
      toast({
        title: "Success!",
        description: `Content converted for ${selectedPlatforms.length} platform(s)`
      })

    } catch (error) {
      console.error('Conversion error:', error)
      toast({
        title: "Conversion Failed",
        description: "An error occurred during conversion. Please try again.",
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
                  placeholder="Paste your content here..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  rows={8}
                />
              </TabsContent>
              
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="url-input">URL</Label>
                <Input
                  id="url-input"
                  placeholder="https://example.com/article"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Supports articles, blog posts, social media posts, and more
                </p>
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
                        <pre className="whitespace-pre-wrap text-sm">{content}</pre>
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