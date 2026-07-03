import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Không gắn token cho login và webhook sepay (public endpoints)
  const isPublic = req.url.includes('/auth/login') || req.url.includes('/webhooks/sepay');
  if (!token || isPublic) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
