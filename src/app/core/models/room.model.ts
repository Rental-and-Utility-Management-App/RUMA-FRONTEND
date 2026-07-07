import { UserResponse } from './user.model';

export type RoomStatus = 'available' | 'occupied';

// Trạng thái thanh toán tiền phòng của THÁNG HIỆN TẠI, do backend tự suy ra
// từ hóa đơn (nếu có) mỗi khi trả về danh sách/chi tiết phòng - không cần gọi
// thêm API hóa đơn để biết phòng này tháng này đã đóng tiền chưa.
export type RoomPaymentStatus = 'no_invoice' | 'draft' | 'unpaid' | 'partial' | 'paid';

export interface RoomCurrentMonthPayment {
  month: number;
  year: number;
  status: RoomPaymentStatus;
  /** Chỉ có giá trị khi status !== 'no_invoice' */
  invoice_id?: string;
  total_amount?: number;
  paid_amount?: number;
  due_date?: string; // ISO date
  overdue?: boolean;
}

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
  current_month_payment?: RoomCurrentMonthPayment;
}

// Màu/nhãn badge dùng chung cho status của current_month_payment - đặt ở đây
// (thay vì khai báo riêng từng trang) để room-list và room-detail luôn hiển
// thị đồng nhất, theo đúng pattern DEPOSIT_STATUS_COLOR/LABEL ở contract.model.ts.
export const ROOM_PAYMENT_STATUS_COLOR: Record<RoomPaymentStatus, string> = {
  no_invoice: 'bg-[#F1EBD8] text-[#8A8270]',
  draft: 'bg-[#DCEBFC] text-[#1D4E89]',
  unpaid: 'bg-[#FBDDD5] text-[#9A3412]',
  partial: 'bg-[#FFE9AC] text-[#8A6200]',
  paid: 'bg-[#DFF3E1] text-[#1F7A34]',
};
export const ROOM_PAYMENT_STATUS_LABEL: Record<RoomPaymentStatus, string> = {
  no_invoice: 'Chưa có hóa đơn',
  draft: 'Chờ xác nhận',
  unpaid: 'Chưa đóng tiền',
  partial: 'Đóng một phần',
  paid: 'Đã đóng tiền',
};
// Màu/nhãn riêng cho trường hợp overdue=true (đè lên màu/nhãn status ở trên).
export const ROOM_PAYMENT_OVERDUE_COLOR = 'bg-[#F4B4A4] text-[#7A1F0D]';
export const ROOM_PAYMENT_OVERDUE_LABEL = 'Quá hạn';