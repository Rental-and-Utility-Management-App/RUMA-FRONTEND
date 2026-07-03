import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" (click)="onBackdrop($event)">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg" (click)="$event.stopPropagation()">
          @if (title()) {
            <h2 class="text-lg font-semibold text-slate-900 mb-4">{{ title() }}</h2>
          }
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class UiModal {
  open = input(false);
  title = input<string>('');
  closeRequested = output<void>();

  onBackdrop(event: MouseEvent) {
    event.stopPropagation();
    this.closeRequested.emit();
  }
}
