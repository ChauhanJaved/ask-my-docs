"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-ai-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display text-neutral-950 tracking-tight leading-none">
              FTChat
            </span>
            <span className="text-[10px] text-neutral-500 font-medium tracking-wide mt-0.5">
              by {siteConfig.company.name}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-600">
          <Link
            href={isHomePage ? "#features" : "/#features"}
            className="hover:text-brand-600 transition-colors"
          >
            Features
          </Link>
          <Link
            href={isHomePage ? "#how-it-works" : "/#how-it-works"}
            className="hover:text-brand-600 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`transition-colors ${
              pathname === "/pricing"
                ? "text-brand-600 font-semibold"
                : "hover:text-brand-600"
            }`}
          >
            Pricing
          </Link>
          <Link
            href={isHomePage ? "#faq" : "/#faq"}
            className="hover:text-brand-600 transition-colors"
          >
            FAQs
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-brand-600 hover:bg-neutral-100 font-medium"
            >
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-brand-500/10"
            >
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile Shadcn Sheet Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none transition-colors"
            >
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
              <div>
                <SheetHeader className="pb-6 border-b border-neutral-100">
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-600 to-ai-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-neutral-950 font-display">FTChat</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col space-y-4 pt-6 text-base font-medium text-neutral-700">
                  <Link
                    href={isHomePage ? "#features" : "/#features"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-brand-600 transition-colors py-1"
                  >
                    Features
                  </Link>
                  <Link
                    href={isHomePage ? "#how-it-works" : "/#how-it-works"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-brand-600 transition-colors py-1"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-brand-600 transition-colors py-1"
                  >
                    Pricing
                  </Link>
                  <Link
                    href={isHomePage ? "#faq" : "/#faq"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-brand-600 transition-colors py-1"
                  >
                    FAQs
                  </Link>
                </nav>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex flex-col space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white justify-center">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
