"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  pricing: "Pricing",
  login: "Log In",
  signup: "Sign Up",
  "reset-password": "Reset Password",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Do not render breadcrumbs on homepage
  if (!pathname || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  let accumulatedPath = "";

  const items = segments.map((segment) => {
    accumulatedPath += `/${segment}`;
    const label =
      PATH_LABELS[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    return {
      label,
      href: accumulatedPath,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="container mx-auto px-6 py-4 border-b border-neutral-100 bg-neutral-50/50"
    >
      <ol className="flex items-center space-x-2 text-xs md:text-sm text-neutral-500">
        {/* Home Item */}
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-neutral-500 hover:text-brand-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </li>

        {/* Dynamic Path Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              {isLast ? (
                <span
                  className="font-medium text-neutral-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-neutral-500 hover:text-brand-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
