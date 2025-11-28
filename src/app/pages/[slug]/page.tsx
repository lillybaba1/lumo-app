
import { getPages } from '@/app/admin/pages/actions';
import { getFAQData } from '@/app/admin/faq/actions';
import { getContactData } from '@/app/admin/contact/actions';
import { notFound } from 'next/navigation';
import * as defaultPagesData from '@/data/pages.json';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Handle special pages with structured data
  if (slug === 'faq') {
    const faqData = await getFAQData();
    if (!faqData) notFound();

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-headline font-bold mb-4">{faqData.title}</h1>
          {faqData.introText && (
            <p className="text-lg text-muted-foreground mb-8">{faqData.introText}</p>
          )}
          {faqData.faqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.faqs
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-6">
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No FAQ items available at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (slug === 'contact') {
    const contactData = await getContactData();
    if (!contactData) notFound();

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-headline font-bold mb-4">{contactData.title}</h1>
          {contactData.introText && (
            <p className="text-lg text-muted-foreground mb-8">{contactData.introText}</p>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {contactData.email && (
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href={`mailto:${contactData.email}`} className="text-muted-foreground hover:text-primary">
                      {contactData.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {contactData.phone && (
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <a href={`tel:${contactData.phone}`} className="text-muted-foreground hover:text-primary">
                      {contactData.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {contactData.address && (
              <Card className="md:col-span-2">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{contactData.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {contactData.socialLinks && Object.values(contactData.socialLinks).some(link => link) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {contactData.socialLinks.facebook && (
                    <a
                      href={contactData.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-primary" />
                    </a>
                  )}
                  {contactData.socialLinks.twitter && (
                    <a
                      href={contactData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Twitter className="h-5 w-5 text-primary" />
                    </a>
                  )}
                  {contactData.socialLinks.instagram && (
                    <a
                      href={contactData.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-primary" />
                    </a>
                  )}
                  {contactData.socialLinks.linkedin && (
                    <a
                      href={contactData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-primary" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Handle regular pages
  const pages = await getPages() ?? defaultPagesData;
  const page = pages[slug];

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-4xl font-headline font-bold mb-8">{page.title}</h1>
        <div className="text-lg whitespace-pre-wrap">
          {page.content}
        </div>
      </div>
    </div>
  );
}
