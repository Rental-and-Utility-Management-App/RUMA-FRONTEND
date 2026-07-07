import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Các endpoint mà 401 KHÔNG có nghĩa là "hết phiên đăng nhập",
// mà là lỗi nghiệp vụ bình thường (vd: sai mật khẩu hiện tại) -> không auto-logout.
const AUTH_401_EXCLUDED_PATHS = ['/auth/change-password'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isExcluded = AUTH_401_EXCLUDED_PATHS.some((path) => req.url.includes(path));

      if (err.status === 401 && !isExcluded) {
        auth.logout();
        router.navigate(['/login']);
      }
      // err.error?.message là chuỗi tiếng Việt sẵn sàng hiển thị cho user (theo brief mục 2)
      return throwError(() => err);
    })
  );
};