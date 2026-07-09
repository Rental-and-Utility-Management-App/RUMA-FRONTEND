import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  resource,
  computed,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { RoomsService } from '../../../core/services/rooms.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  RoomStatus,
  ROOM_PAYMENT_STATUS_COLOR,
  ROOM_PAYMENT_STATUS_LABEL,
  ROOM_PAYMENT_OVERDUE_COLOR,
  ROOM_PAYMENT_OVERDUE_LABEL,
} from '../../../core/models';
import { DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';

const STATUS_COLOR: Record<RoomStatus, string> = {
  available: 'bg-[#FFE9AC] text-[#8A6200]',
  occupied: 'bg-[#E9E4D6] text-[#6B6455]',
};
const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Còn trống',
  occupied: 'Đã thuê',
};

@Component({
  selector: 'app-tenant-room-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, DatePipe, TenantSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <app-tenant-sidebar />

      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-2xl mx-auto p-6 md:p-10">

          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
            <p class="text-sm font-medium text-[#B8860B] mb-1">Không gian của tôi</p>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
              Phòng
              <span class="relative inline-block">
                của tôi
                <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="mt-3 text-[#8A8270]">Thông tin phòng, biểu phí và tình trạng đóng tiền tháng này.</p>
          </div>

          <!-- Content -->
          @if (!roomId()) {
            <div class="rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FBF7ED] text-[#8A6200]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9-2v10a1 1 0 001 1h3m6-11l2 2m-8-9v3m0 0h.01" />
                </svg>
              </div>
              <p class="font-medium text-[#221D0F]">Bạn chưa được gán phòng nào</p>
              <p class="mt-1 text-sm text-[#8A8270]">Vui lòng liên hệ quản lý để được xếp phòng.</p>
            </div>
          } @else if (room.isLoading() && !room.hasValue()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải thông tin phòng...</p>
            </div>
          } @else if (room.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được thông tin phòng. Vui lòng thử lại.</p>
            </div>
          } @else if (room.value(); as r) {
            <div #roomSection class="opacity-0">

              <!-- Hero card: mã phòng + trạng thái + giá thuê -->
              <div class="relative overflow-hidden rounded-3xl bg-[#221D0F] p-6 md:p-8 shadow-[0_10px_30px_rgba(34,29,15,0.25)]">
                <div class="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#FFC629]/10 blur-2xl"></div>
                <div class="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-[#FFC629]/10 blur-2xl"></div>

                <div class="relative flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-wide text-[#FFC629]/80 mb-1.5">Mã phòng</p>
                    <h2 class="text-4xl font-bold text-white">{{ r.code }}</h2>
                  </div>
                  <ui-badge [colorClass]="STATUS_COLOR[r.status]">
                    {{ STATUS_LABEL[r.status] }}
                  </ui-badge>
                </div>

                <div class="relative mt-8 flex items-end justify-between">
                  <div>
                    <p class="text-xs text-[#EFE6CC]/70 mb-1">Giá thuê hàng tháng</p>
                    <p class="text-2xl font-bold text-[#FFC629]">{{ r.monthly_rent | number }} ₫</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-[#FFC629]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9.5L12 4l9 5.5M4.5 10v9a1 1 0 001 1h4.5v-5.5h4V20h4.5a1 1 0 001-1v-9" />
                  </svg>
                </div>
              </div>

              <!-- Sức chứa -->
              <div class="mt-4 rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)]">
                <div class="flex items-center justify-between mb-3">
                  <span class="flex items-center gap-1.5 text-sm font-medium text-[#221D0F]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#8A8270]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Sức chứa phòng
                  </span>
                  <span class="text-sm font-bold text-[#221D0F]">{{ r.occupants || 0 }}/{{ r.capacity || 0 }} người</span>
                </div>
                <div class="h-2.5 w-full rounded-full bg-[#F1EBD8] overflow-hidden">
                  <div
                    class="h-full rounded-full bg-[#FFC629] transition-all duration-500"
                    [style.width.%]="occupancyPercent()"
                  ></div>
                </div>
              </div>

              <!-- Biểu phí chi tiết -->
              <div class="mt-4 rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)]">
                <h3 class="text-sm font-bold text-[#221D0F] mb-4">Biểu phí chi tiết</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-[#8A8270]">Giá điện</span>
                    <span class="text-sm font-bold text-[#221D0F]">{{ r.price_electricity | number }} ₫/kWh</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-[#8A8270]">Giá nước</span>
                    <span class="text-sm font-bold text-[#221D0F]">{{ r.price_water | number }} ₫/khối</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-[#8A8270]">Phí quản lý</span>
                    <span class="text-sm font-bold text-[#221D0F]">{{ r.management_fee_per_person | number }} ₫/người</span>
                  </div>
                </div>
                @if (r.note) {
                  <div class="mt-4 pt-4 border-t border-[#F1EBD8] flex flex-col gap-1">
                    <span class="text-xs text-[#8A8270]">Ghi chú từ quản lý</span>
                    <span class="text-sm font-medium text-[#221D0F]">{{ r.note }}</span>
                  </div>
                }
              </div>

              <!-- Tình trạng thanh toán tháng này -->
              <div class="mt-4 rounded-3xl border p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)]" [class]="paymentBannerBorderColor()">
                <div class="flex items-start gap-4">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" [class]="paymentBadgeColor()">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      @if (isPaidUp()) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-sm font-bold text-[#221D0F]">Tiền phòng tháng này</span>
                      <ui-badge [colorClass]="paymentBadgeColor()">{{ paymentBadgeLabel() }}</ui-badge>
                    </div>

                    @if (r.current_month_payment && r.current_month_payment.status !== 'no_invoice') {
                      <div class="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#8A8270]">
                        <p>
                          Đã đóng:
                          <span class="font-semibold text-[#221D0F]">{{ r.current_month_payment.paid_amount || 0 | number }} ₫</span>
                          / {{ r.current_month_payment.total_amount || 0 | number }} ₫
                        </p>
                        @if (r.current_month_payment.due_date) {
                          <p>
                            Hạn đóng:
                            <span class="font-semibold text-[#221D0F]">{{ r.current_month_payment.due_date | date: 'dd/MM/yyyy' }}</span>
                          </p>
                        }
                      </div>
                    } @else {
                      <p class="text-sm text-[#8A8270]">Chưa có hóa đơn nào được phát hành cho tháng này.</p>
                    }

                    @if (r.current_month_payment?.invoice_id) {
                      <a
                        [routerLink]="['/invoices', r.current_month_payment!.invoice_id]"
                        class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#221D0F] px-4 py-2 text-xs font-semibold text-[#FFC629] transition hover:bg-black"
                      >
                        Xem hóa đơn
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    }
                  </div>
                </div>
              </div>

              <!-- Người ở cùng phòng -->
              @if (r.tenants && r.tenants.length > 0) {
                <div class="mt-4 rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)]">
                  <h3 class="text-sm font-bold text-[#221D0F] mb-4">Người ở cùng phòng ({{ r.tenants.length }})</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (t of r.tenants; track t.id) {
                      <div class="flex items-center gap-3 rounded-xl bg-[#FBF7ED] p-3 border border-[#EFE6CC]">
                        @if (t.avatar_url) {
                          <img [src]="t.avatar_url" alt="" class="h-10 w-10 shrink-0 rounded-full object-cover border border-[#EFE6CC]" />
                        } @else {
                          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#8A6200] shadow-sm border border-[#EFE6CC]">
                            {{ t.full_name?.charAt(0)?.toUpperCase() || 'T' }}
                          </div>
                        }
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-bold text-[#221D0F] truncate" [title]="t.full_name">{{ t.full_name }}</p>
                          <p class="text-xs text-[#8A8270] truncate">{{ t.phone }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Hợp đồng hiện tại -->
          @if (room.hasValue()) {
            <div #contractsHeader class="mt-8 mb-4 opacity-0">
              <h3 class="text-lg font-bold text-[#221D0F]">Hợp đồng hiện tại</h3>
              <p class="text-sm text-[#8A8270]">Lịch sử và trạng thái thuê phòng của bạn</p>
            </div>

            @if (contracts.isLoading() && !contracts.hasValue()) {
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải dữ liệu hợp đồng...</p>
            } @else {
              <div class="space-y-3">
                @for (c of activeContracts(); track c.id) {
                  <a
                    #contractCard
                    [routerLink]="['/contracts', c.id]"
                    class="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#EFE6CC] bg-white p-5 opacity-0
                           transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(34,29,15,0.04)]"
                  >
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="text-base font-bold text-[#221D0F]">
                          {{ c.start_date | date: 'dd/MM/yyyy' }} &rarr; {{ c.end_date | date: 'dd/MM/yyyy' }}
                        </span>
                        <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                          {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
                        </ui-badge>
                      </div>
                      <p class="text-sm text-[#8A8270] flex items-center gap-1.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-[#FFC629]"></span>
                        Đã cọc: <span class="font-semibold text-[#221D0F]">{{ c.deposit_paid | number }} ₫</span> / {{ c.deposit_amount | number }} ₫
                      </p>
                    </div>

                    <div class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF7ED] text-[#B8860B] transition-transform group-hover:translate-x-1 group-hover:bg-[#FFC629] group-hover:text-[#221D0F]">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                } @empty {
                  <div #contractCard class="rounded-2xl border border-dashed border-[#D8D2C2] bg-white/50 p-8 text-center opacity-0">
                    <p class="text-[#8A8270]">Chưa có hợp đồng nào đang hiệu lực cho phòng này.</p>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class TenantRoomListPage {
  private roomsService = inject(RoomsService);
  private contractsService = inject(ContractsService);
  private auth = inject(AuthService);

  STATUS_COLOR = STATUS_COLOR;
  STATUS_LABEL = STATUS_LABEL;
  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;

  // room_id của tenant hiện tại, lấy từ thông tin đăng nhập
  roomId = () => this.auth.currentUser()?.room_id ?? null;

  // Chỉ gọi GET /api/rooms/{id} khi tenant đã được gán phòng
  room = resource({
    params: () => (this.roomId() ? { id: this.roomId()! } : undefined),
    loader: ({ params }) => this.roomsService.getById(params.id),
  });

  contracts = this.contractsService.contractsByRoom(() => this.roomId() ?? '');

  // Rào chắn kiểu 'any' phòng trường hợp Backend trả về kiểu dữ liệu mảng bị sai lệch
  activeContracts() {
    const list = this.contracts.value()?.data || this.contracts.value() || [];
    if (!Array.isArray(list)) return [];
    return list.filter((c: any) => c.status === 'active');
  }

  occupancyPercent = computed(() => {
    const r = this.room.value();
    if (!r || !r.capacity) return 0;
    return Math.min(100, Math.round((r.occupants / r.capacity) * 100));
  });

  isPaidUp = computed(() => {
    const r = this.room.value();
    return !r?.current_month_payment || r.current_month_payment.status === 'paid';
  });

  // Tình trạng đóng tiền phòng tháng này (ưu tiên hiển thị "Quá hạn" nếu
  // overdue=true, bất kể status đang là unpaid hay partial).
  paymentBadgeColor(): string {
    const r = this.room.value();
    if (r?.current_month_payment?.overdue) {
      return ROOM_PAYMENT_OVERDUE_COLOR;
    }
    return ROOM_PAYMENT_STATUS_COLOR[r?.current_month_payment?.status ?? 'no_invoice'];
  }

  paymentBadgeLabel(): string {
    const r = this.room.value();
    if (r?.current_month_payment?.overdue) {
      return ROOM_PAYMENT_OVERDUE_LABEL;
    }
    return ROOM_PAYMENT_STATUS_LABEL[r?.current_month_payment?.status ?? 'no_invoice'];
  }

  // Viền/nền của banner thanh toán: nhấn mạnh màu đỏ nếu quá hạn, còn lại trung tính
  paymentBannerBorderColor(): string {
    const r = this.room.value();
    if (r?.current_month_payment?.overdue) {
      return 'border-[#F4D9D2] bg-[#FEF7F5]';
    }
    return 'border-[#EFE6CC] bg-white';
  }

  // Refs cho animation
  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private roomSectionEl = viewChild<ElementRef<HTMLElement>>('roomSection');
  private contractsHeader = viewChild<ElementRef<HTMLElement>>('contractsHeader');
  private contractCards = viewChildren<ElementRef<HTMLElement>>('contractCard');

  private layoutAnimated = false;
  private roomAnimated = false;
  private contractsAnimated = false;

  constructor() {
    afterNextRender(() => {
      if (this.layoutAnimated) return;
      this.layoutAnimated = true;

      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // Chạy animation cho toàn bộ khối thông tin phòng khi dữ liệu đã sẵn sàng (chỉ 1 lần)
    effect(() => {
      const section = this.roomSectionEl()?.nativeElement;
      if (section && this.room.value() && !this.roomAnimated) {
        this.roomAnimated = true;
        setTimeout(() => {
          gsap.fromTo(section, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        }, 50);
      }
    });

    // FIX: chỉ khoá `contractsAnimated = true` khi số lượng phần tử
    // `contractCards()` đã khớp với số lượng mong đợi (>= 1 cho khối @empty),
    // tránh trường hợp effect chạy sớm hơn 1 nhịp change detection so với
    // lúc @for/@empty render xong khiến card animate với mảng rỗng và
    // kẹt ở opacity-0 vĩnh viễn.
    effect(() => {
      const header = this.contractsHeader()?.nativeElement;
      const cards = this.contractCards().map((c) => c.nativeElement).filter((el) => !!el);
      const expectedCount = Math.max(this.activeContracts().length, 1);

      if (this.contracts.value() && !this.contractsAnimated && cards.length >= expectedCount) {
        this.contractsAnimated = true;
        setTimeout(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (header) tl.fromTo(header, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
          if (cards.length) tl.fromTo(cards, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.1 }, '-=0.1');
        }, 50);
      }
    });
  }
}