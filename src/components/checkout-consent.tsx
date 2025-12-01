"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Truck, 
  RotateCcw, 
  Bell, 
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface CheckoutConsentProps {
  onConsentComplete: (consent: CheckoutConsent) => void;
  initialConsent?: Partial<CheckoutConsent>;
}

export interface CheckoutConsent {
  termsAccepted: boolean;
  shippingPolicyAccepted: boolean;
  returnPolicyAccepted: boolean;
  dataProcessingAccepted: boolean;
  marketingOptIn: boolean;
  smsNotifications: boolean;
  timestamp: string;
}

const defaultConsent: CheckoutConsent = {
  termsAccepted: false,
  shippingPolicyAccepted: false,
  returnPolicyAccepted: false,
  dataProcessingAccepted: false,
  marketingOptIn: false,
  smsNotifications: true, // Default to true for order updates
  timestamp: '',
};

export function CheckoutConsentForm({ onConsentComplete, initialConsent }: CheckoutConsentProps) {
  const [consent, setConsent] = useState<CheckoutConsent>({
    ...defaultConsent,
    ...initialConsent,
  });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateConsent = (field: keyof CheckoutConsent, value: boolean) => {
    setConsent(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    // Validate required consents under Gambian business law
    const requiredConsents = [
      { field: 'termsAccepted', name: 'Terms and Conditions' },
      { field: 'shippingPolicyAccepted', name: 'Shipping Policy' },
      { field: 'returnPolicyAccepted', name: 'Return Policy' },
      { field: 'dataProcessingAccepted', name: 'Data Processing' },
    ];

    const missing = requiredConsents.filter(
      c => !consent[c.field as keyof CheckoutConsent]
    );

    if (missing.length > 0) {
      setError(`Please accept: ${missing.map(m => m.name).join(', ')}`);
      return;
    }

    const finalConsent = {
      ...consent,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage for reference
    localStorage.setItem('lumo-checkout-consent', JSON.stringify(finalConsent));
    
    onConsentComplete(finalConsent);
  };

  const allRequiredAccepted = 
    consent.termsAccepted && 
    consent.shippingPolicyAccepted && 
    consent.returnPolicyAccepted && 
    consent.dataProcessingAccepted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Terms & Consent
        </CardTitle>
        <CardDescription>
          Please review and accept the following to complete your order
          (Required under The Gambia business regulations)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('terms')}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Terms and Conditions</span>
              <span className="text-xs text-destructive">*Required</span>
            </div>
            {expandedSections.includes('terms') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.includes('terms') && (
            <div className="px-3 pb-3 text-sm text-muted-foreground">
              <p className="mb-2">By accepting, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Provide accurate billing and shipping information</li>
                <li>Pay for products at the listed prices in GMD (Gambian Dalasi)</li>
                <li>Comply with The Gambia&apos;s consumer protection guidelines</li>
                <li>Not use our products for illegal purposes</li>
              </ul>
              <Link href="/pages/policy" className="text-primary hover:underline text-xs mt-2 inline-block">
                Read full Terms and Conditions →
              </Link>
            </div>
          )}
          <div className="px-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={consent.termsAccepted}
                onCheckedChange={(checked) => updateConsent('termsAccepted', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I accept the Terms and Conditions
              </Label>
            </div>
          </div>
        </div>

        {/* Shipping Policy */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('shipping')}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="font-medium">Shipping Policy</span>
              <span className="text-xs text-destructive">*Required</span>
            </div>
            {expandedSections.includes('shipping') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.includes('shipping') && (
            <div className="px-3 pb-3 text-sm text-muted-foreground">
              <p className="mb-2">Shipping Information for The Gambia:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Greater Banjul Area:</strong> 2-3 business days</li>
                <li><strong>Upcountry regions:</strong> 5-7 business days</li>
                <li>Delivery times may vary during holidays and Tobaski</li>
                <li>You will receive SMS/WhatsApp updates on your order</li>
                <li>Cash on Delivery (COD) available for selected areas</li>
              </ul>
              <Link href="/pages/shipping" className="text-primary hover:underline text-xs mt-2 inline-block">
                Read full Shipping Policy →
              </Link>
            </div>
          )}
          <div className="px-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shipping"
                checked={consent.shippingPolicyAccepted}
                onCheckedChange={(checked) => updateConsent('shippingPolicyAccepted', checked as boolean)}
              />
              <Label htmlFor="shipping" className="text-sm cursor-pointer">
                I understand and accept the Shipping Policy
              </Label>
            </div>
          </div>
        </div>

        {/* Return Policy */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('returns')}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              <span className="font-medium">Return & Refund Policy</span>
              <span className="text-xs text-destructive">*Required</span>
            </div>
            {expandedSections.includes('returns') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.includes('returns') && (
            <div className="px-3 pb-3 text-sm text-muted-foreground">
              <p className="mb-2">Return Policy (as per The Gambia Consumer Protection):</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>7-day return window</strong> for unused items in original packaging</li>
                <li>Defective products can be returned within 14 days</li>
                <li>Refunds processed within 7-10 business days</li>
                <li>Refunds via Mobile Money (Wave, Afrimoney) or bank transfer</li>
                <li>Return shipping costs may apply for non-defective returns</li>
                <li>Some items (perishables, custom orders) are non-returnable</li>
              </ul>
              <Link href="/pages/policy" className="text-primary hover:underline text-xs mt-2 inline-block">
                Read full Return Policy →
              </Link>
            </div>
          )}
          <div className="px-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="returns"
                checked={consent.returnPolicyAccepted}
                onCheckedChange={(checked) => updateConsent('returnPolicyAccepted', checked as boolean)}
              />
              <Label htmlFor="returns" className="text-sm cursor-pointer">
                I understand and accept the Return & Refund Policy
              </Label>
            </div>
          </div>
        </div>

        {/* Data Processing */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection('data')}
            className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Data Processing Consent</span>
              <span className="text-xs text-destructive">*Required</span>
            </div>
            {expandedSections.includes('data') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.includes('data') && (
            <div className="px-3 pb-3 text-sm text-muted-foreground">
              <p className="mb-2">How we use your data:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations and delivery updates via SMS/WhatsApp</li>
                <li>Share delivery information with our logistics partners</li>
                <li>Improve our services based on your feedback</li>
                <li>Comply with The Gambia tax and business regulations</li>
              </ul>
              <p className="text-xs mt-2">
                Your data is stored securely and never sold to third parties.
              </p>
            </div>
          )}
          <div className="px-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="data"
                checked={consent.dataProcessingAccepted}
                onCheckedChange={(checked) => updateConsent('dataProcessingAccepted', checked as boolean)}
              />
              <Label htmlFor="data" className="text-sm cursor-pointer">
                I consent to the processing of my personal data for order fulfillment
              </Label>
            </div>
          </div>
        </div>

        {/* Optional: Notifications */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Communication Preferences</span>
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sms"
              checked={consent.smsNotifications}
              onCheckedChange={(checked) => updateConsent('smsNotifications', checked as boolean)}
            />
            <Label htmlFor="sms" className="text-sm cursor-pointer">
              Receive order updates via SMS/WhatsApp
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="marketing"
              checked={consent.marketingOptIn}
              onCheckedChange={(checked) => updateConsent('marketingOptIn', checked as boolean)}
            />
            <Label htmlFor="marketing" className="text-sm cursor-pointer">
              Receive promotional offers and new product updates
            </Label>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!allRequiredAccepted}
        >
          Continue to Payment
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By proceeding, you confirm you are at least 18 years old and agree to our terms.
          Protected under The Gambia consumer protection regulations.
        </p>
      </CardContent>
    </Card>
  );
}

// Simple accept all checkbox for simpler checkout flows
export function SimpleCheckoutConsent({ 
  onAccept, 
  disabled 
}: { 
  onAccept: (accepted: boolean) => void;
  disabled?: boolean;
}) {
  const [accepted, setAccepted] = useState(false);

  const handleChange = (checked: boolean) => {
    setAccepted(checked);
    onAccept(checked);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="simple-consent"
          checked={accepted}
          onCheckedChange={handleChange}
          disabled={disabled}
        />
        <Label htmlFor="simple-consent" className="text-sm cursor-pointer leading-relaxed">
          I agree to the{' '}
          <Link href="/pages/policy" className="text-primary hover:underline">
            Terms and Conditions
          </Link>
          ,{' '}
          <Link href="/pages/shipping" className="text-primary hover:underline">
            Shipping Policy
          </Link>
          , and{' '}
          <Link href="/pages/policy" className="text-primary hover:underline">
            Return Policy
          </Link>
          . I consent to the processing of my data for order fulfillment.
        </Label>
      </div>
      <p className="text-xs text-muted-foreground pl-6">
        Required under The Gambia business regulations
      </p>
    </div>
  );
}
