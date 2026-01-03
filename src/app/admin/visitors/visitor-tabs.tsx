'use client';

import { useState, useTransition } from 'react';
import { Visitor, PageView } from '@/services/visitorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  HelpCircle,
  MapPin,
  Clock,
  Eye,
  Globe,
  Trash2,
  Activity,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface VisitorTabsProps {
  initialVisitors: Visitor[];
  initialTotal: number;
  activeCount: number;
  inactiveCount: number;
  recentActivities: (PageView & { visitor?: Visitor })[];
}

function getDeviceIcon(device: string) {
  switch (device) {
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function getTimeSince(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export default function VisitorTabs({ 
  initialVisitors, 
  initialTotal,
  activeCount: initialActiveCount,
  inactiveCount: initialInactiveCount,
  recentActivities 
}: VisitorTabsProps) {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [activeCount, setActiveCount] = useState(initialActiveCount);
  const [inactiveCount, setInactiveCount] = useState(initialInactiveCount);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [clearHours, setClearHours] = useState('0.083');
  const [isPending, startTransition] = useTransition();
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFilterChange = async (value: 'all' | 'active' | 'inactive') => {
    setFilter(value);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/visitors?status=${value}`);
        const data = await res.json();
        if (data.visitors) {
          setVisitors(data.visitors);
          setActiveCount(data.activeCount);
          setInactiveCount(data.inactiveCount);
        }
      } catch (error) {
        console.error('Error fetching visitors:', error);
      }
    });
  };

  const handleClearInactive = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/admin/visitors/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursInactive: parseFloat(clearHours) }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Inactive Visitors Cleared',
          description: `Deleted ${data.deleted} inactive visitor${data.deleted !== 1 ? 's' : ''}.`,
        });
        // Let router.refresh() reload the full page data
        setInactiveCount(0);
        router.refresh();
      } else {
        toast({
          title: 'Clear Failed',
          description: data.error || 'Could not clear inactive visitors. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Clear inactive error:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the server. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/visitors/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setVisitors(prev => prev.filter(v => v.id !== id));
        toast({
          title: 'Visitor Deleted',
          description: 'Visitor and their data have been removed.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete visitor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete visitor.',
        variant: 'destructive',
      });
    }
  };

  const filteredVisitors = visitors;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  return (
    <Tabs defaultValue="visitors" className="space-y-4">
      <TabsList>
        <TabsTrigger value="visitors" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Visitors
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visitors">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Visitor Management</CardTitle>
                <CardDescription>
                  {filter === 'all' && `Showing all ${visitors.length} visitors`}
                  {filter === 'active' && `Showing ${activeCount} active visitors`}
                  {filter === 'inactive' && `Showing ${inactiveCount} inactive visitors`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filter} onValueChange={(v) => handleFilterChange(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visitors</SelectItem>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Active ({activeCount})
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Inactive ({inactiveCount})
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFilterChange(filter)}
                  disabled={isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear Inactive
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Inactive Visitors</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all visitors who have been inactive for the selected period. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">
                        Clear visitors inactive for more than:
                      </label>
                      <Select value={clearHours} onValueChange={setClearHours}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.083">5 minutes (all inactive)</SelectItem>
                          <SelectItem value="0.5">30 minutes</SelectItem>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                          <SelectItem value="168">7 days</SelectItem>
                          <SelectItem value="720">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearInactive}
                        disabled={isClearing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isClearing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Clear Inactive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No visitors found</h3>
                <p className="text-muted-foreground">
                  {filter === 'active' ? 'No active visitors right now.' : 
                   filter === 'inactive' ? 'No inactive visitors to show.' :
                   'Visitors will appear here once they start browsing your site.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Landing Page</TableHead>
                      <TableHead className="text-center">Pages</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => {
                      const isLive = new Date(visitor.last_activity).getTime() > fiveMinutesAgo;
                      
                      return (
                        <TableRow key={visitor.id}>
                          <TableCell>
                            {isLive ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <span className="relative flex h-2 w-2 mr-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {visitor.city || 'Unknown'}
                                  {visitor.country_code && (
                                    <span className="text-muted-foreground ml-1">
                                      ({visitor.country_code})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(visitor.device_type)}
                              <span className="capitalize">{visitor.device_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="font-medium">{visitor.browser || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{visitor.os || 'Unknown'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate" title={visitor.landing_page}>
                              {visitor.landing_page === '/' ? 'Home' : visitor.landing_page}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              <span>{visitor.page_views}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDuration(visitor.session_duration)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {getTimeSince(visitor.last_activity)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVisitor(visitor.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity Log
            </CardTitle>
            <CardDescription>
              Page views and visitor activities across your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                <p className="text-muted-foreground">
                  Page views will appear here as visitors browse your site.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentActivities.map((activity) => {
                  const isLive = activity.visitor && 
                    new Date(activity.visitor.last_activity).getTime() > fiveMinutesAgo;
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {activity.visitor ? (
                          getDeviceIcon(activity.visitor.device_type)
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {activity.page_path === '/' ? 'Home' : activity.page_path}
                          </span>
                          {activity.page_title && (
                            <span className="text-muted-foreground text-sm">
                              - {activity.page_title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          {activity.visitor && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>
                                {activity.visitor.city || 'Unknown'}, {activity.visitor.country || 'Unknown'}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span>{activity.visitor.browser}</span>
                            </>
                          )}
                          {activity.referrer && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="truncate max-w-[200px]">from: {activity.referrer}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isLive && (
                          <Badge variant="default" className="bg-green-500 text-xs">Live</Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getTimeSince(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
