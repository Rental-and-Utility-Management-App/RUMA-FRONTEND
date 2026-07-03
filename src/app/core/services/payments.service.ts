import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Payment, PaymentMethod } from '../models';

const BASE = `${environment.apiUrl}/payments`;

export interface PaymentFilters {
  invoice_id?: string;
  room_id?: string;
}

export interface CreatePaymentPayload {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);

  list(filtersFn: () => PaymentFilters = () => ({})) {
    return httpResource<ApiResponse<Payment[]>>(() => {
      const f = filtersFn();
      const params = new URLSearchParams();
      if (f.invoice_id) params.set('invoice_id', f.invoice_id);
      if (f.room_id) params.set('room_id', f.room_id);
      const qs = params.toString();
      return qs ? `${BASE}?${qs}` : BASE;
    });
  }

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    // Backend chặn vượt số tiền còn lại của hóa đơn (luật #3)
    const res = await firstValueFrom(this.http.post<ApiResponse<Payment>>(BASE, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Ghi nhận thanh toán thất bại');
    return res.data;
  }

  async update(id: string, payload: Partial<CreatePaymentPayload>): Promise<Payment> {
    // Không sửa được payment tự động qua webhook (luật #9) — ẩn nút này ở UI khi is_auto_confirmed = true
    const res = await firstValueFrom(this.http.put<ApiResponse<Payment>>(`${BASE}/${id}`, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật thanh toán thất bại');
    return res.data;
  }

  async delete(id: string): Promise<void> {
    const res = await firstValueFrom(this.http.delete<ApiResponse<null>>(`${BASE}/${id}`));
    if (!res.success) throw new Error(res.message || 'Xóa thanh toán thất bại');
  }
}