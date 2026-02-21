'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Ban, RotateCcw, Trash2, Store } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approveBusinessAccount, approveBoutique, rejectBusinessAccount, suspendBusinessAccount, reactivateBusinessAccount, deleteBusinessAccountAndUser } from '../actions';

interface Props {
  businessId: string;
  status: string;
  accountApproved: boolean;
  boutiqueSubmitted: boolean;
  boutiqueApproved: boolean;
}

export function SellerActionButtons({ businessId, status, accountApproved, boutiqueSubmitted, boutiqueApproved }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApproveAccount = async () => {
    setLoading('approve_account');
    try {
      const result = await approveBusinessAccount(businessId);
      if (result.success) {
        toast({
          title: 'Account Approved!',
          description: 'The user can now access the dashboard and set up their boutique.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve account',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleApproveBoutique = async () => {
    setLoading('approve_boutique');
    try {
      const result = await approveBoutique(businessId);
      if (result.success) {
        toast({
          title: 'Boutique Approved!',
          description: 'The boutique is now active and visible to customers.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve boutique',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      const result = await rejectBusinessAccount(businessId, rejectReason);
      if (result.success) {
        toast({
          title: 'Application Rejected',
          description: 'The business application has been rejected.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
      setRejectReason('');
    }
  };

  const handleSuspend = async () => {
    setLoading('suspend');
    try {
      const result = await suspendBusinessAccount(businessId);
      if (result.success) {
        toast({
          title: 'Seller Suspended',
          description: 'The business account has been suspended.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend seller',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReactivate = async () => {
    setLoading('reactivate');
    try {
      const result = await reactivateBusinessAccount(businessId);
      if (result.success) {
        toast({
          title: 'Seller Reactivated',
          description: 'The business account has been reactivated.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate seller',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    try {
      const result = await deleteBusinessAccountAndUser(businessId);
      if (result.success) {
        toast({
          title: 'Account Deleted',
          description: 'The seller account and user have been permanently deleted.',
        });
        router.push('/admin/sellers');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="space-y-3">
      {/* Stage 1: Account Approval */}
      {!accountApproved && status !== 'SUSPENDED' && status !== 'PENDING_VERIFICATION' && (
        <>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={handleApproveAccount}
            disabled={loading !== null}
          >
            {loading === 'approve_account' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve Account
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={loading !== null}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Seller Application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject the business application. The seller will not be able to access their dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="rejectReason">Reason (optional)</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading === 'reject' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Reject Application
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Stage 2: Boutique Approval */}
      {accountApproved && boutiqueSubmitted && !boutiqueApproved && status !== 'SUSPENDED' && (
        <>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleApproveBoutique}
            disabled={loading !== null}
          >
            {loading === 'approve_boutique' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Store className="h-4 w-4 mr-2" />
            )}
            Approve Boutique
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Review the boutique details before approving.
          </p>
        </>
      )}

      {/* Waiting for Boutique */}
      {accountApproved && !boutiqueSubmitted && status !== 'SUSPENDED' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border text-center">
          <p className="text-sm font-medium">Account Approved</p>
          <p className="text-xs text-muted-foreground mt-1">
            Waiting for user to submit boutique details.
          </p>
        </div>
      )}

      {/* Active Account Actions */}
      {boutiqueApproved && status === 'ACTIVE' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              disabled={loading !== null}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend Seller
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend Seller Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will suspend the seller&apos;s account. They will no longer be able to access their dashboard or sell products.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSuspend}
                className="bg-red-600 hover:bg-red-700"
              >
                Suspend Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Suspended Account Actions */}
      {status === 'SUSPENDED' && (
        <Button 
          className="w-full bg-green-600 hover:bg-green-700" 
          onClick={handleReactivate}
          disabled={loading !== null}
        >
          {loading === 'reactivate' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Reactivate Seller
        </Button>
      )}

      {/* Pending Verification - No actions available */}
      {status === 'PENDING_VERIFICATION' && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Waiting for user to verify their email address.
        </p>
      )}

      {/* Delete Button - Available for all statuses */}
      <div className="pt-4 border-t mt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              disabled={loading !== null}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account Permanently
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Seller Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the seller&apos;s business account and their user account. 
                This action cannot be undone. All their products, orders, and data will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading === 'delete' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
