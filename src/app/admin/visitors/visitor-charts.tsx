'use client';

import { VisitorStats } from '@/services/visitorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp, Users } from 'lucide-react';

interface VisitorChartsProps {
  stats: VisitorStats;
}

export default function VisitorCharts({ stats }: VisitorChartsProps) {
  // Find max values for scaling
  const maxDailyVisitors = Math.max(...stats.visitorsOverTime.map(d => d.count), 1);
  const maxBrowserCount = Math.max(...stats.browserBreakdown.map(b => b.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Visitors Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Visitors Over Time (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.visitorsOverTime.length > 0 ? (
            <div className="space-y-2">
              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-40">
                {stats.visitorsOverTime.slice(-14).map((day, i) => {
                  const height = (day.count / maxDailyVisitors) * 100;
                  const date = new Date(day.date);
                  return (
                    <div 
                      key={day.date} 
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div className="relative w-full flex justify-center">
                        <div 
                          className="w-full max-w-8 bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.date}: ${day.count} visitors`}
                        />
                        <div className="absolute -top-6 hidden group-hover:block bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-md whitespace-nowrap z-10">
                          {day.count} visitors
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>
                  {stats.visitorsOverTime.length > 0 
                    ? new Date(stats.visitorsOverTime[Math.max(0, stats.visitorsOverTime.length - 14)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </span>
                <span>
                  {stats.visitorsOverTime.length > 0 
                    ? new Date(stats.visitorsOverTime[stats.visitorsOverTime.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* New vs Returning Visitors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            New vs Returning Visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalVisitors > 0 ? (
            <div className="space-y-6">
              {/* Donut chart visualization */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    {/* New visitors segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(stats.newVisitors / stats.totalVisitors) * 251.2} 251.2`}
                      className="text-blue-500"
                    />
                    {/* Returning visitors segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(stats.returningVisitors / stats.totalVisitors) * 251.2} 251.2`}
                      strokeDashoffset={`-${(stats.newVisitors / stats.totalVisitors) * 251.2}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold">{stats.totalVisitors}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">New ({stats.newVisitors})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Returning ({stats.returningVisitors})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browser Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Browser Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.browserBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.browserBreakdown.slice(0, 6).map((browser) => {
                const percentage = stats.totalVisitors > 0 
                  ? Math.round((browser.count / stats.totalVisitors) * 100) 
                  : 0;
                return (
                  <div key={browser.browser} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{browser.browser}</span>
                      <span className="text-muted-foreground">
                        {browser.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
