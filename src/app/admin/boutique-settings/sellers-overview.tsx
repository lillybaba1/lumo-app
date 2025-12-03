'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BusinessAccount, BoutiqueSystemSettings, Boutique } from '@/lib/types';
import { 
  bulkUpdateSellersAction, 
  toggleSellerStatusAction, 
  forceUpgradeSellerAction,
  toggleBoutiqueFeaturedAction,
  banBoutiqueAction,
  deleteBoutiqueAction,
  deleteSellerAction
} from './actions';
import { 
  Loader2, Users, Search, Crown, Sparkles, User, Shield,
  CheckCircle, XCircle, Clock, AlertTriangle, Store, Star,
  MoreVertical, Ban, Play, ArrowUpCircle, ShieldOff, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Props {
  businessAccounts: BusinessAccount[];
  boutiques: Boutique[];
  settings: BoutiqueSystemSettings;
}

export default function SellersOverview({ businessAccounts, boutiques, settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);

  // Create a map of boutiques by business account ID
  const boutiqueMap = new Map(boutiques.map(b => [b.businessAccountId, b]));

  // Filter sellers
  const filteredSellers = businessAccounts.filter(seller => {
    const matchesSearch = 
      seller.businessName.toLowerCase().includes(search.toLowerCase()) ||
      seller.ownerUserId.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
    const matchesTier = tierFilter === 'all' || seller.subscriptionTier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const handleToggleStatus = async (sellerId: string, currentStatus: string) => {
    setIsLoading(sellerId);
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const result = await toggleSellerStatusAction(sellerId, newStatus);
      
      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `Seller ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleUpgradeTier = async (sellerId: string, tier: 'free' | 'pro' | 'enterprise') => {
    setIsLoading(sellerId);
    try {
      const result = await forceUpgradeSellerAction(sellerId, tier);
      
      if (result.success) {
        toast({
          title: 'Tier Updated',
          description: `Seller upgraded to ${tier} tier.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to upgrade tier',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleToggleFeatured = async (boutiqueId: string, featured: boolean) => {
    setIsLoading(boutiqueId);
    try {
      const result = await toggleBoutiqueFeaturedAction(boutiqueId, !featured);
      
      if (result.success) {
        toast({
          title: featured ? 'Unfeatured' : 'Featured',
          description: `Boutique ${featured ? 'removed from' : 'added to'} featured list.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update featured status',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleBanBoutique = async (boutiqueId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to BAN the boutique for "${businessName}"? This will unpublish their boutique and suspend the seller.`)) {
      return;
    }

    setIsLoading(boutiqueId);
    try {
      const result = await banBoutiqueAction(boutiqueId);
      
      if (result.success) {
        toast({
          title: 'Boutique Banned',
          description: `The boutique for "${businessName}" has been banned.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to ban boutique',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteBoutique = async (boutiqueId: string, businessName: string) => {
    if (!confirm(`⚠️ DANGER: Are you sure you want to DELETE the boutique for "${businessName}"? This action cannot be undone!`)) {
      return;
    }

    // Double confirmation for destructive action
    if (!confirm(`This is a PERMANENT deletion. Type 'delete' in your mind and confirm to proceed.`)) {
      return;
    }

    setIsLoading(boutiqueId);
    try {
      const result = await deleteBoutiqueAction(boutiqueId);
      
      if (result.success) {
        toast({
          title: 'Boutique Deleted',
          description: `The boutique for "${businessName}" has been permanently deleted.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete boutique',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteSeller = async (sellerId: string, businessName: string) => {
    if (!confirm(`⚠️ DANGER: Are you sure you want to DELETE the seller account "${businessName}"? This will suspend the account and remove access.`)) {
      return;
    }

    setIsLoading(sellerId);
    try {
      const result = await deleteSellerAction(sellerId);
      
      if (result.success) {
        toast({
          title: 'Seller Deleted',
          description: `The seller account "${businessName}" has been deleted.`,
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete seller',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSellers.length === 0) {
      toast({
        title: 'No Sellers Selected',
        description: 'Please select at least one seller.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading('bulk');
    try {
      let updates: any = {};
      switch (action) {
        case 'activate':
          updates = { status: 'ACTIVE' };
          break;
        case 'suspend':
          updates = { status: 'SUSPENDED' };
          break;
        case 'upgrade-pro':
          updates = { subscriptionTier: 'pro' };
          break;
        case 'upgrade-enterprise':
          updates = { subscriptionTier: 'enterprise' };
          break;
        case 'verify':
          updates = { verificationStatus: 'verified' };
          break;
      }

      const result = await bulkUpdateSellersAction(selectedSellers, updates);
      
      if (result.success) {
        toast({
          title: 'Bulk Update Complete',
          description: `Updated ${result.updatedCount} sellers.`,
        });
        setSelectedSellers([]);
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update sellers',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="outline"><User className="h-3 w-3 mr-1" />Free</Badge>;
      case 'pro':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Sparkles className="h-3 w-3 mr-1" />Pro</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Crown className="h-3 w-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seller Management
          </CardTitle>
          <CardDescription>
            View and manage all sellers on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedSellers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg mb-4">
              <span className="text-sm font-medium">
                {selectedSellers.length} selected
              </span>
              <div className="flex-1" />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('activate')}
                disabled={isLoading === 'bulk'}
              >
                <Play className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('suspend')}
                disabled={isLoading === 'bulk'}
              >
                <Ban className="h-4 w-4 mr-1" />
                Suspend
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('upgrade-pro')}
                disabled={isLoading === 'bulk'}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                → Pro
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('upgrade-enterprise')}
                disabled={isLoading === 'bulk'}
              >
                <Crown className="h-4 w-4 mr-1" />
                → Enterprise
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedSellers([])}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sellers List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredSellers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sellers found matching your criteria
              </div>
            ) : (
              filteredSellers.map((seller) => {
                const boutique = boutiqueMap.get(seller.id);
                
                return (
                  <div
                    key={seller.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedSellers.includes(seller.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSellers([...selectedSellers, seller.id]);
                        } else {
                          setSelectedSellers(selectedSellers.filter(id => id !== seller.id));
                        }
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/admin/sellers/${seller.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {seller.businessName}
                        </Link>
                        {seller.verificationStatus === 'verified' && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                        {boutique?.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {boutique && (
                          <Link 
                            href={`/boutique/${boutique.slug}`}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Store className="h-3 w-3" />
                            {boutique.displayName}
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(seller.status)}
                      {getTierBadge(seller.subscriptionTier)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isLoading === seller.id}>
                          {isLoading === seller.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/sellers/${seller.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {boutique && (
                          <DropdownMenuItem asChild>
                            <Link href={`/boutique/${boutique.slug}`} target="_blank">
                              View Boutique
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(seller.id, seller.status)}
                        >
                          {seller.status === 'ACTIVE' ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Seller
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate Seller
                            </>
                          )}
                        </DropdownMenuItem>

                        {boutique && (
                          <DropdownMenuItem
                            onClick={() => handleToggleFeatured(boutique.id, boutique.isFeatured)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {boutique.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Upgrade Tier
                        </DropdownMenuLabel>

                        {seller.subscriptionTier !== 'pro' && (
                          <DropdownMenuItem onClick={() => handleUpgradeTier(seller.id, 'pro')}>
                            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                            Upgrade to Pro
                          </DropdownMenuItem>
                        )}

                        {seller.subscriptionTier !== 'enterprise' && (
                          <DropdownMenuItem onClick={() => handleUpgradeTier(seller.id, 'enterprise')}>
                            <Crown className="h-4 w-4 mr-2 text-purple-500" />
                            Upgrade to Enterprise
                          </DropdownMenuItem>
                        )}

                        {seller.subscriptionTier !== 'free' && (
                          <DropdownMenuItem onClick={() => handleUpgradeTier(seller.id, 'free')}>
                            <ArrowUpCircle className="h-4 w-4 mr-2 rotate-180" />
                            Downgrade to Free
                          </DropdownMenuItem>
                        )}

                        {boutique && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-red-600">
                              Danger Zone
                            </DropdownMenuLabel>
                            
                            <DropdownMenuItem
                              onClick={() => handleBanBoutique(boutique.id, seller.businessName)}
                              className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Ban Boutique
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => handleDeleteBoutique(boutique.id, seller.businessName)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Boutique
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteSeller(seller.id, seller.businessName)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Seller Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
