import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'change-password',
    loadComponent: () =>
      import('./change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
];