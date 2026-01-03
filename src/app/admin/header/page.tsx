'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings, saveSettings, type Settings } from '@/services/settingsService';
import { Save, Eye, Palette, Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function HeaderSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<Settings>>({
        headerBgColor: '#ffffff',
        headerTextColor: '#000000',
        headerButtonStyle: 'outline',
        headerButtonColor: '#4F46E5',
        homeButtonGradientFrom: '#4F46E5',
        homeButtonGradientTo: '#14B8A6',
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getSettings();
                setSettings({
                    headerBgColor: data.headerBgColor || '#ffffff',
                    headerTextColor: data.headerTextColor || '#000000',
                    headerButtonStyle: data.headerButtonStyle || 'outline',
                    headerButtonColor: data.headerButtonColor || '#4F46E5',
                    homeButtonGradientFrom: data.homeButtonGradientFrom || '#4F46E5',
                    homeButtonGradientTo: data.homeButtonGradientTo || '#14B8A6',
                });
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSettings(settings);
            toast({
                title: 'Settings saved',
                description: 'Header settings have been updated successfully.',
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Header Settings</h1>
                    <p className="text-muted-foreground">Customize your store header styling</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/" target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Site
                        </Link>
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Live Preview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Live Preview
                    </CardTitle>
                    <CardDescription>See how your header will look on the site</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        {/* Header Preview */}
                        <div 
                            className="flex items-center justify-between px-6 py-4"
                            style={{
                                backgroundColor: settings.headerBgColor,
                                color: settings.headerTextColor,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">✓</span>
                                </div>
                                <span className="text-xl font-bold" style={{ color: settings.headerTextColor }}>
                                    JulaZone
                                </span>
                                <button
                                    className="ml-2 px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-1.5"
                                    style={{
                                        background: `linear-gradient(to right, ${settings.homeButtonGradientFrom}, ${settings.homeButtonGradientTo})`,
                                    }}
                                >
                                    <Home className="h-3.5 w-3.5" />
                                    Home
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-medium mr-2">A</span>
                                <PreviewButton 
                                    style={settings.headerButtonStyle!} 
                                    color={settings.headerButtonColor!}
                                    textColor={settings.headerTextColor!}
                                >
                                    <User className="h-4 w-4 mr-1" />
                                    Account
                                </PreviewButton>
                                <PreviewButton 
                                    style={settings.headerButtonStyle!} 
                                    color={settings.headerButtonColor!}
                                    textColor={settings.headerTextColor!}
                                >
                                    <Heart className="h-4 w-4 mr-1" />
                                    Wishlist
                                </PreviewButton>
                                <PreviewButton 
                                    style={settings.headerButtonStyle!} 
                                    color={settings.headerButtonColor!}
                                    textColor={settings.headerTextColor!}
                                >
                                    <ShoppingBag className="h-4 w-4 mr-1" />
                                    Cart
                                </PreviewButton>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Header Style Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Header Styling
                        </CardTitle>
                        <CardDescription>Customize header colors and button styles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="header-bg">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        id="header-bg"
                                        value={settings.headerBgColor}
                                        onChange={(e) => setSettings({ ...settings, headerBgColor: e.target.value })}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={settings.headerBgColor}
                                        onChange={(e) => setSettings({ ...settings, headerBgColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="header-text">Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        id="header-text"
                                        value={settings.headerTextColor}
                                        onChange={(e) => setSettings({ ...settings, headerTextColor: e.target.value })}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={settings.headerTextColor}
                                        onChange={(e) => setSettings({ ...settings, headerTextColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="button-style">Button Style</Label>
                            <Select
                                value={settings.headerButtonStyle}
                                onValueChange={(value: 'outline' | 'solid' | 'ghost') => setSettings({ ...settings, headerButtonStyle: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="outline">Outline</SelectItem>
                                    <SelectItem value="solid">Solid</SelectItem>
                                    <SelectItem value="ghost">Ghost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="button-color">Button Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="button-color"
                                    value={settings.headerButtonColor}
                                    onChange={(e) => setSettings({ ...settings, headerButtonColor: e.target.value })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={settings.headerButtonColor}
                                    onChange={(e) => setSettings({ ...settings, headerButtonColor: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Home Button Gradient</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">From</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.homeButtonGradientFrom}
                                            onChange={(e) => setSettings({ ...settings, homeButtonGradientFrom: e.target.value })}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.homeButtonGradientFrom}
                                            onChange={(e) => setSettings({ ...settings, homeButtonGradientFrom: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">To</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.homeButtonGradientTo}
                                            onChange={(e) => setSettings({ ...settings, homeButtonGradientTo: e.target.value })}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.homeButtonGradientTo}
                                            onChange={(e) => setSettings({ ...settings, homeButtonGradientTo: e.target.value })}
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

function PreviewButton({ 
    children, 
    style, 
    color,
    textColor,
}: { 
    children: React.ReactNode; 
    style: 'outline' | 'solid' | 'ghost';
    color: string;
    textColor: string;
}) {
    const getButtonStyles = () => {
        switch (style) {
            case 'solid':
                return {
                    backgroundColor: color,
                    color: '#ffffff',
                    border: 'none',
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: 'none',
                };
            case 'outline':
            default:
                return {
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: `1px solid ${color}`,
                };
        }
    };

    return (
        <button
            className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center transition-colors"
            style={getButtonStyles()}
        >
            {children}
        </button>
    );
}
