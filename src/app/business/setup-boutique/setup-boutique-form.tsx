'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Store, Upload, Loader2, CheckCircle, ArrowRight, Palette } from 'lucide-react';
import { BusinessAccount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SetupBoutiqueFormProps {
  businessAccount: BusinessAccount;
}

export default function SetupBoutiqueForm({ businessAccount }: SetupBoutiqueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: businessAccount.businessName || '',
    slug: businessAccount.boutiqueSlug || generateSlug(businessAccount.businessName),
    tagline: '',
    description: businessAccount.description || '',
    themeColor: '#6366f1', // Default indigo
    logo: businessAccount.logo || '',
    bannerImage: '',
  });

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from display name
    if (name === 'displayName') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/business/boutique/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAccountId: businessAccount.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit boutique');
      }

      toast({
        title: 'Boutique Submitted!',
        description: 'Your boutique is now pending admin review.',
      });

      router.push('/business/pending-boutique-review');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit boutique. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Account Approved</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1 text-primary font-medium">
              <Store className="h-4 w-4" />
              <span>Set Up Boutique</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Admin Review</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Go Live</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Set Up Your Boutique</CardTitle>
            <CardDescription>
              Create your storefront. This information will be visible to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Boutique Name *</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="My Amazing Boutique"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is how your store will appear to customers
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Store URL *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">lumo.app/boutique/</span>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="my-boutique"
                    pattern="[a-z0-9-]+"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="Quality products since 2024"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  A short catchy phrase (max 100 characters)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">About Your Boutique *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your boutique, what you sell, and what makes you special..."
                  rows={4}
                  required
                />
              </div>

              {/* Theme Color */}
              <div className="space-y-2">
                <Label htmlFor="themeColor" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Brand Color
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="themeColor"
                    name="themeColor"
                    type="color"
                    value={formData.themeColor}
                    onChange={handleInputChange}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.themeColor}
                    onChange={handleInputChange}
                    name="themeColor"
                    placeholder="#6366f1"
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">
                    Used for buttons and accents on your boutique page
                  </span>
                </div>
              </div>

              {/* Logo Upload Placeholder */}
              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload your logo (coming soon)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB. Recommended: 400x400px
                  </p>
                </div>
              </div>

              {/* Banner Upload Placeholder */}
              <div className="space-y-2">
                <Label>Banner Image (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a banner (coming soon)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB. Recommended: 1200x300px
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Review
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  After submission, our team will review your boutique within 1-2 business days
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
