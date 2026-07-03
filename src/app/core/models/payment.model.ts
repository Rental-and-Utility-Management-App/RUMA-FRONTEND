export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export interface Payment {
  id: string;
  invoice_id: string;
  room_id: string;
  tenant_id: string;
  tenant_ids?: string[];
  amount: number;
  method: PaymentMethod;
  note?: string;
  confirmed_by: string;
  is_auto_confirmed: boolean;
  external_transaction_id?: string;
  paid_at: string;
  created_at: string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
};
