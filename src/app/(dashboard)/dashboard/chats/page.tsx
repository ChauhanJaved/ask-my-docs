import { Button } from "@/components/ui/button";

export default function ChatsPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Chat History & Logs</h1>
        <p className="text-sm text-neutral-500">Review user interactions, AI confidence ratings, and customer ratings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Chats list */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-[500px]">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
            <div className="p-4 hover:bg-neutral-50 cursor-pointer bg-brand-50/20 border-l-2 border-brand-500">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-neutral-800">Session #88392</span>
                <span className="text-[10px] text-neutral-400">10 mins ago</span>
              </div>
              <p className="text-[11px] text-neutral-600 truncate">Customer: How do I reset my password?</p>
              <div className="mt-2 flex space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  Completed
                </span>
                <span className="bg-neutral-100 text-neutral-600 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  96% Confidence
                </span>
              </div>
            </div>

            <div className="p-4 hover:bg-neutral-50 cursor-pointer">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-neutral-800">Session #88390</span>
                <span className="text-[10px] text-neutral-400">1 hour ago</span>
              </div>
              <p className="text-[11px] text-neutral-600 truncate">Customer: Can you support billing custom tax?</p>
              <div className="mt-2 flex space-x-2">
                <span className="bg-amber-100 text-amber-800 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  Low Confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Thread transcript viewer */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/30">
            <div>
              <h3 className="font-semibold text-sm text-neutral-900">Session #88392 Transcript</h3>
              <p className="text-[10px] text-neutral-400">Customer resolved query autonomously via RAG bot</p>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              Export Log
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex flex-col items-start max-w-[80%]">
              <span className="text-[10px] font-semibold text-neutral-500 mb-1">Customer</span>
              <div className="bg-neutral-100 text-neutral-800 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none">
                How do I reset my password?
              </div>
            </div>

            <div className="flex flex-col items-end ml-auto max-w-[80%]">
              <span className="text-[10px] font-semibold text-brand-600 mb-1">AI Support Bot</span>
              <div className="bg-brand-600 text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-none">
                You can reset your password by going to the Settings page, clicking on Security, and clicking the &quot;Reset Password&quot; button. A password reset link will be emailed to you.
              </div>
              <span className="text-[9px] text-neutral-400 mt-1">Grounded in user-guide.md [Page 2]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
