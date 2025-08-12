
"use client";

import * as React from 'react';
import { useState, ChangeEvent, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Upload, X, Loader2, CornerDownRight } from 'lucide-react';
import { saveTheme } from './actions';
import { uploadImageAndGetUrl } from '@/services/storageService';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


type Theme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
  foregroundImageScale?: number;
  foregroundImagePositionX?: number;
  foregroundImagePositionY?: number;
};

export default function AppearanceForm({ theme }: { theme: Theme }) {
  const { toast } = useToast();
  
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  
  const [backgroundImage, setBackgroundImage] = useState(theme.backgroundImage);
  const [foregroundImage, setForegroundImage] = useState(theme.foregroundImage);

  const [fgScale, setFgScale] = useState(theme.foregroundImageScale ?? 100);
  const [fgPosX, setFgPosX] = useState(theme.foregroundImagePositionX ?? 50);
  const [fgPosY, setFgPosY] = useState(theme.foregroundImagePositionY ?? 50);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const fgInputRef = React.useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
      isDragging: false,
      isResizing: false,
      startX: 0,
      startY: 0,
      startPosX: 0,
      startPosY: 0,
      startScale: 0,
      previewWidth: 0,
      previewHeight: 0
  });


  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('primaryColor', primaryColor);
      formData.append('accentColor', accentColor);
      formData.append('backgroundColor', backgroundColor);
      formData.append('backgroundImage', backgroundImage);
      formData.append('foregroundImage', foregroundImage);
      formData.append('foregroundImageScale', String(fgScale));
      formData.append('foregroundImagePositionX', String(fgPosX));
      formData.append('foregroundImagePositionY', String(fgPosY));

      const result = await saveTheme(formData);

      toast({
          title: result.success ? "Appearance Updated" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });
      setIsSaving(false);
  }


  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, imageSetter: (url: string) => void, path: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive"
        });
        return;
      }
      setIsUploading(true);
      try {
        const url = await uploadImageAndGetUrl(file, path);
        imageSetter(url);
        toast({ title: 'Upload successful', description: 'Image has been uploaded.'});
      } catch (error: any) {
        toast({ 
          title: 'Upload failed', 
          description: error.message || 'Could not upload image.', 
          variant: 'destructive'
        });
      } finally {
        setIsUploading(false);
      }
    }
  };
  
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current) return;
        e.preventDefault();
        const previewRect = previewRef.current.getBoundingClientRect();
        dragStateRef.current = {
            isDragging: true,
            isResizing: false,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: fgPosX,
            startPosY: fgPosY,
            startScale: fgScale,
            previewWidth: previewRect.width,
            previewHeight: previewRect.height
        };
    };

    const handleResizeStart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        if (!previewRef.current) return;
        const previewRect = previewRef.current.getBoundingClientRect();
        dragStateRef.current = {
            isDragging: false,
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startPosX: fgPosX,
            startPosY: fgPosY,
            startScale: fgScale,
            previewWidth: previewRect.width,
            previewHeight: previewRect.height
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging && !state.isResizing) return;
        e.preventDefault();

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;

        if (state.isDragging) {
            const newPosX = state.startPosX + (dx / state.previewWidth) * 100;
            const newPosY = state.startPosY + (dy / state.previewHeight) * 100;
            setFgPosX(Math.max(0, Math.min(100, newPosX)));
            setFgPosY(Math.max(0, Math.min(100, newPosY)));
        }

        if (state.isResizing) {
            const newScale = state.startScale + (dx / state.previewWidth) * 100;
            setFgScale(Math.max(10, Math.min(300, newScale)));
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        dragStateRef.current.isDragging = false;
        dragStateRef.current.isResizing = false;
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
        const onMouseUp = () => handleMouseUp();
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


  const foregroundPreviewStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${fgPosX}%`,
      top: `${fgPosY}%`,
      width: `${fgScale}%`,
      transform: 'translate(-50%, -50%)',
  };


  return (
      <Card>
        <form onSubmit={handleFormSubmit}>
            <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
            <CardDescription>
                Personalize the look and feel of your storefront.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                    <Input type="color" id="primary-color-picker" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="p-1 h-10 w-14" />
                    <Input type="text" id="primary-color" name="primaryColor" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex items-center gap-2">
                    <Input type="color" id="accent-color-picker" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="p-1 h-10 w-14" />
                    <Input type="text" id="accent-color" name="accentColor" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-2">
                    <Input type="color" id="background-color-picker" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="p-1 h-10 w-14" />
                    <Input type="text" id="background-color" name="backgroundColor" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
                </div>
                </div>
            </div>

            <Separator className="my-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    <Label>Background Image</Label>
                    <div className="flex items-center gap-4">
                    {backgroundImage ? (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={backgroundImage} alt="Background Preview" fill className="object-cover" unoptimized/>
                        <Button variant="ghost" size="icon" type="button" className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white" onClick={() => { setBackgroundImage(''); if (bgInputRef.current) bgInputRef.current.value = ''; }}>
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50" data-ai-hint="empty state background">
                            {isUploading ? <Loader2 className="animate-spin"/> : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                    )}
                    <label htmlFor="background-image-upload" className="cursor-pointer">
                        <Button asChild variant="outline" type="button" disabled={isUploading}>
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </div>
                        </Button>
                        <input id="background-image-upload" ref={bgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setBackgroundImage, 'theme/background')} />
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Foreground Image</Label>
                    <div className="flex items-center gap-4">
                    {foregroundImage ? (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={foregroundImage} alt="Foreground Preview" fill className="object-cover" unoptimized/>
                        <Button variant="ghost" size="icon" type="button" className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white" onClick={() => { setForegroundImage(''); if (fgInputRef.current) fgInputRef.current.value = ''; }}>
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50" data-ai-hint="empty state foreground">
                           {isUploading ? <Loader2 className="animate-spin"/> : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                    )}
                        <label htmlFor="foreground-image-upload" className="cursor-pointer">
                        <Button asChild variant="outline" type="button" disabled={isUploading}>
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </div>
                        </Button>
                        <input id="foreground-image-upload" ref={fgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setForegroundImage, 'theme/foreground')} />
                        </label>
                    </div>
                </div>

                 <div className="space-y-4 md:col-span-2">
                    <Label>Live Preview</Label>
                    <div ref={previewRef} className="relative w-full h-80 rounded-lg overflow-hidden border bg-muted/30 select-none">
                        {backgroundImage && <Image src={backgroundImage} alt="Background" layout="fill" objectFit="cover" unoptimized />}
                         <div className="absolute inset-0 bg-black/30"></div>
                        {foregroundImage && (
                             <div 
                                style={foregroundPreviewStyle}
                                className={cn('absolute group', dragStateRef.current.isDragging || dragStateRef.current.isResizing ? 'cursor-grabbing' : 'cursor-grab')}
                                onMouseDown={handleDragStart}
                            >
                                <div className="relative w-full h-full" style={{ paddingBottom: '100%' }}>
                                    <Image src={foregroundImage} alt="Foreground" layout="fill" objectFit="contain" unoptimized className="pointer-events-none" />
                                </div>
                                <button
                                    type="button"
                                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full cursor-nwse-resize text-primary-foreground flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
                                    onMouseDown={handleResizeStart}
                                >
                                    <CornerDownRight className="w-3 h-3" />
                                </button>
                             </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-white p-4 bg-black/20 rounded-lg">
                                <h3 className="font-headline text-2xl">Hero Title</h3>
                                <p className="text-sm">Hero description text.</p>
                            </div>
                        </div>
                    </div>
                 </div>

            </div>


            <div className="flex justify-end gap-2 mt-8">
                <Button type="submit" disabled={isSaving || isUploading}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Paintbrush className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
            </CardContent>
        </form>
      </Card>
  );
}
