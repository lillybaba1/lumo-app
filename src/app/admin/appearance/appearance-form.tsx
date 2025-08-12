
"use client";

import * as React from 'react';
import { useState, ChangeEvent } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Upload, X, Loader2 } from 'lucide-react';
import { saveTheme } from './actions';
import { uploadImageAndGetUrl } from '@/services/storageService';

type Theme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage: string;
  foregroundImage: string;
};

const initialState: { message: string | null, success: boolean } = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Paintbrush className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}


export default function AppearanceForm({ theme }: { theme: Theme }) {
  const { toast } = useToast();
  
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  
  const [backgroundImage, setBackgroundImage] = useState(theme.backgroundImage);
  const [foregroundImage, setForegroundImage] = useState(theme.foregroundImage);
  
  const [isUploading, setIsUploading] = useState(false);

  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const fgInputRef = React.useRef<HTMLInputElement>(null);


  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      
      const formData = new FormData();
      formData.append('primaryColor', primaryColor);
      formData.append('accentColor', accentColor);
      formData.append('backgroundColor', backgroundColor);
      formData.append('backgroundImage', backgroundImage);
      formData.append('foregroundImage', foregroundImage);

      const result = await saveTheme(formData);

      toast({
          title: result.success ? "Appearance Updated" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
      });
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
      } catch (error) {
        toast({ title: 'Upload failed', description: 'Could not upload image.', variant: 'destructive'});
      } finally {
        setIsUploading(false);
      }
    }
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
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
                                Upload Image
                            </div>
                        </Button>
                        <input id="background-image-upload" ref={bgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setBackgroundImage, 'theme/background')} />
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
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
                                Upload Image
                            </div>
                        </Button>
                        <input id="foreground-image-upload" ref={fgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setForegroundImage, 'theme/foreground')} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <SubmitButton />
            </div>
            </CardContent>
        </form>
      </Card>
  );
}
