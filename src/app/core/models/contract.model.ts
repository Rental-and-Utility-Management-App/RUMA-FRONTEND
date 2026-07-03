import { PaymentMethod } from './payment.model';

export type ContractStatus = 'active' | 'ended' | 'terminated' | 'cancelled';

export type DepositStatus =
  | 'unpaid'
  | 'partial'
  | 'held'
  | 'partial_refunded'
  | 'refunded'
  | 'forfeited';

export interface RenewalRecord {
  old_end_date: string;
  new_end_date: string;
  old_monthly_rent?: number;
  new_monthly_rent?: number;
  note?: string;
  created_by: string;
  created_at: string;
}

export interface Contract {
  id: string;
  room_id: string;
  room_code?: string;
  tenant_ids: string[];
  monthly_rent: number;
  deposit_amount: number;
  deposit_paid: number;
  deposit_refunded: number;
  deposit_status: DepositStatus;
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  status: ContractStatus;
  renewals?: RenewalRecord[];
  termination_reason?: string;
  note?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type DepositTxType = 'collect' | 'refund' | 'forfeit';

export interface DepositTransaction {
  id: string;
  contract_id: string;
  room_id: string;
  type: DepositTxType;
  amount: number;
  method?: PaymentMethod;
  note?: string;
  confirmed_by: string;
  created_at: string;
}

/** Màu badge cho deposit_status — dùng chung cho toàn app (luật nghiệp vụ #10) */
export const DEPOSIT_STATUS_COLOR: Record<DepositStatus, string> = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  held: 'bg-green-100 text-green-700',
  partial_refunded: 'bg-gray-100 text-gray-600',
  refunded: 'bg-gray-100 text-gray-600',
  forfeited: 'bg-black text-white',
};

export const DEPOSIT_STATUS_LABEL: Record<DepositStatus, string> = {
  unpaid: 'Chưa cọc',
  partial: 'Cọc một phần',
  held: 'Đang giữ cọc',
  partial_refunded: 'Đã hoàn một phần',
  refunded: 'Đã hoàn cọc',
  forfeited: 'Bị mất cọc',
};
