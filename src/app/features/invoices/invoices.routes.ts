import { Routes } from '@angular/router';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list/invoice-list.page').then((m) => m.InvoiceListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail/invoice-detail.page').then((m) => m.InvoiceDetailPage),
  },
];