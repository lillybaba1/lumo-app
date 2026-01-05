"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Shield, 
  ShieldOff, 
  AlertTriangle, 
  Eye, 
  Ban, 
  CheckCircle,
  Globe,
  Wifi,
  WifiOff,
  MapPin,
  Building,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
  Users,
  Flag,
  Mail,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface IPInvestigation {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_datacenter: boolean;
  is_mobile: boolean;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  threat_types: string[];
  real_ip: string | null;
  real_location: any;
}

interface IPBan {
  id: string;
  ip_address: string;
  ip_range: string | null;
  reason: string | null;
  banned_by: string | null;
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  ban_type: string;
  notes: string | null;
}

interface SuspiciousActivity {
  id: string;
  ip_address: string;
  visitor_id: string | null;
  activity_type: string;
  description: string | null;
  metadata: any;
  severity: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface UserSecurityFlags {
  id: string;
  user_id: string;
  email: string;
  is_flagged: boolean;
  flag_reason: string | null;
  flagged_by: string | null;
  flagged_at: string | null;
  unique_ips_count: number;
  unique_countries_count: number;
  vpn_login_count: number;
  last_login_ip: string | null;
  last_login_at: string | null;
  suspicious_pattern_detected: boolean;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

interface UserLoginHistory {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  login_type: string;
  is_vpn: boolean;
  is_proxy: boolean;
  threat_level: string;
  country: string | null;
  city: string | null;
  created_at: string;
}

interface MultiAccountIP {
  ip_address: string;
  account_count: number;
  emails: string[];
  user_ids: string[];
}

export default function IPManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('investigate');
  const [loading, setLoading] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  
  // Investigate
  const [ipToInvestigate, setIpToInvestigate] = useState('');
  const [investigation, setInvestigation] = useState<IPInvestigation | null>(null);
  
  // Banned IPs
  const [bannedIPs, setBannedIPs] = useState<IPBan[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  
  // Suspicious Activities
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  
  // Ban Dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banNotes, setBanNotes] = useState('');
  const [banType, setBanType] = useState<'manual' | 'temporary'>('manual');
  const [banExpiry, setBanExpiry] = useState('');
  const [ipToBan, setIpToBan] = useState('');

  // Resolve Dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [activityToResolve, setActivityToResolve] = useState<SuspiciousActivity | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // User Security
  const [flaggedUsers, setFlaggedUsers] = useState<UserSecurityFlags[]>([]);
  const [loginHistory, setLoginHistory] = useState<UserLoginHistory[]>([]);
  const [multiAccountIPs, setMultiAccountIPs] = useState<MultiAccountIP[]>([]);
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(true);
  const [usersOnIP, setUsersOnIP] = useState<any[]>([]);

  // Load data
  useEffect(() => {
    if (activeTab === 'banned') {
      loadBannedIPs();
    } else if (activeTab === 'suspicious') {
      loadSuspiciousActivities();
    } else if (activeTab === 'users') {
      loadFlaggedUsers();
      loadMultiAccountIPs();
    } else if (activeTab === 'logins') {
      loadLoginHistory();
    }
  }, [activeTab, showInactive, showResolved, showFlaggedOnly]);

  const loadBannedIPs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ip-management?action=banned&includeInactive=${showInactive}`);
      const data = await res.json();
      if (data.success) {
        setBannedIPs(data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load banned IPs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadSuspiciousActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ip-management?action=suspicious&unresolvedOnly=${!showResolved}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load suspicious activities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadFlaggedUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ip-management?action=flagged-users&flaggedOnly=${showFlaggedOnly}`);
      const data = await res.json();
      if (data.success) {
        setFlaggedUsers(data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load user security data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMultiAccountIPs = async () => {
    try {
      const res = await fetch(`/api/admin/ip-management?action=multi-account-ips&minAccounts=2`);
      const data = await res.json();
      if (data.success) {
        setMultiAccountIPs(data.data);
      }
    } catch (error) {
      console.error('Failed to load multi-account IPs:', error);
    }
  };

  const loadLoginHistory = async (email?: string) => {
    setLoading(true);
    try {
      let url = `/api/admin/ip-management?action=login-history&limit=100`;
      if (email) url += `&email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLoginHistory(data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load login history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadUsersOnIP = async (ip: string) => {
    try {
      const res = await fetch(`/api/admin/ip-management?action=users-by-ip&ip=${encodeURIComponent(ip)}`);
      const data = await res.json();
      if (data.success) {
        setUsersOnIP(data.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users for IP', variant: 'destructive' });
    }
  };

  const handleFlagUser = async (email: string, flag: boolean) => {
    try {
      const res = await fetch('/api/admin/ip-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: flag ? 'flag-user' : 'unflag-user',
          email,
          flagReason: 'Manually flagged by admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: flag ? 'User flagged' : 'User unflagged' });
        loadFlaggedUsers();
      } else {
        toast({ title: 'Error', description: data.error || 'Operation failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const investigateIP = async () => {
    if (!ipToInvestigate.trim()) {
      toast({ title: 'Error', description: 'Please enter an IP address', variant: 'destructive' });
      return;
    }

    setInvestigating(true);
    setInvestigation(null);
    try {
      const res = await fetch(`/api/admin/ip-management?action=investigate&ip=${encodeURIComponent(ipToInvestigate)}`);
      const data = await res.json();
      if (data.success) {
        setInvestigation(data.data);
        toast({ title: 'Success', description: 'IP investigation complete' });
      } else {
        toast({ title: 'Error', description: data.error || 'Investigation failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to investigate IP', variant: 'destructive' });
    } finally {
      setInvestigating(false);
    }
  };

  const handleBanIP = async () => {
    if (!ipToBan.trim()) {
      toast({ title: 'Error', description: 'Please enter an IP address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/ip-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban',
          ip: ipToBan,
          reason: banReason || 'No reason provided',
          banType,
          notes: banNotes,
          expiresAt: banExpiry || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'IP banned successfully' });
        setBanDialogOpen(false);
        setBanReason('');
        setBanNotes('');
        setBanExpiry('');
        setIpToBan('');
        loadBannedIPs();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to ban IP', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to ban IP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanIP = async (ip: string) => {
    if (!confirm(`Are you sure you want to unban ${ip}?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/ip-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban', ip }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'IP unbanned successfully' });
        loadBannedIPs();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to unban IP', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to unban IP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveActivity = async () => {
    if (!activityToResolve) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/ip-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          activityId: activityToResolve.id,
          resolutionNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Activity resolved' });
        setResolveDialogOpen(false);
        setActivityToResolve(null);
        setResolutionNotes('');
        loadSuspiciousActivities();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to resolve activity', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resolve activity', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openBanDialog = (ip?: string) => {
    setIpToBan(ip || '');
    setBanDialogOpen(true);
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            IP Management
          </h1>
          <p className="text-muted-foreground">Investigate, monitor, and ban suspicious IP addresses</p>
        </div>
        <Button onClick={() => openBanDialog()} variant="destructive">
          <Ban className="h-4 w-4 mr-2" />
          Ban IP
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="investigate" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Investigate
          </TabsTrigger>
          <TabsTrigger value="banned" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Banned IPs
          </TabsTrigger>
          <TabsTrigger value="suspicious" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Suspicious
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="logins" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Logins
          </TabsTrigger>
        </TabsList>

        {/* Investigate Tab */}
        <TabsContent value="investigate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>IP Investigation</CardTitle>
              <CardDescription>
                Enter an IP address to investigate. Detects VPNs, proxies, Tor exit nodes, and datacenter IPs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter IP address (e.g., 8.8.8.8)"
                  value={ipToInvestigate}
                  onChange={(e) => setIpToInvestigate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && investigateIP()}
                />
                <Button onClick={investigateIP} disabled={investigating}>
                  {investigating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Investigate</span>
                </Button>
              </div>

              {investigation && (
                <div className="space-y-4 mt-6">
                  {/* Threat Summary */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{investigation.ip}</h3>
                      <p className="text-muted-foreground">
                        {investigation.city}, {investigation.region}, {investigation.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getThreatBadge(investigation.threat_level)}
                      {investigation.is_vpn && (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          <WifiOff className="h-3 w-3 mr-1" />
                          VPN
                        </Badge>
                      )}
                      {investigation.is_proxy && (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          Proxy
                        </Badge>
                      )}
                      {investigation.is_tor && (
                        <Badge variant="destructive">
                          TOR
                        </Badge>
                      )}
                      {investigation.is_datacenter && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          <Building className="h-3 w-3 mr-1" />
                          Datacenter
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                        <p className="font-semibold">{investigation.city}, {investigation.region}</p>
                        <p className="text-sm text-muted-foreground">{investigation.country} ({investigation.country_code})</p>
                        {investigation.latitude && investigation.longitude && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {investigation.latitude.toFixed(4)}, {investigation.longitude.toFixed(4)}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Globe className="h-4 w-4" />
                          Network
                        </div>
                        <p className="font-semibold">{investigation.isp || 'Unknown ISP'}</p>
                        <p className="text-sm text-muted-foreground">{investigation.org || 'Unknown Org'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{investigation.asn || 'No ASN'}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          Timezone
                        </div>
                        <p className="font-semibold">{investigation.timezone || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {investigation.is_mobile && (
                            <Badge variant="outline">Mobile</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Threat Types */}
                  {investigation.threat_types.length > 0 && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Detected Threats
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {investigation.threat_types.map((threat, i) => (
                            <Badge key={i} variant="outline" className="border-red-500 text-red-500">
                              {threat}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Users on this IP */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Users on this IP
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => loadUsersOnIP(investigation.ip)}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Check
                        </Button>
                      </div>
                      {usersOnIP.length > 0 ? (
                        <div className="space-y-2">
                          {usersOnIP.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div>
                                <p className="font-mono text-sm">{user.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.login_count} logins · Last: {new Date(user.last_seen_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {user.is_trusted && <Badge variant="outline" className="text-green-500 border-green-500">Trusted</Badge>}
                                {user.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Click Check to see users</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => openBanDialog(investigation.ip)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban This IP
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banned IPs Tab */}
        <TabsContent value="banned" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Banned IP Addresses</CardTitle>
                  <CardDescription>
                    Manage banned IP addresses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInactive(!showInactive)}
                  >
                    {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadBannedIPs}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : bannedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No banned IPs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Banned At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedIPs.map((ban) => (
                      <TableRow key={ban.id}>
                        <TableCell className="font-mono">{ban.ip_address}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{ban.reason}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ban.ban_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ban.banned_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {ban.expires_at ? new Date(ban.expires_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {ban.is_active ? (
                            <Badge variant="destructive">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {ban.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbanIP(ban.ip_address)}
                            >
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspicious Activity Tab */}
        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Suspicious Activities</CardTitle>
                  <CardDescription>
                    Monitor and investigate suspicious behavior
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResolved(!showResolved)}
                  >
                    {showResolved ? 'Hide Resolved' : 'Show Resolved'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadSuspiciousActivities}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No suspicious activities found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-mono">{activity.ip_address}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.activity_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {activity.description}
                        </TableCell>
                        <TableCell>{getSeverityBadge(activity.severity)}</TableCell>
                        <TableCell>
                          {new Date(activity.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {activity.is_resolved ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIpToInvestigate(activity.ip_address);
                                setActiveTab('investigate');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!activity.is_resolved && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActivityToResolve(activity);
                                    setResolveDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openBanDialog(activity.ip_address)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Security Overview
              </CardTitle>
              <CardDescription>
                Monitor user accounts for suspicious activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showFlaggedOnly}
                    onCheckedChange={setShowFlaggedOnly}
                  />
                  <Label>Show flagged users only</Label>
                </div>
                <Button variant="outline" onClick={loadFlaggedUsers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : flaggedUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No {showFlaggedOnly ? 'flagged ' : ''}users found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Unique IPs</TableHead>
                      <TableHead>Countries</TableHead>
                      <TableHead>VPN Logins</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.risk_score >= 75 ? 'destructive' : user.risk_score >= 50 ? 'default' : 'secondary'}
                          >
                            {user.risk_score}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.unique_ips_count}</TableCell>
                        <TableCell>{user.unique_countries_count}</TableCell>
                        <TableCell>{user.vpn_login_count}</TableCell>
                        <TableCell>
                          {user.last_login_at ? (
                            <div className="text-sm">
                              <div>{new Date(user.last_login_at).toLocaleDateString()}</div>
                              <div className="text-muted-foreground font-mono text-xs">
                                {user.last_login_ip}
                              </div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {user.is_flagged ? (
                            <Badge variant="destructive">Flagged</Badge>
                          ) : user.suspicious_pattern_detected ? (
                            <Badge className="bg-yellow-500">Suspicious</Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUserEmailSearch(user.email);
                                loadLoginHistory(user.email);
                                setActiveTab('logins');
                              }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            {user.last_login_ip && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIpToInvestigate(user.last_login_ip!);
                                  setActiveTab('investigate');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {user.is_flagged ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFlagUser(user.email, false)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleFlagUser(user.email, true)}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Multi-Account IPs Card */}
          {multiAccountIPs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="h-5 w-5" />
                  Shared IP Addresses
                </CardTitle>
                <CardDescription>
                  IP addresses used by multiple user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>Emails</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {multiAccountIPs.map((item) => (
                      <TableRow key={item.ip_address}>
                        <TableCell className="font-mono">{item.ip_address}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.account_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.emails.slice(0, 3).map((email) => (
                              <Badge key={email} variant="outline" className="text-xs">
                                {email}
                              </Badge>
                            ))}
                            {item.emails.length > 3 && (
                              <Badge variant="secondary">+{item.emails.length - 3} more</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIpToInvestigate(item.ip_address);
                                setActiveTab('investigate');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openBanDialog(item.ip_address)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logins Tab */}
        <TabsContent value="logins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Login History
              </CardTitle>
              <CardDescription>
                View login activity by user email or IP address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadLoginHistory(userEmailSearch)}
                />
                <Button onClick={() => loadLoginHistory(userEmailSearch)} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
                <Button variant="outline" onClick={() => { setUserEmailSearch(''); loadLoginHistory(); }}>
                  Clear
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No login history found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Security</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell className="text-sm">
                          {new Date(login.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{login.email}</TableCell>
                        <TableCell className="font-mono text-sm">{login.ip_address}</TableCell>
                        <TableCell>
                          {login.city && login.country ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {login.city}, {login.country}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{login.login_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {login.is_vpn && (
                              <Badge variant="destructive" className="text-xs">VPN</Badge>
                            )}
                            {login.is_proxy && (
                              <Badge variant="destructive" className="text-xs">Proxy</Badge>
                            )}
                            {!login.is_vpn && !login.is_proxy && (
                              <Badge variant="secondary" className="text-xs">Clean</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIpToInvestigate(login.ip_address);
                                setActiveTab('investigate');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openBanDialog(login.ip_address)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban IP Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban IP Address</DialogTitle>
            <DialogDescription>
              Block this IP address from accessing your site
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                placeholder="Enter IP address"
                value={ipToBan}
                onChange={(e) => setIpToBan(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="Reason for banning"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ban Type</Label>
              <Select value={banType} onValueChange={(v: 'manual' | 'temporary') => setBanType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banType === 'temporary' && (
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={banExpiry}
                  onChange={(e) => setBanExpiry(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={banNotes}
                onChange={(e) => setBanNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanIP} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ban IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Activity Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Activity</DialogTitle>
            <DialogDescription>
              Mark this suspicious activity as resolved
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activityToResolve && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-sm">{activityToResolve.ip_address}</p>
                <p className="text-sm text-muted-foreground">{activityToResolve.description}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="What action was taken?"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveActivity} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
