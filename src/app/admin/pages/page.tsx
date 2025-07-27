"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { getPages, savePages } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PageContent = {
  title: string;
  content: string;
};

type Pages = {
  [key: string]: PageContent;
};

export default function PagesPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<Pages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPages().then(data => {
      setPages(data);
      setLoading(false);
    });
  }, []);
  
  const handleContentChange = (pageKey: string, content: string) => {
    if (pages) {
      setPages({
        ...pages,
        [pageKey]: { ...pages[pageKey], content },
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!pages) return;
    try {
      await savePages(pages);
      toast({
        title: "Pages Updated",
        description: "Your static page content has been saved.",
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to save page content.",
        variant: "destructive"
      });
    }
  };

  if (loading || !pages) {
    return (
       <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-headline font-bold">Pages</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
                 <div className="flex justify-end gap-2">
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
        <h1 className="text-3xl font-headline font-bold">Manage Pages</h1>
        <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
          <CardDescription>
            Update the content for your store's static pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" defaultValue={Object.keys(pages)}>
              {Object.entries(pages).map(([key, page]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-lg font-medium">{page.title}</AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor={`content-${key}`} className="sr-only">{page.title}</Label>
                        <Textarea 
                            id={`content-${key}`}
                            value={page.content}
                            onChange={(e) => handleContentChange(key, e.target.value)}
                            rows={10}
                            className="text-base"
                            placeholder={`Enter content for the ${page.title} page...`}
                        />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
