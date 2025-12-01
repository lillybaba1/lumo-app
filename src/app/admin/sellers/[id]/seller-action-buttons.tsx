'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Ban, RotateCcw } from 'lucide-react';
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
import { approveBusinessAccount, rejectBusinessAccount, suspendBusinessAccount, reactivateBusinessAccount } from '../actions';

interface Props {
  businessId: string;
  status: string;
}

export function SellerActionButtons({ businessId, status }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    setLoading('approve');
    try {
      const result = await approveBusinessAccount(businessId);
      if (result.success) {
        toast({
          title: 'Seller Approved!',
          description: 'The business account has been approved and activated.',
        });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve seller',
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

  return (
    <div className="space-y-3">
      {/* Pending Approval Actions */}
      {status === 'PENDING_APPROVAL' && (
        <>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={handleApprove}
            disabled={loading !== null}
          >
            {loading === 'approve' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve Application
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

      {/* Active Account Actions */}
      {status === 'ACTIVE' && (
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
                This will suspend the seller's account. They will no longer be able to access their dashboard or sell products.
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
    </div>
  );
}
