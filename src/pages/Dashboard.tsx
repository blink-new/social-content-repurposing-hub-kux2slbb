import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  RefreshCw, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Users,
  Target,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function Dashboard() {
  const stats = [
    {
      title: 'Content Converted',
      value: '24',
      change: '+12%',
      icon: RefreshCw,
      color: 'text-blue-600'
    },
    {
      title: 'Posts Scheduled',
      value: '18',
      change: '+8%',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Total Engagement',
      value: '2.4K',
      change: '+23%',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Platforms Active',
      value: '6',
      change: '+2',
      icon: Target,
      color: 'text-orange-600'
    }
  ]

  const recentActivity = [
    {
      action: 'Newsletter converted to LinkedIn post',
      time: '2 hours ago',
      platform: 'LinkedIn'
    },
    {
      action: 'Instagram post scheduled for tomorrow',
      time: '4 hours ago',
      platform: 'Instagram'
    },
    {
      action: 'X thread generated from blog post',
      time: '6 hours ago',
      platform: 'X (Twitter)'
    },
    {
      action: 'TikTok script created from newsletter',
      time: '1 day ago',
      platform: 'TikTok'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your content repurposing activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with content repurposing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/inspiration">
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Topic Inspiration</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link to="/convert">
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Convert Content</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link to="/schedule">
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Posts</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link to="/analytics">
              <Button className="w-full justify-between" variant="outline">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>View Analytics</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest content transformations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {activity.platform}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>
            Content distribution across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'LinkedIn', posts: 12, color: 'bg-blue-500' },
              { name: 'X (Twitter)', posts: 8, color: 'bg-black' },
              { name: 'Instagram', posts: 15, color: 'bg-pink-500' },
              { name: 'TikTok', posts: 6, color: 'bg-red-500' },
              { name: 'Threads', posts: 4, color: 'bg-purple-500' },
              { name: 'Newsletter', posts: 3, color: 'bg-green-500' }
            ].map((platform) => (
              <div key={platform.name} className="text-center">
                <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium">{platform.name}</p>
                <p className="text-xs text-muted-foreground">{platform.posts} posts</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}