"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserDropdown } from "@/components/user-dropdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

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
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Top Fixed Header Bar */}
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 transition-colors z-30">
        {/* Left Side: Landing Page Style FTChat Logo */}
        <Link href="/dashboard" className="flex items-center space-x-3 group shrink-0">
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

        {/* Right Side Controls: Theme Toggle + User Avatar Dropdown + Mobile Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <UserDropdown
            fullName={fullName}
            roleDisplay={roleDisplay}
            avatarUrl={avatarUrl}
            initials={initials}
            userEmail={userEmail}
          />

          {/* Mobile Sheet Trigger (Hamburger Menu on Right side next to Avatar) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open mobile navigation</span>
            </SheetTrigger>

            <SheetContent side="right" className="p-0 w-72 flex flex-col border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <SheetHeader className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between space-y-0">
                <SheetTitle className="text-left">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-600 to-ai-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-neutral-950 dark:text-white font-display">
                      FTChat
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Drawer Navigation */}
              <DashboardNav onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Workspace Body (Desktop Sidebar + Main Content) */}
      <div className="flex-1 flex min-w-0 h-[calc(100vh-4rem)] overflow-hidden">
        {/* Desktop Persistent / Collapsible Sidebar */}
        <aside
          className={cn(
            "hidden md:flex border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-col shrink-0 transition-all duration-300 ease-in-out z-20",
            mounted && isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Desktop Sidebar Collapse Toggle */}
          <div
            className={cn(
              "border-b border-neutral-200 dark:border-neutral-800 flex items-center p-3 transition-all duration-300",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!isCollapsed && (
              <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-2">
                Navigation
              </span>
            )}
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
        </aside>

        {/* Dashboard Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

