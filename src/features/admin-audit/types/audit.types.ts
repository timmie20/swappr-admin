// GET /admin/audit, /admin/audit/catalogue and /admin/vendors/:id/history.
// Contract: swappr-backend plan/vendor-tiers/FRONTEND_HANDOFF.md.
// Entries are append-only. An admin never receives delivery, payout,
// ledger, platform or admin_security entries (the backend leaves them out). Amounts are kobo.

export type AuditCategory =
  | 'vendor'
  | 'application'
  | 'product'
  | 'delivery'
  | 'payout'
  | 'ledger'
  | 'platform'
  | 'admin_security';

export type AuditActorType = 'system' | 'admin' | 'vendor' | 'customer';

export type AuditSubjectType =
  | 'vendor'
  | 'vendor_application'
  | 'product'
  | 'order'
  | 'delivery_review'
  | 'payout'
  | 'ledger_transaction'
  | 'settlement_sync_issue'
  | 'platform_fee_settings'
  | 'admin';

export interface AuditEntry {
  id: string;
  created_at: string;
  category: AuditCategory;
  event: string;
  actor_type: AuditActorType;
  actor_id: string | null;
  /** First + last name; null for system entries or no name */
  actor_name: string | null;
  subject_type: AuditSubjectType | null;
  subject_id: string | null;
  /** The subject's name or order number at the time */
  subject_label: string | null;
  vendor_id: string | null;
  vendor: {
    id: string;
    trading_name: string | null;
    business_name: string | null;
  } | null;
  /** Verbatim */
  reason: string | null;
  /** Vendor entries carry from_tier / to_tier here */
  metadata: Record<string, unknown> | null;
}

export interface AuditCatalogue {
  /** Only what the viewer may see */
  categories: { category: AuditCategory; events: string[] }[];
}

export interface QueryAuditParams {
  /** Comma-separated */
  category?: string;
  /** Comma-separated */
  event?: string;
  actor_type?: AuditActorType;
  /** Substring of the admin's name */
  actor?: string;
  /** Substring of trading or business name */
  vendor?: string;
  vendor_id?: string;
  subject_type?: AuditSubjectType;
  subject_id?: string;
  /** ISO date-times, inclusive */
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const CATEGORY_LABEL: Record<AuditCategory, string> = {
  vendor: 'Vendor',
  application: 'Application',
  product: 'Product',
  delivery: 'Delivery',
  payout: 'Payout',
  ledger: 'Ledger',
  platform: 'Platform',
  admin_security: 'Admin security'
};

export const ACTOR_LABEL: Record<AuditActorType, string> = {
  system: 'System',
  admin: 'Admin',
  vendor: 'Vendor',
  customer: 'Customer'
};

// Unknown events still render (humanised) — the catalogue is the authority
export const EVENT_LABEL: Record<string, string> = {
  // vendor standing
  profile_completed: 'Profile completed',
  id_verified: 'ID verified',
  business_lookup_matched: 'CAC lookup matched',
  business_confirmation_declined: 'Vendor declined CAC match',
  business_verified: 'Business verified',
  business_revoked: 'Business verification revoked',
  email_override: 'Email marked verified by admin',
  id_override: 'ID marked verified by admin',
  business_override: 'Business marked verified by admin',
  cac_attempts_reset: 'CAC attempts reset',
  suspended: 'Suspended',
  unsuspended: 'Unsuspended',
  migration: 'Migrated to tiers',
  inspection_verified: 'Inspection verified',
  inspection_revoked: 'Inspection revoked',
  inspection_requested: 'Inspection requested',
  inspection_request_declined: 'Inspection request declined',
  vendor_archived: 'Vendor archived',
  vendor_profile_edited: 'Vendor profile edited',
  // application
  application_review_started: 'Application review started',
  application_approved: 'Application approved',
  application_rejected: 'Application rejected',
  // product
  product_edited: 'Product edited',
  product_published: 'Product published',
  product_unpublished: 'Product unpublished',
  product_archived: 'Product archived',
  product_restored: 'Listing restored',
  product_deleted: 'Product deleted',
  // delivery
  delivery_confirmed_by_admin: 'Delivery confirmed by admin',
  delivery_review_closed: 'Delivery review closed',
  // payout
  payout_approved: 'Payout approved',
  payout_rejected: 'Payout rejected',
  payout_paid: 'Payout marked paid',
  payout_receipt_added: 'Payout receipt added',
  // ledger
  settlement_recorded: 'Settlement recorded',
  settlement_reversed: 'Settlement reversed',
  settlement_sync_run: 'Settlement sync run',
  sync_issue_resolved: 'Sync review item resolved',
  // platform (superadmin)
  platform_fee_standard_changed: 'Standard fee changed',
  platform_fee_promotion_set: 'Fee promotion set',
  platform_fee_promotion_ended: 'Fee promotion ended',
  // admin security (superadmin)
  admin_mfa_enabled: 'Turned on two-step sign-in',
  admin_mfa_reset: 'Two-step sign-in reset',
  admin_mfa_recovery_code_used: 'Signed in with a recovery code',
  admin_mfa_recovery_codes_regenerated: 'Made new recovery codes'
};

export const OVERRIDE_EVENTS = [
  'email_override',
  'id_override',
  'business_override'
];

export const humanise = (key: string) =>
  key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const eventLabel = (event: string) =>
  EVENT_LABEL[event] ?? humanise(event);
