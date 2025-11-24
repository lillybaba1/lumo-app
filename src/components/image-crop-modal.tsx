"use client";

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Crop, Maximize2 } from 'lucide-react';

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
  initialCrop?: CropData;
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
  initialCrop,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropData | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('free');

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
              style={{
                containerStyle: {
                  borderRadius: '0.5rem',
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
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
              <Slider
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
