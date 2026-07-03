import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    };
    return `${base} ${variants[this.variant()]}`;
  }
}
