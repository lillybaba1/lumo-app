'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, Globe, Instagram, Facebook, Twitter, Eye, ExternalLink, Upload } from 'lucide-react';
import { Boutique } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

interface BoutiqueFormProps {
  boutique: Boutique | null;
  businessAccountId: string;
  canCustomize: boolean; // Based on subscription tier
}

export default function BoutiqueForm({ boutique, businessAccountId, canCustomize }: BoutiqueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: boutique?.displayName || '',
    tagline: boutique?.tagline || '',
    description: boutique?.description || '',
    logo: boutique?.logo || '',
    bannerImage: boutique?.bannerImage || '',
    themeColor: boutique?.themeColor || '#8b5cf6',
    accentColor: boutique?.accentColor || '#ec4899',
    contactEmail: boutique?.contactEmail || '',
    contactPhone: boutique?.contactPhone || '',
    shippingInfo: boutique?.shippingInfo || '',
    returnPolicy: boutique?.returnPolicy || '',
    socialLinks: {
      instagram: boutique?.socialLinks?.instagram || '',
      facebook: boutique?.socialLinks?.facebook || '',
      twitter: boutique?.socialLinks?.twitter || '',
    },
    isPublished: boutique?.isPublished || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = boutique 
        ? `/api/business/boutique/${boutique.id}`
        : '/api/business/boutique';
      
      const response = await fetch(endpoint, {
        method: boutique ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessAccountId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save boutique');
      }

      toast({
        title: boutique ? 'Boutique Updated' : 'Boutique Created',
        description: boutique 
          ? 'Your boutique has been updated successfully.'
          : 'Your boutique has been created! You can now customize it further.',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save boutique',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preview Link */}
      {boutique && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Your Boutique URL</p>
              <p className="text-xs text-muted-foreground">
                lumo-app.org/boutique/{boutique.slug}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/boutique/${boutique.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Link>
            </Button>
            {boutique.isPublished && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={`https://lumo-app.org/boutique/${boutique.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Set up your boutique's public profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Boutique Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your Boutique Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A short catchy description"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">About Your Boutique</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your boutique, your story, and what makes you unique..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Customize your boutique's appearance
            {!canCustomize && (
              <span className="block mt-1 text-yellow-600">
                Upgrade to Pro or Enterprise to unlock custom branding
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://..."
                  disabled={!canCustomize}
                />
              </div>
              {formData.logo && (
                <div className="w-16 h-16 rounded-lg border overflow-hidden">
                  <Image
                    src={formData.logo}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label htmlFor="bannerImage">Banner Image URL</Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://..."
                disabled={!canCustomize}
              />
              {formData.bannerImage && (
                <div className="w-full h-20 rounded-lg border overflow-hidden">
                  <Image
                    src={formData.bannerImage}
                    alt="Banner preview"
                    width={400}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="themeColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="themeColor"
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                  disabled={!canCustomize}
                />
                <Input
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  placeholder="#8b5cf6"
                  className="flex-1"
                  disabled={!canCustomize}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                  disabled={!canCustomize}
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  placeholder="#ec4899"
                  className="flex-1"
                  disabled={!canCustomize}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Social */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Social</CardTitle>
          <CardDescription>
            Help customers reach you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@yourboutique.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Social Media Links</Label>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                  })}
                  placeholder="https://instagram.com/yourboutique"
                />
              </div>
              <div className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.facebook}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                  })}
                  placeholder="https://facebook.com/yourboutique"
                />
              </div>
              <div className="flex items-center gap-2">
                <Twitter className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                  })}
                  placeholder="https://twitter.com/yourboutique"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
          <CardDescription>
            Set expectations for your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shippingInfo">Shipping Information</Label>
            <Textarea
              id="shippingInfo"
              value={formData.shippingInfo}
              onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
              placeholder="Describe your shipping policies, delivery times, costs..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="returnPolicy">Return Policy</Label>
            <Textarea
              id="returnPolicy"
              value={formData.returnPolicy}
              onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
              placeholder="Describe your return and refund policies..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Publish */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Control who can see your boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">Publish Boutique</Label>
              <p className="text-sm text-muted-foreground">
                Make your boutique visible to customers
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {boutique ? 'Save Changes' : 'Create Boutique'}
        </Button>
      </div>
    </form>
  );
}
