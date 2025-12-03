'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Save, Building, CreditCard, Wallet, CheckCircle,
  Info, Shield
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PayoutDetails {
  // Bank Transfer
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  // PayPal
  paypalEmail?: string;
  // Stripe
  stripeAccountId?: string;
}

interface Props {
  businessAccountId: string;
  currentMethod: string;
  currentDetails: PayoutDetails;
}

export default function PayoutSettingsForm({ businessAccountId, currentMethod, currentDetails }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [payoutMethod, setPayoutMethod] = useState(currentMethod || 'bank');
  const [details, setDetails] = useState<PayoutDetails>(currentDetails);

  const handleSave = async () => {
    // Validate based on method
    if (payoutMethod === 'bank') {
      if (!details.bankName || !details.accountHolderName || !details.accountNumber) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required bank details.',
          variant: 'destructive',
        });
        return;
      }
    } else if (payoutMethod === 'paypal') {
      if (!details.paypalEmail) {
        toast({
          title: 'Missing Information',
          description: 'Please enter your PayPal email address.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutMethod,
          payoutDetails: details,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payout settings');
      }

      toast({
        title: 'Settings Saved',
        description: 'Your payout settings have been updated.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Your information is secure</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                All payment information is encrypted and stored securely. We never share your financial details with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payout Method
          </CardTitle>
          <CardDescription>
            Choose how you want to receive your earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={payoutMethod} onValueChange={setPayoutMethod} className="space-y-3">
            <div 
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                payoutMethod === 'bank' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setPayoutMethod('bank')}
            >
              <RadioGroupItem value="bank" id="bank" />
              <Building className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="bank" className="font-medium cursor-pointer">Bank Transfer</Label>
                <p className="text-sm text-muted-foreground">Direct deposit to your bank account</p>
              </div>
              <CheckCircle className={`h-5 w-5 ${payoutMethod === 'bank' ? 'text-primary' : 'text-transparent'}`} />
            </div>

            <div 
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                payoutMethod === 'paypal' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setPayoutMethod('paypal')}
            >
              <RadioGroupItem value="paypal" id="paypal" />
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="paypal" className="font-medium cursor-pointer">PayPal</Label>
                <p className="text-sm text-muted-foreground">Receive payments to your PayPal account</p>
              </div>
              <CheckCircle className={`h-5 w-5 ${payoutMethod === 'paypal' ? 'text-primary' : 'text-transparent'}`} />
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Bank Details */}
      {payoutMethod === 'bank' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              Enter your bank account information for direct deposits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name *</Label>
                <Input
                  value={details.bankName || ''}
                  onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                  placeholder="e.g., Chase Bank"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Account Holder Name *</Label>
                <Input
                  value={details.accountHolderName || ''}
                  onChange={(e) => setDetails({ ...details, accountHolderName: e.target.value })}
                  placeholder="Full name as on account"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Account Number *</Label>
                <Input
                  value={details.accountNumber || ''}
                  onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                  placeholder="Your account number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Routing Number</Label>
                <Input
                  value={details.routingNumber || ''}
                  onChange={(e) => setDetails({ ...details, routingNumber: e.target.value })}
                  placeholder="9-digit routing number"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>SWIFT/BIC Code (for international transfers)</Label>
              <Input
                value={details.swiftCode || ''}
                onChange={(e) => setDetails({ ...details, swiftCode: e.target.value })}
                placeholder="e.g., CHASUS33"
                className="mt-1 max-w-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* PayPal Details */}
      {payoutMethod === 'paypal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              PayPal Account
            </CardTitle>
            <CardDescription>
              Enter the email address associated with your PayPal account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>PayPal Email *</Label>
              <Input
                type="email"
                value={details.paypalEmail || ''}
                onChange={(e) => setDetails({ ...details, paypalEmail: e.target.value })}
                placeholder="your-email@example.com"
                className="mt-1 max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Make sure this matches the email on your PayPal account
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Payout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Payout Frequency</span>
              <span className="font-medium">Weekly</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Minimum Payout</span>
              <span className="font-medium">$25.00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Processing Time</span>
              <span className="font-medium">3-5 Business Days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Hold Period</span>
              <span className="font-medium">7 Days (for new sellers)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Payout Settings
        </Button>
      </div>
    </div>
  );
}
