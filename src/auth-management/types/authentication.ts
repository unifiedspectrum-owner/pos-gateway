/* TypeScript interfaces for authentication service data structures */

/* Login response data interface */
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  session_id?: string;
  requires_2fa: boolean;
  is_2fa_authenticated: boolean;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    is_2fa_required: boolean;
  };
}

/* User with role information interface */
export interface UserWithRole {
  id: number;
  email: string;
  f_name: string;
  l_name: string;
  password_hash: string;
  role_id: number;
  role_name: string;
  status: string;
  email_verified: number;
  phone_verified: number;
  account_locked_until: string | null;
  requires_password_change: number;
  last_password_change: string | null;
  is_active: number;
  is_2fa_required: number;
  is_2fa_enabled: number;
}