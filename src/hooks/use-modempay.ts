"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Extend Window interface for ModemPayCheckout
declare global {
  interface Window {
    ModemPayCheckout?: (options: ModemPayCheckoutOptions) => ModemPayModal;
  }
}

export interface ModemPayCheckoutOptions {
  public_key: string;
  amount: number;
  currency?: string;
  payment_methods?: string; // comma-separated: "wallet", "card", "bank", "wallet,card,bank"
  title?: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  metadata?: Record<string, string>;
  return_url?: string;
  cancel_url?: string;
  callback?: (transaction: ModemPayTransaction) => void;
  onClose?: (cancelled: boolean) => void;
}

export interface ModemPayTransaction {
  id: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  metadata: Record<string, string>;
}

export interface ModemPayModal {
  close: () => void;
}

const MODEMPAY_SCRIPT_URL = "https://api.modempay.com/js/v1.js";
const MODEMPAY_CSS_URL = "https://api.modempay.com/dist/main.css";

/**
 * CSS injected into the page to hide the card payment option
 * in the Modem Pay modal when we only want mobile money (wallet).
 *
 * The SDK renders a "Pay With" section at the bottom with buttons
 * like <button class="payment-method-btn" data-method="card">card</button>.
 * We also hide the entire card form layout if it somehow renders.
 */
const WALLET_ONLY_STYLE_ID = "modempay-wallet-only-css";

function injectWalletOnlyCSS() {
  if (document.getElementById(WALLET_ONLY_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = WALLET_ONLY_STYLE_ID;
  style.textContent = `
    /* Hide the "Pay With" card switcher button so user cannot switch to card */
    .modem-pay-methods .payment-method-btn[data-method="card"],
    .modem-pay-methods .payment-method-btn[data-method="bank"] {
      display: none !important;
    }
    /* If card is somehow the only alt, hide the entire "Pay With" section */
    .modem-pay-change-payment:has(.modem-pay-methods:not(:has(.payment-method-btn:not([data-method="card"]):not([data-method="bank"])))) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function removeWalletOnlyCSS() {
  document.getElementById(WALLET_ONLY_STYLE_ID)?.remove();
}

/**
 * After the ModemPay modal renders, if the API returns card as the first
 * payment method (ignoring our wallet-only request), we auto-click the
 * wallet button so the user sees mobile money immediately.
 */
function forceWalletView() {
  const observer = new MutationObserver(() => {
    const modal = document.getElementById("modem-pay-modal");
    if (!modal) return;

    // Check if card view is showing (the card element wrapper exists)
    const cardLayout = modal.querySelector("#modem-pay-card-element");
    if (cardLayout) {
      // Find the wallet button and click it
      const walletBtn = modal.querySelector<HTMLButtonElement>(
        '.payment-method-btn[data-method="wallet"]'
      );
      if (walletBtn) {
        walletBtn.click();
        observer.disconnect();
        return;
      }
    }

    // If wallet form is already showing, we're good
    const walletLayout = modal.querySelector("#gateway");
    if (walletLayout) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Safety: disconnect after 10 s even if nothing happened
  setTimeout(() => observer.disconnect(), 10_000);
}

export function useModemPay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    // Already loaded
    if (window.ModemPayCheckout) {
      setIsLoaded(true);
      return;
    }

    // Already loading
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Load CSS
    if (!document.querySelector(`link[href="${MODEMPAY_CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = MODEMPAY_CSS_URL;
      document.head.appendChild(link);
    }

    // Load JS
    const existingScript = document.querySelector(`script[src="${MODEMPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = MODEMPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error("Failed to load ModemPay script");
      loadingRef.current = false;
    };
    document.head.appendChild(script);
  }, []);

  const openCheckout = useCallback(
    (options: Omit<ModemPayCheckoutOptions, "public_key"> & { walletOnly?: boolean }) => {
      const publicKey = process.env.NEXT_PUBLIC_MODEMPAY_PUBLIC_KEY;
      if (!publicKey) {
        console.error("NEXT_PUBLIC_MODEMPAY_PUBLIC_KEY is not configured");
        return null;
      }

      if (!window.ModemPayCheckout) {
        console.error("ModemPay script not loaded yet");
        return null;
      }

      const { walletOnly, ...checkoutOptions } = options;

      // When walletOnly is requested, inject CSS to hide card tab
      // and set up a MutationObserver to auto-switch to wallet if card loads first
      if (walletOnly) {
        injectWalletOnlyCSS();
        forceWalletView();
      }

      const originalOnClose = checkoutOptions.onClose;
      checkoutOptions.onClose = (cancelled: boolean) => {
        if (walletOnly) removeWalletOnlyCSS();
        originalOnClose?.(cancelled);
      };

      const originalCallback = checkoutOptions.callback;
      checkoutOptions.callback = (transaction: ModemPayTransaction) => {
        if (walletOnly) removeWalletOnlyCSS();
        originalCallback?.(transaction);
      };

      return window.ModemPayCheckout({
        public_key: publicKey,
        ...checkoutOptions,
      });
    },
    []
  );

  return { isLoaded, openCheckout };
}
