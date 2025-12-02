'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building2, Upload, FileText, CheckCircle } from 'lucide-react';

interface VerificationFormProps {
  businessAccountId: string;
  sellerType: 'individual' | 'company';
}

export default function VerificationForm({ businessAccountId, sellerType: initialType }: VerificationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sellerType, setSellerType] = useState<'individual' | 'company'>(initialType);
  
  const [formData, setFormData] = useState({
    // Individual
    idDocumentUrl: '',
    idDocumentType: 'drivers_license' as 'passport' | 'drivers_license' | 'national_id',
    // Company
    businessLicenseUrl: '',
    certificateOfIncorporationUrl: '',
    proofOfAddressUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/business/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAccountId,
          sellerType,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit verification');
      }

      toast({
        title: 'Verification Submitted',
        description: 'Your documents have been submitted for review. We\'ll notify you within 1-3 business days.',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit verification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seller Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Account Type</CardTitle>
          <CardDescription>
            Select the type of seller account you have
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={sellerType}
            onValueChange={(value) => setSellerType(value as 'individual' | 'company')}
            className="grid sm:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="individual"
                id="individual"
                className="peer sr-only"
              />
              <Label
                htmlFor="individual"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <User className="h-8 w-8 mb-3" />
                <div className="text-center">
                  <p className="font-semibold">Individual</p>
                  <p className="text-sm text-muted-foreground">
                    Selling as a person
                  </p>
                </div>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="company"
                id="company"
                className="peer sr-only"
              />
              <Label
                htmlFor="company"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Building2 className="h-8 w-8 mb-3" />
                <div className="text-center">
                  <p className="font-semibold">Company</p>
                  <p className="text-sm text-muted-foreground">
                    Registered business
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Individual Verification */}
      {sellerType === 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Upload a valid government-issued ID to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ID Document Type</Label>
              <RadioGroup
                value={formData.idDocumentType}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  idDocumentType: value as 'passport' | 'drivers_license' | 'national_id' 
                })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="drivers_license" id="drivers_license" />
                  <Label htmlFor="drivers_license">Driver's License</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="passport" id="passport" />
                  <Label htmlFor="passport">Passport</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="national_id" id="national_id" />
                  <Label htmlFor="national_id">National ID Card</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDocument">ID Document URL</Label>
              <Input
                id="idDocument"
                value={formData.idDocumentUrl}
                onChange={(e) => setFormData({ ...formData, idDocumentUrl: e.target.value })}
                placeholder="https://... (Upload your ID and paste the URL)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload a clear photo or scan of your ID. Make sure all details are visible.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Verification */}
      {sellerType === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Verification
            </CardTitle>
            <CardDescription>
              Upload your business documents to verify your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessLicense">Business License URL *</Label>
              <Input
                id="businessLicense"
                value={formData.businessLicenseUrl}
                onChange={(e) => setFormData({ ...formData, businessLicenseUrl: e.target.value })}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Your current business license or registration certificate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate">Certificate of Incorporation (Optional)</Label>
              <Input
                id="certificate"
                value={formData.certificateOfIncorporationUrl}
                onChange={(e) => setFormData({ ...formData, certificateOfIncorporationUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofOfAddress">Proof of Business Address *</Label>
              <Input
                id="proofOfAddress"
                value={formData.proofOfAddressUrl}
                onChange={(e) => setFormData({ ...formData, proofOfAddressUrl: e.target.value })}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Utility bill, bank statement, or lease agreement (dated within last 3 months)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              By submitting this verification request, I confirm that all information and documents 
              provided are accurate and authentic. I understand that providing false information may 
              result in account suspension.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Submit for Verification
      </Button>
    </form>
  );
}
