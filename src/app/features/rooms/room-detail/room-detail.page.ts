import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { RoomStatus } from '../../../core/models';
import { DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';

const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-blue-100 text-blue-700',
};
const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Còn trống',
  occupied: 'Đã thuê',
};

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto p-6">
      <a routerLink="/rooms" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách phòng
      </a>

      @if (room.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (room.error()) {
        <p class="text-red-600 text-sm">Không tải được thông tin phòng.</p>
      } @else if (room.value(); as r) {
        <div class="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-semibold text-slate-900">Phòng {{ r.code }}</h1>
            <ui-badge [colorClass]="ROOM_STATUS_COLOR[r.status]">
              {{ ROOM_STATUS_LABEL[r.status] }}
            </ui-badge>
          </div>

          <dl class="grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-slate-500">Sức chứa</dt>
            <dd class="text-slate-900">{{ r.occupants }}/{{ r.capacity }} người</dd>

            <dt class="text-slate-500">Giá thuê</dt>
            <dd class="text-slate-900">{{ r.monthly_rent | number }} đ/tháng</dd>

            <dt class="text-slate-500">Giá điện</dt>
            <dd class="text-slate-900">{{ r.price_electricity | number }} đ/kWh</dd>

            <dt class="text-slate-500">Giá nước</dt>
            <dd class="text-slate-900">{{ r.price_water | number }} đ/khối</dd>

            <dt class="text-slate-500">Phí quản lý</dt>
            <dd class="text-slate-900">{{ r.management_fee_per_person | number }} đ/người</dd>

            @if (r.note) {
              <dt class="text-slate-500">Ghi chú</dt>
              <dd class="text-slate-900">{{ r.note }}</dd>
            }
          </dl>

          @if (auth.isManager()) {
            <div class="flex gap-2 mt-6 pt-4 border-t border-slate-100">
              <a
                [routerLink]="['/rooms', r.id, 'edit']"
                class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Sửa phòng
              </a>
              @if (r.status === 'available') {
                <a
                  [routerLink]="['/contracts/new']"
                  [queryParams]="{ room_id: r.id }"
                  class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Tạo hợp đồng
                </a>
              }
            </div>
          }
        </div>
      }

      <h2 class="text-lg font-semibold text-slate-900 mb-3">Hợp đồng hiện tại</h2>
      @if (contracts.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else {
        @for (c of activeContracts(); track c.id) {
          <a
            [routerLink]="['/contracts', c.id]"
            class="block rounded-xl border border-slate-200 bg-white p-4 mb-2 hover:border-primary transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-900">
                {{ c.start_date | date: 'dd/MM/yyyy' }} — {{ c.end_date | date: 'dd/MM/yyyy' }}
              </span>
              <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
              </ui-badge>
            </div>
            <p class="text-sm text-slate-500">
              Cọc: {{ c.deposit_paid | number }}/{{ c.deposit_amount | number }} đ
            </p>
          </a>
        } @empty {
          <p class="text-slate-400 text-sm">Chưa có hợp đồng nào cho phòng này.</p>
        }
      }
    </div>
  `,
})
export class RoomDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private roomsService = inject(RoomsService);
  private contractsService = inject(ContractsService);

  room = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.roomsService.getById(params.id),
  });

  contracts = this.contractsService.contractsByRoom(() => this.id());

  activeContracts() {
    return (this.contracts.value()?.data ?? []).filter((c) => c.status === 'active');
  }

  ROOM_STATUS_COLOR = ROOM_STATUS_COLOR;
  ROOM_STATUS_LABEL = ROOM_STATUS_LABEL;
  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;
}
