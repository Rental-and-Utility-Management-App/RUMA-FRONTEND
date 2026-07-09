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
      }
      // Lỗi nghiệp vụ khác (400, 403, 404, 409, 500...) KHÔNG tự show toast ở
      // đây nữa — mọi nơi gọi API đều đã có catch riêng và tự toast.error()
      // với message phù hợp context (vd "Gán phòng thất bại."). Nếu interceptor
      // cũng toast, người dùng sẽ thấy 2 toast trùng lặp cho cùng 1 lỗi.
      return throwError(() => err);
    })
  );
};