import React from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-12 md:py-16 text-xs text-neutral-500 dark:text-neutral-400 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Column 1: Brand Info */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center space-x-2 text-neutral-900 dark:text-white font-bold font-display text-sm">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span>{siteConfig.name}</span>
          </Link>
          <p className="leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-sm">
            {siteConfig.description}
          </p>
        </div>

        {/* Column 2: Quick Links (Header menu links + Contact, Log In, Sign Up) */}
        <div className="md:col-span-2">
          <h5 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h5>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4">
            <li>
              <Link href="/#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                FAQs
              </Link>
            </li>
            <li>
              <a
                href={siteConfig.links.contact}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Contact
              </a>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Log In
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-neutral-400 dark:text-neutral-500 gap-4">
        <p>© {new Date().getFullYear()}{" "}
          <a
            href={siteConfig.company.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors underline underline-offset-2"
          >
            {siteConfig.company.name}
          </a>
          . All rights reserved.
        </p>
        <div className="flex items-center space-x-6">
          <a
            href={siteConfig.links.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href={siteConfig.links.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Terms of Use
          </a>
        </div>
      </div>
    </footer>
  );
}
