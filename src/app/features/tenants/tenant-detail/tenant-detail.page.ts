import { ChangeDetectionStrategy, Component, effect, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [RouterLink, UiButton, UiInput, UiBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <a routerLink="/tenants" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách tenant
      </a>

      @if (tenant.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (tenant.value(); as t) {
        <div class="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-semibold text-slate-900">{{ t.full_name }}</h1>
            <ui-badge [colorClass]="t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
              {{ t.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
            </ui-badge>
          </div>

          <dl class="grid grid-cols-2 gap-y-3 text-sm mb-4">
            <dt class="text-slate-500">SĐT</dt>
            <dd class="text-slate-900">{{ t.phone }}</dd>
            @if (t.email) {
              <dt class="text-slate-500">Email</dt>
              <dd class="text-slate-900">{{ t.email }}</dd>
            }
            <dt class="text-slate-500">Phòng hiện tại</dt>
            <dd class="text-slate-900">{{ t.room_id || 'Chưa có phòng' }}</dd>
          </dl>

          <div class="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <div class="flex gap-2 items-end">
              <ui-input label="Gán phòng (nhập room_id)" [(value)]="roomIdInput" class="flex-1" />
              <ui-button (click)="assignRoom()" [loading]="assigning()">Gán</ui-button>
            </div>
            @if (t.room_id) {
              <ui-button variant="secondary" (click)="unassignRoom()" [loading]="unassigning()">
                Trả phòng
              </ui-button>
            }
            <ui-button
              [variant]="t.is_active ? 'danger' : 'primary'"
              (click)="toggleActive()"
              [loading]="togglingActive()"
            >
              {{ t.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
            </ui-button>
          </div>

          @if (errorMessage()) {
            <p class="text-sm text-red-600 mt-3">{{ errorMessage() }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class TenantDetailPage {
  id = input.required<string>();

  private usersService = inject(UsersService);

  tenant = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.usersService.getById(params.id),
  });

  roomIdInput = signal('');
  assigning = signal(false);
  unassigning = signal(false);
  togglingActive = signal(false);
  errorMessage = signal('');

  async assignRoom() {
    if (!this.roomIdInput()) return;
    this.errorMessage.set('');
    this.assigning.set(true);
    try {
      await this.usersService.assignRoom(this.id(), this.roomIdInput());
      this.tenant.reload();
      this.roomIdInput.set('');
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Gán phòng thất bại.');
    } finally {
      this.assigning.set(false);
    }
  }

  async unassignRoom() {
    this.errorMessage.set('');
    this.unassigning.set(true);
    try {
      await this.usersService.unassignRoom(this.id());
      this.tenant.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Trả phòng thất bại.');
    } finally {
      this.unassigning.set(false);
    }
  }

  async toggleActive() {
    const current = this.tenant.value();
    if (!current) return;
    this.errorMessage.set('');
    this.togglingActive.set(true);
    try {
      // Backend tự chặn nếu đang có hợp đồng active (luật #7) — message lỗi tiếng Việt sẽ hiện thẳng ở đây
      await this.usersService.update(this.id(), { is_active: !current.is_active });
      this.tenant.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Cập nhật trạng thái thất bại.');
    } finally {
      this.togglingActive.set(false);
    }
  }
}