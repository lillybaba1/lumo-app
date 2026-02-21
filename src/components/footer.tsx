"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, Truck, CreditCard, HeadphonesIcon, MapPin, Mail, Phone, Facebook, Instagram, MessageCircle } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// YouTube icon component
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface FooterSettings {
  storeName?: string;
  storeTagline?: string;
  footerDescription?: string;
  footerCopyright?: string;
  footerTagline?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerWhatsApp?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  trustBadge1Title?: string;
  trustBadge1Subtitle?: string;
  trustBadge2Title?: string;
  trustBadge2Subtitle?: string;
  trustBadge3Title?: string;
  trustBadge3Subtitle?: string;
  trustBadge4Title?: string;
  trustBadge4Subtitle?: string;
  trustBadge5Title?: string;
  trustBadge5Subtitle?: string;
  footerPaymentMethods?: string;
  footerDeliveryCountries?: string;
}

const defaultSettings: FooterSettings = {
  storeName: 'JulaZone',
  storeTagline: "Africa's Trusted Marketplace",
  footerDescription: "We're building a trusted shopping experience for Africa. Quality products, secure payments, and reliable delivery across the continent.",
  footerCopyright: "JulaZone – Africa's Trusted Marketplace",
  footerTagline: 'Building trust, one order at a time 🌍',
  footerEmail: 'support@julazone.com',
  footerPhone: '+220 700 1234',
  footerWhatsApp: '+2207001234',
  socialFacebook: 'https://facebook.com/julazone_gm',
  socialInstagram: 'https://instagram.com/julazone_gm',
  socialX: 'https://x.com/julazone_gm',
  socialTiktok: '',
  socialYoutube: '',
  trustBadge1Title: 'Secure Payments',
  trustBadge1Subtitle: '100% Protected',
  trustBadge2Title: 'Fast Delivery',
  trustBadge2Subtitle: '2-7 Business Days',
  trustBadge3Title: 'Easy Refunds',
  trustBadge3Subtitle: '7-Day Returns',
  trustBadge4Title: 'Local Support',
  trustBadge4Subtitle: 'We Speak Your Language',
  trustBadge5Title: "Africa's Marketplace",
  trustBadge5Subtitle: 'Built for Africa',
  footerPaymentMethods: 'Wave,Afrimoney,QMoney,Bank Transfer,Cash on Delivery',
  footerDeliveryCountries: '🇬🇲 Gambia,🇸🇳 Senegal,🇳🇬 Nigeria,🇬🇭 Ghana,🇰🇪 Kenya',
};

const trustBadgeIcons = [
  { icon: Shield, color: 'text-green-600' },
  { icon: Truck, color: 'text-blue-600' },
  { icon: CreditCard, color: 'text-purple-600' },
  { icon: HeadphonesIcon, color: 'text-orange-600' },
  { icon: MapPin, color: 'text-red-600' },
];

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  
  // Hide on admin/business dashboards
  const isHidden = pathname?.startsWith('/admin') || pathname?.startsWith('/business');

  useEffect(() => {
    if (isHidden) return;
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.authenticated && data.user?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    fetchSettings();
    checkAdmin();
  }, [isHidden]);

  if (isHidden) return null;

  const paymentMethods = settings.footerPaymentMethods?.split(',').map(m => m.trim()).filter(Boolean) || [];
  const deliveryCountries = settings.footerDeliveryCountries?.split(',').map(c => c.trim()).filter(Boolean) || [];

  const trustBadges = [
    { title: settings.trustBadge1Title, subtitle: settings.trustBadge1Subtitle },
    { title: settings.trustBadge2Title, subtitle: settings.trustBadge2Subtitle },
    { title: settings.trustBadge3Title, subtitle: settings.trustBadge3Subtitle },
    { title: settings.trustBadge4Title, subtitle: settings.trustBadge4Subtitle },
    { title: settings.trustBadge5Title, subtitle: settings.trustBadge5Subtitle },
  ];

  const socialLinks = [
    { url: settings.socialFacebook, icon: Facebook, label: 'Facebook' },
    { url: settings.socialInstagram, icon: Instagram, label: 'Instagram' },
    { url: settings.socialX, icon: XIcon, label: 'X' },
    { url: settings.socialTiktok, icon: TikTokIcon, label: 'TikTok' },
    { url: settings.socialYoutube, icon: YouTubeIcon, label: 'YouTube' },
  ].filter(link => link.url);

  return (
    <footer className="border-t bg-gradient-to-b from-muted/10 to-muted/30">
      {/* Trust Banner - Enhanced */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {trustBadges.map((badge, index) => {
              const IconComponent = trustBadgeIcons[index]?.icon || Shield;
              const iconColor = trustBadgeIcons[index]?.color || 'text-primary';
              const bgColors = ['bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-orange-50', 'bg-red-50'];
              return (
                <div key={index} className={`flex flex-col items-center p-3 rounded-xl hover:bg-white/50 transition-colors ${index === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className={`p-3 rounded-full ${bgColors[index]} mb-3`}>
                    <IconComponent className={`h-6 w-6 md:h-7 md:w-7 ${iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold">{badge.title}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{badge.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="font-headline text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{settings.storeName}</h3>
            <p className="text-sm font-medium text-foreground/80 mb-3">{settings.storeTagline}</p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {settings.footerDescription}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {settings.footerEmail && (
                <a href={`mailto:${settings.footerEmail}`} className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  {settings.footerEmail}
                </a>
              )}
              {settings.footerPhone && (
                <a href={`tel:${settings.footerPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  {settings.footerPhone}
                </a>
              )}
              {settings.footerWhatsApp && (
                <a href={`https://wa.me/${settings.footerWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-green-100 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  WhatsApp Support
                </a>
              )}
            </div>

            {/* Social Media */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 rounded-xl bg-muted hover:bg-primary hover:text-white transition-all hover:scale-110" 
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links Sections */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Shop</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li><Link href="/" className="hover:text-primary transition-colors">All Products</Link></li>
                  <li><Link href="/?filter=new" className="hover:text-primary transition-colors">New Arrivals</Link></li>
                  <li><Link href="/?filter=deals" className="hover:text-primary transition-colors">Deals & Offers</Link></li>
                  <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Customer Service</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li><Link href="/pages/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                  <li><Link href="/pages/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                  <li><Link href="/pages/shipping" className="hover:text-primary transition-colors">Shipping & Delivery</Link></li>
                  <li><Link href="/pages/policy" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-foreground">My Account</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {isAdmin && (
                    <li><Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin Dashboard</Link></li>
                  )}
                  <li><Link href="/orders" className="hover:text-primary transition-colors">Track My Order</Link></li>
                  <li><Link href="/cart" className="hover:text-primary transition-colors">My Cart</Link></li>
                  <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
                  <li><Link href="/login" className="hover:text-primary transition-colors">Sign In / Register</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Delivery Partners - Enhanced */}
        <div className="mt-10 pt-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paymentMethods.length > 0 && (
              <div className="bg-white/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h5 className="text-sm font-semibold text-foreground">Payment Methods</h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((method, index) => (
                    <span key={index} className="px-4 py-2 bg-white rounded-xl text-sm font-medium shadow-sm border hover:border-primary/30 transition-colors">{method}</span>
                  ))}
                </div>
              </div>
            )}
            {deliveryCountries.length > 0 && (
              <div className="bg-white/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h5 className="text-sm font-semibold text-foreground">We Deliver To</h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deliveryCountries.map((country, index) => (
                    <span key={index} className="px-4 py-2 bg-white rounded-xl text-sm font-medium shadow-sm border hover:border-primary/30 transition-colors">{country}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-foreground/80">&copy; {new Date().getFullYear()} {settings.footerCopyright}</p>
              {settings.footerTagline && (
                <p className="text-xs text-muted-foreground mt-1">{settings.footerTagline}</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <Link href="/pages/about" className="hover:text-primary transition-colors">About Us</Link>
              <span>•</span>
              <Link href="/pages/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/pages/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/pages/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
