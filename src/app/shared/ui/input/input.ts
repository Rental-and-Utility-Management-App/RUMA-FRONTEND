import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label class="text-sm font-medium text-slate-700">{{ label() }}</label>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-slate-50 disabled:text-slate-400"
      />
      @if (error()) {
        <span class="text-xs text-red-600">{{ error() }}</span>
      }
    </div>
  `,
})
export class UiInput {
  label = input<string>('');
  placeholder = input<string>('');
  type = input<string>('text');
  disabled = input(false);
  error = input<string>('');
  value = model<string>('');
}
