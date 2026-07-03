import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ' + colorClass()">
      <ng-content />
    </span>
  `,
})
export class UiBadge {
  /** Truyền class Tailwind từ các map màu như DEPOSIT_STATUS_COLOR / INVOICE_STATUS_COLOR */
  colorClass = input<string>('bg-slate-100 text-slate-700');
}
