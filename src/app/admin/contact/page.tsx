"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Mail, Phone, MapPin, Share2 } from 'lucide-react';
import { getContactData, saveContactData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContactData } from '@/lib/types';

export default function ContactAdminPage() {
  const { toast } = useToast();
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getContactData();
      setContactData(data || {
        title: 'Contact Us',
        introText: '',
        email: '',
        phone: '',
        address: '',
        socialLinks: {}
      });
    } catch (error) {
      console.error('Failed to load contact data:', error);
      setContactData({
        title: 'Contact Us',
        introText: '',
        email: '',
        phone: '',
        address: '',
        socialLinks: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contactData) return;
    setIsSaving(true);
    try {
      await saveContactData(contactData);
      toast({
        title: "Contact Page Updated",
        description: "Your contact information has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact data.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold">Manage Contact Page</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Contact Page</h1>
          <p className="text-muted-foreground mt-1">
            Update your contact information and social media links
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>Configure the title and introduction for your contact page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={contactData?.title || ''}
                onChange={(e) => setContactData(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Contact Us"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intro">Introduction Text (Optional)</Label>
              <Textarea
                id="intro"
                value={contactData?.introText || ''}
                onChange={(e) => setContactData(prev => prev ? { ...prev, introText: e.target.value } : null)}
                placeholder="We'd love to hear from you! Get in touch with us using the information below."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Provide your business contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={contactData?.email || ''}
                onChange={(e) => setContactData(prev => prev ? { ...prev, email: e.target.value } : null)}
                placeholder="support@lumo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={contactData?.phone || ''}
                onChange={(e) => setContactData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <Textarea
                id="address"
                value={contactData?.address || ''}
                onChange={(e) => setContactData(prev => prev ? { ...prev, address: e.target.value } : null)}
                placeholder="123 Main Street, City, State 12345"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>Add links to your social media profiles (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                type="url"
                value={contactData?.socialLinks?.facebook || ''}
                onChange={(e) => setContactData(prev => prev ? {
                  ...prev,
                  socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                } : null)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X URL</Label>
              <Input
                id="twitter"
                type="url"
                value={contactData?.socialLinks?.twitter || ''}
                onChange={(e) => setContactData(prev => prev ? {
                  ...prev,
                  socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                } : null)}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                type="url"
                value={contactData?.socialLinks?.instagram || ''}
                onChange={(e) => setContactData(prev => prev ? {
                  ...prev,
                  socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                } : null)}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={contactData?.socialLinks?.linkedin || ''}
                onChange={(e) => setContactData(prev => prev ? {
                  ...prev,
                  socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                } : null)}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
