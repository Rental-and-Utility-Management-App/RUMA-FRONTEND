import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { InvoicesService } from '../../../core/services/invoices.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';

@Component({
  selector: 'app-tenant-invoice-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, TenantSidebar],
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
        <div class="max-w-5xl mx-auto p-6 md:p-10">

          <div #hero class="mb-8 opacity-0 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-[#B8860B] mb-1">Quản lý thu chi</p>
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
                Danh sách
                <span class="relative inline-block">
                  hóa đơn
                  <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                  </svg>
                </span>
              </h1>
              <p class="mt-3 text-[#8A8270]">Theo dõi các khoản thu tiền phòng, điện nước và dịch vụ hàng tháng.</p>
            </div>

          </div>

          <div #filterBar class="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo tháng, mã hóa đơn hoặc số phòng..."
                (input)="searchQuery.set($any($event.target).value)"
                class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 py-2 pl-10 pr-4 text-sm text-[#221D0F] placeholder-[#8A8270] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <!-- Bộ lọc trạng thái: dạng nút bấm thay vì dropdown -->
          <div #statusFilterBar class="mb-6 flex flex-wrap items-center gap-2 opacity-0">
            @for (s of statusOptions; track s.value) {
              <button
                type="button"
                (click)="statusFilter.set(s.value)"
                class="rounded-full px-4 py-2 text-sm font-semibold border transition-all"
                [class]="statusFilter() === s.value
                  ? 'bg-[#221D0F] border-[#221D0F] text-[#FFC629]'
                  : 'bg-white border-[#EFE6CC] text-[#6B6455] hover:border-[#FFC629] hover:text-[#221D0F]'"
              >
                {{ s.label }}
              </button>
            }
          </div>

          @if (invoices.isLoading()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách hóa đơn...</p>
            </div>
          } @else if (invoices.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được danh sách hóa đơn.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (inv of filteredInvoices(); track inv.id) {
                
                <a
                #card
                  [routerLink]="['/invoices', inv.id]"
                  class="group relative flex flex-col rounded-3xl border bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden h-full"
                  [class.border-dashed]="inv.status === 'draft'"
                  [class.border-[#D8CBA0]]="inv.status === 'draft'"
                  [class.border-[#EFE6CC]]="inv.status !== 'draft'"
                >
                  <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"></div>

                  <div class="relative flex items-start justify-between gap-3 mb-5">
                    <div class="flex items-center gap-3">
                      <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#221D0F] text-[#FFC629]">
                        <span class="text-[10px] uppercase font-bold leading-none tracking-wider opacity-80">Tháng</span>
                        <span class="text-lg font-black leading-none mt-0.5">{{ inv.month }}</span>
                      </div>
                      <div>
                        <h3 class="font-bold text-lg text-[#221D0F]">Kỳ {{ inv.month }}/{{ inv.year }}</h3>
                        <p class="text-xs font-semibold text-[#B8860B] mt-0.5">Phòng {{ roomLabel(inv) }}</p>
                        <p class="text-xs text-[#8A8270] mt-0.5 max-w-30 truncate" [title]="inv.id">ID: {{ inv.id }}</p>
                      </div>
                    </div>
                  </div>

                  @if (inv.status === 'draft') {
                    <div class="relative mb-4 rounded-xl bg-[#FBF7ED] border border-dashed border-[#D8CBA0] p-3 text-xs text-[#8A8270]">
                      Chưa có chỉ số điện/nước — tổng tiền sẽ được tính sau khi xác nhận.
                    </div>
                  }

                  <div class="relative mt-auto pt-4 border-t border-[#F1EBD8] flex items-center justify-between gap-2">
                    <span class="font-bold text-xl text-[#221D0F]">
                      @if (inv.status === 'draft') {
                        —
                      } @else {
                        {{ inv.total_amount | number }} ₫
                      }
                    </span>
                    <ui-badge [colorClass]="statusColor(inv.status)">
                      {{ statusLabel(inv.status) }}
                    </ui-badge>
                  </div>

                </a>
              } @empty {
                <div class="col-span-full rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
                  <p class="text-[#8A8270]">Không tìm thấy hóa đơn nào phù hợp.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class TenantInvoiceListPage {
  private route = inject(ActivatedRoute);
  private invoicesService = inject(InvoicesService);
  private roomsService = inject(RoomsService);

  searchQuery = signal('');
  statusFilter = signal(this.route.snapshot.queryParamMap.get('status') ?? 'all');

  statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'partial', label: 'Thanh toán một phần' },
    { value: 'paid', label: 'Đã thanh toán đủ' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  invoices = this.invoicesService.list(() => ({}));

  // Dùng chung roomsResource của RoomsService (httpResource, cache toàn app)
  get rooms() {
    return this.roomsService.roomsResource;
  }

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;

  // Map room_id -> Room để tra cứu O(1) thay vì .find() trong vòng lặp template
  private roomsMap = computed(() => {
    const map = new Map<string, { code: string }>();
    for (const r of this.rooms.value()?.data ?? []) map.set(r.id, r);
    return map;
  });

  filteredInvoices = computed(() => {
    const list = this.invoices.value()?.data ?? [];
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const roomsMap = this.roomsMap();

    return list.filter((inv: any) => {
      const periodStr = `${inv.month}/${inv.year}`.toLowerCase();
      const roomCode = (roomsMap.get(inv.room_id)?.code ?? inv.room_code ?? '').toLowerCase();
      const matchesSearch =
        !search ||
        periodStr.includes(search) ||
        inv.id.toLowerCase().includes(search) ||
        roomCode.includes(search);

      const matchesStatus = status === 'all' || inv.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  // Trả về mã phòng theo room_id của invoice.
  // Fallback: nếu invoice đã có sẵn room_code (denormalized) hoặc chỉ có room_id thô.
  roomLabel(inv: any): string {
    const room = this.roomsMap().get(inv.room_id);
    return room?.code ?? inv.room_code ?? inv.room_id ?? '—';
  }

  // Nhãn/màu trạng thái - xử lý riêng 'draft' để không phụ thuộc việc
  // INVOICE_STATUS_LABEL/COLOR đã có sẵn key này hay chưa.
  statusLabel(status: string): string {
    if (status === 'draft') return 'Nháp';
    return (this.INVOICE_STATUS_LABEL as any)[status] ?? status;
  }

  statusColor(status: string): string {
    if (status === 'draft') return 'bg-[#F1EBD8] text-[#8A6200]';
    return (this.INVOICE_STATUS_COLOR as any)[status] ?? 'bg-gray-100 text-gray-600';
  }

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private filterBar = viewChild<ElementRef<HTMLElement>>('filterBar');
  private statusFilterBar = viewChild<ElementRef<HTMLElement>>('statusFilterBar');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');
  private animatedCards = false;

  constructor() {
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const filterEl = this.filterBar()?.nativeElement;
      const statusFilterEl = this.statusFilterBar()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');
      if (filterEl) tl.fromTo(filterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');
      if (statusFilterEl) tl.fromTo(statusFilterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    effect(() => {
      const cardEls = this.cards().map(c => c.nativeElement).filter(el => !!el);
      if (cardEls.length > 0) {
        this.animatedCards = false;
        setTimeout(() => {
          gsap.fromTo(cardEls, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.05, ease: 'power3.out' });
        }, 50);
      }
    });
  }
}