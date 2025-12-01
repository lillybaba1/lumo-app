'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Palette, Image as ImageIcon, Blend } from 'lucide-react';
import { Settings } from '@/services/settingsService';
import Image from 'next/image';

interface Props {
  settings: Settings;
}

export default function CategorySectionForm({ settings }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [bgType, setBgType] = useState<'color' | 'image' | 'gradient'>(
    settings.categorySectionBgType || 'color'
  );
  const [bgColor, setBgColor] = useState(settings.categorySectionBgColor || '#f3f4f6');
  const [bgImage, setBgImage] = useState(settings.categorySectionBgImage || '');
  const [gradientFrom, setGradientFrom] = useState(settings.categorySectionBgGradientFrom || '#667eea');
  const [gradientTo, setGradientTo] = useState(settings.categorySectionBgGradientTo || '#764ba2');
  const [gradientDirection, setGradientDirection] = useState(settings.categorySectionBgGradientDirection || 'to right');
  const [textColor, setTextColor] = useState(settings.categorySectionTextColor || '#1f2937');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setBgImage(data.url);

      toast({
        title: 'Image uploaded',
        description: 'Background image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySectionBgType: bgType,
          categorySectionBgColor: bgColor,
          categorySectionBgImage: bgImage,
          categorySectionBgGradientFrom: gradientFrom,
          categorySectionBgGradientTo: gradientTo,
          categorySectionBgGradientDirection: gradientDirection,
          categorySectionTextColor: textColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      toast({
        title: 'Settings saved',
        description: 'Category section appearance updated successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getPreviewStyle = (): React.CSSProperties => {
    switch (bgType) {
      case 'color':
        return { backgroundColor: bgColor };
      case 'image':
        return {
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: bgColor,
        };
      case 'gradient':
        return {
          background: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`,
        };
      default:
        return { backgroundColor: '#f3f4f6' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Category Section Background
        </CardTitle>
        <CardDescription>
          Customize the background of the "Shop by Category" section on your homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Background Type Selection */}
        <div className="space-y-3">
          <Label>Background Type</Label>
          <RadioGroup
            value={bgType}
            onValueChange={(v) => setBgType(v as 'color' | 'image' | 'gradient')}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="color" id="bg-color" className="peer sr-only" />
              <Label
                htmlFor="bg-color"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Palette className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">Solid Color</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="image" id="bg-image" className="peer sr-only" />
              <Label
                htmlFor="bg-image"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <ImageIcon className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">Image</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="gradient" id="bg-gradient" className="peer sr-only" />
              <Label
                htmlFor="bg-gradient"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Blend className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">Gradient</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Color Options */}
        {bgType === 'color' && (
          <div className="space-y-3">
            <Label htmlFor="bgColor">Background Color</Label>
            <div className="flex gap-3">
              <Input
                type="color"
                id="bgColor"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1"
                placeholder="#f3f4f6"
              />
            </div>
          </div>
        )}

        {/* Image Options */}
        {bgType === 'image' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Background Image</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Image
                </Button>
                {bgImage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBgImage('')}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              {bgImage && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={bgImage}
                    alt="Background preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="fallbackColor">Fallback Color (if image fails to load)</Label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  id="fallbackColor"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Gradient Options */}
        {bgType === 'gradient' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="gradientFrom">From Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="gradientFrom"
                    value={gradientFrom}
                    onChange={(e) => setGradientFrom(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={gradientFrom}
                    onChange={(e) => setGradientFrom(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="gradientTo">To Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="gradientTo"
                    value={gradientTo}
                    onChange={(e) => setGradientTo(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={gradientTo}
                    onChange={(e) => setGradientTo(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="gradientDirection">Direction</Label>
              <select
                id="gradientDirection"
                value={gradientDirection}
                onChange={(e) => setGradientDirection(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="to right">Left to Right →</option>
                <option value="to left">Right to Left ←</option>
                <option value="to bottom">Top to Bottom ↓</option>
                <option value="to top">Bottom to Top ↑</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to bottom left">Diagonal ↙</option>
                <option value="to top right">Diagonal ↗</option>
                <option value="to top left">Diagonal ↖</option>
              </select>
            </div>
          </div>
        )}

        {/* Text Color */}
        <div className="space-y-3">
          <Label htmlFor="textColor">Section Title Color</Label>
          <div className="flex gap-3">
            <Input
              type="color"
              id="textColor"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1"
              placeholder="#1f2937"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Preview</Label>
          <div
            className="rounded-lg p-6 border"
            style={getPreviewStyle()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: textColor }}>
                Shop by Category
              </h3>
              <span className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                View All →
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {['Electronics', 'Fashion', 'Home', 'Sports'].map((cat) => (
                <div
                  key={cat}
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                    🛍️
                  </div>
                  <span className="text-xs font-medium text-gray-700">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Category Section Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
