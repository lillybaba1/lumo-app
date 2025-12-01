'use client';

import { Visitor } from '@/services/visitorService';
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
  Monitor, 
  Smartphone, 
  Tablet, 
  HelpCircle,
  MapPin,
  Clock,
  Eye,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VisitorTableProps {
  visitors: Visitor[];
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

export default function VisitorTable({ visitors }: VisitorTableProps) {
  if (visitors.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No visitors yet</h3>
        <p className="text-muted-foreground">
          Visitors will appear here once they start browsing your site.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Browser</TableHead>
            <TableHead>Landing Page</TableHead>
            <TableHead className="text-center">Pages</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visitors.map((visitor) => {
            const isLive = new Date(visitor.last_activity).getTime() > Date.now() - 5 * 60 * 1000;
            
            return (
              <TableRow key={visitor.id}>
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
                      {visitor.country && (
                        <div className="text-xs text-muted-foreground truncate">
                          {visitor.country}
                        </div>
                      )}
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        Live
                      </Badge>
                    ) : visitor.is_returning ? (
                      <Badge variant="secondary">Returning</Badge>
                    ) : (
                      <Badge variant="outline">New</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
