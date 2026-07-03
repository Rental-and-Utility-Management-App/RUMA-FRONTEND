import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { ContractsService } from '../../../core/services/contracts.service';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [UiButton, UiInput, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto p-6">
      <a routerLink="/contracts" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách hợp đồng
      </a>
      <h1 class="text-xl font-semibold text-slate-900 mb-6">Tạo hợp đồng mới</h1>

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <ui-input label="Mã phòng (room_id)" [(value)]="roomId" />
        <ui-input label="Danh sách tenant_id (cách nhau bởi dấu phẩy)" [(value)]="tenantIdsRaw" />
        <ui-input label="Giá thuê / tháng" type="number" [(value)]="monthlyRent" />
        <ui-input label="Tiền cọc" type="number" [(value)]="depositAmount" />
        <ui-input label="Ngày bắt đầu" type="date" [(value)]="startDate" />
        <ui-input label="Ngày kết thúc" type="date" [(value)]="endDate" />
        <ui-input label="Ghi chú (tuỳ chọn)" [(value)]="note" />

        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }

        <div class="flex gap-2 mt-2">
          <ui-button type="submit" [loading]="saving()">Tạo hợp đồng</ui-button>
          <ui-button variant="secondary" (click)="router.navigate(['/contracts'])">Hủy</ui-button>
        </div>
      </form>
    </div>
  `,
})
export class ContractFormPage {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractsService = inject(ContractsService);

  roomId = signal(this.route.snapshot.queryParamMap.get('room_id') ?? '');
  tenantIdsRaw = signal('');
  monthlyRent = signal('0');
  depositAmount = signal('0');
  startDate = signal('');
  endDate = signal('');
  note = signal('');

  saving = signal(false);
  errorMessage = signal('');

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    this.saving.set(true);
    try {
      await this.contractsService.create({
        room_id: this.roomId(),
        tenant_ids: this.tenantIdsRaw()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        monthly_rent: Number(this.monthlyRent()),
        deposit_amount: Number(this.depositAmount()),
        start_date: this.startDate(),
        end_date: this.endDate(),
        note: this.note() || undefined,
      });
      this.contractsService.contractsResource.reload();
      this.router.navigate(['/contracts']);
    } catch (err: any) {
      // Ví dụ lỗi backend trả về: "phòng đã có hợp đồng active" 
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Tạo hợp đồng thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}