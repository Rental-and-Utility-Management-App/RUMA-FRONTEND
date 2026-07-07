import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
  signal,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { UiInput } from '../../../shared/ui/input/input';
import { UiModal } from '../../../shared/ui/modal/modal';
import { ConfirmService, ConfirmDialog } from '../../../shared/ui/confirm/confirm';
import { AuthService } from '../../../core/auth/auth.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';
import { PAYMENT_METHOD_LABEL, PaymentMethod } from '../../../core/models/payment.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, UiInput, UiModal, ConfirmDialog, DecimalPipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-confirm-dialog />

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
        <div class="max-w-4xl mx-auto p-6 md:p-10">

          <div #hero class="mb-8 opacity-0">
            <a routerLink="/invoices" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách hóa đơn
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Chi tiết hóa đơn</h1>
          </div>

          @if (invoice.isLoading()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải thông tin hóa đơn...</p>
            </div>
          } @else if (invoice.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được hóa đơn.</p>
            </div>
          } @else if (invoice.value(); as inv) {
            <div
              #mainCard
              class="relative overflow-hidden rounded-3xl border bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] mb-8 opacity-0"
              [class.border-dashed]="inv.status === 'draft'"
              [class.border-[#D8CBA0]]="inv.status === 'draft'"
              [class.border-[#EFE6CC]]="inv.status !== 'draft'"
            >
              <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

              <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#F1EBD8]">
                <div class="flex items-center gap-4">
                  <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#221D0F] text-[#FFC629] border border-[#EFE6CC]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-[#221D0F]">Kỳ thanh toán {{ inv.month }}/{{ inv.year }}</h2>
                    <p class="text-sm text-[#8A8270] mt-1 uppercase tracking-wider">Mã HĐ: <span class="font-semibold text-[#221D0F]">{{ inv.id }}</span></p>
                  </div>
                </div>
                <ui-badge [colorClass]="INVOICE_STATUS_COLOR[inv.status]">
                  {{ INVOICE_STATUS_LABEL[inv.status] }}
                </ui-badge>
              </div>

              @if (inv.status === 'draft') {
                <div class="relative mb-6 rounded-2xl bg-[#FBF7ED] border border-dashed border-[#D8CBA0] p-5">
                  <p class="text-sm font-semibold text-[#8A6200] mb-1">Hóa đơn nháp - chưa có chỉ số điện/nước</p>
                  <p class="text-xs text-[#8A8270]">
                    Tiền phòng và phí quản lý đã được tính sẵn theo hợp đồng. Số tiền tổng cộng sẽ chỉ được tính
                    sau khi điền chỉ số điện/nước thực tế bên dưới.
                  </p>
                </div>
              }

              <div class="relative mb-6 rounded-2xl bg-[#FBF7ED] border border-[#F1EBD8] overflow-hidden">
                <div class="grid grid-cols-1 divide-y divide-[#F1EBD8]">
                  <div class="flex justify-between p-4 items-center">
                    <span class="text-sm font-medium text-[#6B6455]">Tiền thuê phòng</span>
                    <span class="font-bold text-[#221D0F]">{{ inv.rent_amount | number }} ₫</span>
                  </div>
                  <div class="flex justify-between p-4 items-center">
                    <div>
                      <span class="text-sm font-medium text-[#6B6455] block">Tiền điện</span>
                      @if (inv.status === 'draft') {
                        <span class="text-xs text-[#8A8270]">Số cũ: {{ inv.electric_old }} &rarr; Số mới: chưa xác nhận</span>
                      } @else {
                        <span class="text-xs text-[#8A8270]">Số cũ: {{ inv.electric_old }} &rarr; Số mới: {{ inv.electric_new }}</span>
                      }
                    </div>
                    <span class="font-bold text-[#221D0F]">
                      @if (inv.status === 'draft') { — } @else { {{ inv.electric_amount | number }} ₫ }
                    </span>
                  </div>
                  <div class="flex justify-between p-4 items-center">
                    <div>
                      <span class="text-sm font-medium text-[#6B6455] block">Tiền nước</span>
                      @if (inv.status === 'draft') {
                        <span class="text-xs text-[#8A8270]">Số cũ: {{ inv.water_old }} &rarr; Số mới: chưa xác nhận</span>
                      } @else {
                        <span class="text-xs text-[#8A8270]">Số cũ: {{ inv.water_old }} &rarr; Số mới: {{ inv.water_new }}</span>
                      }
                    </div>
                    <span class="font-bold text-[#221D0F]">
                      @if (inv.status === 'draft') { — } @else { {{ inv.water_amount | number }} ₫ }
                    </span>
                  </div>
                  <div class="flex justify-between p-4 items-center">
                    <span class="text-sm font-medium text-[#6B6455]">Phí quản lý & Dịch vụ</span>
                    <span class="font-bold text-[#221D0F]">{{ inv.management_fee_amount | number }} ₫</span>
                  </div>
                  @if (inv.other_fees) {
                    <div class="flex justify-between p-4 items-center bg-white/50">
                      <span class="text-sm font-medium text-[#6B6455]">{{ inv.other_note || 'Phụ phí khác' }}</span>
                      <span class="font-bold text-[#221D0F]">{{ inv.other_fees | number }} ₫</span>
                    </div>
                  }
                </div>
              </div>

              <div class="relative pt-4 flex flex-col gap-3">
                <div class="flex justify-between items-center text-lg">
                  <span class="font-bold text-[#221D0F]">TỔNG CỘNG</span>
                  <span class="font-black text-2xl text-[#221D0F]">
                    @if (inv.status === 'draft') { — } @else { {{ inv.total_amount | number }} ₫ }
                  </span>
                </div>
                @if (inv.status !== 'draft') {
                  <div class="flex justify-between items-center text-sm border-t border-dashed border-[#EFE6CC] pt-3">
                    <span class="font-medium text-[#8A8270]">Đã thanh toán</span>
                    <span class="font-bold text-green-600">{{ inv.paid_amount | number }} ₫</span>
                  </div>
                  <div class="flex justify-between items-center text-sm border-t border-dashed border-[#EFE6CC] pt-3">
                    <span class="font-bold text-[#221D0F]">SỐ TIỀN CÒN LẠI</span>
                    <span class="font-bold text-[#9A3412] text-lg">{{ ((inv.total_amount || 0) - (inv.paid_amount || 0)) | number }} ₫</span>
                  </div>
                }
              </div>

              <div class="relative flex flex-wrap gap-3 mt-8 pt-6 border-t border-[#F1EBD8]">
                @if (inv.status === 'draft') {
                  @if (auth.isManager()) {
                    <button (click)="openConfirmDraftModal(inv)" class="flex items-center gap-2 rounded-full bg-[#FFC629] px-6 py-2.5 text-sm font-bold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Xác nhận chỉ số điện/nước
                    </button>
                  } @else {
                    <p class="text-sm text-[#8A8270]">Hóa đơn đang được lập, vui lòng chờ quản lý xác nhận.</p>
                  }
                } @else {
                  @if (inv.status !== 'paid') {
                    <button (click)="loadQr()" class="flex items-center gap-2 rounded-full bg-[#F1EBD8] px-6 py-2.5 text-sm font-semibold text-[#221D0F] transition hover:bg-[#E9E4D6] disabled:opacity-60" [disabled]="loadingQr()">
                      @if (loadingQr()) {
                        Đang tạo mã QR...
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Quét mã thanh toán (VietQR)
                      }
                    </button>
                  }
                  @if (auth.isManager() && inv.status !== 'paid' && inv.status !== 'cancelled') {
                    <button (click)="openPaymentModal()" class="flex items-center gap-2 rounded-full bg-[#FFC629] px-6 py-2.5 text-sm font-bold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]">
                      Ghi nhận thanh toán tay
                    </button>
                  }
                }
              </div>

              @if (qrCodeUrl()) {
                <div class="mt-6 p-6 rounded-2xl bg-[#FBF7ED] border border-[#EFE6CC] flex flex-col items-center justify-center text-center">
                  <p class="text-sm font-bold text-[#221D0F] mb-3">Mã QR Thanh Toán Tự Động</p>
                  <img [src]="qrCodeUrl()" alt="VietQR" class="rounded-xl border-4 border-white shadow-sm max-w-48" />
                  <p class="text-xs text-[#8A8270] mt-3">Sử dụng App Ngân hàng bất kỳ để quét mã.<br/>Hệ thống sẽ tự động đối soát ngay lập tức.</p>
                </div>
              }

              @if (errorMessage() && !paymentModalOpen() && !confirmDraftModalOpen()) {
                <div class="mt-6 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <p>{{ errorMessage() }}</p>
                </div>
              }
            </div>
          }

          <div #txHeader class="mb-4 opacity-0">
            <h3 class="text-lg font-bold text-[#221D0F]">Lịch sử nộp tiền</h3>
            <p class="text-sm text-[#8A8270]">Chi tiết các lần thanh toán cho hóa đơn này</p>
          </div>

          @if (payments.isLoading()) {
            <p class="text-sm text-[#8A8270] animate-pulse">Đang nạp lịch sử giao dịch...</p>
          } @else {
            <div class="space-y-2.5">
              @for (p of payments.value()?.data ?? []; track p.id) {
                <div #txCard class="rounded-2xl border border-[#EFE6CC] bg-white p-4 text-sm flex justify-between items-center opacity-0 shadow-[0_2px_8px_rgba(34,29,15,0.02)]">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5F5E9] text-[#166534]">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span class="text-[#221D0F] font-bold block">{{ PAYMENT_METHOD_LABEL[p.method] || 'Tiền mặt' }}</span>
                      @if (p.is_auto_confirmed) {
                        <span class="text-xs text-blue-600 font-medium mt-0.5">Xác nhận tự động qua ngân hàng</span>
                      } @else {
                        <span class="text-xs text-[#8A8270] font-medium mt-0.5">Ghi nhận thủ công</span>
                      }
                    </div>
                  </div>
                  <span class="font-black text-[#166534] text-lg">+ {{ p.amount | number }} ₫</span>
                </div>
              } @empty {
                <div #txCard class="rounded-2xl border border-dashed border-[#D8D2C2] bg-white/50 p-6 text-center opacity-0">
                  <p class="text-sm text-[#8A8270]">Chưa có khoản thanh toán nào được ghi nhận.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <ui-modal [open]="paymentModalOpen()" title="Xác nhận khách nộp tiền" (closeRequested)="paymentModalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <ui-input label="Nhập số tiền khách đã nộp (₫)" type="number" [(value)]="paymentAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="paymentModalOpen.set(false)" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
          <button type="button" (click)="submitPaymentAmount()" [disabled]="submittingPayment()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">
            Xác nhận thu tiền
          </button>
        </div>
      </div>
    </ui-modal>

    <ui-modal [open]="confirmDraftModalOpen()" title="Xác nhận hóa đơn nháp" (closeRequested)="confirmDraftModalOpen.set(false)">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#6B6455]">
          Nhập chỉ số điện/nước thực tế. Hệ thống sẽ tự tính lại tổng tiền và chuyển hóa đơn sang trạng thái chưa thanh toán.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <ui-input label="Chỉ số điện mới (*)" type="number" [(value)]="confirmElectricNew" />
          <ui-input label="Chỉ số nước mới (*)" type="number" [(value)]="confirmWaterNew" />
        </div>
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="confirmDraftModalOpen.set(false)" [disabled]="confirmingDraft()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455] disabled:opacity-70">
            Hủy bỏ
          </button>
          <button type="button" (click)="submitConfirmDraft()" [disabled]="confirmingDraft()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">
            {{ confirmingDraft() ? 'Đang xử lý...' : 'Xác nhận & tính tiền' }}
          </button>
        </div>
      </div>
    </ui-modal>
  `,
})
export class InvoiceDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private invoicesService = inject(InvoicesService);
  private paymentsService = inject(PaymentsService);
  private confirm = inject(ConfirmService);

  invoice = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.invoicesService.getById(params.id),
  });

  payments = this.paymentsService.list(() => ({ invoice_id: this.id() }));

  qrCodeUrl = signal<string | null>(null);
  loadingQr = signal(false);
  paymentModalOpen = signal(false);
  paymentAmount = signal('0');
  submittingPayment = signal(false);
  errorMessage = signal('');

  // ---- Modal: xác nhận hóa đơn nháp (điền chỉ số điện/nước) ----
  confirmDraftModalOpen = signal(false);
  confirmElectricNew = signal('0');
  confirmWaterNew = signal('0');
  confirmingDraft = signal(false);

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;
  PAYMENT_METHOD_LABEL: any = PAYMENT_METHOD_LABEL;

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private mainCard = viewChild<ElementRef<HTMLElement>>('mainCard');
  private txHeader = viewChild<ElementRef<HTMLElement>>('txHeader');
  private txCards = viewChildren<ElementRef<HTMLElement>>('txCard');

  private layoutAnimated = false;
  private cardAnimated = false;
  private txAnimated = false;

  constructor() {
    afterNextRender(() => {
      if (this.layoutAnimated) return;
      this.layoutAnimated = true;

      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, '-=0.4');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    effect(() => {
      const card = this.mainCard()?.nativeElement;
      if (card && this.invoice.value() && !this.cardAnimated) {
        this.cardAnimated = true;
        setTimeout(() => {
          gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        }, 50);
      }
    });

    effect(() => {
      const h = this.txHeader()?.nativeElement;
      const cards = this.txCards().map(c => c.nativeElement).filter((el): el is HTMLElement => !!el);

      if (this.payments.value() && !this.txAnimated) {
        this.txAnimated = true;
        setTimeout(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (h) tl.fromTo(h, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
          if (cards.length) tl.fromTo(cards, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 }, '-=0.1');
        }, 50);
      }
    });
  }

  async loadQr() {
    this.errorMessage.set('');
    this.loadingQr.set(true);
    try {
      const qr = await this.invoicesService.getQrCode(this.id());
      const url = qr.qr_code_url;
      this.qrCodeUrl.set(url.startsWith('http') || url.startsWith('data:') ? url : `data:image/png;base64,${url}`);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Không tạo được mã QR.');
    } finally {
      this.loadingQr.set(false);
    }
  }

  openPaymentModal() {
    this.errorMessage.set('');
    const inv = this.invoice.value();
    if (inv) this.paymentAmount.set(String((inv.total_amount || 0) - (inv.paid_amount || 0)));
    this.paymentModalOpen.set(true);
  }

  /** Bấm "Xác nhận thu tiền" trong modal nhập liệu -> validate rồi hỏi xác nhận qua ConfirmService. */
  async submitPaymentAmount() {
    this.errorMessage.set('');
    const amount = Number(this.paymentAmount());
    if (!this.paymentAmount() || amount <= 0) {
      this.errorMessage.set('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    const ok = await this.confirm.ask({
      title: 'Xác nhận ghi nhận thanh toán',
      message: `Bạn có chắc chắn muốn ghi nhận số tiền ${amount.toLocaleString('vi-VN')} ₫ là đã thanh toán cho hóa đơn này không? Hành động này không thể hoàn tác.`,
      confirmText: 'Đồng ý, ghi nhận',
    });
    if (!ok) return;

    await this.doRecordPayment(amount);
  }

  private async doRecordPayment(amount: number) {
    this.errorMessage.set('');
    this.submittingPayment.set(true);
    this.confirm.setProcessing(true);
    try {
      await this.paymentsService.create({
        invoice_id: this.id(),
        amount,
        method: 'cash' as PaymentMethod,
      });
      this.cardAnimated = false;
      this.invoice.reload();
      this.payments.reload();
      this.paymentModalOpen.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Ghi nhận thanh toán thất bại.');
    } finally {
      this.submittingPayment.set(false);
      this.confirm.setProcessing(false);
    }
  }

  openConfirmDraftModal(inv: any) {
    this.errorMessage.set('');
    this.confirmElectricNew.set(String(inv.electric_old ?? 0));
    this.confirmWaterNew.set(String(inv.water_old ?? 0));
    this.confirmDraftModalOpen.set(true);
  }

  /** Bấm "Xác nhận & tính tiền" trong modal nhập liệu -> hỏi xác nhận qua ConfirmService rồi mới gọi API. */
  async submitConfirmDraft() {
    this.errorMessage.set('');
    const electric = Number(this.confirmElectricNew());
    const water = Number(this.confirmWaterNew());

    const ok = await this.confirm.ask({
      title: 'Xác nhận chỉ số điện/nước',
      message: `Chỉ số điện mới: ${electric.toLocaleString('vi-VN')}\nChỉ số nước mới: ${water.toLocaleString('vi-VN')}\n\nHệ thống sẽ tính lại tổng tiền và chuyển hóa đơn sang trạng thái chưa thanh toán. Bạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận & tính tiền',
    });
    if (!ok) return;

    await this.onConfirmDraft(electric, water);
  }

  private async onConfirmDraft(electricNew: number, waterNew: number) {
    this.errorMessage.set('');
    this.confirmingDraft.set(true);
    this.confirm.setProcessing(true);
    try {
      await this.invoicesService.confirmDraft(this.id(), {
        electric_new: electricNew,
        water_new: waterNew,
      });
      this.cardAnimated = false;
      this.invoice.reload();
      this.confirmDraftModalOpen.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Xác nhận hóa đơn thất bại.');
    } finally {
      this.confirmingDraft.set(false);
      this.confirm.setProcessing(false);
    }
  }
}