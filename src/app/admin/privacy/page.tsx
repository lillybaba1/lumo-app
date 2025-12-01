"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cookie, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConsentStats {
  totalVisitors: number;
  cookieConsents: {
    accepted: number;
    declined: number;
    pending: number;
  };
  locationConsents: {
    granted: number;
    denied: number;
    pending: number;
  };
  cookieBreakdown: {
    analytics: number;
    marketing: number;
    preferences: number;
  };
}

export default function PrivacyDashboard() {
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/privacy-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Use placeholder stats if API not available
        setStats({
          totalVisitors: 0,
          cookieConsents: { accepted: 0, declined: 0, pending: 0 },
          locationConsents: { granted: 0, denied: 0, pending: 0 },
          cookieBreakdown: { analytics: 0, marketing: 0, preferences: 0 },
        });
      }
    } catch (error) {
      console.error('Failed to load privacy stats:', error);
      setStats({
        totalVisitors: 0,
        cookieConsents: { accepted: 0, declined: 0, pending: 0 },
        locationConsents: { granted: 0, denied: 0, pending: 0 },
        cookieBreakdown: { analytics: 0, marketing: 0, preferences: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Privacy & Consent
          </h1>
          <p className="text-muted-foreground">
            Manage user privacy settings and view consent analytics
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVisitors || 0}</div>
            <p className="text-xs text-muted-foreground">Unique visitors tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cookie Consent Rate</CardTitle>
            <Cookie className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && stats.cookieConsents.accepted + stats.cookieConsents.declined > 0
                ? Math.round(
                    (stats.cookieConsents.accepted /
                      (stats.cookieConsents.accepted + stats.cookieConsents.declined)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.cookieConsents.accepted || 0} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Consent</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && stats.locationConsents.granted + stats.locationConsents.denied > 0
                ? Math.round(
                    (stats.locationConsents.granted /
                      (stats.locationConsents.granted + stats.locationConsents.denied)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.locationConsents.granted || 0} granted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics Opt-in</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cookieBreakdown.analytics || 0}</div>
            <p className="text-xs text-muted-foreground">Users with analytics enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cookie Consent Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Consent Breakdown
            </CardTitle>
            <CardDescription>How users respond to cookie consent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Accepted All</span>
              </div>
              <Badge variant="secondary">{stats?.cookieConsents.accepted || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Necessary Only</span>
              </div>
              <Badge variant="secondary">{stats?.cookieConsents.declined || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>No Response</span>
              </div>
              <Badge variant="secondary">{stats?.cookieConsents.pending || 0}</Badge>
            </div>

            <hr className="my-4" />

            <h4 className="font-medium text-sm">Cookie Type Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analytics</span>
                <span>{stats?.cookieBreakdown.analytics || 0} users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marketing</span>
                <span>{stats?.cookieBreakdown.marketing || 0} users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferences</span>
                <span>{stats?.cookieBreakdown.preferences || 0} users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Consent Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Access Breakdown
            </CardTitle>
            <CardDescription>User responses to location requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Granted</span>
              </div>
              <Badge variant="secondary">{stats?.locationConsents.granted || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Denied</span>
              </div>
              <Badge variant="secondary">{stats?.locationConsents.denied || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Not Asked</span>
              </div>
              <Badge variant="secondary">{stats?.locationConsents.pending || 0}</Badge>
            </div>

            <hr className="my-4" />

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Why Location?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Calculate accurate shipping rates</li>
                <li>• Show local currency & pricing</li>
                <li>• Display nearby pickup locations</li>
                <li>• Personalize product recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GDPR Compliance Note */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">GDPR Compliance</h4>
              <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mt-1">
                Your store is configured to request explicit consent for cookies and location access.
                Users can modify their preferences at any time. All consent data is stored locally
                on user devices and tracked anonymously for analytics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
