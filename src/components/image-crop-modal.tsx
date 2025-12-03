"use client";

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Crop, Maximize2, ZoomIn, ZoomOut, Image as ImageIcon, RotateCcw } from 'lucide-react';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (cropData: CropData) => void;
  onUseOriginal?: () => void; // New: callback for using original image
  initialCrop?: CropData;
  allowOriginal?: boolean; // New: show "Use Original" button
}

const ASPECT_RATIOS = [
  { label: 'Free', value: 'free', ratio: undefined },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '3:4', value: '3:4', ratio: 3 / 4 },
  { label: '9:16', value: '9:16', ratio: 9 / 16 },
];

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  onUseOriginal,
  initialCrop,
  allowOriginal = true,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropData | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('free');
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

  const onCropCompleteInternal = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
      onClose();
    }
  };

  const handleUseOriginal = () => {
    if (onUseOriginal) {
      onUseOriginal();
      onClose();
    } else if (imageSize) {
      // Return full image dimensions if no callback provided
      onCropComplete({
        x: 0,
        y: 0,
        width: imageSize.width,
        height: imageSize.height,
      });
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, zoom, and rotation to fit your image perfectly.
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
              {ASPECT_RATIOS.map((ar) => (
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
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={ASPECT_RATIOS.find(ar => ar.value === aspectRatio)?.ratio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteInternal}
              showGrid={true}
              minZoom={0.3}
              maxZoom={3}
              objectFit="contain"
              style={{
                containerStyle: {
                  borderRadius: '0.5rem',
                },
              }}
            />
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
                Tip: Zoom out (below 1x) to fit the entire image in view
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {allowOriginal && (
            <Button 
              variant="secondary" 
              onClick={handleUseOriginal}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Use Original (No Crop)
            </Button>
          )}
          <Button onClick={handleSave}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
