export type UserRole = 'owner' | 'admin' | 'member';

/**
 * Checks if a given role has permission to manage billing, subscriptions, and plans.
 * Only workspace Owners can manage billing.
 */
export function canManageBilling(role?: UserRole | string | null): boolean {
  return role === 'owner';
}

/**
 * Checks if a given role has permission to invite, remove, or view team members.
 * Owners and Admins can manage team members.
 */
export function canManageTeam(role?: UserRole | string | null): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if a user with actorRole has permission to remove a team member with targetRole.
 * - Owners can remove Admins and Members.
 * - Admins can remove Members, but MUST NOT remove other Admins or Owners.
 * - Members cannot remove anyone.
 */
export function canRemoveMember(
  actorRole?: UserRole | string | null,
  targetRole?: UserRole | string | null
): boolean {
  if (!actorRole || !targetRole) return false;
  if (targetRole === 'owner') return false;

  if (actorRole === 'owner') {
    return targetRole === 'admin' || targetRole === 'member';
  }

  if (actorRole === 'admin') {
    return targetRole === 'member';
  }

  return false;
}

/**
 * Checks if a given role has permission to change member roles (e.g. promote Member to Admin).
 * Only workspace Owners can change member roles.
 */
export function canChangeRoles(role?: UserRole | string | null): boolean {
  return role === 'owner';
}

/**
 * Checks if a given role can modify global chatbot settings (name, prompt, tone).
 * Owners and Admins can update chatbot settings.
 */
export function canManageBotSettings(role?: UserRole | string | null): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if a given role can upload, process, or delete knowledge base documents.
 * Owners, Admins, and Members can manage documents.
 */
export function canManageDocuments(role?: UserRole | string | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}
