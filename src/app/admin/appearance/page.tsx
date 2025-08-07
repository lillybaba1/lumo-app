"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Upload, X } from 'lucide-react';
import { getTheme, saveTheme } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppearancePage() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [foregroundImage, setForegroundImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTheme().then(theme => {
      setPrimaryColor(theme.primaryColor);
      setAccentColor(theme.accentColor);
      setBackgroundColor(theme.backgroundColor);
      setBackgroundImage(theme.backgroundImage);
      setForegroundImage(theme.foregroundImage);
      setLoading(false);
    });
  }, []);
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSaveChanges = async () => {
    try {
      const themeToSave = {
        primaryColor,
        accentColor,
        backgroundColor,
        backgroundImage,
        foregroundImage,
      };
      await saveTheme(themeToSave);
      toast({
        title: "Appearance Updated",
        description: "Your storefront's appearance has been saved. Note: Image uploads are for preview only and are not saved.",
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to save appearance settings.",
        variant: "destructive"
      });
    }
  };
  
  const handleReset = () => {
    const defaultTheme = {
        primaryColor: "#D0BFFF",
        accentColor: "#FFB3C6",
        backgroundColor: "#E8E2FF",
        backgroundImage: "",
        foregroundImage: "",
    };
    setPrimaryColor(defaultTheme.primaryColor);
    setAccentColor(defaultTheme.accentColor);
    setBackgroundColor(defaultTheme.backgroundColor);
    setBackgroundImage(defaultTheme.backgroundImage);
    setForegroundImage(defaultTheme.foregroundImage);
    saveTheme(defaultTheme).then(() => {
         toast({
          title: "Appearance Reset",
          description: "Your storefront's appearance has been reset to the default.",
        });
    });
  }

  if (loading) {
    return (
       <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-headline font-bold">Appearance</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-10 w-full" /></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-48" /></div>
                    <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-48" /></div>
                 </div>
                 <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                 </div>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Appearance</h1>
      </div>
      <Card>
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
                <Input type="color" id="primary-color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="p-1 h-10 w-14" />
                <Input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex items-center gap-2">
                 <Input type="color" id="accent-color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="p-1 h-10 w-14" />
                 <Input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex items-center gap-2">
                 <Input type="color" id="background-color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="p-1 h-10 w-14" />
                 <Input type="text" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} />
              </div>
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label>Background Image (preview only)</Label>
                <div className="flex items-center gap-4">
                  {backgroundImage ? (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                      <Image src={backgroundImage} alt="Background Preview" layout="fill" objectFit="cover" />
                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => setBackgroundImage('')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                        <span className="text-xs text-muted-foreground">None</span>
                    </div>
                  )}
                   <label htmlFor="background-image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </div>
                        </Button>
                      </div>
                      <input id="background-image-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setBackgroundImage)} />
                    </label>
                </div>
              </div>

             <div className="space-y-2">
                <Label>Foreground Image (preview only)</Label>
                 <div className="flex items-center gap-4">
                  {foregroundImage ? (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                      <Image src={foregroundImage} alt="Foreground Preview" layout="fill" objectFit="cover" />
                       <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => setForegroundImage('')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                     <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
                        <span className="text-xs text-muted-foreground">None</span>
                    </div>
                  )}
                    <label htmlFor="foreground-image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                         <Button asChild variant="outline">
                            <div>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </div>
                        </Button>
                      </div>
                      <input id="foreground-image-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageChange(e, setForegroundImage)} />
                    </label>
                </div>
              </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>Reset to Default</Button>
            <Button onClick={handleSaveChanges}>
              <Paintbrush className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
