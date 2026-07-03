import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { ContractStatus, DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  active: 'Đang hiệu lực',
  ended: 'Đã kết thúc',
  terminated: 'Đã chấm dứt',
  cancelled: 'Đã hủy',
};

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-semibold text-slate-900">Danh sách hợp đồng</h1>
        @if (auth.isManager()) {
          <a routerLink="/contracts/new" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            + Tạo hợp đồng
          </a>
        }
      </div>

      @if (contracts.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (contracts.error()) {
        <p class="text-red-600 text-sm">Không tải được danh sách hợp đồng.</p>
      } @else {
        <div class="flex flex-col gap-3">
          @for (c of contracts.value()?.data ?? []; track c.id) {
            <a [routerLink]="['/contracts', c.id]" class="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-slate-900">Phòng {{ c.room_code || c.room_id }}</span>
                <div class="flex gap-2">
                  <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                    {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
                  </ui-badge>
                  <ui-badge colorClass="bg-slate-100 text-slate-600">
                    {{ CONTRACT_STATUS_LABEL[c.status] }}
                  </ui-badge>
                </div>
              </div>
              <p class="text-sm text-slate-500">
                {{ c.start_date | date: 'dd/MM/yyyy' }} — {{ c.end_date | date: 'dd/MM/yyyy' }}
                · {{ c.monthly_rent | number }} đ/tháng
              </p>
            </a>
          } @empty {
            <p class="text-slate-400 text-sm">Chưa có hợp đồng nào.</p>
          }
        </div>
      }
    </div>
  `,
})
export class ContractListPage {
  auth = inject(AuthService);
  private contractsService = inject(ContractsService);
  contracts = this.contractsService.contractsResource;

  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;
  CONTRACT_STATUS_LABEL = CONTRACT_STATUS_LABEL;
}