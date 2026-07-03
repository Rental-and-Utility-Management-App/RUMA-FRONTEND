import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UserResponse } from '../models';

const BASE = `${environment.apiUrl}/users`;

export interface CreateTenantPayload {
  full_name: string;
  phone: string;
  password: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  /** Danh sách tenant — chỉ manager gọi được (backend enforce) */
  usersResource = httpResource<ApiResponse<UserResponse[]>>(() => BASE);

  async getById(id: string): Promise<UserResponse> {
    const res = await firstValueFrom(this.http.get<ApiResponse<UserResponse>>(`${BASE}/${id}`));
    if (!res.success || !res.data) throw new Error(res.message || 'Không tìm thấy tenant');
    return res.data;
  }

  async create(payload: CreateTenantPayload): Promise<UserResponse> {
    const res = await firstValueFrom(this.http.post<ApiResponse<UserResponse>>(BASE, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Tạo tài khoản thất bại');
    return res.data;
  }

  async update(
    id: string,
    payload: Partial<Pick<UserResponse, 'full_name' | 'email' | 'is_active'>>
  ): Promise<UserResponse> {
    // Backend chặn deactivate nếu đang có hợp đồng active (luật #7) — message lỗi tiếng Việt sẽ hiện thẳng
    const res = await firstValueFrom(
      this.http.put<ApiResponse<UserResponse>>(`${BASE}/${id}`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật thất bại');
    return res.data;
  }

  async assignRoom(id: string, roomId: string): Promise<UserResponse> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<UserResponse>>(`${BASE}/${id}/room`, { room_id: roomId })
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Gán phòng thất bại');
    return res.data;
  }

  async unassignRoom(id: string): Promise<void> {
    const res = await firstValueFrom(this.http.delete<ApiResponse<null>>(`${BASE}/${id}/room`));
    if (!res.success) throw new Error(res.message || 'Trả phòng thất bại');
  }
}