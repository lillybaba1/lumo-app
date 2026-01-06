"use client";

import { 
  Truck, 
  Shield, 
  CreditCard, 
  Headphones, 
  RefreshCw, 
  Clock,
  MapPin,
  Gift,
  Percent,
  Star,
  Tag,
  Sparkles,
  Flame
} from 'lucide-react';

interface ServiceHighlight {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const defaultHighlights: ServiceHighlight[] = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: '2-7 days nationwide',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'SSL encrypted checkout',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '7-day money back guarantee',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Headphones,
    title: 'Local Support',
    description: 'English, French & Mandinka',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

interface ServiceHighlightsProps {
  highlights?: ServiceHighlight[];
  variant?: 'horizontal' | 'grid' | 'minimal';
  className?: string;
}

export default function ServiceHighlights({ 
  highlights = defaultHighlights, 
  variant = 'horizontal',
  className = '' 
}: ServiceHighlightsProps) {
  if (variant === 'minimal') {
    return (
      <div className={`flex flex-wrap justify-center gap-6 md:gap-10 py-4 ${className}`}>
        {highlights.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <span className="text-sm font-medium">{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {highlights.map((item, index) => (
          <div 
            key={index} 
            className={`flex flex-col items-center p-4 md:p-6 rounded-2xl ${item.bgColor} transition-transform hover:scale-105`}
          >
            <div className={`p-3 rounded-full ${item.bgColor} mb-3`}>
              <item.icon className={`h-6 w-6 md:h-8 md:w-8 ${item.color}`} />
            </div>
            <h3 className="font-semibold text-sm md:text-base text-center">{item.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Default horizontal variant
  return (
    <div className={`bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl border ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/50">
        {highlights.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-4 md:p-6 hover:bg-white/50 transition-colors"
          >
            <div className={`p-2.5 rounded-xl ${item.bgColor} flex-shrink-0`}>
              <item.icon className={`h-5 w-5 md:h-6 md:w-6 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm md:text-base truncate">{item.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Promotional banner component
const BANNER_ICONS = {
  percent: Percent,
  tag: Tag,
  gift: Gift,
  star: Star,
  sparkles: Sparkles,
  flame: Flame,
  truck: Truck,
  clock: Clock,
} as const;

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  icon?: React.ElementType;
  // New props for admin customization
  bgGradientFrom?: string;
  bgGradientTo?: string;
  iconType?: keyof typeof BANNER_ICONS;
}

export function PromoBanner({ 
  title, 
  subtitle, 
  ctaText = 'Shop Now', 
  ctaLink = '/products',
  bgColor,
  textColor = '#ffffff',
  icon,
  bgGradientFrom = '#4f46e5',
  bgGradientTo = '#06b6d4',
  iconType = 'percent'
}: PromoBannerProps) {
  // Use passed icon or resolve from iconType
  const Icon = icon || BANNER_ICONS[iconType] || Percent;
  
  // Use custom gradient if provided, otherwise use bgColor class
  const bgStyle = bgColor 
    ? {} 
    : { background: `linear-gradient(to right, ${bgGradientFrom}, ${bgGradientTo})` };
  
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl p-6 md:p-8 ${bgColor || ''}`}
      style={{ ...bgStyle, color: textColor }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/20" />
      </div>
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white/20">
            <Icon className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-2xl">{title}</h3>
            {subtitle && <p className="text-sm md:text-base opacity-90">{subtitle}</p>}
          </div>
        </div>
        <a 
          href={ctaLink}
          className="px-6 py-2.5 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-colors text-sm md:text-base"
        >
          {ctaText}
        </a>
      </div>
    </div>
  );
}

// Trust indicators component
export function TrustIndicators() {
  const indicators = [
    { icon: Star, value: '4.8/5', label: 'Customer Rating' },
    { icon: Gift, value: '10K+', label: 'Happy Customers' },
    { icon: MapPin, value: '5+', label: 'Countries' },
    { icon: Clock, value: '24/7', label: 'Support' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 md:gap-12 py-6">
      {indicators.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <item.icon className="h-5 w-5 text-primary" />
            <span className="font-bold text-xl md:text-2xl">{item.value}</span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Detailed trust section for footer area
export function DetailedTrustSection({ className = '' }: { className?: string }) {
  const details = [
    {
      icon: Truck,
      title: 'Shipping & Delivery',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      points: [
        'Delivery within 2-7 business days nationwide',
        'Free shipping on orders over €50',
        'Real-time order tracking via SMS & email',
        'Reliable courier partners in West Africa',
      ],
    },
    {
      icon: Shield,
      title: 'Payment Security',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      points: [
        'SSL encrypted checkout process',
        'Wave Money & Orange Money accepted',
        'Cash on delivery available',
        'No hidden fees or charges',
      ],
    },
    {
      icon: RefreshCw,
      title: 'Returns & Refunds',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      points: [
        '7-day money back guarantee',
        'Free returns on defective items',
        'Easy online return request',
        'Refund processed within 3-5 days',
      ],
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      points: [
        'Support in English, French & Mandinka',
        'WhatsApp & phone support available',
        'Response within 24 hours',
        'Dedicated seller support team',
      ],
    },
  ];

  return (
    <div className={`bg-muted/30 py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
          Why Shop with JulaZone?
        </h2>
        <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
          We bring European quality standards to African e-commerce with trusted payment, fast delivery, and local support.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {details.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-3 rounded-xl ${item.bgColor} mb-4`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
              <ul className="space-y-2">
                {item.points.map((point, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className={`${item.color} mt-1`}>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
