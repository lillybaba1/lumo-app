'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Palette,
  Layout,
  Image,
  FileText,
  Share2,
  Bell,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  Eye,
} from 'lucide-react';
import {
  getTheme,
  updateTheme,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAbout,
  updateAbout,
  getSocialLinks,
  updateSocialLinks,
  getAnnouncement,
  updateAnnouncement,
} from './actions';
import { useToast } from '@/hooks/use-toast';

interface Theme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
  layout_style: string;
  products_per_row: number;
  show_sidebar: boolean;
  header_style: string;
  footer_style: string;
  custom_css?: string;
}

interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  link_text?: string;
  position: number;
  is_active: boolean;
}

interface About {
  story_title: string;
  story_content?: string;
  story_image_url?: string;
  mission_statement?: string;
  values: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

interface SocialLink {
  platform: string;
  url: string;
  is_active: boolean;
}

export default function CustomizePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [about, setAbout] = useState<About | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const [themeRes, bannersRes, aboutRes, socialRes, announcementRes] = await Promise.all([
      getTheme(),
      getBanners(),
      getAbout(),
      getSocialLinks(),
      getAnnouncement(),
    ]);

    if (themeRes.success) setTheme(themeRes.data);
    if (bannersRes.success) setBanners(bannersRes.data || []);
    if (aboutRes.success) setAbout(aboutRes.data);
    if (socialRes.success) setSocialLinks(socialRes.data || []);
    if (announcementRes.success) setAnnouncement(announcementRes.data);
    
    setLoading(false);
  }

  async function handleSaveTheme() {
    if (!theme) return;
    setSaving(true);
    const result = await updateTheme(theme);
    if (result.success) {
      toast({ title: 'Theme saved' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  }

  async function handleSaveAbout() {
    if (!about) return;
    setSaving(true);
    const result = await updateAbout(about);
    if (result.success) {
      toast({ title: 'About page saved' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  }

  async function handleSaveSocial() {
    setSaving(true);
    const result = await updateSocialLinks(socialLinks);
    if (result.success) {
      toast({ title: 'Social links saved' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  }

  async function handleAddBanner() {
    const result = await createBanner({
      image_url: '/placeholder-banner.jpg',
      position: banners.length,
    });
    if (result.success) {
      setBanners([...banners, result.data]);
      toast({ title: 'Banner added' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleDeleteBanner(id: string) {
    const result = await deleteBanner(id);
    if (result.success) {
      setBanners(banners.filter(b => b.id !== id));
      toast({ title: 'Banner deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boutique Customization</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your boutique
          </p>
        </div>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>

      <Tabs defaultValue="theme">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="banners">
            <Image className="h-4 w-4 mr-2" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="about">
            <FileText className="h-4 w-4 mr-2" />
            About
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="announcement">
            <Bell className="h-4 w-4 mr-2" />
            Announcement
          </TabsTrigger>
        </TabsList>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>Customize your boutique color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: 'primary_color', label: 'Primary' },
                  { key: 'secondary_color', label: 'Secondary' },
                  { key: 'accent_color', label: 'Accent' },
                  { key: 'background_color', label: 'Background' },
                  { key: 'text_color', label: 'Text' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme?.[key as keyof Theme] as string || '#000000'}
                        onChange={(e) => setTheme({ ...theme!, [key]: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={theme?.[key as keyof Theme] as string || ''}
                        onChange={(e) => setTheme({ ...theme!, [key]: e.target.value })}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>Configure your boutique layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Product Layout</Label>
                  <Select
                    value={theme?.layout_style || 'grid'}
                    onValueChange={(v) => setTheme({ ...theme!, layout_style: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="masonry">Masonry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Products Per Row</Label>
                  <Select
                    value={String(theme?.products_per_row || 4)}
                    onValueChange={(v) => setTheme({ ...theme!, products_per_row: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Header Style</Label>
                  <Select
                    value={theme?.header_style || 'default'}
                    onValueChange={(v) => setTheme({ ...theme!, header_style: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Label>Show Sidebar</Label>
                  <Switch
                    checked={theme?.show_sidebar ?? true}
                    onCheckedChange={(v) => setTheme({ ...theme!, show_sidebar: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveTheme} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Theme
            </Button>
          </div>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Banner Slideshow</CardTitle>
                  <CardDescription>
                    Add banners to showcase on your boutique homepage
                  </CardDescription>
                </div>
                <Button onClick={handleAddBanner}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Image className="h-8 w-8 mb-2" />
                  <p>No banners yet</p>
                  <Button variant="link" onClick={handleAddBanner}>
                    Add your first banner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="cursor-move">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="w-32 h-20 bg-muted rounded overflow-hidden">
                        {banner.image_url && (
                          <img
                            src={banner.image_url}
                            alt={banner.title || `Banner ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Banner title"
                          value={banner.title || ''}
                          onChange={(e) => {
                            const updated = [...banners];
                            updated[index].title = e.target.value;
                            setBanners(updated);
                          }}
                        />
                        <Input
                          placeholder="Subtitle"
                          value={banner.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...banners];
                            updated[index].subtitle = e.target.value;
                            setBanners(updated);
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Link URL"
                            value={banner.link_url || ''}
                            onChange={(e) => {
                              const updated = [...banners];
                              updated[index].link_url = e.target.value;
                              setBanners(updated);
                            }}
                          />
                          <Input
                            placeholder="Button text"
                            value={banner.link_text || ''}
                            onChange={(e) => {
                              const updated = [...banners];
                              updated[index].link_text = e.target.value;
                              setBanners(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(v) => {
                            const updated = [...banners];
                            updated[index].is_active = v;
                            setBanners(updated);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Story</CardTitle>
              <CardDescription>Tell customers about your boutique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Story Title</Label>
                <Input
                  value={about?.story_title || ''}
                  onChange={(e) => setAbout({ ...about!, story_title: e.target.value })}
                  placeholder="Our Story"
                />
              </div>
              <div className="space-y-2">
                <Label>Story Content</Label>
                <Textarea
                  value={about?.story_content || ''}
                  onChange={(e) => setAbout({ ...about!, story_content: e.target.value })}
                  placeholder="Tell your story..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Mission Statement</Label>
                <Textarea
                  value={about?.mission_statement || ''}
                  onChange={(e) => setAbout({ ...about!, mission_statement: e.target.value })}
                  placeholder="Our mission is..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveAbout} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save About Page
            </Button>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['instagram', 'facebook', 'twitter', 'tiktok', 'pinterest', 'youtube'].map((platform) => {
                const link = socialLinks.find(l => l.platform === platform);
                return (
                  <div key={platform} className="flex items-center gap-4">
                    <Label className="w-24 capitalize">{platform}</Label>
                    <Input
                      placeholder={`Your ${platform} URL`}
                      value={link?.url || ''}
                      onChange={(e) => {
                        const updated = [...socialLinks];
                        const idx = updated.findIndex(l => l.platform === platform);
                        if (idx >= 0) {
                          updated[idx].url = e.target.value;
                        } else {
                          updated.push({ platform, url: e.target.value, is_active: true });
                        }
                        setSocialLinks(updated);
                      }}
                      className="flex-1"
                    />
                    <Switch
                      checked={link?.is_active ?? false}
                      onCheckedChange={(v) => {
                        const updated = [...socialLinks];
                        const idx = updated.findIndex(l => l.platform === platform);
                        if (idx >= 0) {
                          updated[idx].is_active = v;
                          setSocialLinks(updated);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSocial} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Social Links
            </Button>
          </div>
        </TabsContent>

        {/* Announcement Tab */}
        <TabsContent value="announcement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
              <CardDescription>
                Display an announcement at the top of your boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Announcement</Label>
                <Switch
                  checked={announcement?.is_active ?? false}
                  onCheckedChange={(v) => setAnnouncement({ ...announcement, is_active: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={announcement?.message || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="Free shipping on orders over $50!"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link URL (optional)</Label>
                  <Input
                    value={announcement?.link_url || ''}
                    onChange={(e) => setAnnouncement({ ...announcement, link_url: e.target.value })}
                    placeholder="/sale"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link Text</Label>
                  <Input
                    value={announcement?.link_text || ''}
                    onChange={(e) => setAnnouncement({ ...announcement, link_text: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={announcement?.background_color || '#1f2937'}
                      onChange={(e) => setAnnouncement({ ...announcement, background_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={announcement?.background_color || '#1f2937'}
                      onChange={(e) => setAnnouncement({ ...announcement, background_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={announcement?.text_color || '#ffffff'}
                      onChange={(e) => setAnnouncement({ ...announcement, text_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={announcement?.text_color || '#ffffff'}
                      onChange={(e) => setAnnouncement({ ...announcement, text_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {announcement?.message && (
                <div className="mt-4">
                  <Label className="mb-2 block">Preview</Label>
                  <div
                    className="p-3 text-center rounded text-sm"
                    style={{
                      backgroundColor: announcement?.background_color || '#1f2937',
                      color: announcement?.text_color || '#ffffff',
                    }}
                  >
                    {announcement.message}
                    {announcement.link_text && (
                      <span className="ml-2 underline cursor-pointer">
                        {announcement.link_text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={async () => {
                setSaving(true);
                const result = await updateAnnouncement(announcement);
                if (result.success) {
                  toast({ title: 'Announcement saved' });
                } else {
                  toast({ title: 'Error', description: result.error, variant: 'destructive' });
                }
                setSaving(false);
              }}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Announcement
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
