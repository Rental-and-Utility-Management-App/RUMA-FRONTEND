import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [UiButton, UiInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-sm mx-auto p-6">
      <h1 class="text-xl font-semibold text-slate-900 mb-6">Đổi mật khẩu</h1>

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <ui-input label="Mật khẩu hiện tại" type="password" [(value)]="oldPassword" />
        <ui-input label="Mật khẩu mới" type="password" [(value)]="newPassword" />

        <ui-button type="submit" [loading]="saving()">Đổi mật khẩu</ui-button>
      </form>
    </div>
  `,
})
export class ChangePasswordPage {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  oldPassword = signal('');
  newPassword = signal('');
  saving = signal(false);

  async onSubmit(event: Event) {
    event.preventDefault();
    this.saving.set(true);
    try {
      await this.auth.changePassword(this.oldPassword(), this.newPassword());
      this.toast.success('Đổi mật khẩu thành công.');
      this.oldPassword.set('');
      this.newPassword.set('');
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? err?.message ?? 'Đổi mật khẩu thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}