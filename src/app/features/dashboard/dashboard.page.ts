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
import gsap from 'gsap';
import { AuthService } from '../../core/auth/auth.service';
import { RoomsService } from '../../core/services/rooms.service';
import { InvoicesService } from '../../core/services/invoices.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-slate-50">
      <!-- Nền gradient động -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          #blob1
          class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-primary/30 to-indigo-400/20 blur-3xl"
        ></div>
        <div
          #blob2
          class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-fuchsia-400/20 to-primary/20 blur-3xl"
        ></div>
      </div>

      <div class="relative max-w-5xl mx-auto p-6 md:p-10">
        <!-- Header -->
        <div #hero class="mb-10 opacity-0">
          <p class="text-sm font-medium text-primary mb-1">{{ today() }}</p>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Chào,
            <span
              class="bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent"
              >{{ auth.currentUser()?.full_name }}</span
            >
            👋
          </h1>
          <p class="mt-2 text-slate-500">Đây là tổng quan hoạt động cho thuê phòng của bạn.</p>
        </div>

        <!-- Stat cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <a
            #card
            routerLink="/rooms"
            class="group relative rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm p-6 shadow-sm opacity-0
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 overflow-hidden"
          >
            <div
              class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 transition-transform duration-500 group-hover:scale-150"
            ></div>
            <div class="relative flex items-center gap-3 mb-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p class="text-sm text-slate-500">Phòng trống</p>
            </div>
            <p class="relative text-3xl font-bold text-slate-900">
              <span #availableCount>0</span>
            </p>
          </a>

          <a
            #card
            routerLink="/invoices"
            [queryParams]="{ status: 'unpaid' }"
            class="group relative rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm p-6 shadow-sm opacity-0
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 overflow-hidden"
          >
            <div
              class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/10 transition-transform duration-500 group-hover:scale-150"
            ></div>
            <div class="relative flex items-center gap-3 mb-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-sm text-slate-500">Hóa đơn chưa thanh toán</p>
            </div>
            <p class="relative text-3xl font-bold text-slate-900">
              <span #unpaidCount>0</span>
            </p>
          </a>

          <a
            #card
            routerLink="/contracts"
            class="group relative rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm p-6 shadow-sm opacity-0
                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 overflow-hidden"
          >
            <div
              class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-400/10 transition-transform duration-500 group-hover:scale-150"
            ></div>
            <div class="relative flex items-center gap-3 mb-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h2a1 1 0 011 1v3" />
                </svg>
              </div>
              <p class="text-sm text-slate-500">Tổng số phòng</p>
            </div>
            <p class="relative text-3xl font-bold text-slate-900">
              <span #totalCount>0</span>
            </p>
          </a>
        </div>

        <!-- Quick actions -->
        <div #actions class="flex gap-3 flex-wrap opacity-0">
          <a
            routerLink="/rooms"
            class="rounded-xl bg-linear-to-r from-primary to-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20
                   transition-transform duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Quản lý phòng
          </a>
          @if (auth.isManager()) {
            <a
              routerLink="/tenants"
              class="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200
                     transition-transform duration-200 hover:scale-105 hover:border-primary/40 hover:text-primary active:scale-95"
            >
              Quản lý tenant
            </a>
          }
          <a
            routerLink="/contracts"
            class="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200
                   transition-transform duration-200 hover:scale-105 hover:border-primary/40 hover:text-primary active:scale-95"
          >
            Hợp đồng
          </a>
          <a
            routerLink="/invoices"
            class="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200
                   transition-transform duration-200 hover:scale-105 hover:border-primary/40 hover:text-primary active:scale-95"
          >
            Hóa đơn
          </a>
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