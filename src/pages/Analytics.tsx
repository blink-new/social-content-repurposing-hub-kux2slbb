import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'

export function Analytics() {
  const metrics = [
    { title: 'Total Reach', value: '12.4K', change: '+15%', icon: Users },
    { title: 'Engagement Rate', value: '4.2%', change: '+0.8%', icon: TrendingUp },
    { title: 'Total Views', value: '28.7K', change: '+22%', icon: Eye },
    { title: 'Conversions', value: '156', change: '+12%', icon: BarChart3 }
  ]

  const platformData = [
    { platform: 'LinkedIn', posts: 12, engagement: '5.2%', reach: '3.2K' },
    { platform: 'Twitter', posts: 18, engagement: '3.8%', reach: '4.1K' },
    { platform: 'Instagram', posts: 15, engagement: '6.1%', reach: '2.8K' },
    { platform: 'TikTok', posts: 8, engagement: '8.3%', reach: '1.9K' },
    { platform: 'Threads', posts: 6, engagement: '4.5%', reach: '1.2K' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your content performance across all platforms
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{metric.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>
              Engagement metrics by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformData.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{platform.platform}</p>
                    <p className="text-sm text-muted-foreground">{platform.posts} posts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{platform.engagement}</p>
                    <p className="text-sm text-muted-foreground">{platform.reach} reach</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Content</CardTitle>
            <CardDescription>
              Your best performing posts this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Industry insights thread', platform: 'Twitter', engagement: '8.2%' },
                { title: 'Product demo video', platform: 'LinkedIn', engagement: '7.5%' },
                { title: 'Behind the scenes story', platform: 'Instagram', engagement: '9.1%' },
                { title: 'Quick tips carousel', platform: 'LinkedIn', engagement: '6.8%' }
              ].map((content, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-muted-foreground">{content.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{content.engagement}</p>
                    <p className="text-sm text-muted-foreground">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
          <CardDescription>
            Track your engagement over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Charts Coming Soon</p>
            <p>Detailed analytics and trend visualization</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}