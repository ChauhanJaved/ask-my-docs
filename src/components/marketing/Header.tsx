"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Bot,
  Menu,
  Sparkles,
  Zap,
  CreditCard,
  HelpCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
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

  const navItems = [
    {
      label: "Features",
      href: isHomePage ? "#features" : "/#features",
      icon: Sparkles,
      isActive: false,
    },
    {
      label: "How It Works",
      href: isHomePage ? "#how-it-works" : "/#how-it-works",
      icon: Zap,
      isActive: false,
    },
    {
      label: "Pricing",
      href: "/pricing",
      icon: CreditCard,
      isActive: pathname === "/pricing",
    },
    {
      label: "FAQs",
      href: isHomePage ? "#faq" : "/#faq",
      icon: HelpCircle,
      isActive: false,
    },
  ];

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-ai-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display text-neutral-950 dark:text-white tracking-tight leading-none">
              FTChat
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide mt-0.5">
              by {siteConfig.company.name}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Link
            href={isHomePage ? "#features" : "/#features"}
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Features
          </Link>
          <Link
            href={isHomePage ? "#how-it-works" : "/#how-it-works"}
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`transition-colors ${
              pathname === "/pricing"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "hover:text-brand-600 dark:hover:text-brand-400"
            }`}
          >
            Pricing
          </Link>
          <Link
            href={isHomePage ? "#faq" : "/#faq"}
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            FAQs
          </Link>
        </nav>

        {/* Desktop Action Buttons & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-3">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-600 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium"
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

        {/* Mobile View Toggle & Sheet Menu */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none transition-colors"
            >
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800"
            >
              <div>
                <SheetHeader className="pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-600 to-ai-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-neutral-950 dark:text-white font-display">
                      FTChat
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col space-y-1.5 pt-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                          item.isActive
                            ? "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-semibold"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              item.isActive
                                ? "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Action Buttons Block: Primary CTA first, then Log In */}
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col space-y-3">
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white justify-center shadow-sm font-semibold h-11">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-neutral-700 dark:text-neutral-300 h-11 font-medium border-neutral-200 dark:border-neutral-800"
                  >
                    Log In
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
