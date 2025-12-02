import { requireBusiness } from '@/lib/auth-business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, CheckCircle, Clock, XCircle, AlertTriangle, 
  FileText, Building2, User, Upload, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import VerificationForm from './verification-form';

export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const { businessAccount } = await requireBusiness();
  
  const verificationStatus = businessAccount.verificationStatus || 'unverified';
  const sellerType = businessAccount.sellerType || 'individual';

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white gap-1">
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Not Verified
          </Badge>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Seller Verification
          </h1>
          <p className="text-muted-foreground mt-1">
            Get verified to build trust with customers
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Benefits of Verification */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-6">
          <h3 className="font-semibold text-lg mb-4">Why Get Verified?</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verified Badge</p>
                <p className="text-xs text-muted-foreground">Stand out with a trust badge</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Higher Visibility</p>
                <p className="text-xs text-muted-foreground">Priority in search results</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Customer Trust</p>
                <p className="text-xs text-muted-foreground">Buyers prefer verified sellers</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Featured Eligibility</p>
                <p className="text-xs text-muted-foreground">Get featured on homepage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verified Status */}
      {verificationStatus === 'verified' && (
        <Card className="border-green-500">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              You're Verified!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Congratulations! Your seller account has been verified. Your verified badge is now 
              displayed on your boutique and product listings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Review */}
      {verificationStatus === 'pending' && (
        <Card className="border-yellow-500">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">
              Verification Under Review
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              We're reviewing your verification documents. This usually takes 1-3 business days. 
              We'll notify you by email once the review is complete.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Submitted:</strong> {businessAccount.verificationDocuments?.submittedAt 
                  ? new Date(businessAccount.verificationDocuments.submittedAt).toLocaleDateString()
                  : 'Recently'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected - Can Resubmit */}
      {verificationStatus === 'rejected' && (
        <Card className="border-red-500 mb-6">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                  Verification Rejected
                </h2>
                <p className="text-muted-foreground mb-3">
                  Unfortunately, we couldn't verify your account. Please review the reason below and submit again.
                </p>
                {businessAccount.verificationDocuments?.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Reason: {businessAccount.verificationDocuments.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Form */}
      {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
        <VerificationForm 
          businessAccountId={businessAccount.id}
          sellerType={sellerType}
        />
      )}
    </div>
  );
}
