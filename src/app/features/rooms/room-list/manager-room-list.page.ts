import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect,
  signal,
  computed
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { RoomsService } from '../../../core/services/rooms.service';
import {
  Room,
  RoomStatus,
  ROOM_PAYMENT_STATUS_COLOR,
  ROOM_PAYMENT_STATUS_LABEL,
  ROOM_PAYMENT_OVERDUE_COLOR,
  ROOM_PAYMENT_OVERDUE_LABEL,
} from '../../../core/models';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

const STATUS_COLOR: Record<RoomStatus, string> = {
  available: 'bg-[#FFE9AC] text-[#8A6200]',
  occupied: 'bg-[#E9E4D6] text-[#6B6455]',
};
const STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Còn trống',
  occupied: 'Đã thuê',
};

@Component({
  selector: 'app-manager-room-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <app-manager-sidebar />

      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-5xl mx-auto p-6 md:p-10">

          <!-- Header -->
          <div #hero class="mb-8 flex flex-wrap items-end justify-between gap-4 opacity-0">
            <div>
              <p class="text-sm font-medium text-[#B8860B] mb-1">Quản lý không gian</p>
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
                Danh sách
                <span class="relative inline-block">
                  phòng
                  <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                  </svg>
                </span>
              </h1>
              <p class="mt-3 text-[#8A8270]">Quản lý và theo dõi trạng thái các phòng hiện tại.</p>
            </div>

            <a
              routerLink="/rooms/new"
              class="flex items-center gap-2 rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tạo phòng
            </a>
          </div>

          <!-- Bộ lọc & Tìm kiếm -->
          <div #filterBar class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo mã phòng (VD: P.101)..."
                (input)="searchQuery.set($any($event.target).value)"
                class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 py-2 pl-10 pr-4 text-sm text-[#221D0F] placeholder-[#8A8270] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div class="shrink-0">
              <select
                (change)="statusFilter.set($any($event.target).value)"
                class="rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Còn trống</option>
                <option value="occupied">Đã thuê</option>
              </select>
            </div>

            <div class="shrink-0">
              <select
                (change)="paymentFilter.set($any($event.target).value)"
                class="rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              >
                <option value="all">Tất cả tiền phòng tháng này</option>
                <option value="unpaid">Chưa đóng tiền</option>
                <option value="partial">Đóng một phần</option>
                <option value="paid">Đã đóng tiền</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>
          </div>

          <!-- Content -->
          @if (rooms.isLoading()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách...</p>
            </div>
          } @else if (rooms.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được danh sách phòng. Vui lòng thử lại.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (room of filteredRooms(); track room.id) {
                <a
                  #card
                  [routerLink]="['/rooms', room.id]"
                  class="group relative flex flex-col rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden h-full"
                >
                  <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"></div>

                  <div class="relative flex items-center justify-between mb-5">
                    <div class="flex items-center gap-3">
                      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBF7ED] text-sm font-bold text-[#8A6200]">
                        {{ room.code }}
                      </div>
                      <span class="text-lg font-bold text-[#221D0F]">Phòng {{ room.code }}</span>
                    </div>
                    <ui-badge [colorClass]="STATUS_COLOR[room.status]">
                      {{ STATUS_LABEL[room.status] }}
                    </ui-badge>
                  </div>

                  <div class="relative mt-auto space-y-3 border-t border-[#F1EBD8] pt-4">
                    <div class="flex items-center justify-between text-sm">
                      <span class="flex items-center gap-1.5 text-[#8A8270]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Sức chứa
                      </span>
                      <span class="font-medium text-[#221D0F]">{{ room.occupants }}/{{ room.capacity }} người</span>
                    </div>

                    <div class="flex items-center justify-between text-sm">
                      <span class="flex items-center gap-1.5 text-[#8A8270]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Giá thuê
                      </span>
                      <span class="font-bold text-[#221D0F]">{{ room.monthly_rent | number }} ₫</span>
                    </div>

                    @if (room.status === 'occupied') {
                      <div class="flex items-center justify-between text-sm">
                        <span class="flex items-center gap-1.5 text-[#8A8270]">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-9 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Tiền phòng tháng này
                        </span>
                        <ui-badge [colorClass]="paymentBadgeColor(room)">
                          {{ paymentBadgeLabel(room) }}
                        </ui-badge>
                      </div>
                    }
                  </div>
                </a>
              } @empty {
                <div class="col-span-full rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
                  <p class="text-[#8A8270]">Không tìm thấy phòng nào phù hợp với bộ lọc.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ManagerRoomListPage {
  private roomsService = inject(RoomsService);
  rooms = this.roomsService.roomsResource;

  STATUS_COLOR = STATUS_COLOR;
  STATUS_LABEL = STATUS_LABEL;

  // --- STATE TÌM KIẾM VÀ LỌC ---
  searchQuery = signal('');
  statusFilter = signal('all');
  // 'all' | 'unpaid' | 'partial' | 'paid' | 'overdue'
  // Lưu ý: 'overdue' không phải 1 RoomPaymentStatus thật ở BE (nó là cờ đi kèm
  // unpaid/partial), nên lọc riêng bằng room.current_month_payment?.overdue.
  paymentFilter = signal('all');

  filteredRooms = computed(() => {
    const list = this.rooms.value()?.data ?? [];
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const payment = this.paymentFilter();

    return list.filter((r) => {
      const matchesSearch = !search || r.code.toLowerCase().includes(search);
      const matchesStatus = status === 'all' || r.status === status;
      const matchesPayment =
        payment === 'all' ||
        (payment === 'overdue'
          ? !!r.current_month_payment?.overdue
          : r.current_month_payment?.status === payment);
      return matchesSearch && matchesStatus && matchesPayment;
    });
  });

  // Tình trạng đóng tiền phòng tháng này (ưu tiên hiển thị "Quá hạn" nếu
  // overdue=true, bất kể status đang là unpaid hay partial).
  paymentBadgeColor(room: Room): string {
    if (room.current_month_payment?.overdue) {
      return ROOM_PAYMENT_OVERDUE_COLOR;
    }
    return ROOM_PAYMENT_STATUS_COLOR[room.current_month_payment?.status ?? 'no_invoice'];
  }

  paymentBadgeLabel(room: Room): string {
    if (room.current_month_payment?.overdue) {
      return ROOM_PAYMENT_OVERDUE_LABEL;
    }
    return ROOM_PAYMENT_STATUS_LABEL[room.current_month_payment?.status ?? 'no_invoice'];
  }

  // Refs cho animation
  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private filterBar = viewChild<ElementRef<HTMLElement>>('filterBar');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');
  private animatedCards = false;

  constructor() {
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const filterEl = this.filterBar()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');
      if (filterEl) tl.fromTo(filterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    effect(() => {
      const cardEls = this.cards().map((c) => c.nativeElement).filter((el): el is HTMLElement => !!el);
      if (cardEls.length > 0) {
        this.animatedCards = false;
        setTimeout(() => {
          gsap.fromTo(
            cardEls,
            { y: 16, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.05, ease: 'power3.out' }
          );
        }, 50);
      }
    });
  }
}