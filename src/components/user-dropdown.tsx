"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  LogOut,
  ChevronDown,
  Sparkles,
  Sliders,
  CreditCard,
  Shield,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

interface UserDropdownProps {
  fullName: string;
  roleDisplay: string;
  avatarUrl: string | null;
  initials: string;
  userEmail?: string;
}

export function UserDropdown({
  fullName,
  roleDisplay,
  avatarUrl,
  initials,
  userEmail,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Error signing out:", err);
      window.location.href = "/";
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="User account menu"
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-8 w-8 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {initials}
          </div>
        )}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[120px] truncate leading-tight">
            {fullName}
          </span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 max-w-[120px] truncate leading-tight">
            {roleDisplay}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200" />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-950/10 dark:shadow-black/50 py-2 z-50 animate-in fade-in-80 zoom-in-95 duration-150"
          role="menu"
        >
          {/* User Header Info */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {fullName}
              </p>
              {userEmail && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {userEmail}
                </p>
              )}
              <span className="inline-block mt-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                {roleDisplay}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="py-1">
            <Link
              href="/dashboard/settings/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              role="menuitem"
            >
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Profile Settings</span>
            </Link>
            <Link
              href="/dashboard/settings/widget"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              role="menuitem"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Widget Settings</span>
            </Link>
            <Link
              href="/dashboard/settings/team"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              role="menuitem"
            >
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>Team Settings</span>
            </Link>
            <Link
              href="/dashboard/settings/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              role="menuitem"
            >
              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
              <span>Billing & Plans</span>
            </Link>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

          {/* Sign Out Action */}
          <div className="px-1.5 py-1">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors disabled:opacity-50"
              role="menuitem"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
