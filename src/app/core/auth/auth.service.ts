import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, JwtPayload, Role, UserResponse } from '../models';

interface LoginRequest {
  phone: string;
  password: string;
}

interface LoginResponseData {
  token: string;
  user: UserResponse;
}

const TOKEN_KEY = 'ruma_token';
const USER_KEY = 'ruma_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  /** Token JWT hiện tại, null nếu chưa đăng nhập */
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  /** User hiện tại (được set sau login hoặc /auth/me) */
  readonly currentUser = signal<UserResponse | null>(this.readStoredUser());

  /** Role suy ra trực tiếp từ user đang lưu — dùng cho UI/guard, KHÔNG dùng để enforce quyền thật sự */
  readonly role = computed<Role | null>(() => this.currentUser()?.role ?? null);

  readonly isAuthenticated = computed(() => !!this.token());
  readonly isManager = computed(() => this.role() === 'manager');
  readonly isTenant = computed(() => this.role() === 'tenant');

  private readStoredUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      return null;
    }
  }

  /** Giải mã nhanh JWT payload — chỉ dùng cho routing/guard phía client, backend luôn re-check quyền */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  async login(phone: string, password: string): Promise<UserResponse> {
    const body: LoginRequest = { phone, password };
    const res = await firstValueFrom(
      this.http.post<ApiResponse<LoginResponseData>>(`${environment.apiUrl}/auth/login`, body)
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Đăng nhập thất bại');
    }
    this.setSession(res.data.token, res.data.user);
    return res.data.user;
  }

  async fetchMe(): Promise<UserResponse | null> {
    if (!this.token()) return null;
    const res = await firstValueFrom(
      this.http.get<ApiResponse<UserResponse>>(`${environment.apiUrl}/auth/me`)
    );
    if (res.success && res.data) {
      this.currentUser.set(res.data);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      return res.data;
    }
    return null;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<null>>(`${environment.apiUrl}/auth/change-password`, {
        old_password: oldPassword,
        new_password: newPassword,
      })
    );
    if (!res.success) {
      throw new Error(res.message || 'Đổi mật khẩu thất bại');
    }
  }

  private setSession(token: string, user: UserResponse) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }
}
