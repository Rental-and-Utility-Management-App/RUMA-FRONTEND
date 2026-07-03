import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="classes()"
    >
      @if (loading()) {
        <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      }
      <ng-content />
    </button>
  `,
})
export class UiButton {
  variant = input<ButtonVariant>('primary');
  disabled = input(false);
  loading = input(false);
  type = input<'button' | 'submit'>('button');

  classes() {
    const base =
      'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ' +
      'transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-linear-to-r from-amber-400 via-orange-400 to-fuchsia-500 text-slate-950 ' +
        'shadow-[0_8px_24px_-6px_rgba(245,166,35,0.5)] hover:shadow-[0_10px_30px_-6px_rgba(245,166,35,0.65)] ' +
        'hover:brightness-110 focus-visible:ring-amber-300',
      secondary:
        'bg-white/10 text-white border border-white/15 backdrop-blur-sm ' +
        'hover:bg-white/15 hover:border-white/25 focus-visible:ring-white/40',
      danger:
        'bg-red-500/90 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] ' +
        'hover:bg-red-500 focus-visible:ring-red-400',
      ghost:
        'bg-transparent text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-white/30',
    };
    return `${base} ${variants[this.variant()]}`;
  }
}