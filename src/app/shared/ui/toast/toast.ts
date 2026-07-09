import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  /** ms trước khi tự đóng. 0 = không tự đóng. Mặc định 4000ms. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, 'title'>> {
  id: number;
  title?: string;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const STYLES: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: 'bg-[#ECFDF3] border-[#ABEFC6]', icon: 'bg-[#12B76A] text-white', bar: 'bg-[#12B76A]' },
  error: { bg: 'bg-[#FEF3F2] border-[#FECDCA]', icon: 'bg-[#F04438] text-white', bar: 'bg-[#F04438]' },
  warning: { bg: 'bg-[#FFFAEB] border-[#FEDF89]', icon: 'bg-[#F79009] text-white', bar: 'bg-[#F79009]' },
  info: { bg: 'bg-[#F1EBD8] border-[#EFE6CC]', icon: 'bg-[#8A6200] text-white', bar: 'bg-[#8A6200]' },
};

/**
 * Service popup thông báo (toast) dùng chung toàn app.
 *
 * Cách dùng trong component:
 *
 *   private toast = inject(ToastService);
 *
 *   this.toast.success('Lưu thành công.');
 *   this.toast.error('Có lỗi xảy ra, vui lòng thử lại.');
 *   this.toast.show({ title: 'Chú ý', message: '...', type: 'warning' });
 *
 * <ui-toast /> đã được đặt 1 lần duy nhất ở app.ts (root component) nên
 * không cần import/khai báo lại UiToast ở từng trang — chỉ cần inject
 * ToastService và gọi show()/success()/error()/... là đủ.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastItem[]>([]);
  private nextId = 1;

  show(options: ToastOptions): number {
    const id = this.nextId++;
    const item: ToastItem = {
      id,
      title: options.title,
      message: options.message,
      type: options.type ?? 'info',
      duration: options.duration ?? 4000,
    };
    this.toasts.update((list) => [...list, item]);

    if (item.duration > 0) {
      setTimeout(() => this.dismiss(id), item.duration);
    }
    return id;
  }

  success(message: string, title?: string, duration?: number) {
    return this.show({ message, title, type: 'success', duration });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({ message, title, type: 'error', duration });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({ message, title, type: 'warning', duration });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({ message, title, type: 'info', duration });
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}

@Component({
  selector: 'ui-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 right-4 z-100 flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto relative overflow-hidden rounded-2xl border shadow-lg animate-[toast-in_0.25s_ease-out]"
          [class]="style(t.type).bg"
        >
          <div class="flex items-start gap-3 p-4">
            <span
              class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              [class]="style(t.type).icon"
            >
              {{ icon(t.type) }}
            </span>
            <div class="min-w-0 flex-1">
              @if (t.title) {
                <p class="text-sm font-semibold text-[#221D0F]">{{ t.title }}</p>
              }
              <p class="text-sm text-[#3F3A2E] whitespace-pre-line wrap-break-word">{{ t.message }}</p>
            </div>
            <button
              type="button"
              (click)="toast.dismiss(t.id)"
              class="shrink-0 text-[#6B6455] hover:text-[#221D0F] text-sm leading-none px-1"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class UiToast {
  toast = inject(ToastService);

  icon(type: ToastType): string {
    return ICONS[type];
  }

  style(type: ToastType) {
    return STYLES[type];
  }
}