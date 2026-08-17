"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Sliders,
  Users,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
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
    title: "Chat Logs",
    href: "/dashboard/chats",
    icon: MessageSquare,
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: "Widget Config",
    href: "/dashboard/settings/widget",
    icon: Sliders,
  },
  {
    title: "Team Settings",
    href: "/dashboard/settings/team",
    icon: Users,
  },
  {
    title: "Billing",
    href: "/dashboard/settings/billing",
    icon: CreditCard,
  },
];

interface DashboardNavProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

export function DashboardNav({ onItemClick, isCollapsed = false }: DashboardNavProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
      {/* Main Section */}
      <div className="space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase transition-opacity duration-200">
            Workspace
          </div>
        )}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group",
                isCollapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
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
      </div>

      {/* Settings Section */}
      <div className="space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase transition-opacity duration-200">
            Management
          </div>
        )}
        {settingsNavItems.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group",
                isCollapsed ? "justify-center px-2" : "px-3",
                active
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
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
      </div>
    </nav>
  );
}
