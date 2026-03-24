export type UserRole = "governanca" | "usuario";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  label: string;
  active: boolean;
  position: number;
}

/** Claims injetados no JWT pelo custom_access_token_hook */
export interface JwtClaims {
  sub: string;
  user_role?: UserRole;
  user_department?: string;
  user_active?: boolean;
}
