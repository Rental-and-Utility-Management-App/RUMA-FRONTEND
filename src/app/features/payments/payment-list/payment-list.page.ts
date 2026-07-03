import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { PaymentsService } from '../../../core/services/payments.service';
import { PAYMENT_METHOD_LABEL } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-xl font-semibold text-slate-900 mb-6">Danh sách thanh toán</h1>

      @if (payments.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (payments.error()) {
        <p class="text-red-600 text-sm">Không tải được danh sách thanh toán.</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (p of payments.value()?.data ?? []; track p.id) {
            <a [routerLink]="['/invoices', p.invoice_id]" class="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-700">{{ PAYMENT_METHOD_LABEL[p.method] }}</p>
                @if (p.is_auto_confirmed) {
                  <ui-badge colorClass="bg-blue-100 text-blue-700">Tự động (SePay)</ui-badge>
                }
              </div>
              <span class="font-medium text-slate-900">{{ p.amount | number }} đ</span>
            </a>
          } @empty {
            <p class="text-slate-400 text-sm">Chưa có thanh toán nào.</p>
          }
        </div>
      }
    </div>
  `,
})
export class PaymentListPage {
  private paymentsService = inject(PaymentsService);
  payments = this.paymentsService.list();

  PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;
}