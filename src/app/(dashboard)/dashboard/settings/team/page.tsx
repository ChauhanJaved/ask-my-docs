"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import {
  canManageTeam,
  canChangeRoles,
  canRemoveMember,
  canManageOrganization,
  UserRole,
} from "@/lib/permissions";
import {
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Mail,
  Link as LinkIcon,
  Users,
  Clock,
  ShieldCheck,
  Building2,
  Pencil,
  Save,
  X,
  Info,
} from "lucide-react";

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
  const [orgName, setOrgName] = useState<string>("");
  const [editOrgName, setEditOrgName] = useState<string>("");
  const [isEditingOrgName, setIsEditingOrgName] = useState<boolean>(false);
  const [isSavingOrgName, setIsSavingOrgName] = useState<boolean>(false);
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

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

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

      // Fetch organization details
      if (profile.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", profile.organization_id)
          .single();

        if (!orgError && orgData) {
          setOrgName(orgData.name || "My Organization");
          setEditOrgName(orgData.name || "My Organization");
        }
      }

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

  const handleUpdateOrgName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editOrgName.trim();
    if (!trimmedName) {
      setError("Organization name cannot be empty.");
      return;
    }

    if (!canManageOrganization(currentRole)) {
      setError("Only the workspace Owner can change the organization name.");
      return;
    }

    setIsSavingOrgName(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          name: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (updateError) throw updateError;

      setOrgName(trimmedName);
      setIsEditingOrgName(false);
      setSuccessMsg("Organization name updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organization name.");
      console.error("Error updating organization name:", err);
    } finally {
      setIsSavingOrgName(false);
    }
  };

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

    if (!canRemoveMember(currentRole, role)) {
      if (currentRole === "admin" && role === "admin") {
        setError("Admins cannot remove other Admins.");
      } else {
        setError("You do not have permission to remove this team member.");
      }
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
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Loading workspace team details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full px-1 sm:px-2">
      {/* Page Header (Role badge removed as role is shown in user avatar area) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white tracking-tight">
              Team Workspace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            View team members, invite colleagues, and manage organization settings and access control.
          </p>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 text-rose-700 dark:text-rose-300 p-3.5 sm:p-4 rounded-r-xl text-xs shadow-2xs animate-in fade-in duration-200">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-300 p-3.5 sm:p-4 rounded-r-xl text-xs shadow-2xs animate-in fade-in duration-200">
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Organization Settings Section (Owner can change org name as per industry standard) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-white font-display">Organization Profile</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage primary workspace identity and organization settings.</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          {isEditingOrgName && canManageOrganization(currentRole) ? (
            <form onSubmit={handleUpdateOrgName} className="space-y-3 max-w-xl">
              <div>
                <label htmlFor="orgNameInput" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Organization Name
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="orgNameInput"
                    type="text"
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-medium"
                    placeholder="Enter organization name"
                    disabled={isSavingOrgName}
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={isSavingOrgName}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingOrgName ? "Saving..." : "Save"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingOrgName}
                      onClick={() => {
                        setEditOrgName(orgName);
                        setIsEditingOrgName(false);
                      }}
                      className="text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Organization Name</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-neutral-900 dark:text-white font-display">{orgName || "Loading..."}</span>
                </div>
              </div>

              {canManageOrganization(currentRole) ? (
                <Button
                  type="button"
                  onClick={() => setIsEditingOrgName(true)}
                  className="w-full sm:w-auto bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Edit Name</span>
                </Button>
              ) : (
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 italic bg-neutral-200/50 dark:bg-neutral-900 px-3 py-1 rounded-full border border-neutral-200/80 dark:border-neutral-800">
                  Only Workspace Owner can edit org name
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Section (Visible to Owner & Admin) */}
      {canManageTeam(currentRole) && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-100 dark:border-neutral-800/80 pb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200/60 dark:border-brand-900/50">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span>Invite Team Member</span>
          </h3>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              <div className="md:col-span-7 lg:col-span-8">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="inviteEmail">
                  Email Address
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  disabled={inviting}
                  required
                />
              </div>
              <div className="md:col-span-5 lg:col-span-4">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="inviteRole">
                  Role
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-medium"
                  disabled={inviting}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3 text-brand-500 shrink-0" />
                <span>An invitation email will be sent along with a shareable join link.</span>
              </p>
              <Button
                type="submit"
                className={`w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-5 py-2.5 rounded-lg transition-colors shadow-xs shrink-0 ${inviting ? "opacity-50" : ""}`}
                disabled={inviting}
              >
                {inviting ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </div>
          </form>

          {/* Industry Standard Role Permissions & Limitations Breakdown */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Role Permissions & Limitations</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    Member
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                    Standard Role
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Can upload knowledge base documents, manage chat sessions, and test AI chatbot features.
                </p>
                <div className="pt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Limitation: Cannot invite members, alter roles, or edit organization profile.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    Admin
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                    Management Role
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  Can invite new members, remove members, and configure chatbot parameters & document pipelines.
                </p>
                <div className="pt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Limitation: Cannot change member roles, edit organization name, or manage billing.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Team Roster */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-display">
            <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Active Workspace Members ({members.length})</span>
          </h3>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 dark:text-neutral-400 text-xs">
            No team members found.
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px / sm) */}
            <div className="block sm:hidden divide-y divide-neutral-200/80 dark:divide-neutral-800">
              {members.map((member) => (
                <div key={member.id} className="p-4 space-y-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {getInitials(member.full_name, member.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                            {member.full_name || member.email.split("@")[0]}
                          </p>
                          {member.id === currentUserId && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-mono">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                    <div>
                      {canChangeRoles(currentRole) && member.role !== "owner" ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                          className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.role === "owner"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                              : member.role === "admin"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          {member.role}
                        </span>
                      )}
                    </div>

                    <div>
                      {canRemoveMember(currentRole, member.role) ? (
                        <button
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold text-xs px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 transition-colors"
                          onClick={() => handleRemoveMember(member.id, member.email, member.role)}
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table View (>= 640px / sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-neutral-50/80 dark:bg-neutral-950/80 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/80 dark:border-neutral-800 tracking-wider">
                    <th className="px-4 py-3.5 md:px-6">User</th>
                    <th className="px-4 py-3.5 md:px-6">Email</th>
                    <th className="px-4 py-3.5 md:px-6">Role</th>
                    <th className="px-4 py-3.5 md:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800 text-xs">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3.5 md:px-6 md:py-4 font-semibold text-neutral-900 dark:text-white">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                            {getInitials(member.full_name, member.email)}
                          </div>
                          <span className="truncate max-w-[120px] md:max-w-[180px] lg:max-w-xs">
                            {member.full_name || member.email.split("@")[0]}
                          </span>
                          {member.id === currentUserId && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 md:py-4 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                        <span className="block truncate max-w-[150px] md:max-w-[220px] lg:max-w-none">
                          {member.email}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 md:px-6 md:py-4 whitespace-nowrap">
                        {canChangeRoles(currentRole) && member.role !== "owner" ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              member.role === "owner"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                : member.role === "admin"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                            }`}
                          >
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 md:px-6 md:py-4 text-right whitespace-nowrap">
                        {canRemoveMember(currentRole, member.role) ? (
                          <button
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold transition-colors disabled:opacity-30 text-xs px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
            </div>
          </>
        )}
      </div>

      {/* Pending Invitations Section */}
      {canManageTeam(currentRole) && invitations.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-2 font-display">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Invitations ({invitations.length})</span>
            </h3>
          </div>

          {/* Mobile Card View (< 640px / sm) */}
          <div className="block sm:hidden divide-y divide-neutral-200/80 dark:divide-neutral-800">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-neutral-900 dark:text-white truncate font-mono">
                      {inv.email}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shrink-0">
                      Pending
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5">
                    <span>
                      Role: <strong className="capitalize text-neutral-700 dark:text-neutral-300">{inv.role}</strong>
                    </span>
                    <span>Sent: {new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                  {/* Copy Link Button */}
                  <button
                    onClick={() => handleCopyInviteLink(inv.token, inv.id)}
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 dark:text-brand-400 font-semibold text-xs transition-colors bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 px-3 py-1.5 rounded-lg"
                    title="Copy invitation link to clipboard"
                  >
                    {copiedId === inv.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Resend Email Button */}
                  <button
                    onClick={() => handleResendInvitation(inv.id)}
                    disabled={resendingId === inv.id}
                    className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold text-xs transition-colors bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    title="Resend invitation email"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingId === inv.id ? "animate-spin" : ""}`} />
                    <span>{resendingId === inv.id ? "Sending..." : "Resend"}</span>
                  </button>

                  {/* Revoke Button */}
                  <button
                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold text-xs transition-colors px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30"
                    onClick={() => handleRevokeInvitation(inv.id)}
                    title="Revoke invitation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet & Desktop Table View (>= 640px / sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-neutral-950/80 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/80 dark:border-neutral-800 tracking-wider">
                  <th className="px-4 py-3.5 md:px-6">Invited Email</th>
                  <th className="px-4 py-3.5 md:px-6">Role</th>
                  <th className="px-4 py-3.5 md:px-6">Sent Date</th>
                  <th className="px-4 py-3.5 md:px-6">Status</th>
                  <th className="px-4 py-3.5 md:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800 text-xs">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3.5 md:px-6 md:py-4 text-neutral-900 dark:text-white font-medium font-mono text-[11px]">
                      <span className="block truncate max-w-[140px] md:max-w-[200px] lg:max-w-none">
                        {inv.email}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 md:py-4 whitespace-nowrap">
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] border border-neutral-200 dark:border-neutral-700">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 md:py-4 text-neutral-500 dark:text-neutral-400 text-[11px] whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 md:px-6 md:py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-3.5 md:px-6 md:py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 md:gap-2">
                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyInviteLink(inv.token, inv.id)}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 font-semibold text-xs transition-colors bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 px-2.5 py-1 rounded-md"
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
                          className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold text-xs transition-colors bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 rounded-md disabled:opacity-50"
                          title="Resend invitation email"
                        >
                          <RefreshCw className={`w-3 h-3 ${resendingId === inv.id ? "animate-spin" : ""}`} />
                          <span>{resendingId === inv.id ? "Sending..." : "Resend"}</span>
                        </button>

                        {/* Revoke Button */}
                        <button
                          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold text-xs transition-colors px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}