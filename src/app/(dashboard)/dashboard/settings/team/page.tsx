import { Button } from "@/components/ui/button";

export default function TeamSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">Team Workspace Settings</h1>
          <p className="text-sm text-neutral-500">Manage collaborative permissions and organization user roles.</p>
        </div>
        <Button className="bg-brand-600 hover:bg-brand-700 text-white">
          Invite Member
        </Button>
      </div>

      {/* Team Roster */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold text-sm text-neutral-900">Active Workspace Members</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-200">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-xs">
            <tr>
              <td className="px-6 py-4 font-semibold text-neutral-900">John Doe</td>
              <td className="px-6 py-4 text-neutral-500">john@example.com</td>
              <td className="px-6 py-4 text-brand-600 font-semibold">Owner</td>
              <td className="px-6 py-4 text-right text-neutral-400">-</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-semibold text-neutral-900">Sarah Jenkins</td>
              <td className="px-6 py-4 text-neutral-500">sarah@example.com</td>
              <td className="px-6 py-4 text-neutral-600">Admin</td>
              <td className="px-6 py-4 text-right">
                <button className="text-rose-600 hover:text-rose-800 font-semibold">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
