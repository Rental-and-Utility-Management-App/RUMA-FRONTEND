import { Routes } from '@angular/router';
import { managerGuard } from '../../core/guards/manager.guard';

export const CONTRACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contract-list/contract-list.page').then((m) => m.ContractListPage),
  },
  {
    // QUAN TRỌNG: route tĩnh 'new' PHẢI đứng TRƯỚC route động ':id'.
    // Angular Router match theo thứ tự khai báo, nếu ':id' đứng trước
    // thì nó sẽ nuốt luôn segment "new" (coi "new" là giá trị của id),
    // khiến ContractDetailPage bị load nhầm với id="new".
    path: 'new',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./contract-form/contract-form.page').then((m) => m.ContractFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./contract-detail/contract-detail.page').then((m) => m.ContractDetailPage),
  },
];