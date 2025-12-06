'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Users,
  Gift,
  Share2,
  Zap,
  Plus,
  Send,
  RefreshCw,
  Download,
  Upload,
  Copy,
  TrendingUp,
  Eye,
  MousePointer,
  UserPlus,
} from 'lucide-react';
import {
  getSubscribers,
  getCampaigns,
  createCampaign,
  getReferralProgram,
  updateReferralProgram,
  getAutomations,
  updateAutomation,
  createAutomation,
} from './actions';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  status: string;
  subscribed_at: string;
  tags: string[];
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
}

interface ReferralProgram {
  is_active: boolean;
  referrer_reward_type: string;
  referrer_reward_amount: number;
  referee_reward_type: string;
  referee_reward_amount: number;
  max_referrals_per_user: number;
}

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  delay_hours: number;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export default function MarketingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', content: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const [subsRes, campsRes, refRes, autoRes] = await Promise.all([
      getSubscribers(),
      getCampaigns(),
      getReferralProgram(),
      getAutomations(),
    ]);

    if (subsRes.success) setSubscribers(subsRes.data || []);
    if (campsRes.success) setCampaigns(campsRes.data || []);
    if (refRes.success) setReferralProgram(refRes.data);
    if (autoRes.success) setAutomations(autoRes.data || []);
    
    setLoading(false);
  }

  async function handleCreateCampaign() {
    if (!newCampaign.name || !newCampaign.subject) {
      toast({ title: 'Error', description: 'Please fill in campaign name and subject', variant: 'destructive' });
      return;
    }

    const result = await createCampaign(newCampaign);
    if (result.success) {
      toast({ title: 'Campaign created' });
      setShowNewCampaign(false);
      setNewCampaign({ name: '', subject: '', content: '' });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleSaveReferral() {
    if (!referralProgram) return;

    const result = await updateReferralProgram(referralProgram);
    if (result.success) {
      toast({ title: 'Referral program updated' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleToggleAutomation(id: string | null, isActive: boolean, triggerType?: string, name?: string) {
    if (id) {
      // Update existing automation
      const result = await updateAutomation(id, { is_active: isActive });
      if (result.success) {
        setAutomations(automations.map(a => 
          a.id === id ? { ...a, is_active: isActive } : a
        ));
        toast({ title: isActive ? 'Automation enabled' : 'Automation disabled' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } else if (triggerType && name) {
      // Create new automation
      const result = await createAutomation({
        name,
        trigger_type: triggerType,
      });
      if (result.success && result.data) {
        // Add the new automation to state and enable it
        const newAutomation = {
          id: result.data.id,
          name: result.data.name,
          trigger_type: result.data.trigger_type,
          is_active: true,
          delay_hours: result.data.delay_hours || 0,
          stats: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        };
        setAutomations([...automations, newAutomation]);
        // Now enable it
        await updateAutomation(result.data.id, { is_active: true });
        toast({ title: 'Automation enabled' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    }
  }

  const activeSubscribers = subscribers.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">
            Grow your audience and increase sales
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">Active email subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'sent').length}
            </div>
            <p className="text-xs text-muted-foreground">Total campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 21%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscribers">
            <Users className="h-4 w-4 mr-2" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Gift className="h-4 w-4 mr-2" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
        </TabsList>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Subscribers</CardTitle>
                  <CardDescription>
                    Manage your email list and subscriber segments
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>No subscribers yet</p>
                        <p className="text-sm">Add a signup form to start collecting emails</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>{sub.name || '-'}</TableCell>
                        <TableCell className="capitalize">{sub.source}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(sub.subscribed_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Campaigns</CardTitle>
                  <CardDescription>
                    Create and send newsletters to your subscribers
                  </CardDescription>
                </div>
                <Button onClick={() => setShowNewCampaign(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <p>No campaigns yet</p>
                        <Button variant="link" onClick={() => setShowNewCampaign(true)}>
                          Create your first campaign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'draft' ? 'secondary' :
                            campaign.status === 'scheduled' ? 'outline' : 'destructive'
                          }>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.stats.sent}</TableCell>
                        <TableCell>
                          {campaign.stats.sent > 0 
                            ? `${((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {campaign.stats.opened > 0
                            ? `${((campaign.stats.clicked / campaign.stats.opened) * 100).toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {campaign.sent_at 
                            ? format(new Date(campaign.sent_at), 'MMM d, yyyy')
                            : format(new Date(campaign.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Referral Program</CardTitle>
                  <CardDescription>
                    Reward customers for referring their friends
                  </CardDescription>
                </div>
                <Switch
                  checked={referralProgram?.is_active ?? false}
                  onCheckedChange={(v) => setReferralProgram({ ...referralProgram!, is_active: v })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Referrer Reward</h4>
                  <p className="text-sm text-muted-foreground">
                    What existing customers get for referring
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Type</Label>
                      <Select
                        value={referralProgram?.referrer_reward_type || 'percentage'}
                        onValueChange={(v) => setReferralProgram({ ...referralProgram!, referrer_reward_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage Off</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="credit">Store Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={referralProgram?.referrer_reward_amount || 10}
                        onChange={(e) => setReferralProgram({ 
                          ...referralProgram!, 
                          referrer_reward_amount: parseFloat(e.target.value) 
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Referee Reward</h4>
                  <p className="text-sm text-muted-foreground">
                    What new customers get when referred
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Type</Label>
                      <Select
                        value={referralProgram?.referee_reward_type || 'percentage'}
                        onValueChange={(v) => setReferralProgram({ ...referralProgram!, referee_reward_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage Off</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={referralProgram?.referee_reward_amount || 10}
                        onChange={(e) => setReferralProgram({ 
                          ...referralProgram!, 
                          referee_reward_amount: parseFloat(e.target.value) 
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveReferral}>
                  Save Referral Program
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Automations</CardTitle>
              <CardDescription>
                Set up automated emails based on customer actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'welcome', name: 'Welcome Email', desc: 'Send when someone subscribes' },
                  { type: 'abandoned_cart', name: 'Abandoned Cart', desc: 'Remind customers about items left in cart' },
                  { type: 'post_purchase', name: 'Post Purchase', desc: 'Thank customers after a purchase' },
                  { type: 'review_request', name: 'Review Request', desc: 'Ask for reviews after delivery' },
                  { type: 'win_back', name: 'Win Back', desc: 'Re-engage inactive customers' },
                ].map((auto) => {
                  const automation = automations.find(a => a.trigger_type === auto.type);
                  return (
                    <div
                      key={auto.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${automation?.is_active ? 'bg-green-500/10' : 'bg-muted'}`}>
                          <Zap className={`h-5 w-5 ${automation?.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{auto.name}</p>
                          <p className="text-sm text-muted-foreground">{auto.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {automation && (
                          <div className="text-sm text-muted-foreground">
                            {automation.stats.sent} sent
                          </div>
                        )}
                        <Switch
                          checked={automation?.is_active ?? false}
                          onCheckedChange={(v) => {
                            handleToggleAutomation(
                              automation?.id ?? null,
                              v,
                              auto.type,
                              auto.name
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new email campaign to send to your subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g., Summer Sale Announcement"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                placeholder="e.g., 🌞 Summer Sale - Up to 50% Off!"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Content</Label>
              <Textarea
                placeholder="Write your email content here..."
                rows={8}
                value={newCampaign.content}
                onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              <Send className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
