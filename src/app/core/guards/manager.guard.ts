import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Chặn route chỉ dành cho manager (ví dụ /tenants, form tạo/sửa).
 * Đây chỉ là UX guard phía client — backend luôn re-check quyền thật sự (brief mục 3).
 */
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isManager()) return true;

  router.navigate(auth.isAuthenticated() ? ['/dashboard'] : ['/login']);
  return false;
};
