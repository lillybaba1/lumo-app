"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload, X, Bot, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface ChatbotSettings {
  chatbotImage: string;
  chatbotName: string;
  chatbotEnabled: boolean;
}

export default function ChatbotSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<ChatbotSettings>({
    chatbotImage: '',
    chatbotName: 'Luna',
    chatbotEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({
        chatbotImage: data.chatbotImage || '',
        chatbotName: data.chatbotName || 'Luna',
        chatbotEnabled: data.chatbotEnabled !== false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chatbot');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setSettings(prev => ({ ...prev, chatbotImage: data.url }));

      toast({
        title: 'Image Uploaded',
        description: 'Your chatbot image has been uploaded.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setSettings(prev => ({ ...prev, chatbotImage: '' }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Save failed');
      }

      toast({
        title: 'Settings Saved',
        description: 'Your chatbot settings have been saved.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chatbot Settings</h1>
        <p className="text-muted-foreground">
          Customize your AI assistant&apos;s appearance and behavior
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chatbot Configuration
            </CardTitle>
            <CardDescription>
              Configure how your AI chatbot appears to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chatbotEnabled">Enable Chatbot</Label>
                <p className="text-sm text-muted-foreground">
                  Show the AI assistant on your store
                </p>
              </div>
              <Switch
                id="chatbotEnabled"
                checked={settings.chatbotEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, chatbotEnabled: checked }))
                }
              />
            </div>

            {/* Chatbot Name */}
            <div className="space-y-2">
              <Label htmlFor="chatbotName">Chatbot Name</Label>
              <Input
                id="chatbotName"
                placeholder="Luna"
                value={settings.chatbotName}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, chatbotName: e.target.value }))
                }
              />
              <p className="text-sm text-muted-foreground">
                The name displayed when customers interact with the chatbot
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Chatbot Image</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a custom image for your chatbot button. Recommended: Square image, at least 112x112px
              </p>
              
              {settings.chatbotImage ? (
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                    <Image
                      src={settings.chatbotImage}
                      alt="Chatbot"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted">
                  <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              See how your chatbot will appear to customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-muted to-muted/50 rounded-lg h-[300px] flex items-end justify-end p-4">
              {/* Mock page content */}
              <div className="absolute inset-4 top-4 space-y-2 opacity-30">
                <div className="h-4 bg-foreground/20 rounded w-3/4" />
                <div className="h-4 bg-foreground/20 rounded w-1/2" />
                <div className="h-20 bg-foreground/10 rounded mt-4" />
              </div>

              {/* Chatbot Preview */}
              {settings.chatbotEnabled && (
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-primary shadow-lg flex items-center justify-center overflow-hidden">
                    {settings.chatbotImage ? (
                      <Image
                        src={settings.chatbotImage}
                        alt={settings.chatbotName}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Bot className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  {settings.chatbotImage && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                      <MessageCircle className="h-3 w-3" />
                    </div>
                  )}
                </div>
              )}

              {!settings.chatbotEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Chatbot is disabled</p>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use a friendly, approachable image</li>
                <li>• Square images work best (1:1 ratio)</li>
                <li>• The button can be dragged anywhere on the screen</li>
                <li>• Position is saved per browser/device</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
