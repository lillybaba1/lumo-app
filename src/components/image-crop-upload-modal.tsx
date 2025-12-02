"use client";

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Crop, Maximize2, RotateCcw } from 'lucide-react';

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
  title?: string;
  description?: string;
  aspectRatios?: { label: string; value: string; ratio: number | undefined }[];
  defaultAspectRatio?: string;
  isUploading?: boolean;
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
  title = 'Crop Image',
  description = 'Adjust the crop area, zoom, and rotation to fit your image perfectly.',
  aspectRatios = DEFAULT_ASPECT_RATIOS,
  defaultAspectRatio = 'free',
  isUploading = false,
}: ImageCropUploadModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>(defaultAspectRatio);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyAndUpload = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setIsProcessing(true);

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedFile) {
        onComplete(croppedFile);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        resolve(new File([blob], 'cropped-image.png', { type: 'image/png' }));
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
