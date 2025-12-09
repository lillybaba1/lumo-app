import { PackageOpen, Shield, Truck, CreditCard, HeadphonesIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  showTrustBadges?: boolean;
}

export default function EmptyState({ title, description, showTrustBadges = true }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        <PackageOpen className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-headline font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-8">{description}</p>
      
      {showTrustBadges && (
        <div className="w-full max-w-2xl">
          <p className="text-sm text-muted-foreground mb-4">Why shop with JulaZone?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <Shield className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-xs font-medium text-center">Secure Payments</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <Truck className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-xs font-medium text-center">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-xs font-medium text-center">Easy Refunds</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <HeadphonesIcon className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-xs font-medium text-center">24/7 Support</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
