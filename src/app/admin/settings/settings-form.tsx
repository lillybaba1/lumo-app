"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Store, DollarSign, Truck, Mail, Package, Globe, Share2, Shield, MessageCircle, Heart, Users } from 'lucide-react';
import { saveSettings } from './actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings } from '@/services/settingsService';

const currencies = [
    { code: 'USD', name: 'United States Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'GMD', name: 'Gambian Dalasi (D)' },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // State for all settings
  const [formState, setFormState] = useState({
    // General
    currency: settings.currency || 'USD',
    storeName: settings.storeName || '',
    storeTagline: settings.storeTagline || '',
    storeEmail: settings.storeEmail || '',
    storePhone: settings.storePhone || '',
    storeAddress: settings.storeAddress || '',
    storeLogo: settings.storeLogo || '',

    // Tax
    taxEnabled: settings.taxEnabled ?? false,
    taxRate: settings.taxRate ?? 0,
    taxLabel: settings.taxLabel || 'Tax',
    displayPricesWithTax: settings.displayPricesWithTax ?? false,

    // Shipping
    freeShippingEnabled: settings.freeShippingEnabled ?? false,
    freeShippingThreshold: settings.freeShippingThreshold ?? 100,
    flatRateShippingEnabled: settings.flatRateShippingEnabled ?? false,
    flatRateShippingCost: settings.flatRateShippingCost ?? 10,

    // Email
    emailOrderConfirmation: settings.emailOrderConfirmation ?? true,
    emailShippingNotification: settings.emailShippingNotification ?? true,
    emailNewsletter: settings.emailNewsletter ?? false,

    // Inventory
    lowStockThreshold: settings.lowStockThreshold ?? 10,
    enableLowStockAlerts: settings.enableLowStockAlerts ?? true,

    // Footer
    footerDescription: settings.footerDescription || '',
    footerCopyright: settings.footerCopyright || '',
    footerTagline: settings.footerTagline || '',
    footerEmail: settings.footerEmail || '',
    footerPhone: settings.footerPhone || '',
    footerWhatsApp: settings.footerWhatsApp || '',
    socialFacebook: settings.socialFacebook || '',
    socialInstagram: settings.socialInstagram || '',
    socialX: settings.socialX || '',
    socialTiktok: settings.socialTiktok || '',
    socialYoutube: settings.socialYoutube || '',
    trustBadge1Title: settings.trustBadge1Title || 'Secure Payments',
    trustBadge1Subtitle: settings.trustBadge1Subtitle || '100% Protected',
    trustBadge2Title: settings.trustBadge2Title || 'Fast Delivery',
    trustBadge2Subtitle: settings.trustBadge2Subtitle || '2-7 Business Days',
    trustBadge3Title: settings.trustBadge3Title || 'Easy Refunds',
    trustBadge3Subtitle: settings.trustBadge3Subtitle || '7-Day Returns',
    trustBadge4Title: settings.trustBadge4Title || 'Local Support',
    trustBadge4Subtitle: settings.trustBadge4Subtitle || 'We Speak Your Language',
    trustBadge5Title: settings.trustBadge5Title || "Africa's Marketplace",
    trustBadge5Subtitle: settings.trustBadge5Subtitle || 'Built for Africa',
    footerPaymentMethods: settings.footerPaymentMethods || 'Wave,Afrimoney,QMoney,Bank Transfer,Cash on Delivery',
    footerDeliveryCountries: settings.footerDeliveryCountries || '🇬🇲 Gambia,🇸🇳 Senegal,🇳🇬 Nigeria,🇬🇭 Ghana,🇰🇪 Kenya',

    // Lumo Promise Section
    lumoPromiseEnabled: settings.lumoPromiseEnabled ?? true,
    lumoPromiseTitle: settings.lumoPromiseTitle || 'The Lumo Promise',
    lumoPromiseDescription: settings.lumoPromiseDescription || 'Every product in our collection is carefully curated with ethics, craftsmanship, and sustainability at its core.',
    lumoPromiseBgColor: settings.lumoPromiseBgColor || '#ffffff',
    lumoPromiseTextColor: settings.lumoPromiseTextColor || '#000000',
    lumoPromiseTitleSize: settings.lumoPromiseTitleSize || 'xl',
    lumoPromiseTitleWeight: settings.lumoPromiseTitleWeight || 'bold',
    lumoPromiseFeature1Icon: settings.lumoPromiseFeature1Icon || '🌱',
    lumoPromiseFeature1Title: settings.lumoPromiseFeature1Title || 'Sustainable',
    lumoPromiseFeature1Subtitle: settings.lumoPromiseFeature1Subtitle || 'Eco-friendly materials and processes',
    lumoPromiseFeature2Icon: settings.lumoPromiseFeature2Icon || '✨',
    lumoPromiseFeature2Title: settings.lumoPromiseFeature2Title || 'Quality Crafted',
    lumoPromiseFeature2Subtitle: settings.lumoPromiseFeature2Subtitle || 'Handpicked for excellence',
    lumoPromiseFeature3Icon: settings.lumoPromiseFeature3Icon || '🤝',
    lumoPromiseFeature3Title: settings.lumoPromiseFeature3Title || 'Fair Trade',
    lumoPromiseFeature3Subtitle: settings.lumoPromiseFeature3Subtitle || 'Supporting artisan communities',

    // Meet the Makers Section
    meetMakersEnabled: settings.meetMakersEnabled ?? true,
    meetMakersTitle: settings.meetMakersTitle || 'Meet the Makers',
    meetMakersDescription: settings.meetMakersDescription || 'Behind every product is a story of skilled artisans dedicated to their craft, using traditional techniques passed down through generations.',
    meetMakersBgColor: settings.meetMakersBgColor || '#ffffff',
    meetMakersTextColor: settings.meetMakersTextColor || '#000000',
    meetMakersTitleSize: settings.meetMakersTitleSize || 'xl',
    meetMakersTitleWeight: settings.meetMakersTitleWeight || 'bold',

    // Hero Announcement Overlay
    heroAnnouncementEnabled: settings.heroAnnouncementEnabled ?? false,
    heroAnnouncementText: settings.heroAnnouncementText || '🔥 Free Shipping on Orders Over $50! 🔥',
    heroAnnouncementBgColor: settings.heroAnnouncementBgColor || '#8b5cf6',
    heroAnnouncementTextColor: settings.heroAnnouncementTextColor || '#ffffff',
    heroAnnouncementBorderColor: settings.heroAnnouncementBorderColor || '#ffffff',
    heroAnnouncementBorderRadius: settings.heroAnnouncementBorderRadius ?? 12,
    heroAnnouncementFontSize: settings.heroAnnouncementFontSize || 'base',
    heroAnnouncementFontWeight: settings.heroAnnouncementFontWeight || 'semibold',
    heroAnnouncementPositionX: settings.heroAnnouncementPositionX ?? 50,
    heroAnnouncementPositionY: settings.heroAnnouncementPositionY ?? 10,
    heroAnnouncementWidth: settings.heroAnnouncementWidth ?? 400,
    heroAnnouncementPadding: settings.heroAnnouncementPadding || 'md',
    heroAnnouncementMobileWidth: settings.heroAnnouncementMobileWidth ?? 90,
    heroAnnouncementMobileFontSize: settings.heroAnnouncementMobileFontSize || 'sm',
    heroAnnouncementLink: settings.heroAnnouncementLink || '',
    heroAnnouncementShadow: settings.heroAnnouncementShadow ?? true,
    heroAnnouncementAnimation: settings.heroAnnouncementAnimation || 'none',
  });

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);

      const formData = new FormData();

      // Add all fields to FormData
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const result = await saveSettings(formData);

      toast({
          title: result.success ? "Settings Updated" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });
      setIsSaving(false);
  };

  const updateField = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* General Store Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <CardTitle>General Store Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                placeholder="Lumo Store"
                value={formState.storeName}
                onChange={(e) => updateField('storeName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Store Currency</Label>
              <Select value={formState.currency} onValueChange={(val) => updateField('currency', val)}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeTagline">Store Tagline</Label>
            <Input
              id="storeTagline"
              placeholder="Your trusted e-commerce store"
              value={formState.storeTagline}
              onChange={(e) => updateField('storeTagline', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Store Email</Label>
              <Input
                id="storeEmail"
                type="email"
                placeholder="contact@lumostore.com"
                value={formState.storeEmail}
                onChange={(e) => updateField('storeEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input
                id="storePhone"
                placeholder="+1 (555) 123-4567"
                value={formState.storePhone}
                onChange={(e) => updateField('storePhone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Textarea
              id="storeAddress"
              placeholder="123 Main St, City, State, ZIP"
              value={formState.storeAddress}
              onChange={(e) => updateField('storeAddress', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Tax Settings</CardTitle>
          </div>
          <CardDescription>
            Configure tax calculation for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="taxEnabled">Enable Tax</Label>
              <p className="text-sm text-muted-foreground">
                Apply tax to product prices
              </p>
            </div>
            <Switch
              id="taxEnabled"
              checked={formState.taxEnabled}
              onCheckedChange={(checked) => updateField('taxEnabled', checked)}
            />
          </div>

          {formState.taxEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={formState.taxRate}
                    onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxLabel">Tax Label</Label>
                  <Input
                    id="taxLabel"
                    placeholder="Tax"
                    value={formState.taxLabel}
                    onChange={(e) => updateField('taxLabel', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="displayPricesWithTax">Display Prices with Tax</Label>
                  <p className="text-sm text-muted-foreground">
                    Show tax-inclusive prices to customers
                  </p>
                </div>
                <Switch
                  id="displayPricesWithTax"
                  checked={formState.displayPricesWithTax}
                  onCheckedChange={(checked) => updateField('displayPricesWithTax', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle>Shipping Settings</CardTitle>
          </div>
          <CardDescription>
            Configure shipping options for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="freeShippingEnabled">Enable Free Shipping</Label>
              <p className="text-sm text-muted-foreground">
                Offer free shipping on orders above a threshold
              </p>
            </div>
            <Switch
              id="freeShippingEnabled"
              checked={formState.freeShippingEnabled}
              onCheckedChange={(checked) => updateField('freeShippingEnabled', checked)}
            />
          </div>

          {formState.freeShippingEnabled && (
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={formState.freeShippingThreshold}
                onChange={(e) => updateField('freeShippingThreshold', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="flatRateShippingEnabled">Enable Flat Rate Shipping</Label>
              <p className="text-sm text-muted-foreground">
                Charge a fixed shipping cost
              </p>
            </div>
            <Switch
              id="flatRateShippingEnabled"
              checked={formState.flatRateShippingEnabled}
              onCheckedChange={(checked) => updateField('flatRateShippingEnabled', checked)}
            />
          </div>

          {formState.flatRateShippingEnabled && (
            <div className="space-y-2">
              <Label htmlFor="flatRateShippingCost">Flat Rate Shipping Cost</Label>
              <Input
                id="flatRateShippingCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                value={formState.flatRateShippingCost}
                onChange={(e) => updateField('flatRateShippingCost', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email/Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email & Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Configure automated email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOrderConfirmation">Order Confirmation Emails</Label>
              <p className="text-sm text-muted-foreground">
                Send email when order is placed
              </p>
            </div>
            <Switch
              id="emailOrderConfirmation"
              checked={formState.emailOrderConfirmation}
              onCheckedChange={(checked) => updateField('emailOrderConfirmation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailShippingNotification">Shipping Notification Emails</Label>
              <p className="text-sm text-muted-foreground">
                Send email when order is shipped
              </p>
            </div>
            <Switch
              id="emailShippingNotification"
              checked={formState.emailShippingNotification}
              onCheckedChange={(checked) => updateField('emailShippingNotification', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNewsletter">Newsletter Subscription</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to subscribe to newsletter
              </p>
            </div>
            <Switch
              id="emailNewsletter"
              checked={formState.emailNewsletter}
              onCheckedChange={(checked) => updateField('emailNewsletter', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Inventory Settings</CardTitle>
          </div>
          <CardDescription>
            Configure inventory management and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableLowStockAlerts">Enable Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show alerts when products are running low
              </p>
            </div>
            <Switch
              id="enableLowStockAlerts"
              checked={formState.enableLowStockAlerts}
              onCheckedChange={(checked) => updateField('enableLowStockAlerts', checked)}
            />
          </div>

          {formState.enableLowStockAlerts && (
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="1"
                placeholder="10"
                value={formState.lowStockThreshold}
                onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 10)}
              />
              <p className="text-sm text-muted-foreground">
                Alert when product stock falls below this number
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Footer Settings</CardTitle>
          </div>
          <CardDescription>
            Customize your website footer content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerDescription">Footer Description</Label>
            <Textarea
              id="footerDescription"
              placeholder="We're building a trusted shopping experience..."
              value={formState.footerDescription}
              onChange={(e) => updateField('footerDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="footerCopyright">Copyright Text</Label>
              <Input
                id="footerCopyright"
                placeholder="Lumo – Africa's Trusted Marketplace"
                value={formState.footerCopyright}
                onChange={(e) => updateField('footerCopyright', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerTagline">Footer Tagline</Label>
              <Input
                id="footerTagline"
                placeholder="Building trust, one order at a time 🌍"
                value={formState.footerTagline}
                onChange={(e) => updateField('footerTagline', e.target.value)}
              />
            </div>
          </div>

          <Separator />
          <h4 className="font-medium">Contact Information</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="footerEmail">Contact Email</Label>
              <Input
                id="footerEmail"
                type="email"
                placeholder="support@example.com"
                value={formState.footerEmail}
                onChange={(e) => updateField('footerEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerPhone">Phone Number</Label>
              <Input
                id="footerPhone"
                placeholder="+220 700 1234"
                value={formState.footerPhone}
                onChange={(e) => updateField('footerPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerWhatsApp">WhatsApp Number</Label>
              <Input
                id="footerWhatsApp"
                placeholder="+2207001234"
                value={formState.footerWhatsApp}
                onChange={(e) => updateField('footerWhatsApp', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Without spaces or dashes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <CardTitle>Social Media Links</CardTitle>
          </div>
          <CardDescription>
            Add your social media profile URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="socialFacebook">Facebook</Label>
              <Input
                id="socialFacebook"
                placeholder="https://facebook.com/yourpage"
                value={formState.socialFacebook}
                onChange={(e) => updateField('socialFacebook', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialInstagram">Instagram</Label>
              <Input
                id="socialInstagram"
                placeholder="https://instagram.com/yourpage"
                value={formState.socialInstagram}
                onChange={(e) => updateField('socialInstagram', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialX">X (Twitter)</Label>
              <Input
                id="socialX"
                placeholder="https://x.com/yourhandle"
                value={formState.socialX}
                onChange={(e) => updateField('socialX', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialTiktok">TikTok</Label>
              <Input
                id="socialTiktok"
                placeholder="https://tiktok.com/@yourhandle"
                value={formState.socialTiktok}
                onChange={(e) => updateField('socialTiktok', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialYoutube">YouTube</Label>
              <Input
                id="socialYoutube"
                placeholder="https://youtube.com/@yourchannel"
                value={formState.socialYoutube}
                onChange={(e) => updateField('socialYoutube', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Trust Badges</CardTitle>
          </div>
          <CardDescription>
            Customize the trust badges shown in the footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b last:border-0">
              <div className="space-y-2">
                <Label htmlFor={`trustBadge${num}Title`}>Badge {num} Title</Label>
                <Input
                  id={`trustBadge${num}Title`}
                  placeholder="Secure Payments"
                  value={(formState as any)[`trustBadge${num}Title`]}
                  onChange={(e) => updateField(`trustBadge${num}Title`, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`trustBadge${num}Subtitle`}>Badge {num} Subtitle</Label>
                <Input
                  id={`trustBadge${num}Subtitle`}
                  placeholder="100% Protected"
                  value={(formState as any)[`trustBadge${num}Subtitle`]}
                  onChange={(e) => updateField(`trustBadge${num}Subtitle`, e.target.value)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment & Delivery */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Payment & Delivery</CardTitle>
          </div>
          <CardDescription>
            Configure payment methods and delivery regions shown in footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerPaymentMethods">Payment Methods</Label>
            <Input
              id="footerPaymentMethods"
              placeholder="Wave,Afrimoney,QMoney,Bank Transfer,Cash on Delivery"
              value={formState.footerPaymentMethods}
              onChange={(e) => updateField('footerPaymentMethods', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of payment methods</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerDeliveryCountries">Delivery Countries</Label>
            <Input
              id="footerDeliveryCountries"
              placeholder="🇬🇲 Gambia,🇸🇳 Senegal,🇳🇬 Nigeria"
              value={formState.footerDeliveryCountries}
              onChange={(e) => updateField('footerDeliveryCountries', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated list with emoji flags (e.g., 🇬🇲 Gambia)</p>
          </div>
        </CardContent>
      </Card>

      {/* Lumo Promise Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            <CardTitle>Lumo Promise Section</CardTitle>
          </div>
          <CardDescription>
            Customize the &quot;Lumo Promise&quot; section on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="lumoPromiseEnabled"
              checked={formState.lumoPromiseEnabled}
              onCheckedChange={(checked) => updateField('lumoPromiseEnabled', checked)}
            />
            <Label htmlFor="lumoPromiseEnabled">Show Lumo Promise Section</Label>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseTitle">Section Title</Label>
              <Input
                id="lumoPromiseTitle"
                placeholder="The Lumo Promise"
                value={formState.lumoPromiseTitle}
                onChange={(e) => updateField('lumoPromiseTitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseTitleSize">Title Size</Label>
              <Select value={formState.lumoPromiseTitleSize} onValueChange={(val) => updateField('lumoPromiseTitleSize', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                  <SelectItem value="3xl">3X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseTitleWeight">Title Weight</Label>
              <Select value={formState.lumoPromiseTitleWeight} onValueChange={(val) => updateField('lumoPromiseTitleWeight', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseBgColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="lumoPromiseBgColor"
                  value={formState.lumoPromiseBgColor}
                  onChange={(e) => updateField('lumoPromiseBgColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formState.lumoPromiseBgColor}
                  onChange={(e) => updateField('lumoPromiseBgColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lumoPromiseTextColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="lumoPromiseTextColor"
                value={formState.lumoPromiseTextColor}
                onChange={(e) => updateField('lumoPromiseTextColor', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formState.lumoPromiseTextColor}
                onChange={(e) => updateField('lumoPromiseTextColor', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lumoPromiseDescription">Description</Label>
            <Textarea
              id="lumoPromiseDescription"
              placeholder="Every product in our collection is carefully curated..."
              value={formState.lumoPromiseDescription}
              onChange={(e) => updateField('lumoPromiseDescription', e.target.value)}
              rows={3}
            />
          </div>

          <Separator />
          <h4 className="font-medium">Feature 1</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature1Icon">Icon (emoji)</Label>
              <Input
                id="lumoPromiseFeature1Icon"
                placeholder="🌱"
                value={formState.lumoPromiseFeature1Icon}
                onChange={(e) => updateField('lumoPromiseFeature1Icon', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature1Title">Title</Label>
              <Input
                id="lumoPromiseFeature1Title"
                placeholder="Sustainable"
                value={formState.lumoPromiseFeature1Title}
                onChange={(e) => updateField('lumoPromiseFeature1Title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature1Subtitle">Subtitle</Label>
              <Input
                id="lumoPromiseFeature1Subtitle"
                placeholder="Eco-friendly materials"
                value={formState.lumoPromiseFeature1Subtitle}
                onChange={(e) => updateField('lumoPromiseFeature1Subtitle', e.target.value)}
              />
            </div>
          </div>

          <h4 className="font-medium">Feature 2</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature2Icon">Icon (emoji)</Label>
              <Input
                id="lumoPromiseFeature2Icon"
                placeholder="✨"
                value={formState.lumoPromiseFeature2Icon}
                onChange={(e) => updateField('lumoPromiseFeature2Icon', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature2Title">Title</Label>
              <Input
                id="lumoPromiseFeature2Title"
                placeholder="Quality Crafted"
                value={formState.lumoPromiseFeature2Title}
                onChange={(e) => updateField('lumoPromiseFeature2Title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature2Subtitle">Subtitle</Label>
              <Input
                id="lumoPromiseFeature2Subtitle"
                placeholder="Handpicked for excellence"
                value={formState.lumoPromiseFeature2Subtitle}
                onChange={(e) => updateField('lumoPromiseFeature2Subtitle', e.target.value)}
              />
            </div>
          </div>

          <h4 className="font-medium">Feature 3</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature3Icon">Icon (emoji)</Label>
              <Input
                id="lumoPromiseFeature3Icon"
                placeholder="🤝"
                value={formState.lumoPromiseFeature3Icon}
                onChange={(e) => updateField('lumoPromiseFeature3Icon', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature3Title">Title</Label>
              <Input
                id="lumoPromiseFeature3Title"
                placeholder="Fair Trade"
                value={formState.lumoPromiseFeature3Title}
                onChange={(e) => updateField('lumoPromiseFeature3Title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lumoPromiseFeature3Subtitle">Subtitle</Label>
              <Input
                id="lumoPromiseFeature3Subtitle"
                placeholder="Supporting artisan communities"
                value={formState.lumoPromiseFeature3Subtitle}
                onChange={(e) => updateField('lumoPromiseFeature3Subtitle', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meet the Makers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Meet the Makers Section</CardTitle>
          </div>
          <CardDescription>
            Customize the &quot;Meet the Makers&quot; section on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="meetMakersEnabled"
              checked={formState.meetMakersEnabled}
              onCheckedChange={(checked) => updateField('meetMakersEnabled', checked)}
            />
            <Label htmlFor="meetMakersEnabled">Show Meet the Makers Section</Label>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetMakersTitle">Section Title</Label>
              <Input
                id="meetMakersTitle"
                placeholder="Meet the Makers"
                value={formState.meetMakersTitle}
                onChange={(e) => updateField('meetMakersTitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetMakersTitleSize">Title Size</Label>
              <Select value={formState.meetMakersTitleSize} onValueChange={(val) => updateField('meetMakersTitleSize', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                  <SelectItem value="3xl">3X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetMakersTitleWeight">Title Weight</Label>
              <Select value={formState.meetMakersTitleWeight} onValueChange={(val) => updateField('meetMakersTitleWeight', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetMakersBgColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="meetMakersBgColor"
                  value={formState.meetMakersBgColor}
                  onChange={(e) => updateField('meetMakersBgColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formState.meetMakersBgColor}
                  onChange={(e) => updateField('meetMakersBgColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetMakersTextColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="meetMakersTextColor"
                value={formState.meetMakersTextColor}
                onChange={(e) => updateField('meetMakersTextColor', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formState.meetMakersTextColor}
                onChange={(e) => updateField('meetMakersTextColor', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetMakersDescription">Description</Label>
            <Textarea
              id="meetMakersDescription"
              placeholder="Behind every product is a story of skilled artisans..."
              value={formState.meetMakersDescription}
              onChange={(e) => updateField('meetMakersDescription', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Announcement Overlay Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle>Hero Announcement Overlay</CardTitle>
          </div>
          <CardDescription>
            Add a customizable announcement banner on top of the hero section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Live Preview</Label>
            <div className="relative w-full h-48 bg-gradient-to-r from-slate-800 to-slate-600 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/50 text-sm">
                  Hero Section Preview
                </div>
              </div>
              {formState.heroAnnouncementEnabled && formState.heroAnnouncementText && (
                <div
                  className={`absolute text-center ${
                    formState.heroAnnouncementAnimation === 'pulse' ? 'animate-pulse' :
                    formState.heroAnnouncementAnimation === 'bounce' ? 'animate-bounce' :
                    formState.heroAnnouncementAnimation === 'shake' ? 'animate-shake' : ''
                  }`}
                  style={{
                    left: `${formState.heroAnnouncementPositionX}%`,
                    top: `${formState.heroAnnouncementPositionY}%`,
                    transform: formState.heroAnnouncementPositionX === 50 ? 'translateX(-50%)' : 
                               formState.heroAnnouncementPositionX > 50 ? `translateX(-${(formState.heroAnnouncementPositionX - 50) * 2}%)` : 'none',
                    width: `${Math.min(formState.heroAnnouncementWidth * 0.5, 200)}px`,
                    backgroundColor: formState.heroAnnouncementBgColor,
                    color: formState.heroAnnouncementTextColor,
                    borderColor: formState.heroAnnouncementBorderColor,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderRadius: `${formState.heroAnnouncementBorderRadius}px`,
                    padding: formState.heroAnnouncementPadding === 'sm' ? '4px 8px' :
                             formState.heroAnnouncementPadding === 'lg' ? '12px 24px' : '8px 16px',
                    fontSize: formState.heroAnnouncementFontSize === 'xs' ? '10px' :
                              formState.heroAnnouncementFontSize === 'sm' ? '11px' :
                              formState.heroAnnouncementFontSize === 'lg' ? '14px' :
                              formState.heroAnnouncementFontSize === 'xl' ? '16px' :
                              formState.heroAnnouncementFontSize === '2xl' ? '18px' : '12px',
                    fontWeight: formState.heroAnnouncementFontWeight === 'normal' ? 400 :
                                formState.heroAnnouncementFontWeight === 'medium' ? 500 :
                                formState.heroAnnouncementFontWeight === 'bold' ? 700 : 600,
                    boxShadow: formState.heroAnnouncementShadow ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {formState.heroAnnouncementText}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This preview shows a scaled version. Actual sizes will differ on the homepage.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="heroAnnouncementEnabled">Enable Hero Announcement</Label>
            <Switch
              id="heroAnnouncementEnabled"
              checked={formState.heroAnnouncementEnabled}
              onCheckedChange={(checked) => updateField('heroAnnouncementEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="heroAnnouncementText">Announcement Text (supports emojis 🎉)</Label>
            <Textarea
              id="heroAnnouncementText"
              placeholder="🔥 Free Shipping on Orders Over $50! 🔥"
              value={formState.heroAnnouncementText}
              onChange={(e) => updateField('heroAnnouncementText', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroAnnouncementLink">Link URL (optional)</Label>
            <Input
              id="heroAnnouncementLink"
              placeholder="https://example.com/sale"
              value={formState.heroAnnouncementLink}
              onChange={(e) => updateField('heroAnnouncementLink', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementBgColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="heroAnnouncementBgColor"
                  value={formState.heroAnnouncementBgColor}
                  onChange={(e) => updateField('heroAnnouncementBgColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formState.heroAnnouncementBgColor}
                  onChange={(e) => updateField('heroAnnouncementBgColor', e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementTextColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="heroAnnouncementTextColor"
                  value={formState.heroAnnouncementTextColor}
                  onChange={(e) => updateField('heroAnnouncementTextColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formState.heroAnnouncementTextColor}
                  onChange={(e) => updateField('heroAnnouncementTextColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementBorderColor">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="heroAnnouncementBorderColor"
                  value={formState.heroAnnouncementBorderColor}
                  onChange={(e) => updateField('heroAnnouncementBorderColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formState.heroAnnouncementBorderColor}
                  onChange={(e) => updateField('heroAnnouncementBorderColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementBorderRadius">Border Radius (px)</Label>
              <Input
                id="heroAnnouncementBorderRadius"
                type="number"
                min={0}
                max={50}
                value={formState.heroAnnouncementBorderRadius}
                onChange={(e) => updateField('heroAnnouncementBorderRadius', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementFontSize">Font Size (Desktop)</Label>
              <Select
                value={formState.heroAnnouncementFontSize}
                onValueChange={(value) => updateField('heroAnnouncementFontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Extra Small</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementMobileFontSize">Font Size (Mobile)</Label>
              <Select
                value={formState.heroAnnouncementMobileFontSize}
                onValueChange={(value) => updateField('heroAnnouncementMobileFontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Extra Small</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementFontWeight">Font Weight</Label>
              <Select
                value={formState.heroAnnouncementFontWeight}
                onValueChange={(value) => updateField('heroAnnouncementFontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementPadding">Padding</Label>
              <Select
                value={formState.heroAnnouncementPadding}
                onValueChange={(value) => updateField('heroAnnouncementPadding', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select padding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementPositionX">Horizontal Position (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="heroAnnouncementPositionX"
                  type="number"
                  min={0}
                  max={100}
                  value={formState.heroAnnouncementPositionX}
                  onChange={(e) => updateField('heroAnnouncementPositionX', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">0 = Left, 50 = Center, 100 = Right</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementPositionY">Vertical Position (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="heroAnnouncementPositionY"
                  type="number"
                  min={0}
                  max={100}
                  value={formState.heroAnnouncementPositionY}
                  onChange={(e) => updateField('heroAnnouncementPositionY', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">0 = Top, 50 = Middle, 100 = Bottom</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementWidth">Width (Desktop - px)</Label>
              <Input
                id="heroAnnouncementWidth"
                type="number"
                min={100}
                max={800}
                value={formState.heroAnnouncementWidth}
                onChange={(e) => updateField('heroAnnouncementWidth', parseInt(e.target.value) || 400)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementMobileWidth">Width (Mobile - %)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="heroAnnouncementMobileWidth"
                  type="number"
                  min={50}
                  max={100}
                  value={formState.heroAnnouncementMobileWidth}
                  onChange={(e) => updateField('heroAnnouncementMobileWidth', parseInt(e.target.value) || 90)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">% of screen width</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="heroAnnouncementShadow">Enable Shadow</Label>
              <Switch
                id="heroAnnouncementShadow"
                checked={formState.heroAnnouncementShadow}
                onCheckedChange={(checked) => updateField('heroAnnouncementShadow', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroAnnouncementAnimation">Animation</Label>
              <Select
                value={formState.heroAnnouncementAnimation}
                onValueChange={(value) => updateField('heroAnnouncementAnimation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select animation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="shake">Shake</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving Settings...' : 'Save All Settings'}
        </Button>
      </div>
    </form>
  );
}
