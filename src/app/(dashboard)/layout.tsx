import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-neutral-200">
          <Link href="/dashboard" className="text-xl font-bold font-display text-brand-600 block">
            AskMyDocs
          </Link>
          <span className="text-xs text-neutral-500 font-medium">Dashboard Hub</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/documents"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Documents
          </Link>
          <Link
            href="/dashboard/chats"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Chat Logs
          </Link>
          
          <div className="pt-4 pb-2 px-4">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Settings</span>
          </div>

          <Link
            href="/dashboard/settings/widget"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Widget Config
          </Link>
          <Link
            href="/dashboard/settings/team"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Team Settings
          </Link>
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            Billing
          </Link>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
              JD
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-800">John Doe</p>
              <p className="text-[10px] text-neutral-500">Workspace Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center px-8 justify-between">
          <h2 className="text-lg font-semibold text-neutral-950 font-display">Workspace Console</h2>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Free Plan
            </span>
            <Link href="/" className="text-xs text-neutral-500 hover:underline">
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
