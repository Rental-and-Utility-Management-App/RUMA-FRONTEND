import { DatePipe, DecimalPipe } from '@angular/common';
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
import { AuthService } from '../../../core/auth/auth.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { Contract, ContractStatus, DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

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
  imports: [RouterLink, UiBadge, UiInput, UiModal, DecimalPipe, DatePipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Sidebar theo vai trò -->
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/assets/images/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-4xl mx-auto p-6 md:p-10">
          
          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
            <a routerLink="/contracts" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách hợp đồng
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Hồ sơ chi tiết</h1>
          </div>

          <!-- Loading / Error -->
          @if (contract.isLoading()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải thông tin hợp đồng...</p>
            </div>
          } @else if (contract.value(); as c) {
            
            <!-- Thẻ thông tin hợp đồng chính -->
            <div #mainCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] mb-6 opacity-0">
              <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

              <div class="relative flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[#F1EBD8]">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF7ED] text-xl font-bold text-[#8A6200]">
                    {{ c.room_code ? c.room_code.slice(-3) : 'HĐ' }}
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-[#221D0F]">Phòng {{ c.room_code || c.room_id }}</h2>
                    <p class="text-sm text-[#8A8270] mt-0.5">Mã số hồ sơ định danh: {{ c.id }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                    {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
                  </ui-badge>
                  <ui-badge colorClass="bg-[#F1EBD8] text-[#6B6455]">
                    {{ CONTRACT_STATUS_LABEL[c.status] }}
                  </ui-badge>
                </div>
              </div>

              <!-- Lưới chi tiết điều khoản -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6">
                <div class="flex flex-col gap-1">
                  <span class="text-[#8A8270]">Thành viên lưu trú</span>
                  <span class="font-bold text-[#221D0F]">{{ tenantNames(c) }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[#8A8270]">Thời hạn chu kỳ thuê</span>
                  <span class="font-bold text-[#221D0F]">{{ c.start_date | date: 'dd/MM/yyyy' }} — {{ c.end_date | date: 'dd/MM/yyyy' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[#8A8270]">Giá thuê thỏa thuận</span>
                  <span class="font-bold text-[#221D0F]">{{ c.monthly_rent | number }} ₫/tháng</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[#8A8270]">Quỹ tiền ký cọc</span>
                  <span class="font-bold text-[#221D0F]">{{ c.deposit_paid | number }} / {{ c.deposit_amount | number }} ₫</span>
                </div>
                @if (c.note) {
                  <div class="flex flex-col gap-1 sm:col-span-2">
                    <span class="text-[#8A8270]">Điều khoản đặc biệt (Ghi chú)</span>
                    <span class="font-medium text-[#221D0F]">{{ c.note }}</span>
                  </div>
                }
              </div>

              <!-- Khối công cụ quản trị (Manager) -->
              @if (auth.isManager() && c.status === 'active') {
                <div class="relative flex flex-wrap gap-2 pt-6 border-t border-[#F1EBD8]">
                  <button (click)="openModal('extend')" class="rounded-full bg-[#F1EBD8] px-5 py-2 text-xs font-semibold text-[#221D0F] transition hover:bg-[#E9E4D6]">Gia hạn</button>
                  @if (c.deposit_paid < c.deposit_amount) {
                    <button (click)="openModal('collect-deposit')" class="rounded-full bg-[#FFC629] px-5 py-2 text-xs font-bold text-[#221D0F] transition hover:bg-[#FFD764]">Thu cọc</button>
                  }
                  <button (click)="openModal('add-tenant')" class="rounded-full bg-[#221D0F] px-5 py-2 text-xs font-semibold text-white transition hover:bg-black">Thêm người ở ghép</button>
                  <button (click)="openModal('checkout')" class="rounded-full bg-[#F4D9D2] px-5 py-2 text-xs font-semibold text-[#9A3412] transition hover:bg-[#F0C9BE]">Checkout phòng</button>
                  @if (c.deposit_paid === 0) {
                    <button (click)="onCancel()" [disabled]="cancelling()" class="rounded-full border border-[#9A3412] px-5 py-2 text-xs font-semibold text-[#9A3412] transition hover:bg-[#F4D9D2]">
                      {{ cancelling() ? 'Đang hủy...' : 'Hủy hợp đồng' }}
                    </button>
                  }
                </div>

                <!-- Chip xóa thành viên ở ghép -->
                @if (c.tenant_ids.length > 1) {
                  <div class="mt-4 flex flex-wrap gap-2 pt-3 border-t border-dashed border-[#F1EBD8]">
                    <span class="text-xs text-[#8A8270] self-center w-full sm:w-auto mb-1 sm:mb-0">Xóa người ở ghép nhanh:</span>
                    @for (tid of c.tenant_ids; track tid) {
                      <span class="inline-flex items-center gap-2 rounded-full bg-[#FBF7ED] border border-[#EFE6CC] px-3 py-1 text-xs font-medium text-[#6B6455]">
                        {{ tenantLabel(c, tid) }}
                        <button type="button" class="text-[#9A3412] hover:text-red-700 font-bold text-sm" (click)="removeTenant(tid)" [disabled]="removingTenant()">&times;</button>
                      </span>
                    }
                  </div>
                }
              }

              @if (errorMessage()) {
                <div class="mt-4 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <p>{{ errorMessage() }}</p>
                </div>
              }
            </div>
          }

          <!-- Lịch sử cọc (Giao dịch) -->
          <div #txHeader class="mb-4 opacity-0">
            <h3 class="text-lg font-bold text-[#221D0F]">Lịch sử ký quỹ cọc</h3>
            <p class="text-sm text-[#8A8270]">Nhật ký nạp tiền/hoàn trả tiền bảo đảm</p>
          </div>

          @if (depositTx.isLoading()) {
            <p class="text-sm text-[#8A8270] animate-pulse">Đang nạp lịch sử giao dịch...</p>
          } @else {
            <div class="space-y-2.5">
              @for (tx of depositTx.value() ?? []; track tx.id) {
                <div #txCard class="rounded-2xl border border-[#EFE6CC] bg-white p-4 text-sm flex justify-between items-center opacity-0 shadow-[0_2px_8px_rgba(34,29,15,0.02)]">
                  <div class="flex items-center gap-2.5">
                    <span class="h-2 w-2 rounded-full" [class]="tx.type === 'collect' ? 'bg-green-500' : 'bg-[#9A3412]'"></span>
                    <span class="text-[#221D0F] font-semibold">{{ TX_LABEL[tx.type] }}</span>
                  </div>
                  <span class="font-bold" [class]="tx.type === 'collect' ? 'text-green-700' : 'text-[#221D0F]'">{{ tx.amount | number }} ₫</span>
                </div>
              } @empty {
                <div #txCard class="rounded-2xl border border-dashed border-[#D8D2C2] bg-white/50 p-6 text-center opacity-0">
                  <p class="text-sm text-[#8A8270]">Chưa ghi nhận bất kỳ giao dịch ký quỹ nào.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- HỘP THOẠI MODAL (ĐÃ ĐỒNG BỘ STYLE BUTTON) -->
    <!-- Modal: Gia hạn -->
    <ui-modal [open]="activeModal() === 'extend'" title="Gia hạn thời hiệu hợp đồng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-input label="Ngày kết thúc mới (*)" type="date" [(value)]="extendEndDate" />
        <ui-input label="Giá thuê điều chỉnh (bỏ trống nếu giữ nguyên)" type="number" [(value)]="extendRent" />
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
          <button type="button" (click)="onExtend()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F]">Xác nhận</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thu cọc -->
    <ui-modal [open]="activeModal() === 'collect-deposit'" title="Thu hồi bổ sung tiền cọc" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-input label="Số tiền quỹ nạp thêm (₫) (*)" type="number" [(value)]="collectAmount" />
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
          <button type="button" (click)="onCollectDeposit()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F]">Nạp quỹ cọc</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Checkout -->
    <ui-modal [open]="activeModal() === 'checkout'" title="Xác nhận tất toán bàn giao phòng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-input label="Ngày kết thúc thực tế (*)" type="date" [(value)]="checkoutDate" />
        <ui-input label="Số tiền hoàn lại cho khách (₫)" type="number" [(value)]="refundAmount" />
        <ui-input label="Số tiền khấu trừ phạt (₫)" type="number" [(value)]="forfeitAmount" />
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy</button>
          <button type="button" (click)="onCheckout()" class="rounded-full bg-[#9A3412] px-6 py-2.5 text-xs font-bold text-white">Xác nhận thanh lý</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thêm tenant -->
    <ui-modal [open]="activeModal() === 'add-tenant'" title="Bổ sung thành viên ở ghép" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-input label="Nhập ID Khách thuê mới (tenant_id) (*)" [(value)]="newTenantId" />
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy</button>
          <button type="button" (click)="onAddTenant()" class="rounded-full bg-[#221D0F] px-6 py-2.5 text-xs font-semibold text-white">Thêm vào phòng</button>
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
  TX_LABEL = { collect: 'Thu cọc', refund: 'Hoàn cọc', forfeit: 'Giữ cọc (khấu trừ phạt)' };

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
      if (card && this.contract.value() && !this.cardAnimated) {
        this.cardAnimated = true;
        setTimeout(() => {
          gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        }, 50);
      }
    });

    effect(() => {
      const h = this.txHeader()?.nativeElement;
      const cards = this.txCards().map(c => c.nativeElement).filter((el): el is HTMLElement => !!el);

      if (this.depositTx.value() && !this.txAnimated) {
        this.txAnimated = true;
        setTimeout(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (h) tl.fromTo(h, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
          if (cards.length) tl.fromTo(cards, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 }, '-=0.1');
        }, 50);
      }
    });
  }

  /** Chuỗi tên đầy đủ của tất cả tenant, ưu tiên dùng c.tenants (đã populate
   *  từ BE); fallback về tenant_ids nếu BE chưa populate được. */
  tenantNames(c: Contract): string {
    if (c.tenants?.length) {
      return c.tenants.map(t => t.full_name).join(', ');
    }
    return c.tenant_ids.join(', ');
  }

  /** Nhãn hiển thị cho 1 tenant cụ thể (dùng ở chip xóa người ở ghép) —
   *  trả về tên nếu tìm thấy trong c.tenants, ngược lại fallback về ID. */
  tenantLabel(c: Contract, tenantId: string): string {
    const found = c.tenants?.find(t => t.id === tenantId);
    return found ? found.full_name : tenantId;
  }

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
      await this.contractsService.removeTenant(this.id(), tenantId);
      this.contract.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Gỡ tenant thất bại.');
    } finally {
      this.removingTenant.set(false);
    }
  }
}