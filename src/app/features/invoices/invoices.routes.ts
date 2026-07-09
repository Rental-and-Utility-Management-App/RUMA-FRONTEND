import { Routes } from '@angular/router';
import { managerMatch } from '../../core/guards/role-match.guard';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    canMatch: [managerMatch],
    loadComponent: () =>
      import('./invoice-list/manager-invoice-list.page').then((m) => m.ManagerInvoiceListPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list/tenant-invoice-list.page').then((m) => m.TenantInvoiceListPage),
  },
  {
    path: ':id',
    canMatch: [managerMatch],
    loadComponent: () =>
      import('./invoice-detail/manager-invoice-detail.page').then((m) => m.ManagerInvoiceDetailPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail/tenant-invoice-detail.page').then((m) => m.TenantInvoiceDetailPage),
  },
];