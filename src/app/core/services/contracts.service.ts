import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Contract, DepositTransaction } from '../models';

const BASE = `${environment.apiUrl}/contracts`;

export interface CreateContractPayload {
  room_id: string;
  tenant_ids: string[];
  monthly_rent: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  note?: string;
}

export interface ExtendContractPayload {
  new_end_date: string;
  new_monthly_rent?: number;
  note?: string;
}

export interface CollectDepositPayload {
  amount: number;
  method: 'cash' | 'bank_transfer' | 'other';
  note?: string;
}

export interface CheckoutContractPayload {
  actual_end_date: string;
  refund_amount?: number;
  forfeit_amount?: number;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractsService {
  private http = inject(HttpClient);

  /** Danh sách hợp đồng — tenant tự chỉ thấy hợp đồng phòng mình (backend filter) */
  contractsResource = httpResource<ApiResponse<Contract[]>>(() => BASE);

  /** Lấy hợp đồng active của 1 phòng cụ thể — dùng filter phía client vì API không có query theo room_id riêng */
  contractsByRoom(roomIdFn: () => string) {
    return httpResource<ApiResponse<Contract[]>>(() => `${BASE}?room_id=${roomIdFn()}`);
  }

  async getById(id: string): Promise<Contract> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Contract>>(`${BASE}/${id}`));
    if (!res.success || !res.data) throw new Error(res.message || 'Không tìm thấy hợp đồng');
    return res.data;
  }

  async create(payload: CreateContractPayload): Promise<Contract> {
    const res = await firstValueFrom(this.http.post<ApiResponse<Contract>>(BASE, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Tạo hợp đồng thất bại');
    return res.data;
  }

  async update(id: string, payload: Partial<Pick<Contract, 'note' | 'monthly_rent' | 'deposit_amount'>>): Promise<Contract> {
    // Lưu ý: deposit_amount chỉ sửa được khi deposit_paid == 0 (luật #6) — backend sẽ trả lỗi tiếng Việt nếu vi phạm
    const res = await firstValueFrom(this.http.put<ApiResponse<Contract>>(`${BASE}/${id}`, payload));
    if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật hợp đồng thất bại');
    return res.data;
  }

  async extend(id: string, payload: ExtendContractPayload): Promise<Contract> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Contract>>(`${BASE}/${id}/extend`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Gia hạn thất bại');
    return res.data;
  }

  async collectDeposit(id: string, payload: CollectDepositPayload): Promise<Contract> {
    // Backend chặn thu vượt deposit_amount (luật #2)
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Contract>>(`${BASE}/${id}/collect-deposit`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Thu cọc thất bại');
    return res.data;
  }

  async checkout(id: string, payload: CheckoutContractPayload): Promise<Contract> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Contract>>(`${BASE}/${id}/checkout`, payload)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Checkout thất bại');
    return res.data;
  }

  async cancel(id: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<null>>(`${BASE}/${id}/cancel`, {})
    );
    if (!res.success) throw new Error(res.message || 'Hủy hợp đồng thất bại');
  }

  async addTenant(id: string, tenantId: string): Promise<Contract> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Contract>>(`${BASE}/${id}/tenants`, { tenant_id: tenantId })
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Thêm người ở ghép thất bại');
    return res.data;
  }

  async removeTenant(id: string, tenantId: string): Promise<Contract> {
    // Backend chặn gỡ người cuối cùng (luật #4) — disable nút ở UI khi tenant_ids.length === 1
    const res = await firstValueFrom(
      this.http.delete<ApiResponse<Contract>>(`${BASE}/${id}/tenants/${tenantId}`)
    );
    if (!res.success || !res.data) throw new Error(res.message || 'Gỡ người ở ghép thất bại');
    return res.data;
  }

  async getDepositTransactions(id: string): Promise<DepositTransaction[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<DepositTransaction[]>>(`${BASE}/${id}/deposit-transactions`)
    );
    if (!res.success) throw new Error(res.message || 'Không tải được lịch sử cọc');
    return res.data ?? [];
  }
}
