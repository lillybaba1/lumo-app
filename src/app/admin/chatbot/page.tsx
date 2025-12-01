"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Upload, X, Bot, MessageCircle, Palette, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface ChatbotSettings {
  chatbotImage: string;
  chatbotName: string;
  chatbotEnabled: boolean;
  chatbotGlowColor: string;
  chatbotBubbleGradientFrom: string;
  chatbotBubbleGradientTo: string;
  chatbotLabelBgColor: string;
  chatbotLabelTextColor: string;
  chatbotPulseEnabled: boolean;
}

const defaultSettings: ChatbotSettings = {
  chatbotImage: '',
  chatbotName: 'Luna',
  chatbotEnabled: true,
  chatbotGlowColor: '#8b5cf6',
  chatbotBubbleGradientFrom: '#8b5cf6',
  chatbotBubbleGradientTo: '#ec4899',
  chatbotLabelBgColor: '#ffffff',
  chatbotLabelTextColor: '#8b5cf6',
  chatbotPulseEnabled: true,
};

export default function ChatbotSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);

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
        chatbotGlowColor: data.chatbotGlowColor || '#8b5cf6',
        chatbotBubbleGradientFrom: data.chatbotBubbleGradientFrom || '#8b5cf6',
        chatbotBubbleGradientTo: data.chatbotBubbleGradientTo || '#ec4899',
        chatbotLabelBgColor: data.chatbotLabelBgColor || '#ffffff',
        chatbotLabelTextColor: data.chatbotLabelTextColor || '#8b5cf6',
        chatbotPulseEnabled: data.chatbotPulseEnabled !== false,
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

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

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

      if (!res.ok) throw new Error('Upload failed');

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
      if (fileInputRef.current) fileInputRef.current.value = '';
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

      if (!res.ok) throw new Error('Save failed');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Settings</h1>
          <p className="text-muted-foreground">
            Customize your AI assistant&apos;s appearance and behavior
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            See how your chatbot button will appear to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg h-[200px] flex items-end justify-end p-6">
            {/* Mock page content */}
            <div className="absolute inset-6 top-6 space-y-2 opacity-20">
              <div className="h-4 bg-foreground/30 rounded w-3/4" />
              <div className="h-4 bg-foreground/30 rounded w-1/2" />
              <div className="h-16 bg-foreground/20 rounded mt-4" />
            </div>

            {/* Chatbot Preview */}
            {settings.chatbotEnabled ? (
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center overflow-visible relative"
                  style={{
                    backgroundColor: settings.chatbotImage ? 'transparent' : settings.chatbotGlowColor,
                    border: settings.chatbotImage ? `2px solid ${settings.chatbotGlowColor}` : 'none',
                    boxShadow: `0 0 20px ${settings.chatbotGlowColor}66, 0 4px 12px rgba(0, 0, 0, 0.15)`,
                    ...(settings.chatbotImage ? { 
                      outline: `4px solid ${settings.chatbotGlowColor}4D`
                    } : {})
                  }}
                >
                  {settings.chatbotImage ? (
                    <Image
                      src={settings.chatbotImage}
                      alt={settings.chatbotName}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <Bot className="h-6 w-6 text-white" />
                  )}
                  
                  {/* Chat bubble indicator */}
                  <div 
                    className={`absolute -top-1 -right-1 rounded-full p-1.5 shadow-lg ${settings.chatbotPulseEnabled ? 'animate-pulse' : ''}`}
                    style={{
                      background: `linear-gradient(to bottom right, ${settings.chatbotBubbleGradientFrom}, ${settings.chatbotBubbleGradientTo})`
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                
                {/* Chat label */}
                <span 
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm"
                  style={{
                    backgroundColor: settings.chatbotLabelBgColor,
                    color: settings.chatbotLabelTextColor,
                  }}
                >
                  Chat
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Chatbot is disabled</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Basic Settings
            </CardTitle>
            <CardDescription>
              Configure chatbot name and image
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
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Chatbot Image</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Square image, at least 112x112px recommended
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
          </CardContent>
        </Card>

        {/* Style Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Style & Animation
            </CardTitle>
            <CardDescription>
              Customize colors and effects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pulse Animation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chatbotPulse" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Pulse Animation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Animate the chat bubble icon
                </p>
              </div>
              <Switch
                id="chatbotPulse"
                checked={settings.chatbotPulseEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, chatbotPulseEnabled: checked }))
                }
              />
            </div>

            {/* Glow Color */}
            <div className="space-y-2">
              <Label>Glow Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.chatbotGlowColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, chatbotGlowColor: e.target.value }))}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.chatbotGlowColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, chatbotGlowColor: e.target.value }))}
                  className="flex-1"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>

            {/* Bubble Gradient */}
            <div className="space-y-2">
              <Label>Chat Bubble Gradient</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.chatbotBubbleGradientFrom}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotBubbleGradientFrom: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.chatbotBubbleGradientFrom}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotBubbleGradientFrom: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.chatbotBubbleGradientTo}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotBubbleGradientTo: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.chatbotBubbleGradientTo}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotBubbleGradientTo: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Label Colors */}
            <div className="space-y-2">
              <Label>Chat Label Colors</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.chatbotLabelBgColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotLabelBgColor: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.chatbotLabelBgColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotLabelBgColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Text</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.chatbotLabelTextColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotLabelTextColor: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.chatbotLabelTextColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, chatbotLabelTextColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
