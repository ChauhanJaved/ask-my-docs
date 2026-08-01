import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">Knowledge Documents</h1>
          <p className="text-sm text-neutral-500">Sync text files, Markdown files, or crawl websites to teach your AI bot.</p>
        </div>
        <Button className="bg-brand-600 hover:bg-brand-700 text-white">
          + Ingest File
        </Button>
      </div>

      {/* Drag & Drop mockup */}
      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-10 text-center bg-white hover:border-brand-400 transition-colors cursor-pointer">
        <p className="text-sm font-semibold text-neutral-700">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-neutral-400 mt-1">Supports PDF, TXT, MD, DOCX up to 10MB</p>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold text-sm text-neutral-900">Ingested Sources</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
              <th className="px-6 py-3">Source Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Ingested At</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-xs">
            <tr>
              <td className="px-6 py-4 font-medium text-neutral-900">user-guide.md</td>
              <td className="px-6 py-4 text-neutral-500">Markdown</td>
              <td className="px-6 py-4 text-neutral-500">2026-08-01 10:24</td>
              <td className="px-6 py-4">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-neutral-400 hover:text-neutral-600 mr-4 font-semibold">View Chunks</button>
                <button className="text-rose-600 hover:text-rose-800 font-semibold">Delete</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-neutral-900">faq-sheet.pdf</td>
              <td className="px-6 py-4 text-neutral-500">PDF Document</td>
              <td className="px-6 py-4 text-neutral-500">2026-08-01 10:25</td>
              <td className="px-6 py-4">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-neutral-400 hover:text-neutral-600 mr-4 font-semibold">View Chunks</button>
                <button className="text-rose-600 hover:text-rose-800 font-semibold">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
