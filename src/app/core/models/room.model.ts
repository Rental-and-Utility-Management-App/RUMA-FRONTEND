import { UserResponse } from './user.model';

export type RoomStatus = 'available' | 'occupied';

export interface Room {
  id: string;
  code: string;
  name?: string;
  floor?: number;
  tenant_ids?: string[];
  capacity: number;
  monthly_rent: number;
  price_electricity: number;
  price_water: number;
  occupants: number;
  management_fee_per_person: number;
  status: RoomStatus;
  note?: string;
  created_at: string; // ISO date
  updated_at: string;
  tenants?: UserResponse[]; 
}