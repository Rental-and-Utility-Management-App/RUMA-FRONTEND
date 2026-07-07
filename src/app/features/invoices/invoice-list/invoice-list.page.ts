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
import { UiInput } from '../../../shared/ui/input/input';
import { UiModal } from '../../../shared/ui/modal/modal';
import { AuthService } from '../../../core/auth/auth.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, UiBadge, UiInput, UiModal, DecimalPipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
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

            @if (auth.isManager()) {
              <button
                (click)="openGenerateModal()"
                class="flex items-center gap-2 rounded-full bg-[#221D0F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tạo hóa đơn nháp đầu tháng
              </button>
            }
          </div>

          @if (generateToast()) {
            <div class="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-green-200 bg-[#E5F5E9] px-5 py-3.5 text-sm text-green-800">
              <span>{{ generateToast() }}</span>
              <button type="button" (click)="generateToast.set(null)" class="text-green-700 hover:text-green-900 font-bold text-sm shrink-0">&times;</button>
            </div>
          }

          @if (auth.isManager() && draftCount() > 0) {
            <button
              (click)="statusFilter.set('draft')"
              class="mb-6 w-full flex items-center justify-between gap-3 rounded-2xl border border-[#FFC629]/50 bg-[#FFF8E1] px-5 py-3.5 text-left transition hover:bg-[#FFF3CD]"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC629] text-[#221D0F] font-bold text-sm shrink-0">{{ draftCount() }}</span>
                <span class="text-sm font-medium text-[#8A6200]">Có hóa đơn nháp đang chờ điền chỉ số điện/nước — bấm để xem ngay</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#8A6200] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          }

          <div #filterBar class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
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

            <div class="shrink-0">
              <select
                [value]="statusFilter()"
                (change)="statusFilter.set($any($event.target).value)"
                class="rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                @if (auth.isManager()) {
                  <option value="draft">Nháp - chờ xác nhận</option>
                }
                <option value="unpaid">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
                <option value="paid">Đã thanh toán đủ</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
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

                  @if (auth.isManager() && inv.status === 'draft') {
                    <button
                      type="button"
                      (click)="$event.preventDefault(); $event.stopPropagation(); openConfirmModal(inv)"
                      class="relative mt-3 w-full rounded-full bg-[#FFC629] px-4 py-2 text-xs font-bold text-[#221D0F] transition hover:bg-[#FFD764]"
                    >
                      Xác nhận chỉ số điện/nước
                    </button>
                  }
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

    <!-- Modal: Tạo hóa đơn nháp đầu tháng -->
    <ui-modal [open]="generateModalOpen()" title="Tạo hóa đơn nháp đầu tháng" (closeRequested)="closeGenerateModal()">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#6B6455]">
          Hệ thống sẽ tự tạo hóa đơn nháp cho mọi phòng đang có hợp đồng hiệu lực chưa có hóa đơn tháng này.
          Tiền phòng và phí quản lý được tính sẵn, chỉ còn thiếu chỉ số điện/nước — xác nhận riêng từng hóa đơn sau.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <ui-input label="Tháng" type="number" [(value)]="generateMonth" />
          <ui-input label="Năm" type="number" [(value)]="generateYear" />
        </div>

        @if (generateError()) {
          <p class="text-sm text-[#9A3412]">{{ generateError() }}</p>
        }

        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeGenerateModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Đóng</button>
          <button type="button" (click)="onGenerateDraft()" [disabled]="generating()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">
            {{ generating() ? 'Đang tạo...' : 'Tạo hóa đơn nháp' }}
          </button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Xác nhận hóa đơn nháp (điền chỉ số điện/nước) -->
    <ui-modal [open]="confirmModalOpen()" title="Xác nhận hóa đơn nháp" (closeRequested)="closeConfirmModal()">
      @if (confirmingInvoice(); as inv) {
        <div class="flex flex-col gap-4">
          <p class="text-sm text-[#6B6455]">
            Nhập chỉ số điện/nước thực tế cho phòng <span class="font-bold text-[#221D0F]">{{ roomLabel(inv) }}</span>,
            kỳ {{ inv.month }}/{{ inv.year }}. Hệ thống sẽ tự tính lại tổng tiền và chuyển hóa đơn sang trạng thái chưa thanh toán.
          </p>
          <div class="grid grid-cols-2 gap-3">
            <ui-input label="Chỉ số điện mới (*)" type="number" [(value)]="confirmElectricNew" />
            <ui-input label="Chỉ số nước mới (*)" type="number" [(value)]="confirmWaterNew" />
          </div>

          @if (confirmError()) {
            <p class="text-sm text-[#9A3412]">{{ confirmError() }}</p>
          }

          <div class="flex gap-2 justify-end pt-2">
            <button type="button" (click)="closeConfirmModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
            <button type="button" (click)="onConfirmDraft()" [disabled]="confirming()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">
              {{ confirming() ? 'Đang xử lý...' : 'Xác nhận & tính tiền' }}
            </button>
          </div>
        </div>
      }
    </ui-modal>
  `,
})
export class InvoiceListPage {
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  private invoicesService = inject(InvoicesService);
  private roomsService = inject(RoomsService);

  searchQuery = signal('');
  statusFilter = signal(this.route.snapshot.queryParamMap.get('status') ?? 'all');

  invoices = this.invoicesService.list(() => ({}));

  // Dùng chung roomsResource của RoomsService (httpResource, cache toàn app)
  get rooms() {
    return this.roomsService.roomsResource;
  }

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;

  // ---- Modal: tạo hóa đơn nháp đầu tháng ----
  generateModalOpen = signal(false);
  generateMonth = signal(String(new Date().getMonth() + 1));
  generateYear = signal(String(new Date().getFullYear()));
  generating = signal(false);
  generateError = signal('');
  generateToast = signal<string | null>(null);
  private generateToastTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Modal: xác nhận hóa đơn nháp ----
  confirmModalOpen = signal(false);
  confirmingInvoice = signal<any>(null);
  confirmElectricNew = signal('0');
  confirmWaterNew = signal('0');
  confirming = signal(false);
  confirmError = signal('');

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

  // Số hóa đơn nháp đang chờ xác nhận, dùng cho banner nhắc nhở manager
  draftCount = computed(() => {
    const list = this.invoices.value()?.data ?? [];
    return list.filter((inv: any) => inv.status === 'draft').length;
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

  openGenerateModal() {
    this.generateError.set('');
    this.generateModalOpen.set(true);
  }

  closeGenerateModal() {
    this.generateModalOpen.set(false);
  }

  async onGenerateDraft() {
    this.generateError.set('');
    this.generating.set(true);
    try {
      const result = await this.invoicesService.generateDraft({
        month: Number(this.generateMonth()),
        year: Number(this.generateYear()),
      });
      this.invoices.reload();

      // Tự đóng modal ngay khi thành công, thay bằng toast tóm tắt kết quả
      // hiện ở đầu trang trong vài giây rồi tự ẩn.
      this.closeGenerateModal();
      const errorCount = result.errors?.length ?? 0;
      const message =
        `Đã tạo mới ${result.created} hóa đơn, bỏ qua ${result.skipped} phòng đã có hóa đơn` +
        (errorCount > 0 ? `, lỗi ${errorCount} phòng.` : '.');
      this.showGenerateToast(message);
    } catch (err: any) {
      this.generateError.set(err?.error?.message ?? err?.message ?? 'Tạo hóa đơn nháp thất bại.');
    } finally {
      this.generating.set(false);
    }
  }

  private showGenerateToast(message: string) {
    if (this.generateToastTimer) clearTimeout(this.generateToastTimer);
    this.generateToast.set(message);
    this.generateToastTimer = setTimeout(() => this.generateToast.set(null), 6000);
  }

  openConfirmModal(inv: any) {
    this.confirmError.set('');
    this.confirmingInvoice.set(inv);
    this.confirmElectricNew.set(String(inv.electric_old ?? 0));
    this.confirmWaterNew.set(String(inv.water_old ?? 0));
    this.confirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.confirmModalOpen.set(false);
    this.confirmingInvoice.set(null);
  }

  async onConfirmDraft() {
    const inv = this.confirmingInvoice();
    if (!inv) return;

    this.confirmError.set('');
    this.confirming.set(true);
    try {
      await this.invoicesService.confirmDraft(inv.id, {
        electric_new: Number(this.confirmElectricNew()),
        water_new: Number(this.confirmWaterNew()),
      });
      this.invoices.reload();
      this.closeConfirmModal();
    } catch (err: any) {
      this.confirmError.set(err?.error?.message ?? err?.message ?? 'Xác nhận hóa đơn thất bại.');
    } finally {
      this.confirming.set(false);
    }
  }

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