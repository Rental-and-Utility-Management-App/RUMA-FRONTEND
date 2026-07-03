import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [UiButton, UiInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <h1 class="text-xl font-semibold text-slate-900 mb-1">Đăng nhập RUMA</h1>
        <p class="text-sm text-slate-500 mb-6">Quản lý phòng trọ</p>

        <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
          <ui-input label="Số điện thoại" type="tel" [(value)]="phone" />
          <ui-input label="Mật khẩu" type="password" [(value)]="password" />

          @if (errorMessage()) {
            <p class="text-sm text-red-600">{{ errorMessage() }}</p>
          }

          <ui-button type="submit" [loading]="loading()" class="mt-2">
            Đăng nhập
          </ui-button>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  phone = signal('');
  password = signal('');
  loading = signal(false);
  errorMessage = signal('');

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const user = await this.auth.login(this.phone(), this.password());
      this.router.navigate([user.role === 'manager' ? '/dashboard' : '/rooms']);
    } catch (err: any) {
      // Ưu tiên message tiếng Việt trả về từ backend (brief mục 2)
      this.errorMessage.set(
        err?.error?.message ?? err?.message ?? 'Đăng nhập thất bại, vui lòng thử lại.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
