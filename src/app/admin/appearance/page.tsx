"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush } from 'lucide-react';

export default function AppearancePage() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("#D0BFFF");
  const [accentColor, setAccentColor] = useState("#FFB3C6");
  const [backgroundColor, setBackgroundColor] = useState("#E8E2FF");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [foregroundImage, setForegroundImage] = useState("");

  const handleSaveChanges = () => {
    // In a real app, you would save these values to a database or a global state management solution.
    // For this prototype, we'll just show a success message.
    toast({
      title: "Appearance Updated",
      description: "Your storefront's appearance has been saved.",
    });
  };
  
  const handleReset = () => {
    setPrimaryColor("#D0BFFF");
    setAccentColor("#FFB3C6");
    setBackgroundColor("#E8E2FF");
    setBackgroundImage("");
    setForegroundImage("");
     toast({
      title: "Appearance Reset",
      description: "Your storefront's appearance has been reset to the default.",
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="space-y-2">
            <Label htmlFor="background-image">Background Image URL</Label>
            <Input id="background-image" placeholder="https://example.com/your-image.png" value={backgroundImage} onChange={e => setBackgroundImage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="foreground-image">Foreground Image URL</Label>
            <Input id="foreground-image" placeholder="https://example.com/your-image.png" value={foregroundImage} onChange={e => setForegroundImage(e.target.value)} />
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
