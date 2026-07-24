export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms — converted from ISO at login/refresh
}

export interface AdminSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
}

export type LoginCredentials = {
  email: string;
  password: string;
};

/** Full admin record from /admins/me */
export type AdminProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};
