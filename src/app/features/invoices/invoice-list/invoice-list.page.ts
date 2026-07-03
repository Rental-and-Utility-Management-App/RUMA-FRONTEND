import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { InvoicesService } from '../../../core/services/invoices.service';
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-xl font-semibold text-slate-900 mb-6">Danh sách hóa đơn</h1>

      @if (invoices.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (invoices.error()) {
        <p class="text-red-600 text-sm">Không tải được danh sách hóa đơn.</p>
      } @else {
        <div class="flex flex-col gap-3">
          @for (inv of invoices.value()?.data ?? []; track inv.id) {
            <a [routerLink]="['/invoices', inv.id]" class="rounded-xl border border-slate-200 bg-white p-4 hover:border-primary flex items-center justify-between">
              <div>
                <p class="font-medium text-slate-900">Tháng {{ inv.month }}/{{ inv.year }}</p>
                <p class="text-sm text-slate-500">{{ inv.total_amount | number }} đ</p>
              </div>
              <ui-badge [colorClass]="INVOICE_STATUS_COLOR[inv.status]">
                {{ INVOICE_STATUS_LABEL[inv.status] }}
              </ui-badge>
            </a>
          } @empty {
            <p class="text-slate-400 text-sm">Chưa có hóa đơn nào.</p>
          }
        </div>
      }
    </div>
  `,
})
export class InvoiceListPage {
  private route = inject(ActivatedRoute);
  private invoicesService = inject(InvoicesService);

  private statusFilter = signal(this.route.snapshot.queryParamMap.get('status') ?? '');
  invoices = this.invoicesService.list(() => ({ status: this.statusFilter() || undefined }));

  INVOICE_STATUS_COLOR = INVOICE_STATUS_COLOR;
  INVOICE_STATUS_LABEL = INVOICE_STATUS_LABEL;
}