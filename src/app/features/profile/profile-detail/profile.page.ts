import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ElementRef,
  viewChild,
  afterNextRender,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import gsap from 'gsap';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';
import { ChangePasswordPage } from '../changepassword/changepassword.page';
import { ConfirmService } from '../../../shared/ui/confirm/confirm';
import { environment } from '../../../../environments/environment';

// --- Kiểu dữ liệu tối thiểu cho hồ sơ, khớp với response của GET /api/auth/me ---
interface ProfileMe {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string | null;
  role: 'manager' | 'tenant';
  room_id?: string | null;
  room?: { code: string } | null;
  is_active: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TenantSidebar, ManagerSidebar, ChangePasswordPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Sidebar theo vai trò -->
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-3xl mx-auto p-6 md:p-10">

          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
            <p class="text-sm font-medium text-[#B8860B] mb-1">Tài khoản của tôi</p>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
              Hồ sơ
              <span class="relative inline-block">
                cá nhân
                <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="mt-3 text-[#8A8270]">Xem và cập nhật thông tin, ảnh đại diện của bạn.</p>
          </div>

          @if (loadingProfile()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải hồ sơ...</p>
            </div>
          } @else if (loadError()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">{{ loadError() }}</p>
            </div>
          } @else if (profile(); as p) {
            <!-- Card avatar -->
            <div #avatarCard class="mb-6 rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0">
              <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div class="relative shrink-0">
                  @if (avatarPreview() || p.avatar_url) {
                    <img
                      [src]="avatarPreview() || p.avatar_url"
                      alt="Ảnh đại diện"
                      class="h-28 w-28 rounded-full object-cover border border-[#F1EBD8]"
                    />
                  } @else {
                    <div class="flex h-28 w-28 items-center justify-center rounded-full bg-[#FBF7ED] text-3xl font-bold text-[#8A6200] border border-[#F1EBD8]">
                      {{ p.full_name.charAt(0).toUpperCase() }}
                    </div>
                  }

                  @if (uploadingAvatar()) {
                    <div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                      <span class="text-xs font-medium text-white">Đang tải...</span>
                    </div>
                  }
                </div>

                <div class="flex-1 min-w-0 text-center sm:text-left">
                  <h3 class="text-lg font-bold text-[#221D0F]">{{ p.full_name }}</h3>
                  <p class="text-sm text-[#8A8270] mt-0.5">{{ p.phone }}</p>

                  @if (p.room_id) {
                    <div class="mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                      <span class="text-xs text-[#8A8270]">Phòng:</span>
                      <span class="inline-block rounded-md bg-[#FFC629] px-2 py-0.5 text-xs font-bold text-[#221D0F] shadow-sm">
                        {{ p.room?.code || p.room_id }}
                      </span>
                    </div>
                  }

                  <div class="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <label
                      class="cursor-pointer flex items-center gap-2 rounded-full bg-[#FFC629] px-4 py-2 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Đổi ảnh đại diện
                      <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="onAvatarSelected($event)" />
                    </label>

                    @if (p.avatar_url) {
                      <button
                        type="button"
                        [disabled]="removingAvatar()"
                        (click)="onRemoveAvatarClick()"
                        class="flex items-center gap-2 rounded-full border border-[#EFE6CC] bg-white px-4 py-2 text-sm font-semibold text-[#8A8270] transition hover:border-[#F4D9D2] hover:text-[#9A3412] disabled:opacity-50"
                      >
                        Gỡ ảnh
                      </button>
                    }
                  </div>

                  @if (avatarMessage(); as msg) {
                    <p class="mt-3 text-sm" [class.text-[#166534]]="!avatarError()" [class.text-[#9A3412]]="avatarError()">{{ msg }}</p>
                  }
                </div>
              </div>
            </div>

            <!-- Card thông tin cơ bản -->
            <div #infoCard class="mb-6 rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0">
              <h3 class="text-base font-bold text-[#221D0F] mb-4">Thông tin tài khoản</h3>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt class="text-[#8A8270]">Họ và tên</dt>
                  <dd class="mt-1 font-medium text-[#221D0F]">{{ p.full_name }}</dd>
                </div>
                <div>
                  <dt class="text-[#8A8270]">Số điện thoại</dt>
                  <dd class="mt-1 font-medium text-[#221D0F]">{{ p.phone }}</dd>
                </div>
                <div>
                  <dt class="text-[#8A8270]">Email</dt>
                  <dd class="mt-1 font-medium text-[#221D0F]">{{ p.email || 'Chưa cập nhật' }}</dd>
                </div>
                <div>
                  <dt class="text-[#8A8270]">Trạng thái</dt>
                  <dd class="mt-1">
                    <span
                      class="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                      [class]="p.is_active ? 'bg-[#E5F5E9] text-[#166534]' : 'bg-[#F1EBD8] text-[#6B6455]'"
                    >
                      {{ p.is_active ? 'Hoạt động' : 'Đã khóa' }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Card đổi mật khẩu (component riêng) -->
            <div #passwordCard class="opacity-0">
              <app-change-password />
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProfilePage {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private confirm = inject(ConfirmService);

  // --- Hồ sơ ---
  profile = signal<ProfileMe | null>(null);
  loadingProfile = signal(true);
  loadError = signal<string | null>(null);

  // --- Avatar ---
  avatarPreview = signal<string | null>(null);
  uploadingAvatar = signal(false);
  removingAvatar = signal(false);
  avatarMessage = signal<string | null>(null);
  avatarError = signal(false);

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private avatarCard = viewChild<ElementRef<HTMLElement>>('avatarCard');
  private infoCard = viewChild<ElementRef<HTMLElement>>('infoCard');
  private passwordCard = viewChild<ElementRef<HTMLElement>>('passwordCard');

  constructor() {
    this.loadProfile();

    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
  }

  private animateCards(): void {
    setTimeout(() => {
      const cards = [this.avatarCard()?.nativeElement, this.infoCard()?.nativeElement, this.passwordCard()?.nativeElement].filter(
        (el): el is HTMLElement => !!el,
      );
      if (cards.length > 0) {
        gsap.fromTo(cards, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.08, ease: 'power3.out' });
      }
    }, 50);
  }

  // --- Tải hồ sơ hiện tại (GET /api/auth/me) ---
  private async loadProfile(): Promise<void> {
    this.loadingProfile.set(true);
    this.loadError.set(null);
    try {
      const res = await firstValueFrom(this.http.get<ApiResponse<ProfileMe>>(`${environment.apiUrl}/auth/me`));
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Không tải được hồ sơ');
      }
      this.profile.set(res.data);
      this.animateCards();
    } catch (error: any) {
      console.error('Load profile failed:', error);
      this.loadError.set(error?.error?.message || 'Không tải được hồ sơ. Vui lòng thử lại.');
    } finally {
      this.loadingProfile.set(false);
    }
  }

  // --- Chọn ảnh mới -> preview + upload (POST /api/users/me/avatar) ---
  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.uploadingAvatar.set(true);
    this.avatarMessage.set(null);
    this.avatarError.set(false);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await firstValueFrom(
        this.http.post<ApiResponse<{ avatarUrl?: string; avatar_url?: string }>>(`${environment.apiUrl}/users/me/avatar`, formData),
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Tải ảnh lên thất bại');
      }
      const newUrl = res.data.avatarUrl ?? res.data.avatar_url ?? this.avatarPreview() ?? undefined;

      this.profile.update((p) => (p ? { ...p, avatar_url: newUrl ?? p.avatar_url } : p));
      this.avatarMessage.set('Cập nhật ảnh đại diện thành công.');
    } catch {
      this.avatarError.set(true);
      this.avatarMessage.set('Tải ảnh lên thất bại. Vui lòng thử lại.');
      this.avatarPreview.set(null);
    } finally {
      this.uploadingAvatar.set(false);
      input.value = '';
    }
  }

  // --- Bấm "Gỡ ảnh" -> hỏi xác nhận trước ---
  async onRemoveAvatarClick(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Gỡ ảnh đại diện',
      message: 'Bạn có chắc chắn muốn gỡ ảnh đại diện hiện tại? Thao tác này không thể hoàn tác.',
      confirmText: 'Gỡ ảnh',
      cancelText: 'Hủy bỏ',
      danger: true,
    });
    if (!ok) return;

    await this.removeAvatar();
  }

  // --- Gỡ avatar hiện tại (DELETE /api/users/me/avatar) ---
  private async removeAvatar(): Promise<void> {
    this.removingAvatar.set(true);
    this.confirm.setProcessing(true);
    this.avatarMessage.set(null);
    this.avatarError.set(false);

    try {
      const res = await firstValueFrom(this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/users/me/avatar`));
      if (!res.success) {
        throw new Error(res.message || 'Gỡ ảnh thất bại');
      }
      this.profile.update((p) => (p ? { ...p, avatar_url: null } : p));
      this.avatarPreview.set(null);
      this.avatarMessage.set('Đã gỡ ảnh đại diện.');
    } catch {
      this.avatarError.set(true);
      this.avatarMessage.set('Gỡ ảnh thất bại. Vui lòng thử lại.');
    } finally {
      this.removingAvatar.set(false);
      this.confirm.setProcessing(false);
    }
  }
}