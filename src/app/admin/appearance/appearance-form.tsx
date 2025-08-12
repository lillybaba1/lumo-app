
"use client";

import * as React from 'react';
import { useState, useActionState, useEffect, ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Upload, X, Loader2 } from 'lucide-react';
import { saveTheme } from './actions';

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
  const [state, formAction] = useActionState(saveTheme, initialState);

  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [fgPreview, setFgPreview] = useState<string | null>(null);
  
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState(theme.backgroundImage);
  const [currentForegroundImage, setCurrentForegroundImage] = useState(theme.foregroundImage);

  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const fgInputRef = React.useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Appearance Updated" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
    }
  }, [state, toast]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>, previewSetter: (value: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 2MB.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        previewSetter(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const displayBackgroundImage = bgPreview ?? currentBackgroundImage;
  const displayForegroundImage = fgPreview ?? currentForegroundImage;

  return (
      <Card>
        <form action={formAction}>
            <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
            <CardDescription>
                Personalize the look and feel of your storefront.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <input type="hidden" name="currentBackgroundImage" value={currentBackgroundImage} />
                <input type="hidden" name="currentForegroundImage" value={currentForegroundImage} />

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
                    {displayBackgroundImage ? (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={displayBackgroundImage} alt="Background Preview" fill className="object-cover" unoptimized/>
                        <Button variant="ghost" size="icon" type="button" className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white" onClick={() => { setCurrentBackgroundImage(''); setBgPreview(null); if (bgInputRef.current) bgInputRef.current.value = ''; }}>
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50" data-ai-hint="empty state">
                            <span className="text-xs text-muted-foreground">None</span>
                        </div>
                    )}
                    <label htmlFor="background-image-upload" className="cursor-pointer">
                        <Button asChild variant="outline" type="button">
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </div>
                        </Button>
                        <input id="background-image-upload" name="backgroundImage" ref={bgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setBgPreview)} />
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Foreground Image</Label>
                    <div className="flex items-center gap-4">
                    {displayForegroundImage ? (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={displayForegroundImage} alt="Foreground Preview" fill className="object-cover" unoptimized/>
                        <Button variant="ghost" size="icon" type="button" className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/70 text-white" onClick={() => { setCurrentForegroundImage(''); setFgPreview(null); if (fgInputRef.current) fgInputRef.current.value = ''; }}>
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50" data-ai-hint="empty state">
                            <span className="text-xs text-muted-foreground">None</span>
                        </div>
                    )}
                        <label htmlFor="foreground-image-upload" className="cursor-pointer">
                        <Button asChild variant="outline" type="button">
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </div>
                        </Button>
                        <input id="foreground-image-upload" name="foregroundImage" ref={fgInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setFgPreview)} />
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
