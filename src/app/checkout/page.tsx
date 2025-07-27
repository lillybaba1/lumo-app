"use client";

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const { toast } = useToast();
  const router = useRouter();

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would process the payment here.
    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. We've received your order.",
    });
    dispatch({ type: 'CLEAR_CART' });
    router.push('/');
  };

  if (items.length === 0) {
    // Redirect to home if cart is empty, maybe show a message first
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" required />
                    </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup defaultValue="cod" className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wave" id="wave" />
                      <Label htmlFor="wave">Wave Money Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {items.map(item => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                            <span>{item.product.name} x {item.quantity}</span>
                            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">Place Order</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
