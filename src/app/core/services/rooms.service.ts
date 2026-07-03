import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Room } from '../models';

const BASE = `${environment.apiUrl}/rooms`;

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private http = inject(HttpClient);

  /**
   * Danh sách phòng — dùng httpResource() (stable từ Angular 22) thay vì tự subscribe.
   * Tenant sẽ tự chỉ nhận về phòng của mình (backend filter theo role, không cần xử lý ở FE).
   * Gọi `.reload()` trên resource sau khi tạo/sửa/xóa để refresh danh sách.
   */
  roomsResource = httpResource<ApiResponse<Room[]>>(() => BASE);

  async getById(id: string): Promise<Room> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Room>>(`${BASE}/${id}`));
    if (!res.success || !res.data) throw new Error(res.message || 'Không tìm thấy phòng');
    return res.data;
  }

  async create(payload: Partial<Room>): Promise<Room> {
    const res = await firstValueFrom(this.http.post<ApiResponse<Room>>(BASE, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Tạo phòng thất bại');
    return res.data;
  }

  async update(id: string, payload: Partial<Room>): Promise<Room> {
    const res = await firstValueFrom(this.http.put<ApiResponse<Room>>(`${BASE}/${id}`, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật phòng thất bại');
    return res.data;
  }

  async delete(id: string): Promise<void> {
    // Backend chặn nếu còn tenant (luật nghiệp vụ #1 liên quan) — message lỗi tiếng Việt sẽ hiện thẳng
    const res = await firstValueFrom(this.http.delete<ApiResponse<null>>(`${BASE}/${id}`));
    if (!res.success) throw new Error(res.message || 'Xóa phòng thất bại');
  }

  /** Legacy — ưu tiên dùng ContractsService.checkout() thay vì API này (brief mục 5) */
  async checkoutLegacy(id: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<null>>(`${BASE}/${id}/checkout`, {})
    );
    if (!res.success) throw new Error(res.message || 'Checkout thất bại');
  }
}
