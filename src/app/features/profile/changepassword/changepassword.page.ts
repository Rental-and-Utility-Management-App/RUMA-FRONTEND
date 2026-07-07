import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)]">
      <h3 class="text-base font-bold text-[#221D0F] mb-4">Đổi mật khẩu</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs font-medium text-[#8A8270]">Mật khẩu hiện tại</label>
          <input
            type="password"
            [value]="oldPassword()"
            (input)="oldPassword.set($any($event.target).value)"
            class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-[#8A8270]">Mật khẩu mới</label>
          <input
            type="password"
            [value]="newPassword()"
            (input)="newPassword.set($any($event.target).value)"
            class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-[#8A8270]">Nhập lại mật khẩu mới</label>
          <input
            type="password"
            [value]="confirmPassword()"
            (input)="confirmPassword.set($any($event.target).value)"
            class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
          />
        </div>
      </div>

      @if (passwordMessage(); as msg) {
        <p class="mt-3 text-sm" [class.text-[#166534]]="!passwordError()" [class.text-[#9A3412]]="passwordError()">{{ msg }}</p>
      }

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          [disabled]="!canSubmitPassword() || changingPassword()"
          (click)="onChangePasswordClick()"
          class="flex items-center gap-2 rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764] disabled:opacity-50 disabled:hover:bg-[#FFC629]"
        >
          {{ changingPassword() ? 'Đang lưu...' : 'Lưu mật khẩu mới' }}
        </button>
      </div>
    </div>

    <!-- Popup thông báo đổi mật khẩu thành công -->
    @if (showSuccessPopup()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#221D0F]/40 backdrop-blur-sm"
        (click)="closeSuccessPopup()"
      >
        <div
          class="mx-4 w-full max-w-sm rounded-3xl border border-[#EFE6CC] bg-white p-6 text-center shadow-[0_12px_40px_rgba(34,29,15,0.18)] animate-[popupIn_0.2s_ease-out]"
          (click)="$event.stopPropagation()"
        >
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF6D9]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-[#B58A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h4 class="text-base font-bold text-[#221D0F]">Đổi mật khẩu thành công</h4>
          <p class="mt-1 text-sm text-[#8A8270]">
            Vui lòng dùng mật khẩu mới cho lần đăng nhập tiếp theo.
          </p>
          <button
            type="button"
            (click)="closeSuccessPopup()"
            class="mt-5 w-full rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes popupIn {
      from { opacity: 0; transform: scale(0.94) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `],
})
export class ChangePasswordPage {
  private http = inject(HttpClient);
  private confirm = inject(ConfirmService);

  oldPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  changingPassword = signal(false);
  passwordMessage = signal<string | null>(null);
  passwordError = signal(false);
  showSuccessPopup = signal(false);

  canSubmitPassword = computed(() => {
    return (
      this.oldPassword().trim().length > 0 &&
      this.newPassword().trim().length >= 6 &&
      this.newPassword() === this.confirmPassword()
    );
  });

  // --- Bấm nút "Lưu mật khẩu mới" -> hỏi xác nhận trước ---
  async onChangePasswordClick(): Promise<void> {
    if (!this.canSubmitPassword()) return;

    const ok = await this.confirm.ask({
      title: 'Xác nhận đổi mật khẩu',
      message: 'Bạn có chắc chắn muốn đổi mật khẩu? Bạn sẽ cần dùng mật khẩu mới cho lần đăng nhập tiếp theo.',
      confirmText: 'Đổi mật khẩu',
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    await this.changePassword();
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup.set(false);
  }

  // --- Đổi mật khẩu (PUT /api/auth/change-password) ---
  private async changePassword(): Promise<void> {
    this.changingPassword.set(true);
    this.confirm.setProcessing(true);
    this.passwordMessage.set(null);
    this.passwordError.set(false);

    try {
      const res = await firstValueFrom(
        this.http.put<ApiResponse<null>>(`${environment.apiUrl}/auth/change-password`, {
          old_password: this.oldPassword(),
          new_password: this.newPassword(),
        }),
      );
      if (!res.success) {
        throw new Error(res.message || 'Đổi mật khẩu thất bại');
      }
      this.passwordMessage.set('Đổi mật khẩu thành công.');
      this.oldPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.showSuccessPopup.set(true);
    } catch (err: any) {
      this.passwordError.set(true);
      this.passwordMessage.set(err?.error?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      this.changingPassword.set(false);
      this.confirm.setProcessing(false);
    }
  }
}