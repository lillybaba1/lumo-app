
"use client";

import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSettings } from '../admin/settings/actions';
import { createOrder } from '@/services/orderService';
import { validateCoupon, incrementCouponUsage } from '@/services/couponService';
import { processCashOnDelivery, processPayDunyaPayment, processMobileMoneyPayment } from '@/services/paymentService';
import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';
import { Tag, Loader2, CreditCard, Smartphone, Banknote, Info, Copy, CheckCircle } from 'lucide-react';
import { CheckoutConsent } from '@/components/checkout-consent';
import { getCurrencySymbol, formatAmount } from '@/lib/currency';

type Settings = { currency?: string };

type PaymentMethod = 'paydunya' | 'mobile_money' | 'cod';

interface MobileMoneyAccount {
  provider: string;
  number: string;
  accountName: string;
}

interface SellerMobileMoneyInfo {
  sellerId: string;
  businessName: string;
  mobileMoneyAccounts: MobileMoneyAccount[];
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
  const [consentGiven, setConsentGiven] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [sellerMobileMoneyInfo, setSellerMobileMoneyInfo] = useState<SellerMobileMoneyInfo[]>([]);
  const [mobileMoneyLoading, setMobileMoneyLoading] = useState(false);
  const [mmReferenceNumber, setMmReferenceNumber] = useState('');
  const [mmSenderNumber, setMmSenderNumber] = useState('');
  const [mmSelectedProvider, setMmSelectedProvider] = useState('');
  const [mmSelectedReceiverNumber, setMmSelectedReceiverNumber] = useState('');
  const [copiedNumber, setCopiedNumber] = useState('');

  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));
  }, []);

  // Fetch seller mobile money details when mobile money is selected
  useEffect(() => {
    if (paymentMethod === 'mobile_money') {
      fetchSellerMobileMoneyInfo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

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

  async function fetchSellerMobileMoneyInfo() {
    setMobileMoneyLoading(true);
    try {
      const sellerIds = [...new Set(items.map(item => item.sellerId || item.product.sellerId).filter(Boolean))];
      
      const results: SellerMobileMoneyInfo[] = [];
      for (const sellerId of sellerIds) {
        if (!sellerId) continue;
        try {
          const res = await fetch(`/api/payments/seller-mobile-money?sellerId=${sellerId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.mobileMoneyAccounts && data.mobileMoneyAccounts.length > 0) {
              results.push(data);
            }
          }
        } catch {
          // Skip sellers without mobile money info
        }
      }
      setSellerMobileMoneyInfo(results);
    } catch (error) {
      console.error('Error fetching seller mobile money info:', error);
    } finally {
      setMobileMoneyLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(''), 2000);
    toast({ title: "Copied!", description: `${text} copied to clipboard` });
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
          description: `You saved ${currencySymbol}${formatAmount(calculateDiscount(subtotal, coupon))}`,  
        });
      } else {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is not valid or has expired.",
          variant: "destructive",
        });
      }
    } catch {
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
      const notes = formData.get('notes') as string;

      // Validate mobile money fields
      if (paymentMethod === 'mobile_money') {
        if (!mmReferenceNumber.trim()) {
          toast({ title: "Missing Reference", description: "Please enter the transaction reference number.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!mmSenderNumber.trim()) {
          toast({ title: "Missing Sender Number", description: "Please enter the number you sent from.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!mmSelectedProvider) {
          toast({ title: "Missing Provider", description: "Please select which mobile money account you sent to.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      const orderPaymentMethod = paymentMethod === 'paydunya' ? 'PayDunya' 
        : paymentMethod === 'mobile_money' ? 'Mobile Money' 
        : 'Cash on Delivery';

      const simplifiedItems = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        sellerId: item.sellerId || item.product.sellerId || 'unknown'
      }));

      const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: `${address}, ${city}`,
        items: simplifiedItems as any,
        subtotal: subtotal,
        discount: discount,
        total: total,
        status: 'Pending',
        paymentMethod: orderPaymentMethod as Order['paymentMethod'],
        paymentStatus: 'Pending',
        couponCode: appliedCoupon?.code,
        notes: notes || undefined,
      };

      const order = await createOrder(orderData);

      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.code);
      }

      const paymentBase = {
        orderId: order.id,
        amount: total,
        currency: settings?.currency || 'GMD',
        customerEmail: email,
        customerName: `${firstName} ${lastName}`,
      };

      if (paymentMethod === 'paydunya') {
        const paydunyaRes = await fetch('/api/payments/paydunya/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: total,
            description: `JulaZone Order #${order.id.substring(0, 8)}`,
            customerName: `${firstName} ${lastName}`,
            customerEmail: email,
            customerPhone: phone,
            items: simplifiedItems.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
            })),
          }),
        });

        const paydunyaData = await paydunyaRes.json();

        if (!paydunyaRes.ok || !paydunyaData.checkoutUrl) {
          throw new Error(paydunyaData.error || 'Failed to create payment. Please try another method.');
        }

        await processPayDunyaPayment(
          { ...paymentBase, paymentMethod: 'PayDunya' },
          paydunyaData.token
        );

        dispatch({ type: 'CLEAR_CART' });
        window.location.href = paydunyaData.checkoutUrl;
        return;

      } else if (paymentMethod === 'mobile_money') {
        await processMobileMoneyPayment(
          { ...paymentBase, paymentMethod: 'Mobile Money' },
          {
            provider: mmSelectedProvider,
            referenceNumber: mmReferenceNumber.trim(),
            senderNumber: mmSenderNumber.trim(),
            receiverNumber: mmSelectedReceiverNumber,
          }
        );

        toast({
          title: "Order Placed!",
          description: "Your order is placed. The seller will verify your mobile money payment.",
        });

      } else {
        await processCashOnDelivery({ ...paymentBase, paymentMethod: 'Cash on Delivery' });

        toast({
          title: "Order Placed Successfully!",
          description: `Order #${order.id.substring(0, 8)} has been created. Pay when you receive your order.`,
        });
      }

      dispatch({ type: 'CLEAR_CART' });
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Order Failed",
        description: `Failed to place your order: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-4">Add some items to your cart before checking out.</p>
        <Button asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  const allMobileMoneyAccounts = sellerMobileMoneyInfo.flatMap(seller =>
    seller.mobileMoneyAccounts.map(acc => ({
      ...acc,
      sellerName: seller.businessName,
      sellerId: seller.sellerId,
    }))
  );

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

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* PayDunya (Wave / Card) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paydunya')}
                    className={`w-full flex items-center gap-3 border rounded-lg p-4 transition-colors text-left ${
                      paymentMethod === 'paydunya'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400'
                        : 'hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      paymentMethod === 'paydunya' 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : 'bg-muted'
                    }`}>
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Wave / Card Payment</div>
                      <div className="text-sm text-muted-foreground">Pay securely via Wave or bank card</div>
                    </div>
                    {paymentMethod === 'paydunya' && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </button>

                  {/* Mobile Money Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`w-full flex items-center gap-3 border rounded-lg p-4 transition-colors text-left ${
                      paymentMethod === 'mobile_money'
                        ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 ring-2 ring-purple-400'
                        : 'hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      paymentMethod === 'mobile_money' 
                        ? 'bg-purple-100 dark:bg-purple-900' 
                        : 'bg-muted'
                    }`}>
                      <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Mobile Money Transfer</div>
                      <div className="text-sm text-muted-foreground">Send via QMoney, Afrimoney, or Wave</div>
                    </div>
                    {paymentMethod === 'mobile_money' && (
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    )}
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full flex items-center gap-3 border rounded-lg p-4 transition-colors text-left ${
                      paymentMethod === 'cod'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-400'
                        : 'hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      paymentMethod === 'cod' 
                        ? 'bg-emerald-100 dark:bg-emerald-900' 
                        : 'bg-muted'
                    }`}>
                      <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                    </div>
                    {paymentMethod === 'cod' && (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    )}
                  </button>

                  {/* PayDunya info */}
                  {paymentMethod === 'paydunya' && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          <p>You will be redirected to a secure payment page to complete your payment via Wave or bank card. Your order will be confirmed once payment is received.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Money Transfer Details */}
                  {paymentMethod === 'mobile_money' && (
                    <div className="mt-3 space-y-4">
                      {mobileMoneyLoading ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading seller payment details...</span>
                        </div>
                      ) : allMobileMoneyAccounts.length === 0 ? (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-300">
                              <p className="font-medium">Mobile Money not available</p>
                              <p className="mt-1">The seller(s) for your cart items haven&apos;t set up mobile money yet. Please choose another payment method.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Step 1: Show seller mobile money numbers */}
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h4 className="font-medium text-sm mb-3 text-purple-800 dark:text-purple-300">
                              Step 1: Send {currencySymbol}{formatAmount(total)} to the seller
                            </h4>
                            <div className="space-y-2">
                              {allMobileMoneyAccounts.map((acc, i) => (
                                <div 
                                  key={i}
                                  onClick={() => {
                                    setMmSelectedProvider(acc.provider);
                                    setMmSelectedReceiverNumber(acc.number);
                                  }}
                                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                                    mmSelectedReceiverNumber === acc.number && mmSelectedProvider === acc.provider
                                      ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400'
                                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                  }`}
                                >
                                  <div>
                                    <span className="font-medium text-sm">{acc.provider}</span>
                                    <span className="mx-2 text-muted-foreground">•</span>
                                    <span className="text-sm">{acc.accountName}</span>
                                    {sellerMobileMoneyInfo.length > 1 && (
                                      <span className="text-xs text-muted-foreground ml-2">({acc.sellerName})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">{acc.number}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(acc.number);
                                      }}
                                      className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded"
                                      title="Copy number"
                                    >
                                      {copiedNumber === acc.number ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Step 2: Enter confirmation */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                            <h4 className="font-medium text-sm mb-3">Step 2: Enter your transfer details</h4>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="mm-sender" className="text-xs">Your phone number (sender) *</Label>
                                <Input
                                  id="mm-sender"
                                  placeholder="+220 XXXXXXX"
                                  value={mmSenderNumber}
                                  onChange={(e) => setMmSenderNumber(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="mm-reference" className="text-xs">Transaction reference / ID *</Label>
                                <Input
                                  id="mm-reference"
                                  placeholder="e.g. TXN123456789"
                                  value={mmReferenceNumber}
                                  onChange={(e) => setMmReferenceNumber(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
                        <div className="w-16 h-16 bg-muted rounded flex-shrink-0 relative overflow-hidden">
                          {((item.product.productImages && item.product.productImages.length > 0) ||
                            (item.product.imageUrls && item.product.imageUrls.length > 0)) && (
                            <Image
                              src={
                                (item.product.productImages && item.product.productImages.length > 0)
                                  ? item.product.productImages[0]
                                  : item.product.imageUrls[0]
                              }
                              alt={item.product.name}
                              fill
                              className="object-cover rounded"
                              sizes="64px"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{currencySymbol}{formatAmount(item.product.price * item.quantity)}</div>
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
                        ✓ Coupon &ldquo;{appliedCoupon.code}&rdquo; applied successfully!
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{currencySymbol}{formatAmount(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-{currencySymbol}{formatAmount(discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{currencySymbol}{formatAmount(total)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <CheckoutConsent onConsentChange={setConsentGiven} />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={
                      loading || 
                      !consentGiven || 
                      (paymentMethod === 'mobile_money' && allMobileMoneyAccounts.length === 0)
                    }
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading 
                      ? 'Processing...' 
                      : paymentMethod === 'paydunya' 
                        ? 'Pay Now' 
                        : paymentMethod === 'mobile_money'
                          ? 'Confirm Mobile Money Payment'
                          : 'Place Order (Cash on Delivery)'
                    }
                  </Button>
                </CardFooter>
              </Card>

              {/* Security Notice */}
              <div className="text-center text-sm text-muted-foreground">
                <p>🔒 Your information is secure</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
