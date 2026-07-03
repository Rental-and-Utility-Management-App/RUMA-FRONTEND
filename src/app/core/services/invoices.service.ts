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

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);

  /** filtersFn là hàm getter để đọc filter reactive (giống pattern contractsByRoom) */
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
    // Chỉ sửa được khi paid_amount == 0 (luật #5)
    const res = await firstValueFrom(this.http.put<ApiResponse<Invoice>>(`${BASE}/${id}`, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật hóa đơn thất bại');
    return res.data;
  }

  async cancel(id: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<ApiResponse<null>>(`${BASE}/${id}/cancel`, {}));
    if (!res.success) throw new Error(res.message || 'Hủy hóa đơn thất bại');
  }

  /**
   * LƯU Ý: shape response chưa được brief mô tả chi tiết (chỉ nói "sinh mã VietQR").
   * Giả định field `qr_code` (base64 hoặc URL ảnh) — kiểm tra lại Swagger UI
   * (http://localhost:8080/swagger/index.html) để confirm field name chính xác,
   * rồi sửa lại type ở đây nếu khác.
   */
  async getQrCode(id: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<{ qr_code: string }>>(`${BASE}/${id}/qr-code`)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Không tạo được mã QR');
    return res.data.qr_code;
  }
}