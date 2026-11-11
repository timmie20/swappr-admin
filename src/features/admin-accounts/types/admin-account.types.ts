// GET /admins and POST /admins/:userId/mfa/reset (superadmin only).
// Contract: swappr-backend plan/security-hardening/FE_HANDOFF_admin_mfa.md §2.

export interface AdminAccount {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  /** When two-step sign-in was turned on; null if not set up */
  mfa_enabled_at: string | null;
  last_signIn: string | null;
  created_at: string;
}

export const RESET_REASON_MIN = 5;
export const RESET_REASON_MAX = 500;

export const adminName = (a: AdminAccount) =>
  [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email;
