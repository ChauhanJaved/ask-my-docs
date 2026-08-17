import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(fullName);
  const roleDisplay = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Workspace Owner";

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col transition-colors">
        {/* Brand */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/dashboard" className="text-xl font-bold font-display text-brand-600 dark:text-brand-400 block">
            FTChat
          </Link>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Dashboard Hub</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/documents"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Documents
          </Link>
          <Link
            href="/dashboard/chats"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Chat Logs
          </Link>
          
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Settings</span>
          </div>

          <Link
            href="/dashboard/settings/widget"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Widget Config
          </Link>
          <Link
            href="/dashboard/settings/team"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Team Settings
          </Link>
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Billing
          </Link>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center space-x-3 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-9 w-9 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{fullName}</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{roleDisplay}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center px-8 justify-between transition-colors">
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-white font-display">Workspace Console</h2>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Free Plan
            </span>
            <Link href="/" className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline">
              Sign Out
            </Link>
          </div>
        </header>
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

