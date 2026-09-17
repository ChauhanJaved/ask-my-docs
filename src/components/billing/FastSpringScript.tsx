"use client";

import Script from "next/script";
import { useEffect } from "react";

export const FASTSPRING_POPUP_STOREFRONT = "frameworkteam.onfastspring.com/popup-frameworkteam";

declare global {
  interface Window {
    fastspring?: {
      builder: {
        push: (data: Record<string, unknown>, callback?: () => void) => void;
        reset: () => void;
        checkout: (productId?: string) => void;
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
      data-debug="false"
      strategy="afterInteractive"
    />
  );
}

/**
 * Triggers FastSpring popup overlay checkout for a product with the current organization ID in tags.
 * Launches as an embedded in-app modal (PWA experience).
 */
export function openFastSpringCheckout(productId: string, organizationId: string) {
  if (typeof window === "undefined" || !window.fastspring) {
    console.warn("FastSpring SBL script not loaded yet. Opening popup storefront window.");
    window.open(
      `https://${FASTSPRING_POPUP_STOREFRONT}/${productId}?tags[organization_id]=${organizationId}`,
      "_blank"
    );
    return;
  }

  try {
    // Reset previous builder session
    window.fastspring.builder.reset();

    // Push product & organization tag to FastSpring popup builder
    window.fastspring.builder.push({
      products: [{ path: productId, quantity: 1 }],
      tags: {
        organization_id: organizationId,
      },
    });

    // Launch the in-app popup modal overlay
    window.fastspring.builder.checkout();
  } catch (err) {
    console.error("Error triggering FastSpring popup checkout:", err);
  }
}
