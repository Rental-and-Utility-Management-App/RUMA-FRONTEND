import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadge } from '../../../shared/ui/badge/badge';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { UiModal } from '../../../shared/ui/modal/modal';
import { AuthService } from '../../../core/auth/auth.service';
import { ContractsService } from '../../../core/services/contracts.service';
import {
  ContractStatus,
  DEPOSIT_STATUS_COLOR,
  DEPOSIT_STATUS_LABEL,
} from '../../../core/models/contract.model';

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  active: 'Đang hiệu lực',
  ended: 'Đã kết thúc',
  terminated: 'Đã chấm dứt',
  cancelled: 'Đã hủy',
};

type ModalKind = 'extend' | 'collect-deposit' | 'checkout' | 'add-tenant' | null;

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, UiButton, UiInput, UiModal, DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <a routerLink="/contracts" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách hợp đồng
      </a>

      @if (contract.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else if (contract.value(); as c) {
        <div class="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-semibold text-slate-900">Phòng {{ c.room_code || c.room_id }}</h1>
            <div class="flex gap-2">
              <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
              </ui-badge>
              <ui-badge colorClass="bg-slate-100 text-slate-600">
                {{ CONTRACT_STATUS_LABEL[c.status] }}
              </ui-badge>
            </div>
          </div>

          <dl class="grid grid-cols-2 gap-y-3 text-sm mb-4">
            <dt class="text-slate-500">Người thuê</dt>
            <dd class="text-slate-900">{{ c.tenant_ids.join(', ') }}</dd>

            <dt class="text-slate-500">Thời hạn</dt>
            <dd class="text-slate-900">{{ c.start_date | date: 'dd/MM/yyyy' }} — {{ c.end_date | date: 'dd/MM/yyyy' }}</dd>

            <dt class="text-slate-500">Giá thuê</dt>
            <dd class="text-slate-900">{{ c.monthly_rent | number }} đ/tháng</dd>

            <dt class="text-slate-500">Cọc</dt>
            <dd class="text-slate-900">{{ c.deposit_paid | number }}/{{ c.deposit_amount | number }} đ</dd>

            @if (c.note) {
              <dt class="text-slate-500">Ghi chú</dt>
              <dd class="text-slate-900">{{ c.note }}</dd>
            }
          </dl>

          @if (auth.isManager() && c.status === 'active') {
            <div class="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <ui-button variant="secondary" (click)="openModal('extend')">Gia hạn</ui-button>
              @if (c.deposit_paid < c.deposit_amount) {
                <ui-button variant="secondary" (click)="openModal('collect-deposit')">Thu cọc</ui-button>
              }
              <ui-button variant="secondary" (click)="openModal('add-tenant')">Thêm người ở ghép</ui-button>
              <ui-button variant="danger" (click)="openModal('checkout')">Checkout</ui-button>
              @if (c.deposit_paid === 0) {
                <ui-button variant="danger" (click)="onCancel()" [loading]="cancelling()">Hủy hợp đồng</ui-button>
              }
            </div>

            @if (c.tenant_ids.length > 1) {
              <div class="mt-3 flex flex-wrap gap-2">
                @for (tid of c.tenant_ids; track tid) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {{ tid }}
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700"
                      (click)="removeTenant(tid)"
                      [disabled]="removingTenant()"
                    >
                      &times;
                    </button>
                  </span>
                }
              </div>
            }
          }

          @if (errorMessage()) {
            <p class="text-sm text-red-600 mt-3">{{ errorMessage() }}</p>
          }
        </div>
      }

      <h2 class="text-lg font-semibold text-slate-900 mb-3">Lịch sử cọc</h2>
      @if (depositTx.isLoading()) {
        <p class="text-slate-500 text-sm">Đang tải...</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (tx of depositTx.value() ?? []; track tx.id) {
            <div class="rounded-lg border border-slate-200 bg-white p-3 text-sm flex justify-between">
              <span class="text-slate-700">{{ TX_LABEL[tx.type] }}</span>
              <span class="text-slate-900 font-medium">{{ tx.amount | number }} đ</span>
            </div>
          } @empty {
            <p class="text-slate-400 text-sm">Chưa có giao dịch cọc nào.</p>
          }
        </div>
      }
    </div>

    <!-- Modal: Gia hạn -->
    <ui-modal [open]="activeModal() === 'extend'" title="Gia hạn hợp đồng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-3">
        <ui-input label="Ngày kết thúc mới" type="date" [(value)]="extendEndDate" />
        <ui-input label="Giá thuê mới (bỏ trống nếu giữ nguyên)" type="number" [(value)]="extendRent" />
        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end">
          <ui-button variant="secondary" (click)="closeModal()">Hủy</ui-button>
          <ui-button (click)="onExtend()" [loading]="submitting()">Xác nhận</ui-button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thu cọc -->
    <ui-modal [open]="activeModal() === 'collect-deposit'" title="Thu cọc" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-3">
        <ui-input label="Số tiền thu" type="number" [(value)]="collectAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end">
          <ui-button variant="secondary" (click)="closeModal()">Hủy</ui-button>
          <ui-button (click)="onCollectDeposit()" [loading]="submitting()">Xác nhận</ui-button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Checkout -->
    <ui-modal [open]="activeModal() === 'checkout'" title="Checkout hợp đồng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-3">
        <ui-input label="Ngày kết thúc thực tế" type="date" [(value)]="checkoutDate" />
        <ui-input label="Số tiền hoàn cọc" type="number" [(value)]="refundAmount" />
        <ui-input label="Số tiền giữ (phạt)" type="number" [(value)]="forfeitAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end">
          <ui-button variant="secondary" (click)="closeModal()">Hủy</ui-button>
          <ui-button variant="danger" (click)="onCheckout()" [loading]="submitting()">Xác nhận checkout</ui-button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thêm tenant -->
    <ui-modal [open]="activeModal() === 'add-tenant'" title="Thêm người ở ghép" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-3">
        <ui-input label="tenant_id" [(value)]="newTenantId" />
        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end">
          <ui-button variant="secondary" (click)="closeModal()">Hủy</ui-button>
          <ui-button (click)="onAddTenant()" [loading]="submitting()">Xác nhận</ui-button>
        </div>
      </div>
    </ui-modal>
  `,
})
export class ContractDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private contractsService = inject(ContractsService);

  contract = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.contractsService.getById(params.id),
  });

  depositTx = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.contractsService.getDepositTransactions(params.id),
  });

  activeModal = signal<ModalKind>(null);
  submitting = signal(false);
  cancelling = signal(false);
  removingTenant = signal(false);
  errorMessage = signal('');

  extendEndDate = signal('');
  extendRent = signal('');
  collectAmount = signal('0');
  checkoutDate = signal('');
  refundAmount = signal('0');
  forfeitAmount = signal('0');
  newTenantId = signal('');

  CONTRACT_STATUS_LABEL = CONTRACT_STATUS_LABEL;
  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;
  TX_LABEL = { collect: 'Thu cọc', refund: 'Hoàn cọc', forfeit: 'Giữ cọc (phạt)' };

  openModal(kind: ModalKind) {
    this.errorMessage.set('');
    this.activeModal.set(kind);
  }
  closeModal() {
    this.activeModal.set(null);
  }

  private async runAction(fn: () => Promise<unknown>) {
    this.errorMessage.set('');
    this.submitting.set(true);
    try {
      await fn();
      this.contract.reload();
      this.depositTx.reload();
      this.closeModal();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Có lỗi xảy ra.');
    } finally {
      this.submitting.set(false);
    }
  }

  onExtend() {
    return this.runAction(() =>
      this.contractsService.extend(this.id(), {
        new_end_date: this.extendEndDate(),
        new_monthly_rent: this.extendRent() ? Number(this.extendRent()) : undefined,
      })
    );
  }

  onCollectDeposit() {
    return this.runAction(() =>
      this.contractsService.collectDeposit(this.id(), {
        amount: Number(this.collectAmount()),
        method: 'cash',
      })
    );
  }

  onCheckout() {
    return this.runAction(() =>
      this.contractsService.checkout(this.id(), {
        actual_end_date: this.checkoutDate(),
        refund_amount: Number(this.refundAmount()) || undefined,
        forfeit_amount: Number(this.forfeitAmount()) || undefined,
      })
    );
  }

  onAddTenant() {
    return this.runAction(() => this.contractsService.addTenant(this.id(), this.newTenantId()));
  }

  async onCancel() {
    this.errorMessage.set('');
    this.cancelling.set(true);
    try {
      await this.contractsService.cancel(this.id());
      this.contract.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Hủy hợp đồng thất bại.');
    } finally {
      this.cancelling.set(false);
    }
  }

  async removeTenant(tenantId: string) {
    this.errorMessage.set('');
    this.removingTenant.set(true);
    try {
      // Backend tự chặn gỡ người cuối cùng 
      await this.contractsService.removeTenant(this.id(), tenantId);
      this.contract.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Gỡ tenant thất bại.');
    } finally {
      this.removingTenant.set(false);
    }
  }
}