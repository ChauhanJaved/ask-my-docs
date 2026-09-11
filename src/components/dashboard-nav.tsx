"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sliders,
  User,
  Users,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canManageBilling, canManageTeam, UserRole } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

interface DashboardNavProps {
  fullName?: string;
  role?: UserRole | string;
  roleDisplay?: string;
  avatarUrl?: string | null;
  initials?: string;
  userEmail?: string;
  onItemClick?: () => void;
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function DashboardNav({
  fullName = "User",
  role,
  roleDisplay = "Member",
  avatarUrl = null,
  initials = "U",
  userEmail,
  onItemClick,
  isCollapsed = false,
  onToggleSidebar,
}: DashboardNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole | string | undefined>(role);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentRole(role);
  }, [role]);

  useEffect(() => {
    async function loadClientProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.role) {
            setCurrentRole(profile.role as UserRole);
          }
        }
      } catch (err) {
        console.error("Error loading nav profile role:", err);
      }
    }
    loadClientProfile();
  }, []);

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

  const activeRole = (currentRole || role || "member").toString().toLowerCase();
  const displayRoleText =
    activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  const roleBadgeStyle =
    activeRole === "owner"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : activeRole === "admin"
      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Nav items strictly following user requested order:
  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Documents",
      href: "/dashboard/documents",
      icon: FileText,
    },
    {
      title: "Widget Config",
      href: "/dashboard/settings/widget",
      icon: Sliders,
    },
    {
      title: "Chat Logs",
      href: "/dashboard/chats",
      icon: MessageSquare,
    },
    {
      title: "Profile Settings",
      href: "/dashboard/settings/profile",
      icon: User,
    },
    {
      title: "Team Settings",
      href: "/dashboard/settings/team",
      icon: Users,
    },
    ...(canManageBilling(activeRole)
      ? [
          {
            title: "Billing & Plans",
            href: "/dashboard/settings/billing",
            icon: CreditCard,
          },
        ]
      : []),
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto">
      <div className="p-3 space-y-4">
        {/* Industry Standard User Profile Header Card */}
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center py-1">
            <button
              type="button"
              onClick={onToggleSidebar}
              title={`${fullName} (${displayRoleText}) — Click to expand navigation`}
              aria-label="Expand navigation"
              className="relative group p-0.5 rounded-full hover:ring-2 hover:ring-brand-500/30 focus:outline-none transition-all"
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-9 w-9 rounded-full object-cover shrink-0 border border-neutral-300 dark:border-neutral-700 shadow-xs"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {initials}
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/50 p-2.5 border border-neutral-200/60 dark:border-neutral-800 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0 gap-3">
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-9 w-9 rounded-full object-cover shrink-0 border border-neutral-300 dark:border-neutral-700 shadow-xs"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                  {fullName}
                </p>
                {userEmail && (
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight mt-0.5">
                    {userEmail}
                  </p>
                )}
                <span
                  className={cn(
                    "inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border",
                    roleBadgeStyle
                  )}
                >
                  {displayRoleText}
                </span>
              </div>
            </div>

            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                title="Collapse Navigation"
                aria-label="Collapse Navigation"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Item List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-150 group",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-xs border border-brand-200/50 dark:border-brand-800/50"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    active
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                  )}
                />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section: Theme Switcher & Sign Out */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        {/* Theme Mode Selector */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
              Theme Mode
            </div>
          )}
          <div
            className={cn(
              "grid gap-1 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-xl",
              isCollapsed ? "grid-cols-1" : "grid-cols-3"
            )}
          >
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const active = mounted && theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  title={isCollapsed ? `Theme: ${t.label}` : undefined}
                  className={cn(
                    "flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all duration-150",
                    active
                      ? "bg-white dark:bg-neutral-900 text-brand-600 dark:text-brand-400 shadow-xs font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {!isCollapsed && <span>{t.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign Out Action Button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title={isCollapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center gap-2.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors disabled:opacity-50",
            isCollapsed ? "justify-center px-2" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
          {!isCollapsed && (
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          )}
        </button>
      </div>
    </div>
  );
}


