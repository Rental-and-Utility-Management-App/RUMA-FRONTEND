import { DatePipe, DecimalPipe } from '@angular/common';
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
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { UiDatePicker } from '../../../shared/ui/date-picker/date-picker';
import { PaymentsService } from '../../../core/services/payments.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { UsersService } from '../../../core/services/users.service';
import { PAYMENT_METHOD_LABEL, PaymentMethod } from '../../../core/models/payment.model';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

// Màu badge riêng cho từng phương thức thanh toán, tách biệt với badge "Tự động (SePay)"
const PAYMENT_METHOD_BADGE_COLOR: Record<PaymentMethod, string> = {
  cash: 'bg-[#F1EBD8] text-[#6B6455]',
  bank_transfer: 'bg-[#E5F5E9] text-[#166534]',
  other: 'bg-[#EFE6CC] text-[#8A6200]',
};

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [RouterLink, UiBadge, UiDatePicker, DecimalPipe, DatePipe, TenantSidebar, ManagerSidebar],
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
        <div class="max-w-5xl mx-auto p-6 md:p-10">

          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
            <p class="text-sm font-medium text-[#B8860B] mb-1">Lịch sử giao dịch</p>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
              Danh sách
              <span class="relative inline-block">
                thanh toán
                <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="mt-3 text-[#8A8270]">Theo dõi toàn bộ các khoản đã thanh toán cho hóa đơn.</p>
          </div>

          <!-- Thẻ tổng quan -->
          <div #statsRow class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0">
            <div class="rounded-2xl border border-[#EFE6CC] bg-white p-5 shadow-[0_2px_10px_rgba(34,29,15,0.03)]">
              <p class="text-xs font-medium text-[#8A8270] mb-1">Tổng số giao dịch</p>
              <p class="text-2xl font-bold text-[#221D0F]">{{ filteredPayments().length }}</p>
            </div>
            <div class="rounded-2xl border border-[#EFE6CC] bg-white p-5 shadow-[0_2px_10px_rgba(34,29,15,0.03)]">
              <p class="text-xs font-medium text-[#8A8270] mb-1">Tổng tiền đã thu</p>
              <p class="text-2xl font-bold text-[#221D0F]">{{ totalAmount() | number }} đ</p>
            </div>
            <div class="rounded-2xl border border-[#EFE6CC] bg-white p-5 shadow-[0_2px_10px_rgba(34,29,15,0.03)]">
              <p class="text-xs font-medium text-[#8A8270] mb-1">Xác nhận tự động (SePay)</p>
              <p class="text-2xl font-bold text-[#221D0F]">{{ autoConfirmedCount() }}</p>
            </div>
          </div>

          <!-- Tìm kiếm + Lọc theo khoảng thời gian -->
          <div #filterBar class="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo phòng, người thuê hoặc ghi chú..."
                (input)="searchQuery.set($any($event.target).value)"
                class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 py-2 pl-10 pr-4 text-sm text-[#221D0F] placeholder-[#8A8270] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <ui-date-picker
              label="Từ ngày"
              [(value)]="dateFrom"
            />

            <ui-date-picker
              label="Đến ngày"
              [(value)]="dateTo"
              [minDate]="dateFrom()"
            />

            @if (dateFrom() || dateTo()) {
              <button
                type="button"
                (click)="dateFrom.set(''); dateTo.set('')"
                class="rounded-full px-4 py-2 text-sm font-semibold border border-[#EFE6CC] text-[#6B6455] hover:border-[#FFC629] hover:text-[#221D0F] transition-all"
              >
                Xóa lọc ngày
              </button>
            }
          </div>

          <!-- Bộ lọc phương thức: Tiền mặt / Chuyển khoản -->
          <div #methodFilterBar class="mb-6 flex flex-wrap items-center gap-2 opacity-0">
            @for (m of methodOptions; track m.value) {
              <button
                type="button"
                (click)="methodFilter.set(m.value)"
                class="rounded-full px-4 py-2 text-sm font-semibold border transition-all"
                [class]="methodFilter() === m.value
                  ? 'bg-[#221D0F] border-[#221D0F] text-[#FFC629]'
                  : 'bg-white border-[#EFE6CC] text-[#6B6455] hover:border-[#FFC629] hover:text-[#221D0F]'"
              >
                {{ m.label }}
              </button>
            }
          </div>

          <!-- Content -->
          @if (payments.isLoading() && !payments.hasValue()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách...</p>
            </div>
          } @else if (payments.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được danh sách thanh toán.</p>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              @for (p of filteredPayments(); track p.id) {
                <a
                  #card
                  [routerLink]="['/invoices', p.invoice_id]"
                  class="group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[#EFE6CC] bg-white p-5 opacity-0
                         shadow-[0_2px_10px_rgba(34,29,15,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(255,198,41,0.2)]"
                >
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBF7ED] border border-[#F1EBD8] text-[#8A6200]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-sm font-bold text-[#221D0F]">
                        Phòng {{ roomsMap().get(p.room_id)?.code ?? p.room_id }}
                      </span>
                      <ui-badge [colorClass]="methodBadgeColor[p.method]">{{ PAYMENT_METHOD_LABEL[p.method] }}</ui-badge>
                      @if (p.is_auto_confirmed) {
                        <ui-badge colorClass="bg-blue-100 text-blue-700">Tự động (SePay)</ui-badge>
                      }
                    </div>
                    <p class="text-xs text-[#8A8270] truncate">
                      {{ tenantsMap().get(p.tenant_id)?.full_name ?? 'Người thuê' }}
                      @if (p.tenant_ids && p.tenant_ids.length > 1) {
                        <span class="text-[#B8B096]"> +{{ p.tenant_ids.length - 1 }} người khác</span>
                      }
                    </p>
                    @if (p.note) {
                      <p class="text-xs text-[#8A8270] mt-1 italic truncate">"{{ p.note }}"</p>
                    }
                  </div>

                  <div class="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-1 shrink-0 sm:text-right sm:pl-4 sm:border-l sm:border-[#F1EBD8]">
                    <span class="text-lg font-bold text-[#221D0F]">{{ p.amount | number }} đ</span>
                    <span class="text-xs text-[#8A8270]">{{ p.paid_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </a>
              } @empty {
                <div class="rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
                  <p class="text-[#8A8270]">Không tìm thấy khoản thanh toán nào phù hợp.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class PaymentListPage {
  auth = inject(AuthService);
  private paymentsService = inject(PaymentsService);
  private roomsService = inject(RoomsService);
  private usersService = inject(UsersService);

  payments = this.paymentsService.list();
  rooms = this.roomsService.roomsResource;

  // Chỉ manager mới cần danh sách người dùng để hiển thị tên tenant.
  // Lưu ý: field này vẫn khởi tạo resource ngay khi component construct,
  // nên với tenant request /users vẫn được gửi đi (và sẽ nhận 403) — chỉ là
  // kết quả không được dùng (xem tenantsMap bên dưới). Muốn tenant KHÔNG gửi
  // request này nữa thì phải sửa trong UsersService để nhận điều kiện fetch
  // theo role, ví dụ dùng Angular resource() với request signal trả về
  // undefined khi !isManager() để resource bỏ qua việc fetch.
  users = this.usersService.usersResource;

  PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;
  methodBadgeColor = PAYMENT_METHOD_BADGE_COLOR;

  // --- STATE TÌM KIẾM VÀ LỌC ---
  searchQuery = signal('');
  dateFrom = signal(''); // ISO yyyy-MM-dd, đồng bộ 2 chiều với ui-date-picker qua [(value)]
  dateTo = signal('');
  methodFilter = signal<'all' | PaymentMethod>('all');

  // Chỉ còn Tiền mặt và Chuyển khoản, bỏ "Khác"
  methodOptions: { value: 'all' | PaymentMethod; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
  ];

  // Tra cứu nhanh phòng theo id (dùng cho hiển thị tên phòng)
  // Dùng .hasValue() để kiểm tra trước, vì gọi .value() khi resource đang ở
  // trạng thái lỗi (VD: tenant gọi GET /users bị 403 vì endpoint chỉ dành cho
  // manager) sẽ ném ResourceValueError thay vì trả về undefined, làm crash
  // toàn bộ template đang render (=> trang trắng).
  roomsMap = computed(() => {
    const data = this.rooms.hasValue() ? this.rooms.value()?.data ?? [] : [];
    return new Map(data.map((r) => [r.id, r]));
  });

  // Chỉ đọc dữ liệu users khi là manager, vì tenant không có quyền gọi
  // /users nên resource sẽ ở trạng thái lỗi (403) chứ không có value hợp lệ.
  tenantsMap = computed(() => {
    if (!this.auth.isManager()) return new Map();
    const data = this.users.hasValue() ? this.users.value()?.data ?? [] : [];
    return new Map(data.map((u) => [u.id, u]));
  });

  filteredPayments = computed(() => {
    const list = this.payments.hasValue() ? this.payments.value()?.data ?? [] : [];
    const search = this.searchQuery().toLowerCase().trim();
    const from = this.dateFrom();
    const to = this.dateTo();
    const method = this.methodFilter();
    const rMap = this.roomsMap();
    const tMap = this.tenantsMap();

    return list
      .filter((p) => {
        const matchesMethod = method === 'all' || p.method === method;

        const roomName = (rMap.get(p.room_id)?.code ?? p.room_id).toLowerCase();
        const tenantName = (tMap.get(p.tenant_id)?.full_name ?? '').toLowerCase();
        const note = (p.note ?? '').toLowerCase();
        const matchesSearch = !search || roomName.includes(search) || tenantName.includes(search) || note.includes(search);

        const paidAt = new Date(p.paid_at);
        const matchesFrom = !from || paidAt >= new Date(from + 'T00:00:00');
        const matchesTo = !to || paidAt <= new Date(to + 'T23:59:59');

        return matchesMethod && matchesSearch && matchesFrom && matchesTo;
      })
      // Giao dịch mới nhất lên đầu
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
  });

  totalAmount = computed(() => this.filteredPayments().reduce((sum, p) => sum + p.amount, 0));
  autoConfirmedCount = computed(() => this.filteredPayments().filter((p) => p.is_auto_confirmed).length);

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private statsRow = viewChild<ElementRef<HTMLElement>>('statsRow');
  private filterBar = viewChild<ElementRef<HTMLElement>>('filterBar');
  private methodFilterBar = viewChild<ElementRef<HTMLElement>>('methodFilterBar');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');

  constructor() {
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const statsEl = this.statsRow()?.nativeElement;
      const filterEl = this.filterBar()?.nativeElement;
      const methodFilterEl = this.methodFilterBar()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');
      if (statsEl) tl.fromTo(statsEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');
      if (filterEl) tl.fromTo(filterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');
      if (methodFilterEl) tl.fromTo(methodFilterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // Re-animate danh sách mỗi khi kết quả lọc/tìm kiếm thay đổi
    effect(() => {
      const cardEls = this.cards().map((c) => c.nativeElement).filter((el) => !!el);
      if (cardEls.length > 0) {
        setTimeout(() => {
          gsap.fromTo(
            cardEls,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power3.out' },
          );
        }, 50);
      }
    });
  }
}