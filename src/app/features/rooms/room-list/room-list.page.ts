import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { RoomStatus } from '../../../core/models';

const STATUS_COLOR: Record<RoomStatus, string> = {
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-blue-100 text-blue-700',
};
const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Còn trống',
  occupied: 'Đã thuê',
};

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-semibold text-slate-900">Danh sách phòng</h1>
        @if (auth.isManager()) {
          <a
            routerLink="/rooms/new"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            + Tạo phòng
          </a>
        }
      </div>

      @if (rooms.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (rooms.error()) {
        <p class="text-red-600 text-sm">Không tải được danh sách phòng.</p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (room of rooms.value()?.data ?? []; track room.id) {
            <a
              [routerLink]="['/rooms', room.id]"
              class="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-slate-900">Phòng {{ room.code }}</span>
                <ui-badge [colorClass]="STATUS_COLOR[room.status]">
                  {{ STATUS_LABEL[room.status] }}
                </ui-badge>
              </div>
              <p class="text-sm text-slate-500">
                {{ room.occupants }}/{{ room.capacity }} người ·
                {{ room.monthly_rent | number }} đ/tháng
              </p>
            </a>
          } @empty {
            <p class="text-slate-400 text-sm col-span-full">Chưa có phòng nào.</p>
          }
        </div>
      }
    </div>
  `,
})
export class RoomListPage {
  auth = inject(AuthService);
  private roomsService = inject(RoomsService);
  rooms = this.roomsService.roomsResource;

  STATUS_COLOR = STATUS_COLOR;
  STATUS_LABEL = STATUS_LABEL;
}
