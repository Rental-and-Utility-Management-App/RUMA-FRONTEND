import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { UiModal } from '../../../shared/ui/modal/modal';
import { AuthService } from '../../../core/auth/auth.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { PaymentsService } from '../../../core/services/payments.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';
import { PAYMENT_METHOD_LABEL, PaymentMethod } from '../../../core/models/payment.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, UiButton, UiInput, UiModal, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <a routerLink="/invoices" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách hóa đơn
      </a>

      @if (invoice.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (invoice.value(); as inv) {
        <div class="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-semibold text-slate-900">Hóa đơn tháng {{ inv.month }}/{{ inv.year }}</h1>
            <ui-badge [colorClass]="INVOICE_STATUS_COLOR[inv.status]">{{ INVOICE_STATUS_LABEL[inv.status] }}</ui-badge>
          </div>

          <dl class="grid grid-cols-2 gap-y-2 text-sm mb-4">
            <dt class="text-slate-500">Tiền phòng</dt>
            <dd class="text-slate-900 text-right">{{ inv.rent_amount | number }} đ</dd>

            <dt class="text-slate-500">Điện ({{ inv.electric_old }} → {{ inv.electric_new }})</dt>
            <dd class="text-slate-900 text-right">{{ inv.electric_amount | number }} đ</dd>

            <dt class="text-slate-500">Nước ({{ inv.water_old }} → {{ inv.water_new }})</dt>
            <dd class="text-slate-900 text-right">{{ inv.water_amount | number }} đ</dd>

            <dt class="text-slate-500">Phí quản lý</dt>
            <dd class="text-slate-900 text-right">{{ inv.management_fee_amount | number }} đ</dd>

            @if (inv.other_fees) {
              <dt class="text-slate-500">{{ inv.other_note || 'Phí khác' }}</dt>
              <dd class="text-slate-900 text-right">{{ inv.other_fees | number }} đ</dd>
            }

            <dt class="text-slate-700 font-medium pt-2 border-t border-slate-100">Tổng cộng</dt>
            <dd class="text-slate-900 font-semibold text-right pt-2 border-t border-slate-100">
              {{ inv.total_amount | number }} đ
            </dd>

            <dt class="text-slate-500">Đã thanh toán</dt>
            <dd class="text-slate-900 text-right">{{ inv.paid_amount | number }} đ</dd>

            <dt class="text-slate-500">Còn lại</dt>
            <dd class="text-red-600 font-medium text-right">{{ (inv.total_amount - inv.paid_amount) | number }} đ</dd>
          </dl>

          <div class="flex gap-2 pt-4 border-t border-slate-100">
            <ui-button variant="secondary" (click)="loadQr()" [loading]="loadingQr()">Xem mã QR</ui-button>
            @if (auth.isManager() && inv.status !== 'paid' && inv.status !== 'cancelled') {
              <ui-button (click)="openPaymentModal()">Ghi nhận thanh toán</ui-button>
            }
          </div>

          @if (qrCodeUrl()) {
            <img [src]="qrCodeUrl()" alt="VietQR" class="mt-4 rounded-lg border border-slate-200 max-w-xs" />
          }

          @if (errorMessage()) {
            <p class="text-sm text-red-600 mt-3">{{ errorMessage() }}</p>
          }
        </div>
      }

      <h2 class="text-lg font-semibold text-slate-900 mb-3">Lịch sử thanh toán</h2>
      @if (payments.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (p of payments.value()?.data ?? []; track p.id) {
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-sm flex justify-between items-center">
              <div>
                <span class="text-slate-700">{{ PAYMENT_METHOD_LABEL[p.method] }}</span>
                @if (p.is_auto_confirmed) {
                  <ui-badge colorClass="bg-blue-100 text-blue-700 ml-2">Tự động (SePay)</ui-badge>
                }
              </div>
              <span class="text-slate-900 font-medium">{{ p.amount | number }} đ</span>
            </div>
          } @empty {
            <p class="text-slate-400 text-sm">Chưa có thanh toán nào.</p>
          }
        </div>
      }
    </div>

    <ui-modal [open]="paymentModalOpen()" title="Ghi nhận thanh toán" (closeRequested)="paymentModalOpen.set(false)">
      <div class="flex flex-col gap-3">
        <ui-input label="Số tiền" type="number" [(value)]="paymentAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end">
          <ui-button variant="secondary" (click)="paymentModalOpen.set(false)">Hủy</ui-button>
          <ui-button (click)="onRecordPayment()" [loading]="submittingPayment()">Xác nhận</ui-button>
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

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;
  PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  async loadQr() {
    this.errorMessage.set('');
    this.loadingQr.set(true);
    try {
      const qr = await this.invoicesService.getQrCode(this.id());
      // Giả định backend trả base64 hoặc URL ảnh trực tiếp — điều chỉnh nếu format khác (xem ghi chú trong InvoicesService)
      this.qrCodeUrl.set(qr.startsWith('http') || qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Không tạo được mã QR.');
    } finally {
      this.loadingQr.set(false);
    }
  }

  openPaymentModal() {
    this.errorMessage.set('');
    const inv = this.invoice.value();
    if (inv) this.paymentAmount.set(String(inv.total_amount - inv.paid_amount));
    this.paymentModalOpen.set(true);
  }

  async onRecordPayment() {
    this.errorMessage.set('');
    this.submittingPayment.set(true);
    try {
      // Backend chặn vượt số tiền còn lại (luật #3)
      await this.paymentsService.create({
        invoice_id: this.id(),
        amount: Number(this.paymentAmount()),
        method: 'cash' as PaymentMethod,
      });
      this.invoice.reload();
      this.payments.reload();
      this.paymentModalOpen.set(false);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Ghi nhận thanh toán thất bại.');
    } finally {
      this.submittingPayment.set(false);
    }
  }
}