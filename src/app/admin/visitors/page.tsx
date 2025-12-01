import { getVisitorsByStatus, getVisitorStats, getLiveVisitors, getRecentActivities } from '@/services/visitorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Globe, Monitor, Clock, TrendingUp, Eye, MapPin, Activity } from 'lucide-react';
import VisitorCharts from './visitor-charts';
import VisitorTabs from './visitor-tabs';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default async function VisitorsPage() {
  const [visitorsData, stats, liveCount, recentActivities] = await Promise.all([
    getVisitorsByStatus('all', 1, 50),
    getVisitorStats(),
    getLiveVisitors(),
    getRecentActivities(100),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Website Visitors</h1>
          <p className="text-muted-foreground">Track and analyze your website traffic</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {liveCount} Live Now
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.uniqueVisitors.toLocaleString()} unique
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active / Inactive</p>
                <p className="text-2xl font-bold">
                  <span className="text-green-600">{visitorsData.activeCount}</span>
                  {' / '}
                  <span className="text-muted-foreground">{visitorsData.inactiveCount}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active in last 5 min
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Session</p>
                <p className="text-2xl font-bold">{formatDuration(stats.averageSessionDuration)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Time on site
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Returning</p>
                <p className="text-2xl font-bold">
                  {stats.totalVisitors > 0 
                    ? Math.round((stats.returningVisitors / stats.totalVisitors) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.returningVisitors.toLocaleString()} returning visitors
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/10">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <VisitorCharts stats={stats} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCountries.length > 0 ? (
                stats.topCountries.slice(0, 5).map((item, i) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.country}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPages.length > 0 ? (
                stats.topPages.slice(0, 5).map((item, i) => (
                  <div key={item.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                      <span className="font-medium truncate" title={item.page}>
                        {item.page === '/' ? 'Home' : item.page}
                      </span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{item.views}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device & Browser */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.deviceBreakdown.length > 0 ? (
                stats.deviceBreakdown.map((item) => {
                  const percentage = stats.totalVisitors > 0 
                    ? Math.round((item.count / stats.totalVisitors) * 100) 
                    : 0;
                  return (
                    <div key={item.device} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{item.device}</span>
                        <span className="text-muted-foreground text-sm">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Tabs - Active/Inactive/Activity */}
      <VisitorTabs 
        initialVisitors={visitorsData.visitors}
        initialTotal={visitorsData.total}
        activeCount={visitorsData.activeCount}
        inactiveCount={visitorsData.inactiveCount}
        recentActivities={recentActivities}
      />
    </div>
  );
}
