"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { getHeroSettings, updateHeroSettings } from './actions';
import { uploadImageAndGetUrl } from '@/services/storageService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HeroSettingsForm() {
  const { toast } = useToast();

  const [heroHeading, setHeroHeading] = useState('');
  const [heroTagline, setHeroTagline] = useState('');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('');
  const [heroImageObjectPosition, setHeroImageObjectPosition] = useState('center');
  const [customPosition, setCustomPosition] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load initial settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getHeroSettings();
        setHeroHeading(settings.heroHeading);
        setHeroTagline(settings.heroTagline);
        setHeroBackgroundImage(settings.heroBackgroundImage);
        setHeroImageObjectPosition(settings.heroImageObjectPosition);

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

    setIsUploading(true);
    try {
      const url = await uploadImageAndGetUrl(file, 'hero');
      setHeroBackgroundImage(url);
      setHasUnsavedChanges(true);
      toast({
        title: 'Upload successful',
        description: 'Hero image uploaded. Click "Save Changes" to apply.',
        variant: 'default'
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
            <Input
              id="hero-heading"
              value={heroHeading}
              onChange={(e) => {
                setHeroHeading(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Step into Lumo"
            />
          </div>

          {/* Hero Tagline */}
          <div className="space-y-2">
            <Label htmlFor="hero-tagline">Hero Tagline</Label>
            <Textarea
              id="hero-tagline"
              value={heroTagline}
              onChange={(e) => {
                setHeroTagline(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Discover exceptional products crafted with care..."
              rows={3}
            />
          </div>

          {/* Background Image */}
          <div className="space-y-4">
            <Label>Background Image</Label>

            {/* Image Preview */}
            {heroBackgroundImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={heroBackgroundImage}
                  alt="Hero Background Preview"
                  fill
                  className="object-cover"
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
                    <div className="cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                  <input
                    id="hero-image-upload"
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
    </Card>
  );
}
