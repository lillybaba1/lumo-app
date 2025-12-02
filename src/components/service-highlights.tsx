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
  Star
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
    description: '2-7 business days',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% protected',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '7-day return policy',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Headphones,
    title: 'Local Support',
    description: 'We speak your language',
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
interface PromoBannerProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  icon?: React.ElementType;
}

export function PromoBanner({ 
  title, 
  subtitle, 
  ctaText = 'Shop Now', 
  ctaLink = '/products',
  bgColor = 'bg-gradient-to-r from-primary to-accent',
  textColor = 'text-white',
  icon: Icon = Percent
}: PromoBannerProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${bgColor} ${textColor} p-6 md:p-8`}>
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
