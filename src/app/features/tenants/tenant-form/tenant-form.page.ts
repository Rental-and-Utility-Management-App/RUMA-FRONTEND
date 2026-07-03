import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [UiButton, UiInput, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto p-6">
      <a routerLink="/tenants" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách tenant
      </a>
      <h1 class="text-xl font-semibold text-slate-900 mb-6">Tạo tài khoản tenant</h1>

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <ui-input label="Họ tên" [(value)]="fullName" />
        <ui-input label="Số điện thoại" type="tel" [(value)]="phone" />
        <ui-input label="Email (tuỳ chọn)" type="email" [(value)]="email" />
        <ui-input label="Mật khẩu tạm" type="password" [(value)]="password" />

        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }

        <div class="flex gap-2 mt-2">
          <ui-button type="submit" [loading]="saving()">Tạo tenant</ui-button>
          <ui-button variant="secondary" (click)="router.navigate(['/tenants'])">Hủy</ui-button>
        </div>
      </form>
    </div>
  `,
})
export class TenantFormPage {
  router = inject(Router);
  private usersService = inject(UsersService);

  fullName = signal('');
  phone = signal('');
  email = signal('');
  password = signal('');
  saving = signal(false);
  errorMessage = signal('');

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    this.saving.set(true);
    try {
      await this.usersService.create({
        full_name: this.fullName(),
        phone: this.phone(),
        password: this.password(),
        email: this.email() || undefined,
      });
      this.usersService.usersResource.reload();
      this.router.navigate(['/tenants']);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Tạo tenant thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}