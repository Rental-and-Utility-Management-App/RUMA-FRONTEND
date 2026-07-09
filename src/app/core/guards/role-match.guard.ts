import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Dùng với `canMatch` để route tự chọn ĐÚNG component theo vai trò, thay vì
 * dùng chung 1 component rồi rẽ nhánh `@if (auth.isManager())` bên trong
 * template (cách cũ). Khai báo 2 route cùng `path`, route dành cho manager
 * đứng trước và gắn `managerMatch`; nếu không match, Angular Router sẽ tự
 * rơi xuống route thứ hai (dành cho tenant) không có canMatch.
 *
 * Đây chỉ là UX routing phía client — Backend luôn re-check quyền thật sự.
 */
export const managerMatch: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.isManager();
};