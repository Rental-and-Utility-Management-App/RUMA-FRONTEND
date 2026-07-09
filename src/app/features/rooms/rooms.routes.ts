import { Routes } from '@angular/router';
import { managerGuard } from '../../core/guards/manager.guard';
import { managerMatch } from '../../core/guards/role-match.guard';

export const ROOMS_ROUTES: Routes = [
  {
    path: '',
    canMatch: [managerMatch],
    loadComponent: () =>
      import('./room-list/manager-room-list.page').then((m) => m.ManagerRoomListPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./room-list/tenant-room-list.page').then((m) => m.TenantRoomListPage),
  },
  {
    path: 'new',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./room-form/room-form.page').then((m) => m.RoomFormPage),
  },
  {
    path: ':id/edit',
    canActivate: [managerGuard],
    loadComponent: () =>
      import('./room-form/room-form.page').then((m) => m.RoomFormPage),
  },
  {
    path: ':id',
    canMatch: [managerMatch],
    loadComponent: () =>
      import('./room-detail/manager-room-detail.page').then((m) => m.ManagerRoomDetailPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./room-detail/tenant-room-detail.page').then((m) => m.TenantRoomDetailPage),
  },
];