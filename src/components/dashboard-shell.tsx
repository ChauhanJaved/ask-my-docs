"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserDropdown } from "@/components/user-dropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  fullName: string;
  roleDisplay: string;
  avatarUrl: string | null;
  initials: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  fullName,
  roleDisplay,
  avatarUrl,
  initials,
  userEmail,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read sidebar state preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem("ftchat_sidebar_collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("ftchat_sidebar_collapsed", String(nextState));
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Desktop Persistent / Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-col shrink-0 transition-all duration-300 ease-in-out z-30",
          mounted && isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand & Collapse Toggle Header */}
        <div
          className={cn(
            "border-b border-neutral-200 dark:border-neutral-800 flex items-center transition-all duration-300",
            isCollapsed ? "p-3 flex-col gap-2 justify-center" : "p-5 justify-between"
          )}
        >
          <Link href="/dashboard" className="flex flex-col min-w-0">
            {isCollapsed ? (
              <span className="text-lg font-black font-display tracking-tight text-brand-600 dark:text-brand-400">
                FT
              </span>
            ) : (
              <>
                <span className="text-xl font-bold font-display tracking-tight text-brand-600 dark:text-brand-400 truncate">
                  FTChat
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
                  Dashboard Hub
                </span>
              </>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Nav links */}
        <DashboardNav isCollapsed={isCollapsed} />

        {/* Desktop Sidebar Footer - User Quick View */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40">
          <div
            className={cn(
              "flex items-center space-x-3 overflow-hidden",
              isCollapsed && "justify-center space-x-0"
            )}
            title={isCollapsed ? `${fullName} (${roleDisplay})` : undefined}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-8 w-8 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {fullName}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  {roleDisplay}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Responsive Header Bar */}
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 transition-colors z-20">
          {/* Left Side: Mobile Menu Button + Workspace Context Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden p-2 -ml-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open mobile navigation</span>
              </SheetTrigger>

              <SheetContent side="left" className="p-0 w-72 flex flex-col border-r border-neutral-200 dark:border-neutral-800">
                <SheetHeader className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between space-y-0">
                  <SheetTitle className="text-left">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col"
                    >
                      <span className="text-xl font-bold font-display text-brand-600 dark:text-brand-400">
                        FTChat
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Dashboard Hub
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Drawer Navigation */}
                <DashboardNav onItemClick={() => setMobileOpen(false)} />

                {/* Mobile Drawer Footer */}
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Theme Mode</span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="h-9 w-9 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {fullName}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.2 rounded-full">
                        Free Plan
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-base sm:text-lg font-semibold text-neutral-950 dark:text-white font-display truncate">
              Console
            </h1>
          </div>

          {/* Right Side Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Free Plan Badge (visible on tablet/desktop) */}
            <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-semibold px-2.5 py-1 rounded-full shadow-2xs">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Free Plan
            </span>

            {/* Desktop Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Interactive User Dropdown (containing Sign Out, Profile & Mobile Theme/Plan) */}
            <UserDropdown
              fullName={fullName}
              roleDisplay={roleDisplay}
              avatarUrl={avatarUrl}
              initials={initials}
              userEmail={userEmail}
            />
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
