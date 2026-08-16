"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

export default function TeamSettingsPage() {
  interface Member {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  }

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>("");

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Get the user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get all members of the organization
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('organization_id', profile.organization_id);

      if (membersError) throw membersError;

      setMembers(membersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching team members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Get the user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if email already exists in the organization
      const { data: existingMember, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim())
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMember) {
        setError("User with this email is already a member of the organization");
        return;
      }

      // In a real implementation, you would send an invitation email
      // For now, we'll just create a placeholder member (this would normally be done via invitation flow)
      setError("Invitation sent! (Placeholder implementation)");

      // Reset form
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error inviting member:", err);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      // In a real app, you'd check permissions and possibly reassign ownership
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      // Refresh the member list
      await fetchTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error removing member:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">Loading team members...</div>;
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/50 border-l-4 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 p-4 mb-6">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Team Workspace Settings</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage collaborative permissions and organization user roles.</p>
        </div>
        <Button className="bg-brand-600 hover:bg-brand-700 text-white">
          Invite Member
        </Button>
      </div>

      {/* Invite Member Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm transition-colors">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-200 dark:border-neutral-800 pb-4">Invite Team Member</h3>
        <form onSubmit={handleInviteMember} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="inviteEmail">
              Email Address
            </label>
            <input
              type="email"
              id="inviteEmail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              disabled={inviting}
            />
          </div>
          <Button
            type="submit"
            className={`w-full bg-brand-600 hover:bg-brand-700 text-white text-xs ${
              inviting ? "opacity-50" : ""
            }`}
            disabled={inviting}
          >
            {inviting ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </div>

      {/* Team Roster */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm transition-colors">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Active Workspace Members ({members.length})</h3>
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            No team members found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">
                    {member.full_name || member.email.split('@')[0]}
                  </td>
                  <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={member.role === 'owner' ? "text-brand-600 dark:text-brand-400 font-semibold" : member.role === 'admin' ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400"}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold disabled:opacity-30 transition-colors"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={member.role === 'owner'} // Prevent removing owner
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}