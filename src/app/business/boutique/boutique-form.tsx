'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, Globe, Instagram, Facebook, Twitter, Eye, ExternalLink, Palette, Lock, MapPin, Clock, Phone, Shield, Tag, CreditCard, MessageCircle } from 'lucide-react';
import { Boutique } from '@/lib/types';
import Link from 'next/link';
import ImageUploadBox from '@/components/image-upload-box';
import { uploadBoutiqueImage, deleteBoutiqueImage, BOUTIQUE_IMAGE_SPECS } from '@/services/boutiqueStorageService';

interface BoutiqueFormProps {
  boutique: Boutique | null;
  businessAccountId: string;
  canCustomize: boolean; // Based on subscription tier
}

// Preset color themes
const COLOR_PRESETS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Violet', color: '#8b5cf6' },
  { name: 'Slate', color: '#475569' },
  { name: 'Coral', color: '#ff6b6b' },
];

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
    whatsapp: boutique?.whatsapp || '',
    storeAddress: boutique?.storeAddress || '',
    storeCity: boutique?.storeCity || '',
    storeCountry: boutique?.storeCountry || '',
    storeLocation: boutique?.storeLocation || '',
    businessHours: boutique?.businessHours || '',
    establishedYear: boutique?.establishedYear || '',
    trustBadges: boutique?.trustBadges || [],
    specializations: boutique?.specializations || [],
    acceptedPayments: boutique?.acceptedPayments || [],
    shippingInfo: boutique?.shippingInfo || '',
    returnPolicy: boutique?.returnPolicy || '',
    socialLinks: {
      instagram: boutique?.socialLinks?.instagram || '',
      facebook: boutique?.socialLinks?.facebook || '',
      twitter: boutique?.socialLinks?.twitter || '',
    },
    isPublished: boutique?.isPublished || false,
  });

  const handleLogoUpload = async (file: File): Promise<string> => {
    const url = await uploadBoutiqueImage(file, businessAccountId, 'logo');
    setFormData(prev => ({ ...prev, logo: url }));
    return url;
  };

  const handleLogoDelete = async (): Promise<void> => {
    if (formData.logo) {
      await deleteBoutiqueImage(formData.logo);
      setFormData(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleBannerUpload = async (file: File): Promise<string> => {
    const url = await uploadBoutiqueImage(file, businessAccountId, 'banner');
    setFormData(prev => ({ ...prev, bannerImage: url }));
    return url;
  };

  const handleBannerDelete = async (): Promise<void> => {
    if (formData.bannerImage) {
      await deleteBoutiqueImage(formData.bannerImage);
      setFormData(prev => ({ ...prev, bannerImage: '' }));
    }
  };

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
                julazone.com/boutique/{boutique.slug}
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
                <a href={`https://julazone.com/boutique/${boutique.slug}`} target="_blank" rel="noopener noreferrer">
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
      <Card className="overflow-hidden border-2 border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize your boutique's appearance
            {!canCustomize && (
              <span className="flex items-center gap-1 mt-1 text-amber-600">
                <Lock className="h-3 w-3" />
                Upgrade to Pro or Enterprise to unlock custom branding
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Banner Image */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-base font-semibold">Banner Image</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {BOUTIQUE_IMAGE_SPECS.banner.description}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {BOUTIQUE_IMAGE_SPECS.banner.maxSize} max
              </Badge>
            </div>
            <ImageUploadBox
              value={formData.bannerImage || null}
              onUpload={handleBannerUpload}
              onDelete={handleBannerDelete}
              variant="banner"
              description="1200 × 300px recommended"
              disabled={!canCustomize}
            />
          </div>

          <Separator />

          {/* Logo and Colors side by side */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Logo */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base font-semibold">Logo</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {BOUTIQUE_IMAGE_SPECS.logo.description}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {BOUTIQUE_IMAGE_SPECS.logo.maxSize} max
                </Badge>
              </div>
              <div className="max-w-[200px]">
                <ImageUploadBox
                  value={formData.logo || null}
                  onUpload={handleLogoUpload}
                  onDelete={handleLogoDelete}
                  variant="square"
                  description="400 × 400px"
                  disabled={!canCustomize}
                />
              </div>
            </div>

            {/* Theme Colors */}
            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Primary Color</Label>
                
                {/* Color Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => canCustomize && setFormData({ ...formData, themeColor: preset.color })}
                      className={`
                        w-8 h-8 rounded-full transition-all
                        ${formData.themeColor === preset.color 
                          ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'}
                        ${!canCustomize && 'opacity-50 cursor-not-allowed'}
                      `}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                      disabled={!canCustomize}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.themeColor}
                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-muted cursor-pointer"
                    disabled={!canCustomize}
                  />
                  <Input
                    value={formData.themeColor}
                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                    placeholder="#8b5cf6"
                    className="w-28 font-mono text-sm"
                    disabled={!canCustomize}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Accent Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border-2 border-muted cursor-pointer"
                    disabled={!canCustomize}
                  />
                  <Input
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    placeholder="#ec4899"
                    className="w-28 font-mono text-sm"
                    disabled={!canCustomize}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact & Location
          </CardTitle>
          <CardDescription>
            Public contact info for your boutique (separate from your personal business details)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Boutique Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@yourboutique.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Boutique Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+220 700 1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Number
            </Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+220 700 1234"
            />
            <p className="text-xs text-muted-foreground">Customers can message you directly on WhatsApp</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Store Location
            </Label>
            <p className="text-xs text-muted-foreground -mt-2">Where customers can find you (if you have a physical store)</p>
            
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Street Address</Label>
              <Input
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                placeholder="123 Market Street"
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeCity">City</Label>
                <Input
                  id="storeCity"
                  value={formData.storeCity}
                  onChange={(e) => setFormData({ ...formData, storeCity: e.target.value })}
                  placeholder="Serrekunda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCountry">Country</Label>
                <Input
                  id="storeCountry"
                  value={formData.storeCountry}
                  onChange={(e) => setFormData({ ...formData, storeCountry: e.target.value })}
                  placeholder="The Gambia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeLocation">Location Description</Label>
              <Input
                id="storeLocation"
                value={formData.storeLocation}
                onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
                placeholder="Near Serrekunda Market, opposite the main mosque"
              />
              <p className="text-xs text-muted-foreground">Help customers find you with landmarks</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessHours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </Label>
            <Input
              id="businessHours"
              value={formData.businessHours}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              placeholder="Mon-Fri 9am-6pm, Sat 10am-4pm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trust & Credibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust & Credibility
          </CardTitle>
          <CardDescription>
            Build buyer confidence with important business information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="establishedYear">Year Established</Label>
            <Input
              id="establishedYear"
              value={formData.establishedYear}
              onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
              placeholder="2020"
              maxLength={4}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">Show buyers how long you've been in business</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializations" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Specializations
            </Label>
            <Input
              id="specializations"
              value={formData.specializations.join(', ')}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Electronics, Phone Accessories, Repairs"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of what you specialize in</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptedPayments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Accepted Payment Methods
            </Label>
            <Input
              id="acceptedPayments"
              value={formData.acceptedPayments.join(', ')}
              onChange={(e) => setFormData({ ...formData, acceptedPayments: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Cash, Wave, Orange Money, Bank Transfer"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of payment methods you accept</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trustBadges">Trust Highlights</Label>
            <Input
              id="trustBadges"
              value={formData.trustBadges.join(', ')}
              onChange={(e) => setFormData({ ...formData, trustBadges: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Fast Shipping, Money Back Guarantee, Original Products Only"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of trust badges to display</p>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Connect your social accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
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
