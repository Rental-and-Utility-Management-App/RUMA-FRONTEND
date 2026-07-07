import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Invoice } from '../models';

const BASE = `${environment.apiUrl}/invoices`;

export interface InvoiceFilters {
  room_id?: string;
  status?: string;
  month?: number;
  year?: number;
}

export interface CreateInvoicePayload {
  room_id: string;
  month: number;
  year: number;
  electric_new: number;
  water_new: number;
  other_fees?: number;
  other_note?: string;
  due_date: string;
}

/** Shape thực tế của response GET /invoices/:id/qr-code (đã confirm qua response mẫu) */
export interface QrCodeInfo {
  account_name: string;
  account_no: string;
  add_info: string;
  amount: number;
  bank_id: string;
  invoice_id: string;
  payment_ref_code: string;
  qr_code_url: string;
}

/** Payload cho POST /invoices/generate-draft - bỏ trống thì BE tự dùng tháng/năm hiện tại */
export interface GenerateDraftInvoicesPayload {
  month?: number;
  year?: number;
}

/** Response của POST /invoices/generate-draft (khớp scheduler.GenerateMonthlyDraftInvoices) */
export interface GenerateDraftInvoicesResult {
  created: number;
  skipped: number;
  errors: string[];
}

/** Payload cho PUT /invoices/:id/confirm - điền chỉ số điện/nước thật cho hóa đơn draft */
export interface ConfirmDraftInvoicePayload {
  electric_new: number;
  water_new: number;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);

  list(filtersFn: () => InvoiceFilters = () => ({})) {
    return httpResource<ApiResponse<Invoice[]>>(() => {
      const f = filtersFn();
      const params = new URLSearchParams();
      if (f.room_id) params.set('room_id', f.room_id);
      if (f.status) params.set('status', f.status);
      if (f.month) params.set('month', String(f.month));
      if (f.year) params.set('year', String(f.year));
      const qs = params.toString();
      return qs ? `${BASE}?${qs}` : BASE;
    });
  }

  async getById(id: string): Promise<Invoice> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Invoice>>(`${BASE}/${id}`));
    if (!res.success || !res.data) throw new Error(res.message || 'Không tìm thấy hóa đơn');
    return res.data;
  }

  async create(payload: CreateInvoicePayload): Promise<Invoice> {
    const res = await firstValueFrom(this.http.post<ApiResponse<Invoice>>(BASE, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Tạo hóa đơn thất bại');
    return res.data;
  }

  async update(id: string, payload: Partial<CreateInvoicePayload>): Promise<Invoice> {
    const res = await firstValueFrom(this.http.put<ApiResponse<Invoice>>(`${BASE}/${id}`, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật hóa đơn thất bại');
    return res.data;
  }

  async cancel(id: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<ApiResponse<null>>(`${BASE}/${id}/cancel`, {}));
    if (!res.success) throw new Error(res.message || 'Hủy hóa đơn thất bại');
  }

  /**
   * Trả về QrCodeInfo đầy đủ (không chỉ mỗi URL), vì response còn có
   * account_name, account_no, amount, bank_id, add_info... hữu ích để hiển thị
   * thông tin chuyển khoản thủ công bên cạnh ảnh QR.
   */
  async getQrCode(id: string): Promise<QrCodeInfo> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<QrCodeInfo>>(`${BASE}/${id}/qr-code`)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Không tạo được mã QR');
    return res.data;
  }

  /**
   * Tạo hóa đơn nháp (status='draft') cho mọi phòng đang có hợp đồng active
   * chưa có hóa đơn tháng/năm chỉ định (mặc định tháng/năm hiện tại nếu bỏ
   * trống). Dùng chung logic với cron job hàng ngày (xem internal/scheduler
   * bên BE) - manager có thể chạy tay qua nút "Tạo hóa đơn nháp đầu tháng".
   */
  async generateDraft(payload: GenerateDraftInvoicesPayload = {}): Promise<GenerateDraftInvoicesResult> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<GenerateDraftInvoicesResult>>(`${BASE}/generate-draft`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Tạo hóa đơn nháp thất bại');
    return res.data;
  }

  /**
   * Điền chỉ số điện/nước thật cho 1 hóa đơn đang ở trạng thái draft, hệ
   * thống tự tính lại total_amount và chuyển hóa đơn sang unpaid.
   */
  async confirmDraft(id: string, payload: ConfirmDraftInvoicePayload): Promise<Invoice> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<Invoice>>(`${BASE}/${id}/confirm`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Xác nhận hóa đơn thất bại');
    return res.data;
  }
}