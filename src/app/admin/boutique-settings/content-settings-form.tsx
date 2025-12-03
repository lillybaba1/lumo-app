'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BoutiqueSystemSettings } from '@/lib/types';
import { updateBoutiqueSettingsAction } from './actions';
import { 
  Loader2, Save, FileText, Link as LinkIcon, 
  Type, MessageSquare, ExternalLink
} from 'lucide-react';

interface Props {
  settings: BoutiqueSystemSettings;
}

export default function ContentSettingsForm({ settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [content, setContent] = useState(settings.content);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateBoutiqueSettingsAction({ content });
      
      if (result.success) {
        toast({
          title: 'Content Updated',
          description: 'Content settings have been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Boutique Page Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Boutiques Page Content
          </CardTitle>
          <CardDescription>
            Customize the text displayed on the public boutiques listing page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input
              value={content.boutiquePageTitle}
              onChange={(e) => setContent({ ...content, boutiquePageTitle: e.target.value })}
              placeholder="e.g., Discover Boutiques"
            />
          </div>

          <div className="space-y-2">
            <Label>Page Description</Label>
            <Textarea
              value={content.boutiquePageDescription}
              onChange={(e) => setContent({ ...content, boutiquePageDescription: e.target.value })}
              placeholder="Description shown below the title"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seller Signup Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Seller Signup Content
          </CardTitle>
          <CardDescription>
            Customize the call-to-action for new sellers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Signup Title</Label>
            <Input
              value={content.sellerSignupTitle}
              onChange={(e) => setContent({ ...content, sellerSignupTitle: e.target.value })}
              placeholder="e.g., Start Your Own Boutique"
            />
          </div>

          <div className="space-y-2">
            <Label>Signup Description</Label>
            <Textarea
              value={content.sellerSignupDescription}
              onChange={(e) => setContent({ ...content, sellerSignupDescription: e.target.value })}
              placeholder="Description encouraging sellers to sign up"
              rows={3}
            />
          </div>

          {/* Preview */}
          <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg mt-4">
            <h3 className="text-xl font-bold text-center mb-2">
              {content.sellerSignupTitle || 'Start Your Own Boutique'}
            </h3>
            <p className="text-center text-muted-foreground mb-4">
              {content.sellerSignupDescription || 'Join our marketplace and showcase your products'}
            </p>
            <div className="text-center">
              <Button disabled>Become a Seller</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Documents
          </CardTitle>
          <CardDescription>
            Links to legal documents for sellers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Terms & Conditions URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={content.termsAndConditionsUrl}
                onChange={(e) => setContent({ ...content, termsAndConditionsUrl: e.target.value })}
                placeholder="/terms or https://..."
              />
              {content.termsAndConditionsUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={content.termsAndConditionsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Seller Agreement URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={content.sellerAgreementUrl}
                onChange={(e) => setContent({ ...content, sellerAgreementUrl: e.target.value })}
                placeholder="/seller-agreement or https://..."
              />
              {content.sellerAgreementUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={content.sellerAgreementUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Content Settings
        </Button>
      </div>
    </div>
  );
}
