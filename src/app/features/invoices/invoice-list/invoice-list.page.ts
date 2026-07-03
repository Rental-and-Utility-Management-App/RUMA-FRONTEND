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
import { AuthService } from '../../../core/auth/auth.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <!-- Ảnh nền mờ chìm -->
      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/assets/images/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <!-- Nền gradient động -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-5xl mx-auto p-6 md:p-10">
          
          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
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

          <!-- BỘ LỌC & TÌM KIẾM (MỚI) -->
          <div #filterBar class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo tháng (VD: 07/2026) hoặc mã hóa đơn..."
                (input)="searchQuery.set($any($event.target).value)"
                class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 py-2 pl-10 pr-4 text-sm text-[#221D0F] placeholder-[#8A8270] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div class="shrink-0">
              <select
                [value]="statusFilter()"
                (change)="statusFilter.set($any($event.target).value)"
                class="rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
                <option value="paid">Đã thanh toán đủ</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <!-- Content List -->
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
                  class="group relative flex flex-col rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden h-full"
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
                        <p class="text-xs text-[#8A8270] mt-0.5 max-w-30 truncate" [title]="inv.id">ID: {{ inv.id }}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="relative mt-auto pt-4 border-t border-[#F1EBD8] flex items-center justify-between">
                    <span class="font-bold text-xl text-[#221D0F]">{{ inv.total_amount | number }} ₫</span>
                    <ui-badge [colorClass]="INVOICE_STATUS_COLOR[inv.status]">
                      {{ INVOICE_STATUS_LABEL[inv.status] }}
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
export class InvoiceListPage {
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  private invoicesService = inject(InvoicesService);

  // Khởi tạo state bộ lọc (lấy query params từ URL nếu user click từ Dashboard sang)
  searchQuery = signal('');
  statusFilter = signal(this.route.snapshot.queryParamMap.get('status') ?? 'all');

  // Load TOÀN BỘ hóa đơn về client để việc tìm kiếm/lọc diễn ra tức thì (Real-time)
  invoices = this.invoicesService.list(() => ({})); 

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;

  // Lọc dữ liệu mượt mà ở Client-side (MỚI)
  filteredInvoices = computed(() => {
    const list = this.invoices.value()?.data ?? [];
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((inv) => {
      // Tìm kiếm theo "Tháng/Năm" (vd: "07/2026") hoặc ID
      const periodStr = `${inv.month}/${inv.year}`.toLowerCase();
      const matchesSearch = !search || 
                            periodStr.includes(search) || 
                            inv.id.toLowerCase().includes(search);
      
      const matchesStatus = status === 'all' || inv.status === status;
      return matchesSearch && matchesStatus;
    });
  });

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