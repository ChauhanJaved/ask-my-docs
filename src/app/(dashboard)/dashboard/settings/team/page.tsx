"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { canManageTeam, canChangeRoles, UserRole } from "@/lib/permissions";
import { Copy, Check, RefreshCw, Trash2, Mail, Link as LinkIcon } from "lucide-react";

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  status: string;
  token?: string;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>("member");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [orgId, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Invite form state
  const [inviting, setInviting] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");

  // Interaction feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }
      setCurrentUserId(user.id);

      // Get current user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const userRole = (profile.role as UserRole) || "member";
      setCurrentRole(userRole);
      setOrgId(profile.organization_id);

      // Get all active team members in organization
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: true });

      if (membersError) throw membersError;
      setMembers((membersData as Member[]) || []);

      // Fetch pending invitations
      if (canManageTeam(userRole)) {
        const { data: inviteData, error: inviteError } = await supabase
          .from("invitations")
          .select("id, email, role, created_at, status, token")
          .eq("organization_id", profile.organization_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (!inviteError && inviteData) {
          setInvitations(inviteData as Invitation[]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setError(null);
    setSuccessMsg(null);

    if (!canManageTeam(currentRole)) {
      setError("Only workspace Owners and Admins can invite team members.");
      return;
    }

    setInviting(true);
    try {
      // Call backend API route which handles DB insert and Resend email dispatch
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation.");
      }

      setSuccessMsg(data.message || `Invitation created for ${inviteEmail.trim()} as ${inviteRole.toUpperCase()}`);
      setInviteEmail("");
      setInviteRole("member");
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
      console.error("Error inviting member:", err);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyInviteLink = (token?: string, id?: string) => {
    if (!token || !id) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/accept-invite?token=${token}`;

    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleResendInvitation = async (invitationId: string) => {
    setResendingId(invitationId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/team/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend invitation");

      setSuccessMsg(data.message || "Invitation email resent successfully.");
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation.");
    } finally {
      setResendingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!canChangeRoles(currentRole)) {
      setError("Only the workspace Owner can modify member roles.");
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", memberId);

      if (updateError) throw updateError;

      setSuccessMsg("Member role updated successfully.");
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string, role: string) => {
    if (role === "owner") {
      setError("The workspace Owner cannot be removed.");
      return;
    }

    if (!canManageTeam(currentRole)) {
      setError("You do not have permission to remove team members.");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from this workspace?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", memberId);

      if (deleteError) throw deleteError;

      setSuccessMsg(`Member ${memberEmail} removed successfully.`);
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: revokeError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (revokeError) throw revokeError;

      setSuccessMsg("Invitation revoked successfully.");
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invitation.");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-medium">Loading workspace team details...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Team Workspace Settings</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage team collaboration, invite colleagues, and assign role-based access.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            Your Role: <strong className="capitalize text-brand-600 dark:text-brand-400">{currentRole}</strong>
          </span>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border-l-4 border-rose-500 text-rose-700 dark:text-rose-300 p-4 rounded-r-md text-xs">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300 p-4 rounded-r-md text-xs">
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Role Summary Banner */}
      <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Role Hierarchy Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800">
            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">👑 Owner</span>
            <p className="text-neutral-500 dark:text-neutral-400">Full control over Billing, Plans, Team Invites, Role Changes, and Bot Config.</p>
          </div>
          <div className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800">
            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">⚡ Admin</span>
            <p className="text-neutral-500 dark:text-neutral-400">Can invite members, manage documents & bot settings. Cannot touch billing.</p>
          </div>
          <div className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800">
            <span className="font-bold text-neutral-600 dark:text-neutral-300 block mb-1">👤 Member</span>
            <p className="text-neutral-500 dark:text-neutral-400">Can upload/delete documents, view analytics & test playground. Read-only settings.</p>
          </div>
        </div>
      </div>

      {/* Invite Member Section (Visible to Owner & Admin) */}
      {canManageTeam(currentRole) ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-200 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Invite Team Member via Resend & Direct Link</span>
          </h3>
          <form onSubmit={handleInviteMember} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="inviteEmail">
                  Email Address
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={inviting}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="inviteRole">
                  Role
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  disabled={inviting}
                >
                  <option value="member">Member (Upload docs & test bot)</option>
                  <option value="admin">Admin (Manage team & bot settings)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-brand-500" />
                <span>An invite email will be sent via Resend, and a shareable join link generated instantly.</span>
              </p>
              <Button
                type="submit"
                className={`bg-brand-600 hover:bg-brand-700 text-white text-xs ${inviting ? "opacity-50" : ""}`}
                disabled={inviting}
              >
                {inviting ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300">
          ℹ️ You are logged in as a <strong>Member</strong>. Contact your workspace Owner or Admin to invite new colleagues.
        </div>
      )}

      {/* Active Team Roster */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
            Active Workspace Members ({members.length})
          </h3>
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-xs">
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
                    {member.full_name || member.email.split("@")[0]}
                    {member.id === currentUserId && (
                      <span className="ml-2 text-[10px] font-normal px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    {canChangeRoles(currentRole) && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === "owner"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : member.role === "admin"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.role !== "owner" && canManageTeam(currentRole) ? (
                      <button
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold transition-colors disabled:opacity-30 text-xs"
                        onClick={() => handleRemoveMember(member.id, member.email, member.role)}
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invitations Section */}
      {canManageTeam(currentRole) && invitations.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <span>Pending Invitations ({invitations.length})</span>
              <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">(Sent via Resend & Direct Link)</span>
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                <th className="px-6 py-3">Invited Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Sent Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="px-6 py-4 text-neutral-900 dark:text-white font-medium">
                    {inv.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px]">
                      {inv.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyInviteLink(inv.token, inv.id)}
                      className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 font-semibold text-xs transition-colors bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 px-2.5 py-1 rounded"
                      title="Copy invitation link to clipboard"
                    >
                      {copiedId === inv.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Resend Email Button */}
                    <button
                      onClick={() => handleResendInvitation(inv.id)}
                      disabled={resendingId === inv.id}
                      className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold text-xs transition-colors bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 rounded disabled:opacity-50"
                      title="Resend email via Resend"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendingId === inv.id ? "animate-spin" : ""}`} />
                      <span>{resendingId === inv.id ? "Sending..." : "Resend"}</span>
                    </button>

                    {/* Revoke Button */}
                    <button
                      className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold text-xs transition-colors px-2 py-1"
                      onClick={() => handleRevokeInvitation(inv.id)}
                      title="Revoke invitation"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}