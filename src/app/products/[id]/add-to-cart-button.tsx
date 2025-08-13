
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/lib/types";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({ product }: { product: Product }) {
    const { dispatch } = useCart();
    const { toast } = useToast();

    const handleAddToCart = () => {
        dispatch({ type: 'ADD_ITEM', payload: product });
        toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
        });
    };

    return (
        <Button onClick={handleAddToCart} size="lg" disabled={product.stock === 0}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Button>
    );
}
