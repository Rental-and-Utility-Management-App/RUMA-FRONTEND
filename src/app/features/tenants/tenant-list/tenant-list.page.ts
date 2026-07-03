import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [RouterLink, UiBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-semibold text-slate-900">Danh sách tenant</h1>
        <a routerLink="/tenants/new" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          + Tạo tenant
        </a>
      </div>

      @if (users.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (users.error()) {
        <p class="text-red-600 text-sm">Không tải được danh sách tenant.</p>
      } @else {
        <div class="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          @for (u of users.value()?.data ?? []; track u.id) {
            <a [routerLink]="['/tenants', u.id]" class="flex items-center justify-between p-4 hover:bg-slate-50">
              <div>
                <p class="font-medium text-slate-900">{{ u.full_name }}</p>
                <p class="text-sm text-slate-500">{{ u.phone }}</p>
              </div>
              <ui-badge [colorClass]="u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                {{ u.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
              </ui-badge>
            </a>
          } @empty {
            <p class="text-slate-400 text-sm p-4">Chưa có tenant nào.</p>
          }
        </div>
      }
    </div>
  `,
})
export class TenantListPage {
  private usersService = inject(UsersService);
  users = this.usersService.usersResource;
}