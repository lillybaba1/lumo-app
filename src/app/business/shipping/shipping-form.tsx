'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, Trash2, Package, Globe, Truck, Clock, 
  DollarSign, MapPin, Save 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  isEnabled: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  isEnabled: boolean;
}

interface ShippingSettings {
  methods?: ShippingMethod[];
  zones?: ShippingZone[];
  freeShippingThreshold?: number;
  processingTime?: string;
  handlingFee?: number;
  internationalShipping?: boolean;
  shippingPolicy?: string;
}

interface Props {
  businessAccountId: string;
  currentSettings: ShippingSettings;
}

const DEFAULT_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Regular delivery',
    price: 5.99,
    estimatedDays: '5-7',
    isEnabled: true,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Fast delivery',
    price: 12.99,
    estimatedDays: '2-3',
    isEnabled: true,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    price: 24.99,
    estimatedDays: '1',
    isEnabled: false,
  },
];

export default function ShippingSettingsForm({ businessAccountId, currentSettings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [methods, setMethods] = useState<ShippingMethod[]>(
    currentSettings.methods?.length ? currentSettings.methods : DEFAULT_METHODS
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    currentSettings.freeShippingThreshold || 0
  );
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(
    (currentSettings.freeShippingThreshold || 0) > 0
  );
  const [processingTime, setProcessingTime] = useState(currentSettings.processingTime || '1-2');
  const [handlingFee, setHandlingFee] = useState(currentSettings.handlingFee || 0);
  const [internationalShipping, setInternationalShipping] = useState(
    currentSettings.internationalShipping ?? false
  );
  const [shippingPolicy, setShippingPolicy] = useState(currentSettings.shippingPolicy || '');

  const handleMethodToggle = (methodId: string) => {
    setMethods(methods.map(m => 
      m.id === methodId ? { ...m, isEnabled: !m.isEnabled } : m
    ));
  };

  const handleMethodPriceChange = (methodId: string, price: number) => {
    setMethods(methods.map(m => 
      m.id === methodId ? { ...m, price } : m
    ));
  };

  const handleMethodDaysChange = (methodId: string, days: string) => {
    setMethods(methods.map(m => 
      m.id === methodId ? { ...m, estimatedDays: days } : m
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingPolicies: {
            methods,
            freeShippingThreshold: freeShippingEnabled ? freeShippingThreshold : 0,
            processingTime,
            handlingFee,
            internationalShipping,
            shippingPolicy,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Settings Saved',
        description: 'Your shipping settings have been updated.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipping Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Methods
          </CardTitle>
          <CardDescription>
            Configure available shipping options for your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {methods.map((method) => (
            <div 
              key={method.id}
              className={`p-4 border rounded-lg ${method.isEnabled ? 'border-primary/50 bg-primary/5' : 'border-muted bg-muted/30'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={method.isEnabled}
                    onCheckedChange={() => handleMethodToggle(method.id)}
                  />
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </div>
              
              {method.isEnabled && (
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <Label className="text-sm">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={method.price}
                      onChange={(e) => handleMethodPriceChange(method.id, parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Estimated Days</Label>
                    <Input
                      value={method.estimatedDays}
                      onChange={(e) => handleMethodDaysChange(method.id, e.target.value)}
                      placeholder="e.g., 3-5"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Free Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Free Shipping
          </CardTitle>
          <CardDescription>
            Offer free shipping for orders above a certain amount
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Free Shipping Threshold</p>
              <p className="text-sm text-muted-foreground">
                Customers get free shipping when their order exceeds this amount
              </p>
            </div>
            <Switch
              checked={freeShippingEnabled}
              onCheckedChange={setFreeShippingEnabled}
            />
          </div>
          
          {freeShippingEnabled && (
            <div>
              <Label>Minimum Order Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                className="mt-1 max-w-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing & Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing & Handling
          </CardTitle>
          <CardDescription>
            Set order processing time and handling fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Processing Time</Label>
              <Select value={processingTime} onValueChange={setProcessingTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same-day">Same Day</SelectItem>
                  <SelectItem value="1">1 Business Day</SelectItem>
                  <SelectItem value="1-2">1-2 Business Days</SelectItem>
                  <SelectItem value="2-3">2-3 Business Days</SelectItem>
                  <SelectItem value="3-5">3-5 Business Days</SelectItem>
                  <SelectItem value="5-7">5-7 Business Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Handling Fee ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={handlingFee}
                onChange={(e) => setHandlingFee(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Added to each order</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* International Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            International Shipping
          </CardTitle>
          <CardDescription>
            Configure international shipping options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable International Shipping</p>
              <p className="text-sm text-muted-foreground">
                Allow customers from other countries to order from your store
              </p>
            </div>
            <Switch
              checked={internationalShipping}
              onCheckedChange={setInternationalShipping}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Policy
          </CardTitle>
          <CardDescription>
            Describe your shipping terms and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={shippingPolicy}
            onChange={(e) => setShippingPolicy(e.target.value)}
            placeholder="Describe your shipping policy, delivery times, packaging, and any special instructions..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Shipping Settings
        </Button>
      </div>
    </div>
  );
}
