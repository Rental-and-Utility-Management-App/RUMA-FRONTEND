import { Room } from './room.model';

export type Role = 'manager' | 'tenant';

export interface UserResponse {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: Role;
  room_id?: string; 
  is_active: boolean;
  room?: Room; 
}

export interface JwtPayload {
  user_id: string;
  role: Role;
  exp: number;
  iat?: number;
}