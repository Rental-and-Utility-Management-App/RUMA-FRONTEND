import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  // Không gắn token cho login và webhook sepay (public endpoints)
  const isPublic = req.url.includes('/auth/login') || req.url.includes('/webhooks/sepay');

  const request = !token || isPublic ? req : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(request).pipe(
    catchError((err: unknown) => {
      // Bỏ qua các request public (vd: sai mật khẩu lúc login cũng trả 401,
      // nhưng đó không phải lỗi "phiên hết hạn" nên không được tự logout).
      if (!isPublic && err instanceof HttpErrorResponse && err.status === 401 && auth.isAuthenticated()) {
        // Token hết hạn, sai chữ ký, hoặc user_id trong token không còn tồn tại
        // trong DB (vd: tài khoản bị xóa/DB được seed lại) -> phiên không còn
        // hợp lệ, dọn sạch session cũ và đưa người dùng về trang đăng nhập
        // thay vì để họ thấy các lỗi 401/404 khó hiểu rải rác khắp app.
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};