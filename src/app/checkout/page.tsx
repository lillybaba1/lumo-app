
"use client";

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSettings } from '../admin/settings/actions';
import { createOrder } from '@/services/orderService';
import { validateCoupon, incrementCouponUsage } from '@/services/couponService';
import { initiateWaveMoneyPayment, processCashOnDelivery } from '@/services/paymentService';
import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';
import { Tag, Loader2 } from 'lucide-react';

type Settings = { currency?: string };

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));
  }, []);

  const currencySymbol = getCurrencySymbol(settings?.currency);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon ? calculateDiscount(subtotal, appliedCoupon) : 0;
  const total = subtotal - discount;

  function calculateDiscount(subtotal: number, coupon: any): number {
    if (coupon.type === 'percentage') {
      const discountAmount = (subtotal * coupon.value) / 100;
      return coupon.maxDiscount ? Math.min(discountAmount, coupon.maxDiscount) : discountAmount;
    } else {
      return coupon.value;
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const coupon = await validateCoupon(couponCode, subtotal);
      if (coupon) {
        setAppliedCoupon(coupon);
        toast({
          title: "Coupon Applied!",
          description: `You saved ${currencySymbol}${calculateDiscount(subtotal, coupon).toFixed(2)}`,
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const firstName = formData.get('first-name') as string;
      const lastName = formData.get('last-name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const address = formData.get('address') as string;
      const city = formData.get('city') as string;
      const paymentMethod = formData.get('payment-method') as 'Wave Money' | 'Cash on Delivery';
      const notes = formData.get('notes') as string;

      const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: `${address}, ${city}`,
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: total,
        status: 'Pending',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'Wave Money' ? 'Pending' : 'Pending',
        couponCode: appliedCoupon?.code,
        notes: notes || undefined,
      };

      const order = await createOrder(orderData);

      // Increment coupon usage if coupon was applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.code);
      }

      // Create payment record
      const paymentData = {
        orderId: order.id,
        amount: total,
        currency: settings?.currency || 'USD',
        paymentMethod: paymentMethod,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`,
      };

      if (paymentMethod === 'Wave Money') {
        await initiateWaveMoneyPayment(paymentData);
      } else {
        await processCashOnDelivery(paymentData);
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.id.substring(0, 8)} has been created. Thank you for your purchase!`,
      });

      dispatch({ type: 'CLEAR_CART' });
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    if (typeof window !== 'undefined') {
        router.push('/');
    }
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-headline font-bold mb-8 text-center">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Customer Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name *</Label>
                      <Input id="first-name" name="first-name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name *</Label>
                      <Input id="last-name" name="last-name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input id="address" name="address" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" name="city" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Any special instructions for your order?"
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup defaultValue="cod" name="payment-method" className="space-y-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="Wave Money" id="wave" />
                      <Label htmlFor="wave" className="flex-1 cursor-pointer">
                        <div className="font-medium">Wave Money Transfer</div>
                        <div className="text-sm text-muted-foreground">Pay via Wave Money mobile wallet</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="Cash on Delivery" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.product.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded flex-shrink-0">
                          {item.product.imageUrls?.[0] && (
                            <img
                              src={item.product.imageUrls[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{currencySymbol}{(item.product.price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Input */}
                  <div className="space-y-2">
                    <Label>Have a coupon code?</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={!!appliedCoupon}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant={appliedCoupon ? "destructive" : "outline"}
                        onClick={() => {
                          if (appliedCoupon) {
                            setAppliedCoupon(null);
                            setCouponCode('');
                          } else {
                            handleApplyCoupon();
                          }
                        }}
                        disabled={couponLoading || (!couponCode.trim() && !appliedCoupon)}
                      >
                        {couponLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {appliedCoupon ? 'Remove' : 'Apply'}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        ✓ Coupon "{appliedCoupon.code}" applied successfully!
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-{currencySymbol}{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{currencySymbol}{total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing Order...' : 'Place Order'}
                  </Button>
                </CardFooter>
              </Card>

              {/* Security Notice */}
              <div className="text-center text-sm text-muted-foreground">
                <p>🔒 Your payment information is secure</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
