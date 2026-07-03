import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ElementRef,
  viewChild,
  afterNextRender
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiInput } from '../../../shared/ui/input/input';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [UiInput, RouterLink, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/assets/images/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-3xl mx-auto p-6 md:p-10">
          
          <div #hero class="mb-8 opacity-0">
            <a routerLink="/tenants" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Tạo tài khoản</h1>
            <p class="mt-2 text-[#8A8270]">Cung cấp thông tin đăng nhập cho người thuê mới.</p>
          </div>

          <div #formCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0">
            <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

            <form (submit)="onSubmit($event)">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <ui-input class="block w-full" label="Họ và tên (*)" [(value)]="fullName" />
                <ui-input class="block w-full" label="Số điện thoại (*)" type="tel" [(value)]="phone" />
                <ui-input class="block w-full" label="Email (tuỳ chọn)" type="email" [(value)]="email" />
                <ui-input class="block w-full" label="Mật khẩu tạm (*)" type="password" [(value)]="password" />
              </div>

              @if (errorMessage()) {
                <div class="mb-6 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{{ errorMessage() }}</p>
                </div>
              }

              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" [disabled]="saving()" class="flex items-center justify-center gap-2 rounded-full bg-[#FFC629] px-8 py-3 text-sm font-bold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764] disabled:opacity-60 disabled:cursor-not-allowed">
                  @if (saving()) {
                    <svg class="h-4 w-4 animate-spin text-[#221D0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang xử lý...
                  } @else {
                    Tạo tài khoản
                  }
                </button>
                <button type="button" (click)="router.navigate(['/tenants'])" [disabled]="saving()" class="rounded-full bg-[#F1EBD8] px-6 py-3 text-sm font-semibold text-[#6B6455] transition hover:bg-[#E9E4D6] hover:text-[#221D0F] disabled:opacity-60">
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TenantFormPage {
  router = inject(Router);
  auth = inject(AuthService);
  private usersService = inject(UsersService);

  fullName = signal('');
  phone = signal('');
  email = signal('');
  password = signal('');
  saving = signal(false);
  errorMessage = signal('');

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private formCard = viewChild<ElementRef<HTMLElement>>('formCard');

  constructor() {
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const formCardEl = this.formCard()?.nativeElement;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.4');
      if (formCardEl) tl.fromTo(formCardEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    this.saving.set(true);
    try {
      await this.usersService.create({
        full_name: this.fullName(),
        phone: this.phone(),
        password: this.password(),
        email: this.email() || undefined,
      });
      this.usersService.usersResource.reload();
      this.router.navigate(['/tenants']);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Tạo tài khoản thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}