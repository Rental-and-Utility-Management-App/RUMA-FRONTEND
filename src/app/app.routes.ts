import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { managerGuard } from './core/guards/manager.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'rooms',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/rooms/room-list/room-list.page').then((m) => m.RoomListPage),
          },
          {
            path: 'new',
            canActivate: [managerGuard],
            loadComponent: () =>
              import('./features/rooms/room-form/room-form.page').then((m) => m.RoomFormPage),
          },
          {
            path: ':id/edit',
            canActivate: [managerGuard],
            loadComponent: () =>
              import('./features/rooms/room-form/room-form.page').then((m) => m.RoomFormPage),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/rooms/room-detail/room-detail.page').then(
                (m) => m.RoomDetailPage
              ),
          },
        ],
      },
      {
        path: 'tenants',
        canActivate: [managerGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/tenants/tenant-list/tenant-list.page').then(
                (m) => m.TenantListPage
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/tenants/tenant-form/tenant-form.page').then(
                (m) => m.TenantFormPage
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/tenants/tenant-detail/tenant-detail.page').then(
                (m) => m.TenantDetailPage
              ),
          },
        ],
      },
      {
        path: 'contracts',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/contracts/contract-list/contract-list.page').then(
                (m) => m.ContractListPage
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/contracts/contract-detail/contract-detail.page').then(
                (m) => m.ContractDetailPage
              ),
          },
        ],
      },
      {
        path: 'invoices',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/invoices/invoice-list/invoice-list.page').then(
                (m) => m.InvoiceListPage
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/invoices/invoice-detail/invoice-detail.page').then(
                (m) => m.InvoiceDetailPage
              ),
          },
        ],
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payment-list/payment-list.page').then(
            (m) => m.PaymentListPage
          ),
      },
      {
        path: 'settings/change-password',
        loadComponent: () =>
          import('./features/settings/change-password/change-password.page').then(
            (m) => m.ChangePasswordPage
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];