"use client";

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Crop, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

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
  onUseOriginal?: () => void;
  initialCrop?: CropData;
  allowOriginal?: boolean;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: 'free', ratio: undefined },
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '3:4', value: '3:4', ratio: 3 / 4 },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
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
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  // Reset state whenever a new image is loaded
  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspectRatio('1:1');
    }
  }, [imageSrc]);

  const onCropCompleteInternal = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
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

  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crop className="h-4 w-4" />
            Crop Image
          </DialogTitle>
        </DialogHeader>

        {/* Aspect ratio pills */}
        <div className="flex items-center gap-1.5 px-4 pb-2">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              type="button"
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                aspectRatio === ar.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
              onClick={() => setAspectRatio(ar.value)}
            >
              {ar.label}
            </button>
          ))}
        </div>

        {/* Crop area — tall, dark, touch-friendly */}
        <div className="relative w-full bg-black" style={{ height: 'min(60vh, 500px)' }}>
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
            minZoom={1}
            maxZoom={5}
            objectFit="cover"
            restrictPosition={true}
          />
        </div>

        {/* Compact controls bar */}
        <div className="px-4 py-3 space-y-2 border-t">
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              min={1}
              max={5}
              step={0.05}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Button
              type="button" variant="ghost" size="icon"
              onClick={handleRotate90}
              title="Rotate 90°"
              className="h-8 w-8 flex-shrink-0"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="px-4 pb-4 pt-0 gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
