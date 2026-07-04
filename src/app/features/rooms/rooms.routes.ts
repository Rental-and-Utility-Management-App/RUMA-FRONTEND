import { Routes } from '@angular/router';
import { managerGuard } from '../../core/guards/manager.guard';

export const ROOMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./room-list/room-list.page').then((m) => m.RoomListPage),
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
    loadComponent: () =>
      import('./room-detail/room-detail.page').then((m) => m.RoomDetailPage),
  },
];