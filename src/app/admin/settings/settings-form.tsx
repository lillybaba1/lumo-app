"use client";

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Store, DollarSign, Truck, Mail, Package, Globe, Share2, Shield, MessageCircle } from 'lucide-react';
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
