"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { LogoSettings, saveLogoSettings } from './actions';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LogoForm({ initialSettings }: { initialSettings: LogoSettings }) {
  const { toast } = useToast();
  
  // Form state
  const [settings, setSettings] = useState<LogoSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveLogoSettings(settings);
      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Your branding settings have been updated.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Logo & Favicon</AlertTitle>
        <AlertDescription>
          The site logo and favicon are now served from <code className="bg-muted px-1 rounded">/icon.svg</code> for instant loading. 
          To change the logo, replace the <code className="bg-muted px-1 rounded">src/app/icon.svg</code> file in the codebase.
        </AlertDescription>
      </Alert>

      {/* Current Logo Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <CardTitle>Current Logo</CardTitle>
          </div>
          <CardDescription>
            This is the logo displayed in the header and as the browser favicon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {/* Logo Preview */}
            <div className="p-4 bg-muted rounded-lg border">
              <Image
                src="/icon.svg"
                alt="Site Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            
            {/* Favicon Preview */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Favicon Preview</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                <Image
                  src="/icon.svg"
                  alt="Favicon"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className="text-white text-sm">JulaZone</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Branding Settings</CardTitle>
          <CardDescription>
            Configure accessibility and SEO settings for your logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoAlt">Logo Alt Text</Label>
              <Input
                id="logoAlt"
                value={settings.logoAlt || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, logoAlt: e.target.value }))}
                placeholder="JulaZone - Africa Marketplace"
              />
              <p className="text-xs text-muted-foreground">
                Describes the logo for accessibility and SEO
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoWidth">Display Width (px)</Label>
              <Input
                id="logoWidth"
                type="number"
                value={settings.logoWidth || 40}
                onChange={(e) => setSettings(prev => ({ ...prev, logoWidth: parseInt(e.target.value) || 40 }))}
                min={20}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Width of the logo in the header (20-100px)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
