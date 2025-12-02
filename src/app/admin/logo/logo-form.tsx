"use client";

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Crop, 
  RotateCcw,
  Maximize2,
  Eye,
  Download
} from 'lucide-react';
import { LogoSettings, saveLogoSettings, uploadLogo, deleteLogo } from './actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: 'free', ratio: undefined },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '3:1', value: '3:1', ratio: 3 / 1 },
  { label: '2:1', value: '2:1', ratio: 2 / 1 },
  { label: '1:1', value: '1:1', ratio: 1 },
];

const FAVICON_ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', ratio: 1 }, // Favicons should be square
];

export default function LogoForm({ initialSettings }: { initialSettings: LogoSettings }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [settings, setSettings] = useState<LogoSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [currentUploadType, setCurrentUploadType] = useState<'logo' | 'favicon'>('logo');
  
  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Open crop modal for both logo and favicon
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCurrentUploadType(type);
      // Set default aspect ratio based on type
      setAspectRatio(type === 'favicon' ? '1:1' : 'free');
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const result = await uploadLogo(formData);
      
      if (result.success && result.url) {
        setSettings(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: result.url,
        }));
        
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels) return;
    
    // Save crop data (only for logo)
    if (currentUploadType === 'logo') {
      setSettings(prev => ({
        ...prev,
        logoCropX: croppedAreaPixels.x,
        logoCropY: croppedAreaPixels.y,
        logoCropWidth: croppedAreaPixels.width,
        logoCropHeight: croppedAreaPixels.height,
      }));
    }
    
    // Create cropped image and upload
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      if (croppedImage) {
        await handleUpload(croppedImage, currentUploadType);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: 'Error',
        description: 'Failed to crop image',
        variant: 'destructive',
      });
    }
    
    setCropModalOpen(false);
    resetCropState();
  };

  const resetCropState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectRatio('free');
    setCroppedAreaPixels(null);
    setImageToCrop('');
  };

  const handleDelete = async (type: 'logo' | 'favicon') => {
    if (!confirm(`Are you sure you want to delete the ${type}?`)) return;
    
    const result = await deleteLogo(type);
    
    if (result.success) {
      setSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logoUrl' : 'faviconUrl']: '',
      }));
      toast({
        title: 'Deleted',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const result = await saveLogoSettings(settings);
      
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <CardTitle>Store Logo</CardTitle>
          </div>
          <CardDescription>
            Upload your store logo. You can crop and adjust the image after uploading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Logo Preview */}
          {settings.logoUrl && (
            <div className="space-y-4">
              <Label>Current Logo</Label>
              <div className="relative inline-block p-4 bg-muted rounded-lg border-2 border-dashed">
                <Image
                  src={settings.logoUrl}
                  alt={settings.logoAlt || 'Store Logo'}
                  width={settings.logoWidth || 200}
                  height={settings.logoHeight || 60}
                  className="object-contain"
                  style={{ maxHeight: '120px', width: 'auto' }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete('logo')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!settings.logoUrl && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Upload Logo</p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, WebP or SVG (max 5MB)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 400x120 pixels with transparent background
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'logo')}
          />

          {/* Logo Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="logoAlt">Logo Alt Text</Label>
              <Input
                id="logoAlt"
                value={settings.logoAlt || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, logoAlt: e.target.value }))}
                placeholder="Africa Marketplace - Premium Goods"
              />
              <p className="text-xs text-muted-foreground">
                Describes the logo for accessibility and SEO
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoWidth">Display Width (px)</Label>
              <Input
                id="logoWidth"
                type="number"
                value={settings.logoWidth || 200}
                onChange={(e) => setSettings(prev => ({ ...prev, logoWidth: parseInt(e.target.value) || 200 }))}
                min={50}
                max={500}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Upload Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle>Favicon</CardTitle>
          </div>
          <CardDescription>
            Upload a favicon for browser tabs. Should be square, ideally 32x32 or 64x64 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.faviconUrl ? (
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded border">
                <Image
                  src={settings.faviconUrl}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Replace & Crop
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete('favicon')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => faviconInputRef.current?.click()}
            >
              <Crop className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Upload & Crop Favicon</p>
              <p className="text-xs text-muted-foreground">
                ICO, PNG, or SVG (32x32 recommended)
              </p>
            </div>
          )}

          <input
            ref={faviconInputRef}
            type="file"
            accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'favicon')}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploading}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              {currentUploadType === 'favicon' ? 'Crop Favicon' : 'Crop Logo'}
            </DialogTitle>
            <DialogDescription>
              {currentUploadType === 'favicon' 
                ? 'Adjust the crop area to create a square favicon. Favicons should be 1:1 ratio.'
                : 'Adjust the crop area, zoom, and rotation to fit your logo perfectly.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Aspect Ratio Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                Aspect Ratio
              </Label>
              <div className="flex flex-wrap gap-2">
                {(currentUploadType === 'favicon' ? FAVICON_ASPECT_RATIOS : ASPECT_RATIOS).map((ar) => (
                  <Button
                    key={ar.value}
                    type="button"
                    variant={aspectRatio === ar.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio(ar.value)}
                  >
                    {ar.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Crop Area */}
            <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={(currentUploadType === 'favicon' ? FAVICON_ASPECT_RATIOS : ASPECT_RATIOS).find(ar => ar.value === aspectRatio)?.ratio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  style={{
                    containerStyle: { borderRadius: '0.5rem' },
                  }}
                />
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zoom: {zoom.toFixed(1)}x</Label>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Rotation: {rotation}°</Label>
                <div className="flex gap-2">
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRotation(0)}
                    title="Reset rotation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropModalOpen(false); resetCropState(); }}>
              Cancel
            </Button>
            <Button onClick={handleCropSave} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Crop className="h-4 w-4 mr-2" />
                  Apply & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logo Preview</DialogTitle>
            <DialogDescription>
              Preview how your logo will appear on the site
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Light Background */}
            <div className="space-y-2">
              <Label>On Light Background</Label>
              <div className="bg-white p-8 rounded-lg border flex items-center justify-center">
                {settings.logoUrl && (
                  <Image
                    src={settings.logoUrl}
                    alt={settings.logoAlt || 'Store Logo'}
                    width={settings.logoWidth || 200}
                    height={settings.logoHeight || 60}
                    className="object-contain"
                  />
                )}
              </div>
            </div>
            
            {/* Dark Background */}
            <div className="space-y-2">
              <Label>On Dark Background</Label>
              <div className="bg-gray-900 p-8 rounded-lg flex items-center justify-center">
                {settings.logoUrl && (
                  <Image
                    src={settings.logoUrl}
                    alt={settings.logoAlt || 'Store Logo'}
                    width={settings.logoWidth || 200}
                    height={settings.logoHeight || 60}
                    className="object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to create cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Set canvas to final cropped size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste cropped image data
  ctx.putImageData(data, 0, 0);

  // Convert to blob/file
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'cropped-logo.png', { type: 'image/png' }));
      } else {
        resolve(null);
      }
    }, 'image/png');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
