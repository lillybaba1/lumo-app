
import Link from 'next/link';
import { getPages } from '@/app/admin/pages/actions';

export default async function Footer() {
  const pages = await getPages();

  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="md:col-span-1">
             <h3 className="font-headline text-lg font-semibold mb-2 text-primary-foreground">Lumo</h3>
             <p className="text-sm text-foreground/80">Discover Your Style</p>
           </div>
           <div className="md:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Shop</h4>
                   <ul className="space-y-1 text-sm text-foreground/80">
                      <li><Link href="#" className="hover:underline">All Products</Link></li>
                      <li><Link href="#" className="hover:underline">New Arrivals</Link></li>
                      <li><Link href="#" className="hover:underline">Sales</Link></li>
                   </ul>
                </div>
                 <div>
                  <h4 className="font-semibold mb-2 text-foreground">Information</h4>
                   <ul className="space-y-1 text-sm text-foreground/80">
                     {Object.entries(pages).map(([slug, { title }]) => (
                        <li key={slug}>
                          <Link href={`/pages/${slug}`} className="hover:underline">
                            {title}
                          </Link>
                        </li>
                      ))}
                   </ul>
                </div>
                 <div>
                  <h4 className="font-semibold mb-2 text-foreground">Account</h4>
                   <ul className="space-y-1 text-sm text-foreground/80">
                      <li><Link href="/admin/dashboard" className="hover:underline">Admin</Link></li>
                      <li><Link href="/cart" className="hover:underline">My Cart</Link></li>
                   </ul>
                </div>
              </div>
           </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-foreground/80">
            <p>&copy; {new Date().getFullYear()} Lumo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
