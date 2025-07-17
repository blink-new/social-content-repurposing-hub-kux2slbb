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
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/use-toast'

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-red-500' },
  { id: 'threads', name: 'Threads', icon: MessageCircle, color: 'bg-purple-500' },
  { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'bg-green-600' }
]

interface ScheduledPost {
  id: string
  content: string
  platform: string
  scheduledDate: Date
  status: 'scheduled' | 'published' | 'failed'
  title?: string
}

export function Scheduler() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [showNewPostForm, setShowNewPostForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const { toast } = useToast()

  // Load scheduled posts from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('scheduledPosts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((post: any) => ({
          ...post,
          scheduledDate: new Date(post.scheduledDate)
        }))
        setScheduledPosts(parsed)
      } catch (error) {
        console.error('Error loading scheduled posts:', error)
      }
    }
  }, [])

  // Save to localStorage whenever scheduledPosts changes
  useEffect(() => {
    localStorage.setItem('scheduledPosts', JSON.stringify(scheduledPosts))
  }, [scheduledPosts])

  const handleSchedulePost = () => {
    if (!selectedDate || !selectedTime || !selectedPlatform || !postContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      content: postContent,
      platform: selectedPlatform,
      scheduledDate: scheduledDateTime,
      status: 'scheduled',
      title: postTitle || undefined
    }

    setScheduledPosts(prev => [...prev, newPost])
    
    // Reset form
    setSelectedDate(undefined)
    setSelectedTime('')
    setSelectedPlatform('')
    setPostContent('')
    setPostTitle('')
    setShowNewPostForm(false)

    toast({
      title: "Post Scheduled!",
      description: `Your post has been scheduled for ${format(scheduledDateTime, 'PPP p')}`
    })
  }

  const handleDeletePost = (id: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== id))
    toast({
      title: "Post Deleted",
      description: "Scheduled post has been removed"
    })
  }

  const getStatusIcon = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ScheduledPost['status']) => {
    const variants = {
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

  const upcomingPosts = scheduledPosts
    .filter(post => post.scheduledDate > new Date() && post.status === 'scheduled')
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Scheduler</h1>
          <p className="text-muted-foreground mt-2">
            Schedule your content across all platforms
          </p>
        </div>
        <Button onClick={() => setShowNewPostForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Post Form */}
          {showNewPostForm && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Post</CardTitle>
                <CardDescription>
                  Create and schedule content for your social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 ${platform.color} rounded flex items-center justify-center`}>
                                <platform.icon className="w-3 h-3 text-white" />
                              </div>
                              <span>{platform.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Title (Optional)</Label>
                    <Input
                      placeholder="Post title..."
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Write your post content..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSchedulePost}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Posts List */}
          <Card>
            <CardHeader>
              <CardTitle>All Scheduled Posts</CardTitle>
              <CardDescription>
                Manage your scheduled content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No scheduled posts</p>
                  <p>Create your first scheduled post to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts
                    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
                    .map((post) => {
                      const platform = platforms.find(p => p.id === post.platform)
                      if (!platform) return null

                      return (
                        <div key={post.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center`}>
                                <platform.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{platform.name}</span>
                                  {getStatusBadge(post.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(post.scheduledDate, 'PPP p')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(post.status)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {post.title && (
                            <h4 className="font-medium mb-2">{post.title}</h4>
                          )}
                          
                          <div className="bg-muted rounded p-3">
                            <p className="text-sm whitespace-pre-wrap">
                              {post.content.length > 200 
                                ? `${post.content.substring(0, 200)}...` 
                                : post.content
                              }
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Posts</CardTitle>
              <CardDescription>
                Next scheduled content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming posts
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((post) => {
                    const platform = platforms.find(p => p.id === post.platform)
                    if (!platform) return null

                    return (
                      <div key={post.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className={`w-6 h-6 ${platform.color} rounded flex items-center justify-center`}>
                          <platform.icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {post.title || post.content.substring(0, 30) + '...'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(post.scheduledDate, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Scheduled</span>
                  <span className="text-sm font-medium">
                    {scheduledPosts.filter(p => p.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm font-medium">
                    {scheduledPosts.filter(p => p.status === 'published').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="text-sm font-medium">
                    {scheduledPosts.filter(p => p.status === 'failed').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}