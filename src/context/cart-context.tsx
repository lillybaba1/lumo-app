"use client";

import React, { createContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'RESTORE_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
};

const CART_STORAGE_KEY = 'lumo_cart';

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.product.id === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'RESTORE_CART':
      return { ...state, items: action.payload };
    default:
      return state;
  }
};

export const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, baseDispatch] = useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wrap dispatch to track cart-add events via intelligence engine
  const dispatch: React.Dispatch<CartAction> = useCallback((action: CartAction) => {
    baseDispatch(action);
    if (action.type === 'ADD_ITEM') {
      try {
        const payload = JSON.stringify({
          eventType: 'cart_add',
          productId: action.payload.id,
          categoryId: action.payload.categoryId || undefined,
          sessionId: typeof window !== 'undefined' ? (sessionStorage.getItem('jz_session_id') || '') : '',
        });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/track', blob);
        } else {
          fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
        }
      } catch {}
    }
  }, []);

  // Restore cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: 'RESTORE_CART', payload: parsed });
        }
      }
    } catch (error) {
      console.error('Failed to restore cart from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [state.items, isHydrated]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};
