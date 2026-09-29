"use client";

import Script from "next/script";
import { useEffect } from "react";

export const FASTSPRING_POPUP_STOREFRONT = "frameworkteam.test.onfastspring.com/popup-frameworkteam";

declare global {
  interface Window {
    fastspring?: {
      builder: {
        push: (data: Record<string, unknown>, callback?: () => void) => void;
        reset: () => void;
        checkout: (productId?: string) => void;
        account?: {
          open: () => void;
          managementUrl?: () => string;
        };
      };
    };
    onFastSpringPopupClosed?: (data: Record<string, unknown> | null) => void;
  }
}

interface FastSpringScriptProps {
  onPopupClosed?: (data: Record<string, unknown> | null) => void;
}

export function FastSpringScript({ onPopupClosed }: FastSpringScriptProps) {
  useEffect(() => {
    // Register global callback for FastSpring SBL popup close event
    window.onFastSpringPopupClosed = (data) => {
      console.log("FastSpring popup closed:", data);
      if (onPopupClosed) {
        onPopupClosed(data);
      }
    };

    return () => {
      delete window.onFastSpringPopupClosed;
    };
  }, [onPopupClosed]);

  return (
    <Script
      id="fsc-api"
      src="https://sbl.onfastspring.com/sbl/1.0.9/fastspring-builder.min.js"
      data-storefront={FASTSPRING_POPUP_STOREFRONT}
      data-popup-closed="onFastSpringPopupClosed"
      data-test="true"
      data-debug="false"
      strategy="afterInteractive"
    />
  );
}

/**
 * Triggers FastSpring popup overlay checkout for a product with the current organization ID in tags.
 * Launches in Test Mode as an embedded in-app modal (PWA experience).
 */
export function openFastSpringCheckout(productId: string, organizationId: string) {
  console.log(`[BILLING_ACTION] 🛒 Opening FastSpring Checkout | Product: ${productId} | Org: ${organizationId}`);
  if (typeof window === "undefined" || !window.fastspring) {
    console.warn("[BILLING_ACTION] ⚠️ FastSpring SBL script not loaded yet. Opening direct storefront window.");
    window.open(
      `https://${FASTSPRING_POPUP_STOREFRONT}/${productId}?tags[organization_id]=${organizationId}`,
      "_blank"
    );
    return;
  }

  try {
    // Reset previous builder session
    window.fastspring.builder.reset();

    // Push test mode flag, product & organization tag to FastSpring popup builder
    window.fastspring.builder.push({
      test: true,
      products: [{ path: productId, quantity: 1 }],
      tags: {
        organization_id: organizationId,
      },
    });

    console.log(`[BILLING_ACTION] 🚀 Triggering fastspring.builder.checkout() popup`);
    // Launch the in-app popup modal overlay
    window.fastspring.builder.checkout();
  } catch (err) {
    console.error("[BILLING_ACTION] ❌ Error triggering FastSpring popup checkout:", err);
  }
}

/**
 * Opens the FastSpring Customer Account Portal (for active subscription & invoice management).
 */
export function openFastSpringAccountPortal() {
  console.log("[BILLING_ACTION] 🔑 Opening FastSpring Customer Account Management Portal");
  if (typeof window === "undefined") return;

  if (window.fastspring?.builder?.account?.open) {
    try {
      window.fastspring.builder.account.open();
      return;
    } catch (err) {
      console.warn("[BILLING_ACTION] ⚠️ FastSpring SBL account open error, falling back to direct URL portal:", err);
    }
  }

  // Direct FastSpring Account Portal fallback URL
  const portalUrl = `https://frameworkteam.test.onfastspring.com/account`;
  window.open(portalUrl, "_blank", "noopener,noreferrer");
}

