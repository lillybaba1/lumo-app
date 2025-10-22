
import { getPages } from '@/app/admin/pages/actions';
import { notFound } from 'next/navigation';
import * as defaultPagesData from '@/data/pages.json';

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
