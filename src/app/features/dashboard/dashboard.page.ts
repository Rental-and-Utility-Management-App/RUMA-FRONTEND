import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import gsap from 'gsap';
import { AuthService } from '../../core/auth/auth.service';
import { RoomsService } from '../../core/services/rooms.service';
import { InvoicesService } from '../../core/services/invoices.service';
import { TenantSidebar } from '../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Sidebar theo vai trò -->
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <!-- Ảnh nền dashboard, mờ chìm trên nền kem -->
      <div
        class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]"
        style="background-image: url('/assets/images/dashboard-bg.jpg');"
      ></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <!-- Nền gradient động, tông vàng -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          #blob1
          class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"
        ></div>
        <div
          #blob2
          class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"
        ></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-5xl mx-auto p-6 md:p-10">
          <!-- Header -->
          <div #hero class="mb-8 flex flex-wrap items-end justify-between gap-4 opacity-0">
            <div>
              <p class="text-sm font-medium text-[#B8860B] mb-1">{{ today() }}</p>
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
                Chào,
                <span class="relative inline-block">
                  {{ auth.currentUser()?.full_name }}
                  <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                  </svg>
                </span>
                👋
              </h1>
              <p class="mt-3 text-[#8A8270]">Đây là tổng quan hoạt động cho thuê phòng của bạn.</p>
            </div>

            <!-- Pills tổng quan nhanh -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 rounded-full border border-[#EFE6CC] bg-white/80 px-4 py-2 shadow-sm">
                <span class="h-2 w-2 rounded-full bg-[#FFC629]"></span>
                <span class="text-sm text-[#6B6455]">Tổng phòng</span>
                <span class="text-sm font-semibold text-[#221D0F]">{{ totalRoomsCount() }}</span>
              </div>
              <div class="flex items-center gap-2 rounded-full bg-[#221D0F] px-4 py-2 shadow-sm">
                <span class="h-2 w-2 rounded-full bg-[#FFC629]"></span>
                <span class="text-sm text-[#D8D2C2]">Phòng trống</span>
                <span class="text-sm font-semibold text-white">{{ availableRoomsCount() }}</span>
              </div>
            </div>
          </div>

          <!-- Stat cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <a
              #card
              routerLink="/rooms"
              class="group relative rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0
                     transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden"
            >
              <div
                class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"
              ></div>
              <div class="relative flex items-center gap-3 mb-4">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFC629] text-[#221D0F]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p class="text-sm text-[#8A8270]">Phòng trống</p>
              </div>
              <p class="relative text-3xl font-bold text-[#221D0F]">
                <span #availableCount>0</span>
              </p>
            </a>

            <a
              #card
              routerLink="/invoices"
              [queryParams]="{ status: 'unpaid' }"
              class="group relative rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0
                     transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden"
            >
              <div
                class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"
              ></div>
              <div class="relative flex items-center gap-3 mb-4">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#221D0F] text-[#FFC629]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p class="text-sm text-[#8A8270]">Hóa đơn chưa thanh toán</p>
              </div>
              <p class="relative text-3xl font-bold text-[#221D0F]">
                <span #unpaidCount>0</span>
              </p>
            </a>

            <a
              #card
              routerLink="/contracts"
              class="group relative rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0
                     transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden"
            >
              <div
                class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"
              ></div>
              <div class="relative flex items-center gap-3 mb-4">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE29A] text-[#8A6200]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h2a1 1 0 011 1v3" />
                  </svg>
                </div>
                <p class="text-sm text-[#8A8270]">Tổng số phòng</p>
              </div>
              <p class="relative text-3xl font-bold text-[#221D0F]">
                <span #totalCount>0</span>
              </p>
            </a>
          </div>

          <!-- Khối tối: điểm nhấn thương hiệu, kiểu "Onboarding" trong ảnh tham chiếu -->
          <div
            #actions
            class="relative overflow-hidden rounded-3xl bg-[#221D0F] p-6 md:p-8 opacity-0"
          >
            <div class="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#FFC629]/10 blur-2xl"></div>
            <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-[#FFC629]">Tỷ lệ lấp đầy</p>
                <p class="mt-1 text-2xl font-bold text-white">
                  {{ totalRoomsCount() > 0 ? (((totalRoomsCount() - availableRoomsCount()) / totalRoomsCount()) * 100 | number: '1.0-0') : 0 }}%
                  phòng đang cho thuê
                </p>
              </div>
              <div class="flex items-center gap-3">
                <a
                  routerLink="/rooms"
                  class="rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] transition hover:bg-[#FFD764]"
                  >Xem danh sách phòng</a
                >
                <a
                  routerLink="/invoices"
                  [queryParams]="{ status: 'unpaid' }"
                  class="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >Xem hóa đơn</a
                >
              </div>
            </div>
            <!-- Thanh tiến trình -->
            <div class="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-[#FFC629] transition-all duration-700"
                [style.width.%]="totalRoomsCount() > 0 ? ((totalRoomsCount() - availableRoomsCount()) / totalRoomsCount()) * 100 : 0"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage {
  auth = inject(AuthService);
  private roomsService = inject(RoomsService);
  private invoicesService = inject(InvoicesService);

  rooms = this.roomsService.roomsResource;
  invoices = this.invoicesService.list(() => ({ status: 'unpaid' }));

  totalRoomsCount = computed(() => this.rooms.value()?.data?.length ?? 0);
  availableRoomsCount = computed(
    () => (this.rooms.value()?.data ?? []).filter((r: { status: string }) => r.status === 'available').length
  );
  unpaidInvoicesCount = computed(() => this.invoices.value()?.data?.length ?? 0);

  today = computed(() =>
    new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  );

  // Refs
  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private actionsEl = viewChild<ElementRef<HTMLElement>>('actions');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');

  private availableCountEl = viewChild<ElementRef<HTMLElement>>('availableCount');
  private unpaidCountEl = viewChild<ElementRef<HTMLElement>>('unpaidCount');
  private totalCountEl = viewChild<ElementRef<HTMLElement>>('totalCount');

  private countersAnimated = false;

  constructor() {
    // Chạy animation nhập cảnh một lần sau khi view sẵn sàng
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const actionsElNode = this.actionsEl()?.nativeElement;
      const cardEls = this.cards()
        .map((c) => c.nativeElement)
        .filter((el): el is HTMLElement => !!el);

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) {
        tl.fromTo(
          [blob1El, blob2El],
          { opacity: 0, scale: 0.7 },
          { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }
        );
      }

      if (heroEl) {
        tl.fromTo(heroEl, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=1');
      }

      if (cardEls.length) {
        tl.fromTo(
          cardEls,
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.15 },
          '-=0.3'
        );
      }

      if (actionsElNode) {
        tl.fromTo(actionsElNode, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');
      }

      // Hiệu ứng "thở" nhẹ cho các blob nền
      if (blob1El) {
        gsap.to(blob1El, {
          x: 20,
          y: 15,
          duration: 6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
      if (blob2El) {
        gsap.to(blob2El, {
          x: -15,
          y: -20,
          duration: 7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    });

    // Đếm số chạy lên khi dữ liệu về (chỉ chạy 1 lần khi có dữ liệu thật)
    effect(() => {
      const total = this.totalRoomsCount();
      const available = this.availableRoomsCount();
      const unpaid = this.unpaidInvoicesCount();

      if (this.countersAnimated) return;
      if (this.rooms.value() === undefined || this.invoices.value() === undefined) return;

      this.countersAnimated = true;
      this.animateCount(this.totalCountEl()?.nativeElement, total);
      this.animateCount(this.availableCountEl()?.nativeElement, available);
      this.animateCount(this.unpaidCountEl()?.nativeElement, unpaid);
    });
  }

  private animateCount(el: HTMLElement | undefined, target: number) {
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.2,
      delay: 0.4,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = Math.round(obj.val).toString()),
    });
  }
}