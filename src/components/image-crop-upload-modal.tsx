"use client";

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Crop, Maximize2, RotateCcw, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onComplete: (croppedFile: File) => void;
  onUseOriginal?: (originalFile: File) => void; // New: callback for using original image
  originalFile?: File; // New: the original file for "Use Original" option
  title?: string;
  description?: string;
  aspectRatios?: { label: string; value: string; ratio: number | undefined }[];
  defaultAspectRatio?: string;
  isUploading?: boolean;
  allowOriginal?: boolean; // New: show "Use Original" button
  quality?: number; // New: JPEG quality (0-1), default 0.95
}

const DEFAULT_ASPECT_RATIOS = [
  { label: 'Free', value: 'free', ratio: undefined },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '3:1', value: '3:1', ratio: 3 / 1 },
  { label: '2:1', value: '2:1', ratio: 2 / 1 },
  { label: '1:1', value: '1:1', ratio: 1 },
];

export default function ImageCropUploadModal({
  isOpen,
  onClose,
  imageSrc,
  onComplete,
  onUseOriginal,
  originalFile,
  title = 'Crop Image',
  description = 'Adjust the crop area, zoom, and rotation to fit your image perfectly.',
  aspectRatios = DEFAULT_ASPECT_RATIOS,
  defaultAspectRatio = 'free',
  isUploading = false,
  allowOriginal = true,
  quality = 0.95,
}: ImageCropUploadModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>(defaultAspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Get image dimensions when image changes
  useEffect(() => {
    if (imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Zoom control functions
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.3));
  const resetZoom = () => setZoom(1);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyAndUpload = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setIsProcessing(true);

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, quality);
      if (croppedFile) {
        onComplete(croppedFile);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseOriginal = () => {
    if (originalFile && onUseOriginal) {
      onUseOriginal(originalFile);
      resetState();
      onClose();
    } else if (originalFile) {
      // Use the onComplete callback with original file
      onComplete(originalFile);
      resetState();
      onClose();
    }
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setAspectRatio(defaultAspectRatio);
  };

  const isLoading = isUploading || isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
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
              {aspectRatios.map((ar) => (
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
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatios.find(ar => ar.value === aspectRatio)?.ratio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                showGrid={true}
                minZoom={0.3}
                maxZoom={3}
                style={{
                  containerStyle: { borderRadius: '0.5rem' },
                }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Controls */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {zoom.toFixed(1)}x
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomOut}
                  disabled={zoom <= 0.3}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={zoomIn}
                  disabled={zoom >= 3}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetZoom}
                  title="Reset Zoom"
                >
                  Reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Zoom out (below 1x) to see the entire image and avoid cutting
              </p>
            </div>

            {/* Rotation Controls */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Rotation: {rotation}°
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRotation(0)}
                  title="Reset Rotation"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleApplyAndUpload} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              <>
                <Crop className="h-4 w-4 mr-2" />
                Apply & Upload
              </>
            )}
          </Button>
          {allowOriginal && originalFile && (
            <Button 
              variant="secondary" 
              onClick={handleUseOriginal}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Use Original (No Crop)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to create cropped image with high quality
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0,
  quality = 0.95
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

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

  // Convert to blob/file with high quality JPEG (better for photos)
  // Use PNG for images that might have transparency
  return new Promise((resolve) => {
    // First try JPEG for better quality with photos
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' }));
      } else {
        // Fallback to PNG if JPEG fails
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(new File([pngBlob], 'cropped-image.png', { type: 'image/png' }));
          } else {
            resolve(null);
          }
        }, 'image/png');
      }
    }, 'image/jpeg', quality);
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
