import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RoomsService } from '../../core/services/rooms.service';
import { InvoicesService } from '../../core/services/invoices.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto p-6">
      <h1 class="text-xl font-semibold text-slate-900 mb-6">
        Chào {{ auth.currentUser()?.full_name }}
      </h1>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <a routerLink="/rooms" class="rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary">
          <p class="text-sm text-slate-500 mb-1">Phòng trống</p>
          <p class="text-2xl font-semibold text-slate-900">{{ availableRoomsCount() }}</p>
        </a>
        <a routerLink="/invoices" [queryParams]="{ status: 'unpaid' }" class="rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary">
          <p class="text-sm text-slate-500 mb-1">Hóa đơn chưa thanh toán</p>
          <p class="text-2xl font-semibold text-slate-900">{{ unpaidInvoicesCount() }}</p>
        </a>
        <a routerLink="/contracts" class="rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary">
          <p class="text-sm text-slate-500 mb-1">Tổng số phòng</p>
          <p class="text-2xl font-semibold text-slate-900">{{ totalRoomsCount() }}</p>
        </a>
      </div>

      <div class="flex gap-3 flex-wrap">
        <a routerLink="/rooms" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Quản lý phòng</a>
        @if (auth.isManager()) {
          <a routerLink="/tenants" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Quản lý tenant</a>
        }
        <a routerLink="/contracts" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Hợp đồng</a>
        <a routerLink="/invoices" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Hóa đơn</a>
      </div>
    </div>
  `,
})
export class DashboardPage {
  auth = inject(AuthService);
  private roomsService = inject(RoomsService);
  private invoicesService = inject(InvoicesService);

  rooms = this.roomsService.roomsResource;
  invoices = this.invoicesService.list(() => ({ status: 'unpaid' }));

  totalRoomsCount = computed(() => this.rooms.value()?.data?.length ?? 0);
  availableRoomsCount = computed(
    () => (this.rooms.value()?.data ?? []).filter((r: { status: string; }) => r.status === 'available').length
  );
  unpaidInvoicesCount = computed(() => this.invoices.value()?.data?.length ?? 0);
}