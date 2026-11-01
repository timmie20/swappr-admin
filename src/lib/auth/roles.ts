// Finance and delivery-review actions are superadmin-only on the backend (a
// plain `admin` gets 403). Hiding them in the UI is a courtesy — the API is
// the enforcement, so screens must still handle a 403.
export const SUPERADMIN_ROLE = 'superadmin';

export function isSuperadmin(role: string | null | undefined): boolean {
  return role === SUPERADMIN_ROLE;
}
