import React from "react";
import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-12 md:py-16 text-xs text-neutral-500 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Column 1: Brand Info */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-2 text-neutral-900 font-bold font-display text-sm">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span>FTChat</span>
          </Link>
          <p className="leading-relaxed text-neutral-500">
            Automated RAG-powered customer chatbot generation for B2B SaaS organizations.
          </p>
        </div>

        {/* Column 2: Product */}
        <div>
          <h5 className="font-bold text-neutral-900 uppercase tracking-wider mb-4">Product</h5>
          <ul className="space-y-2">
            <li>
              <Link href="/#features" className="hover:text-brand-600 transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-brand-600 transition-colors">
                Pricing Options
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-brand-600 transition-colors">
                Sign Up
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-600 transition-colors">
                Client Log In
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources */}
        <div>
          <h5 className="font-bold text-neutral-900 uppercase tracking-wider mb-4">Resources</h5>
          <ul className="space-y-2">
            <li>
              <Link href="/#faq" className="hover:text-brand-600 transition-colors">
                FAQs
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors inline-flex items-center">
                API Docs <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Crawl API
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Platform Status
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Legal */}
        <div>
          <h5 className="font-bold text-neutral-900 uppercase tracking-wider mb-4">Legal</h5>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                GDPR Deletion Request
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Security Audit Report
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-neutral-400">
        <p>© {new Date().getFullYear()} {siteConfig.company.name}.</p>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <a href="#" className="hover:text-neutral-600 transition-colors">
            Twitter / X
          </a>
          <a href="#" className="hover:text-neutral-600 transition-colors">
            GitHub Repository
          </a>
          <a href="#" className="hover:text-neutral-600 transition-colors">
            Discord Community
          </a>
        </div>
      </div>
    </footer>
  );
}
