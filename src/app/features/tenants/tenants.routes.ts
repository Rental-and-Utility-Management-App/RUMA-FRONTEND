import { Routes } from '@angular/router';
import { managerGuard } from '../../core/guards/manager.guard';

export const TENANTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [managerGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./tenant-list/tenant-list.page').then((m) => m.TenantListPage),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./tenant-form/tenant-form.page').then((m) => m.TenantFormPage),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./tenant-detail/tenant-detail.page').then((m) => m.TenantDetailPage),
      },
    ],
  },
];