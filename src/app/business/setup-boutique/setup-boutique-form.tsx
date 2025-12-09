'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  Palette, 
  Sparkles,
  Eye,
  ImageIcon,
  Globe,
  AlertCircle
} from 'lucide-react';
import { BusinessAccount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import ImageUploadBox from '@/components/image-upload-box';
import { uploadBoutiqueImage, deleteBoutiqueImage, BOUTIQUE_IMAGE_SPECS } from '@/services/boutiqueStorageService';

interface SetupBoutiqueFormProps {
  businessAccount: BusinessAccount;
}

// Preset color themes
const COLOR_PRESETS = [
  { name: 'Indigo', color: '#6366f1', gradient: 'from-indigo-500 to-purple-500' },
  { name: 'Rose', color: '#f43f5e', gradient: 'from-rose-500 to-pink-500' },
  { name: 'Emerald', color: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Amber', color: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
  { name: 'Sky', color: '#0ea5e9', gradient: 'from-sky-500 to-cyan-500' },
  { name: 'Violet', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
  { name: 'Slate', color: '#475569', gradient: 'from-slate-500 to-gray-500' },
  { name: 'Coral', color: '#ff6b6b', gradient: 'from-red-400 to-orange-400' },
];

export default function SetupBoutiqueForm({ businessAccount }: SetupBoutiqueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: businessAccount.businessName || '',
    slug: businessAccount.boutiqueSlug || generateSlug(businessAccount.businessName),
    tagline: '',
    description: businessAccount.description || '',
    themeColor: '#6366f1',
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
    
    if (name === 'displayName') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleLogoUpload = async (file: File): Promise<string> => {
    const url = await uploadBoutiqueImage(file, businessAccount.id, 'logo');
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
    const url = await uploadBoutiqueImage(file, businessAccount.id, 'banner');
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
        title: '🎉 Boutique Submitted!',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Account Approved</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1 text-primary font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Design Your Boutique</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Admin Review</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Go Live! 🚀</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white mb-4 shadow-lg shadow-primary/30">
            <Store className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-headline font-bold mb-2">Design Your Boutique</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Make your store stand out with a beautiful logo, banner, and brand colors. 
            This is what customers will see when they visit your boutique.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Branding Section - Featured */}
          <Card className="overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Brand Your Boutique
              </CardTitle>
              <CardDescription>
                Upload your logo and banner to make your store memorable
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
                />
              </div>

              <Separator />

              {/* Logo and Color side by side */}
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
                    />
                  </div>
                </div>

                {/* Theme Color */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Brand Color</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Choose a color that represents your brand
                  </p>
                  
                  {/* Color Presets */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, themeColor: preset.color }))}
                        className={`
                          w-10 h-10 rounded-full transition-all
                          bg-gradient-to-br ${preset.gradient}
                          ${formData.themeColor === preset.color 
                            ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                            : 'hover:scale-105 opacity-80 hover:opacity-100'}
                        `}
                        title={preset.name}
                      />
                    ))}
                  </div>

                  {/* Custom Color Picker */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        name="themeColor"
                        value={formData.themeColor}
                        onChange={handleInputChange}
                        className="w-12 h-12 rounded-lg border-2 border-muted cursor-pointer appearance-none"
                        style={{ backgroundColor: formData.themeColor }}
                      />
                      <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-muted" />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={formData.themeColor}
                        onChange={handleInputChange}
                        name="themeColor"
                        placeholder="#6366f1"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Store Details
              </CardTitle>
              <CardDescription>
                Tell customers about your boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base">
                  Boutique Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="My Amazing Boutique"
                  className="text-lg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is how your store will appear to customers
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-base">
                  Store URL <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 pr-3">
                  <span className="text-sm text-muted-foreground px-3 py-2">
                    julazone.com/boutique/
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="my-boutique"
                    pattern="[a-z0-9-]+"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-base">Tagline</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="Quality products, unbeatable prices"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  A catchy phrase that describes your boutique ({formData.tagline.length}/100)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">
                  About Your Boutique <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your boutique, what you sell, and what makes you special. Share your story and why they should shop with you..."
                  rows={5}
                  required
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowPreview(!showPreview)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </div>
                <Badge variant="secondary">
                  {showPreview ? 'Hide' : 'Show'}
                </Badge>
              </CardTitle>
              <CardDescription>
                See how your boutique will look to customers
              </CardDescription>
            </CardHeader>
            {showPreview && (
              <CardContent className="pt-0">
                <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-950">
                  {/* Preview Banner */}
                  <div 
                    className="relative h-32 bg-gradient-to-r from-muted to-muted/50"
                    style={formData.bannerImage ? { backgroundImage: `url(${formData.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: formData.themeColor + '20' }}
                  >
                    {!formData.bannerImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Content */}
                  <div className="p-6 relative">
                    {/* Logo positioned to overlap banner */}
                    <div className="absolute -top-12 left-6">
                      <div 
                        className="w-24 h-24 rounded-xl border-4 border-white dark:border-gray-950 bg-muted flex items-center justify-center overflow-hidden shadow-lg"
                        style={{ backgroundColor: formData.logo ? undefined : formData.themeColor + '20' }}
                      >
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="h-8 w-8" style={{ color: formData.themeColor }} />
                        )}
                      </div>
                    </div>

                    <div className="ml-0 mt-12 sm:ml-28 sm:mt-0">
                      <h3 className="text-xl font-bold">
                        {formData.displayName || 'Your Boutique Name'}
                      </h3>
                      {formData.tagline && (
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {formData.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge style={{ backgroundColor: formData.themeColor }} className="text-white">
                          Open
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          julazone.com/boutique/{formData.slug || 'your-slug'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Review
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Our team will review your boutique within 1-2 business days.
              You'll receive an email when your boutique is approved!
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
