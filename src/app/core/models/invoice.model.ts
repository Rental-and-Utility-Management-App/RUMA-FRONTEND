export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  room_id: string;
  tenant_id: string;
  tenant_ids?: string[];
  month: number; // 1-12
  year: number;
  rent_amount: number;
  electric_old: number;
  electric_new: number;
  electric_price: number;
  electric_amount: number;
  water_old: number;
  water_new: number;
  water_price: number;
  water_amount: number;
  other_fees?: number;
  other_note?: string;
  occupants: number;
  management_fee_per_person: number;
  management_fee_amount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  payment_ref_code?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
};
