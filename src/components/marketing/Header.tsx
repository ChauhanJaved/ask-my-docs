"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";

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
            <span className="text-[10px] text-neutral-500 font-medium tracking-wider uppercase mt-0.5">
              SaaS Platform
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-neutral-100 text-neutral-600 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-6 py-4 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-neutral-700">
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
          <div className="pt-3 border-t border-neutral-100 flex flex-col space-y-2">
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
        </div>
      )}
    </header>
  );
}
