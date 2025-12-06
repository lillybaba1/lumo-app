"use client";

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, Upload, Crop, Move, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import { getHeroSettings, updateHeroSettings } from './actions';
import { uploadImageAndGetUrl } from '@/services/storageService';
import ImageCropUploadModal from '@/components/image-crop-upload-modal';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HERO_ASPECT_RATIOS = [
  { label: 'Free', value: 'free', ratio: undefined },
  { label: '21:9', value: '21:9', ratio: 21 / 9 },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '3:1', value: '3:1', ratio: 3 / 1 },
  { label: '2:1', value: '2:1', ratio: 2 / 1 },
];

export default function HeroSettingsForm() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [heroHeading, setHeroHeading] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('');
  const [heroImageObjectPosition, setHeroImageObjectPosition] = useState('center');
  const [heroImageFit, setHeroImageFit] = useState<'cover' | 'contain'>('cover');
  const [customPosition, setCustomPosition] = useState('');
  
  // New text styling fields
  const [heroHeadingColor, setHeroHeadingColor] = useState('#ffffff');
  const [heroTaglineColor, setHeroTaglineColor] = useState('#ffffff');
  const [heroHeadingPosition, setHeroHeadingPosition] = useState({ x: 5, y: 35 });
  const [heroTaglinePosition, setHeroTaglinePosition] = useState({ x: 5, y: 50 });
  const [heroCtaPosition, setHeroCtaPosition] = useState({ x: 5, y: 65 });

  // Button color fields
  const [heroButton1BgColor, setHeroButton1BgColor] = useState('#3b82f6');
  const [heroButton1TextColor, setHeroButton1TextColor] = useState('#ffffff');
  const [heroButton2BgColor, setHeroButton2BgColor] = useState('transparent');
  const [heroButton2TextColor, setHeroButton2TextColor] = useState('#ffffff');
  const [heroButton2BorderColor, setHeroButton2BorderColor] = useState('#ffffff');
  const [heroButton3BgColor, setHeroButton3BgColor] = useState('#3b82f6');
  const [heroButton3TextColor, setHeroButton3TextColor] = useState('#ffffff');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Load initial settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getHeroSettings();
        setHeroHeading(settings.heroHeading);
        setHeroTagline(settings.heroTagline);
        setHeroBackgroundImage(settings.heroBackgroundImage);
        setHeroImageObjectPosition(settings.heroImageObjectPosition);
        setHeroImageFit(settings.heroImageFit || 'cover');
        setHeroHeadingColor(settings.heroHeadingColor || '#ffffff');
        setHeroTaglineColor(settings.heroTaglineColor || '#ffffff');
        setHeroHeadingPosition(settings.heroHeadingPosition || { x: 5, y: 35 });
        setHeroTaglinePosition(settings.heroTaglinePosition || { x: 5, y: 50 });
        setHeroCtaPosition(settings.heroCtaPosition || { x: 5, y: 65 });
        
        // Load button colors
        setHeroButton1BgColor(settings.heroButton1BgColor || '#3b82f6');
        setHeroButton1TextColor(settings.heroButton1TextColor || '#ffffff');
        setHeroButton2BgColor(settings.heroButton2BgColor || 'transparent');
        setHeroButton2TextColor(settings.heroButton2TextColor || '#ffffff');
        setHeroButton2BorderColor(settings.heroButton2BorderColor || '#ffffff');
        setHeroButton3BgColor(settings.heroButton3BgColor || '#3b82f6');
        setHeroButton3TextColor(settings.heroButton3TextColor || '#ffffff');

        // If it's a custom position (not in preset list), set it to custom
        const presets = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'];
        if (!presets.includes(settings.heroImageObjectPosition)) {
          setCustomPosition(settings.heroImageObjectPosition);
          setHeroImageObjectPosition('custom');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load hero settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please upload an image smaller than 4MB.",
        variant: "destructive"
      });
      return;
    }

    // Open crop modal instead of uploading directly
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true);
    setCropModalOpen(false);

    try {
      const url = await uploadImageAndGetUrl(croppedFile, 'hero');
      setHeroBackgroundImage(url);
      setHasUnsavedChanges(true);
      setImageToCrop('');
      toast({
        title: 'Image uploaded successfully!',
        description: '⚠️ Important: Click "Save Changes" button below to apply the new hero image.',
        variant: 'default',
        duration: 8000,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Could not upload image.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const finalPosition = heroImageObjectPosition === 'custom' ? customPosition : heroImageObjectPosition;

    try {
      const result = await updateHeroSettings({
        heroHeading,
        heroTagline,
        heroBackgroundImage,
        heroImageObjectPosition: finalPosition,
        heroImageFit,
        heroHeadingColor,
        heroTaglineColor,
        heroHeadingPosition,
        heroTaglinePosition,
        heroCtaPosition,
        heroButton1BgColor,
        heroButton1TextColor,
        heroButton2BgColor,
        heroButton2TextColor,
        heroButton2BorderColor,
        heroButton3BgColor,
        heroButton3TextColor,
      });

      toast({
        title: result.success ? "Hero Settings Updated" : "Error",
        description: result.success
          ? "Your hero section has been updated successfully."
          : result.error || "Failed to update hero settings",
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        setHasUnsavedChanges(false);
        // Force refresh to show updated hero image
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Large Live Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Live Preview
              </CardTitle>
              <CardDescription>
                See your changes in real-time
              </CardDescription>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewExpanded(!previewExpanded)}
            >
              {previewExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className={`relative w-full overflow-hidden rounded-lg border transition-all ${previewExpanded ? 'aspect-[16/7]' : 'aspect-[21/6]'}`}
            style={{ minHeight: previewExpanded ? '400px' : '200px' }}
          >
            {/* Background */}
            {heroBackgroundImage ? (
              <div className="absolute inset-0">
                <Image
                  src={heroBackgroundImage}
                  alt="Hero preview"
                  fill
                  className={heroImageFit === 'contain' ? 'object-contain' : 'object-cover'}
                  style={{ 
                    objectPosition: heroImageObjectPosition === 'custom' ? customPosition : heroImageObjectPosition,
                    backgroundColor: heroImageFit === 'contain' ? '#1a1a2e' : undefined 
                  }}
                  unoptimized
                />
                {heroImageFit === 'cover' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600" />
            )}

            {/* Heading */}
            <div
              className="absolute text-2xl md:text-4xl lg:text-5xl font-bold max-w-[60%] px-4 leading-tight"
              style={{
                left: `${heroHeadingPosition.x}%`,
                top: `${heroHeadingPosition.y}%`,
                transform: 'translateY(-50%)',
                color: heroHeadingColor,
              }}
            >
              {heroHeading || 'Step into Lumo'}
            </div>

            {/* Tagline */}
            <div
              className="absolute text-sm md:text-base lg:text-lg max-w-[50%] px-4"
              style={{
                left: `${heroTaglinePosition.x}%`,
                top: `${heroTaglinePosition.y}%`,
                transform: 'translateY(-50%)',
                color: heroTaglineColor,
                opacity: 0.95,
              }}
            >
              {heroTagline || 'Discover exceptional products crafted with care.'}
            </div>

            {/* CTA Buttons */}
            <div 
              className="absolute flex gap-2 px-4"
              style={{
                left: `${heroCtaPosition.x}%`,
                top: `${heroCtaPosition.y}%`,
                transform: 'translateY(-50%)',
              }}
            >
              <div className="bg-primary text-primary-foreground text-xs md:text-sm font-semibold px-4 py-2 rounded-md flex items-center gap-1">
                Shop New Arrivals
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <div className="bg-white/10 backdrop-blur text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-md border border-white/30">
                Browse Collections
              </div>
            </div>

            {/* Position indicators */}
            {previewExpanded && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Heading: {heroHeadingPosition.x}%, {heroHeadingPosition.y}% | 
                Tagline: {heroTaglinePosition.x}%, {heroTaglinePosition.y}% | 
                CTA: {heroCtaPosition.x}%, {heroCtaPosition.y}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>
            Customize the hero section that appears on your homepage.
            {hasUnsavedChanges && <span className="text-orange-600 font-semibold ml-2">• Unsaved changes</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Heading */}
          <div className="space-y-2">
            <Label htmlFor="hero-heading">Hero Heading</Label>
            <div className="flex gap-2">
              <Input
                id="hero-heading"
                value={heroHeading}
                onChange={(e) => {
                  setHeroHeading(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Step into Lumo"
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="heading-color" className="text-xs text-muted-foreground whitespace-nowrap">Color:</Label>
                <input
                  type="color"
                  id="heading-color"
                  value={heroHeadingColor}
                  onChange={(e) => {
                    setHeroHeadingColor(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
              </div>
            </div>
          </div>

          {/* Heading Position */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                Heading X Position: {heroHeadingPosition.x}%
              </Label>
              <Slider
                value={[heroHeadingPosition.x]}
                onValueChange={([x]) => {
                  setHeroHeadingPosition({ ...heroHeadingPosition, x });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Heading Y Position: {heroHeadingPosition.y}%</Label>
              <Slider
                value={[heroHeadingPosition.y]}
                onValueChange={([y]) => {
                  setHeroHeadingPosition({ ...heroHeadingPosition, y });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Hero Tagline */}
          <div className="space-y-2">
            <Label htmlFor="hero-tagline">Hero Tagline</Label>
            <div className="flex gap-2">
              <Textarea
                id="hero-tagline"
                value={heroTagline}
                onChange={(e) => {
                  setHeroTagline(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Discover exceptional products crafted with care..."
                rows={3}
                className="flex-1"
              />
              <div className="flex flex-col items-center gap-1">
                <Label htmlFor="tagline-color" className="text-xs text-muted-foreground">Color:</Label>
                <input
                  type="color"
                  id="tagline-color"
                  value={heroTaglineColor}
                  onChange={(e) => {
                    setHeroTaglineColor(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
              </div>
            </div>
          </div>

          {/* Tagline Position */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                Tagline X Position: {heroTaglinePosition.x}%
              </Label>
              <Slider
                value={[heroTaglinePosition.x]}
                onValueChange={([x]) => {
                  setHeroTaglinePosition({ ...heroTaglinePosition, x });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline Y Position: {heroTaglinePosition.y}%</Label>
              <Slider
                value={[heroTaglinePosition.y]}
                onValueChange={([y]) => {
                  setHeroTaglinePosition({ ...heroTaglinePosition, y });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* CTA Buttons Position */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                CTA Buttons X Position: {heroCtaPosition.x}%
              </Label>
              <Slider
                value={[heroCtaPosition.x]}
                onValueChange={([x]) => {
                  setHeroCtaPosition({ ...heroCtaPosition, x });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Buttons Y Position: {heroCtaPosition.y}%</Label>
              <Slider
                value={[heroCtaPosition.y]}
                onValueChange={([y]) => {
                  setHeroCtaPosition({ ...heroCtaPosition, y });
                  setHasUnsavedChanges(true);
                }}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* CTA Button Colors */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-base font-semibold">Button Colors</Label>
            
            {/* Button 1: Shop New Arrivals */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Shop New Arrivals Button</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn1-bg" className="text-xs whitespace-nowrap">Background:</Label>
                  <input
                    type="color"
                    id="btn1-bg"
                    value={heroButton1BgColor}
                    onChange={(e) => {
                      setHeroButton1BgColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn1-text" className="text-xs whitespace-nowrap">Text:</Label>
                  <input
                    type="color"
                    id="btn1-text"
                    value={heroButton1TextColor}
                    onChange={(e) => {
                      setHeroButton1TextColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
              </div>
            </div>

            {/* Button 2: Browse Collections */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Browse Collections Button</Label>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn2-bg" className="text-xs whitespace-nowrap">Background:</Label>
                  <input
                    type="color"
                    id="btn2-bg"
                    value={heroButton2BgColor === 'transparent' ? '#000000' : heroButton2BgColor}
                    onChange={(e) => {
                      setHeroButton2BgColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn2-text" className="text-xs whitespace-nowrap">Text:</Label>
                  <input
                    type="color"
                    id="btn2-text"
                    value={heroButton2TextColor}
                    onChange={(e) => {
                      setHeroButton2TextColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn2-border" className="text-xs whitespace-nowrap">Border:</Label>
                  <input
                    type="color"
                    id="btn2-border"
                    value={heroButton2BorderColor}
                    onChange={(e) => {
                      setHeroButton2BorderColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
              </div>
            </div>

            {/* Button 3: Featured */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Featured Button</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn3-bg" className="text-xs whitespace-nowrap">Background:</Label>
                  <input
                    type="color"
                    id="btn3-bg"
                    value={heroButton3BgColor}
                    onChange={(e) => {
                      setHeroButton3BgColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="btn3-text" className="text-xs whitespace-nowrap">Text:</Label>
                  <input
                    type="color"
                    id="btn3-text"
                    value={heroButton3TextColor}
                    onChange={(e) => {
                      setHeroButton3TextColor(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-4">
            <Label>Background Image</Label>

            {/* Image Preview */}
            {heroBackgroundImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border" style={{ backgroundColor: '#f3f4f6' }}>
                <Image
                  src={heroBackgroundImage}
                  alt="Hero Background Preview"
                  fill
                  className={heroImageFit === 'contain' ? 'object-contain' : 'object-cover'}
                  style={{ objectPosition: heroImageObjectPosition === 'custom' ? customPosition : heroImageObjectPosition }}
                  unoptimized
                />
              </div>
            )}

            {/* Image URL Input */}
            <div className="space-y-2">
              <Label htmlFor="hero-image-url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="hero-image-url"
                  value={heroBackgroundImage}
                  onChange={(e) => {
                    setHeroBackgroundImage(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="https://images.unsplash.com/..."
                />
                <label htmlFor="hero-image-upload">
                  <Button asChild variant="outline" type="button" disabled={isUploading}>
                    <div className="cursor-pointer flex items-center gap-2">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Crop className="h-4 w-4" />
                          <span className="hidden sm:inline">Upload & Crop</span>
                        </>
                      )}
                    </div>
                  </Button>
                  <input
                    id="hero-image-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Image Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-fit">Image Fit Mode</Label>
              <Select
                value={heroImageFit}
                onValueChange={(value: 'cover' | 'contain') => {
                  setHeroImageFit(value);
                  setHasUnsavedChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fit mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (fill & crop)</SelectItem>
                  <SelectItem value="contain">Contain (show full image)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {heroImageFit === 'cover' 
                  ? 'Image fills the entire area, may be cropped' 
                  : 'Full image is visible, may have empty space'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-position">Image Position</Label>
              <Select
                value={heroImageObjectPosition}
                onValueChange={(value) => {
                  setHeroImageObjectPosition(value);
                  setHasUnsavedChanges(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="top left">Top Left</SelectItem>
                  <SelectItem value="top right">Top Right</SelectItem>
                  <SelectItem value="bottom left">Bottom Left</SelectItem>
                  <SelectItem value="bottom right">Bottom Right</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Position Input */}
          {heroImageObjectPosition === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-position">Custom Position (e.g., "50% 30%")</Label>
              <Input
                id="custom-position"
                value={customPosition}
                onChange={(e) => {
                  setCustomPosition(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="50% 30%"
              />
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </form>

      {/* Image Crop Modal */}
      <ImageCropUploadModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setImageToCrop('');
        }}
        imageSrc={imageToCrop}
        onComplete={handleCropComplete}
        title="Crop Hero Image"
        description="Adjust the crop area, zoom, and rotation to fit your hero section perfectly."
        aspectRatios={HERO_ASPECT_RATIOS}
        defaultAspectRatio="16:9"
        isUploading={isUploading}
      />
    </Card>
    </div>
  );
}
