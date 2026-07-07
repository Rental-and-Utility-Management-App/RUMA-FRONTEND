import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  inject,
  signal,
} from '@angular/core';

import { UiModal } from '../modal/modal';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** true => nút xác nhận màu đỏ (hành động nguy hiểm/không thể hoàn tác) */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

/**
 * Service xác nhận dùng chung toàn app.
 *
 * Cách dùng trong component:
 *
 *   private confirm = inject(ConfirmService);
 *
 *   async someAction() {
 *     const ok = await this.confirm.ask({
 *       title: 'Xác nhận',
 *       message: 'Bạn có chắc chắn muốn thực hiện thao tác này?',
 *     });
 *     if (!ok) return;
 *     // ... thực hiện thao tác / gọi API
 *   }
 *
 * <ui-confirm /> đã được đặt 1 lần duy nhất ở app.ts (root component) nên
 * không cần import/khai báo lại UiConfirm ở từng trang — chỉ cần inject
 * ConfirmService và gọi ask() là đủ.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  state = signal<ConfirmState | null>(null);
  processing = signal(false);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({ ...options, resolve });
    });
  }

  /** Gọi khi thao tác async (gọi API...) đang chạy để disable nút trong dialog. */
  setProcessing(value: boolean) {
    this.processing.set(value);
  }

  respond(result: boolean) {
    const current = this.state();
    if (!current) return;
    current.resolve(result);
    this.state.set(null);
    this.processing.set(false);
  }
}

@Component({
  selector: 'ui-confirm',
  standalone: true,
  imports: [UiModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.state(); as s) {
      <ui-modal
        [open]="true"
        [title]="s.title || 'Xác nhận'"
        (closeRequested)="onCancel()"
      >
        <div class="flex flex-col gap-4">
          <p class="text-sm text-[#6B6455] whitespace-pre-line">{{ s.message }}</p>

          <div class="flex gap-2 justify-end pt-2">
            <button
              type="button"
              (click)="onCancel()"
              [disabled]="confirm.processing()"
              class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455] disabled:opacity-70"
            >
              {{ s.cancelText || 'Hủy bỏ' }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              [disabled]="confirm.processing()"
              [class]="
                'rounded-full px-6 py-2.5 text-xs font-bold disabled:opacity-70 ' +
                (s.danger ? 'bg-red-600 text-white' : 'bg-[#FFC629] text-[#221D0F]')
              "
            >
              {{ confirm.processing() ? 'Đang xử lý...' : (s.confirmText || 'Đồng ý') }}
            </button>
          </div>
        </div>
      </ui-modal>
    }
  `,
})
export class UiConfirm {
  confirm = inject(ConfirmService);

  onCancel() {
    this.confirm.respond(false);
  }

  onConfirm() {
    this.confirm.respond(true);
  }
}