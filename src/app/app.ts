import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiConfirm } from './shared/ui/confirm/confirm';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiConfirm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <ui-confirm />
  `,
})
export class App {}
