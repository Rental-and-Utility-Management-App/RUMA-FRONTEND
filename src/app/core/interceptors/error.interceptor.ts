import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../../shared/ui/toast/toast';

// Các endpoint mà 401 KHÔNG có nghĩa là "hết phiên đăng nhập",
// mà là lỗi nghiệp vụ bình thường (vd: sai mật khẩu hiện tại) -> không auto-logout.
const AUTH_401_EXCLUDED_PATHS = ['/auth/change-password'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isExcluded = AUTH_401_EXCLUDED_PATHS.some((path) => req.url.includes(path));

      if (err.status === 401 && !isExcluded) {
        auth.logout();
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        router.navigate(['/login']);
      } else {
        // err.error?.message là chuỗi tiếng Việt sẵn sàng hiển thị cho user (theo brief mục 2)
        // Hiển thị popup thông báo lỗi cho mọi lỗi API khác (400, 403, 404, 409, 500...).
        const message = err.error?.message ?? err.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
        toast.error(message);
      }
      return throwError(() => err);
    })
  );
};