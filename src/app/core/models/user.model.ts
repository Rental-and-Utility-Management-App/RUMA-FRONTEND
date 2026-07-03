export type Role = 'manager' | 'tenant';

export interface UserResponse {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: Role;
  room_id?: string; // chỉ tenant mới có
  is_active: boolean;
}

export interface JwtPayload {
  user_id: string;
  role: Role;
  exp: number;
  iat?: number;
}
