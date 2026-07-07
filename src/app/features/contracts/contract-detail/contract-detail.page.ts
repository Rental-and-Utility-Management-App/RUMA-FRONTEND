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
import { UiDatePicker } from '../../../shared/ui/date-picker/date-picker';
import { UiModal } from '../../../shared/ui/modal/modal';
import { ConfirmService, ConfirmDialog } from '../../../shared/ui/confirm/confirm';
import { AuthService } from '../../../core/auth/auth.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { UsersService } from '../../../core/services/users.service';
import { UserResponse } from '../../../core/models';
import { ContractStatus, DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';
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
  imports: [RouterLink, UiBadge, UiInput, UiDatePicker, UiModal, ConfirmDialog, DecimalPipe, DatePipe, TenantSidebar, ManagerSidebar],
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
            <a routerLink="/contracts" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách hợp đồng
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Hồ sơ chi tiết</h1>
          </div>

          @if (contract.isLoading()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải thông tin hợp đồng...</p>
            </div>
          } @else if (contract.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được hợp đồng.</p>
            </div>
          } @else if (contract.value(); as c) {

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

              @if (auth.isManager() && c.status === 'active') {
                <div class="relative flex flex-wrap gap-2 pt-6 border-t border-[#F1EBD8]">
                  <button (click)="openModal('extend')" class="rounded-full bg-[#F1EBD8] px-5 py-2 text-xs font-semibold text-[#221D0F] transition hover:bg-[#E9E4D6]">Gia hạn</button>
                  @if ((c.deposit_paid || 0) < (c.deposit_amount || 0)) {
                    <button (click)="openModal('collect-deposit')" class="rounded-full bg-[#FFC629] px-5 py-2 text-xs font-bold text-[#221D0F] transition hover:bg-[#FFD764]">Thu cọc</button>
                  }
                  <button (click)="openModal('add-tenant')" class="rounded-full bg-[#221D0F] px-5 py-2 text-xs font-semibold text-white transition hover:bg-black">Thêm người ở ghép</button>
                  <button (click)="openModal('checkout')" class="rounded-full bg-[#F4D9D2] px-5 py-2 text-xs font-semibold text-[#9A3412] transition hover:bg-[#F0C9BE]">Checkout phòng</button>
                  @if (c.deposit_paid === 0) {
                    <button (click)="submitCancel()" [disabled]="cancelling()" class="rounded-full border border-[#9A3412] px-5 py-2 text-xs font-semibold text-[#9A3412] transition hover:bg-[#F4D9D2]">
                      {{ cancelling() ? 'Đang hủy...' : 'Hủy hợp đồng' }}
                    </button>
                  }
                </div>
              }

              @if (errorMessage()) {
                <div class="mt-4 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <p>{{ errorMessage() }}</p>
                </div>
              }
            </div>
          }

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
                    <span class="text-[#221D0F] font-semibold">{{ TX_LABEL[tx.type] || 'Giao dịch' }}</span>
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

    <!-- Modal: Gia hạn -->
    <ui-modal [open]="activeModal() === 'extend'" title="Gia hạn thời hiệu hợp đồng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-date-picker label="Ngày kết thúc mới (*)" [(value)]="extendEndDate" />
        <ui-input label="Giá thuê điều chỉnh (bỏ trống nếu giữ nguyên)" type="number" [(value)]="extendRent" />
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
          <button type="button" (click)="submitExtend()" [disabled]="submitting()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">Xác nhận</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thu cọc -->
    <ui-modal [open]="activeModal() === 'collect-deposit'" title="Thu hồi bổ sung tiền cọc" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-input label="Số tiền quỹ nạp thêm (₫) (*)" type="number" [(value)]="collectAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy bỏ</button>
          <button type="button" (click)="submitCollectDeposit()" [disabled]="submitting()" class="rounded-full bg-[#FFC629] px-6 py-2.5 text-xs font-bold text-[#221D0F] disabled:opacity-70">Nạp quỹ cọc</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Checkout -->
    <ui-modal [open]="activeModal() === 'checkout'" title="Xác nhận tất toán bàn giao phòng" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        <ui-date-picker label="Ngày kết thúc thực tế (*)" [(value)]="checkoutDate" />
        <ui-input label="Số tiền hoàn lại cho khách (₫)" type="number" [(value)]="refundAmount" />
        <ui-input label="Số tiền khấu trừ phạt (₫)" type="number" [(value)]="forfeitAmount" />
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy</button>
          <button type="button" (click)="submitCheckout()" [disabled]="submitting()" class="rounded-full bg-[#9A3412] px-6 py-2.5 text-xs font-bold text-white disabled:opacity-70">Xác nhận thanh lý</button>
        </div>
      </div>
    </ui-modal>

    <!-- Modal: Thêm tenant -->
    <ui-modal [open]="activeModal() === 'add-tenant'" title="Bổ sung thành viên ở ghép" (closeRequested)="closeModal()">
      <div class="flex flex-col gap-4">
        @if (allUsers.isLoading()) {
          <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách người dùng...</p>
        } @else if (allUsers.error()) {
          <p class="text-sm text-[#9A3412]">Không tải được danh sách người dùng.</p>
        } @else {
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-[#6B6455]">Chọn khách thuê (*)</label>
            <select
              [value]="newTenantId()"
              (change)="newTenantId.set($any($event.target).value)"
              class="rounded-xl border border-[#EFE6CC] bg-white px-4 py-2.5 text-sm text-[#221D0F] focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
            >
              <option value="" disabled selected>-- Chọn người dùng --</option>
              @for (u of availableTenants(); track u.id) {
                <option [value]="u.id">{{ u.full_name }} — {{ u.phone }} (Phòng {{ u.room?.code || u.room_id }})</option>
              }
            </select>
          </div>
        }
        @if (errorMessage()) {
          <p class="text-sm text-[#9A3412]">{{ errorMessage() }}</p>
        }
        <div class="flex gap-2 justify-end pt-2">
          <button type="button" (click)="closeModal()" class="rounded-full bg-[#F1EBD8] px-5 py-2.5 text-xs font-semibold text-[#6B6455]">Hủy</button>
          <button type="button" (click)="submitAddTenant()" [disabled]="!newTenantId() || submitting()" class="rounded-full bg-[#221D0F] px-6 py-2.5 text-xs font-semibold text-white disabled:opacity-60">
            {{ submitting() ? 'Đang xử lý...' : 'Thêm vào phòng' }}
          </button>
        </div>
      </div>
    </ui-modal>
  `,
})
export class ContractDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private contractsService = inject(ContractsService);
  private usersService = inject(UsersService);
  private confirm = inject(ConfirmService);

  contract = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.contractsService.getById(params.id),
  });

  depositTx = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.contractsService.getDepositTransactions(params.id),
  });

  // Danh sách toàn bộ người dùng (đã cache sẵn ở UsersService, dùng chung app)
  // dùng để đổ dropdown "Thêm người ở ghép". Lưu ý: usersResource trả về cả
  // envelope ApiResponse, phải lấy qua .value()?.data.
  get allUsers() {
    return this.usersService.usersResource;
  }

  activeModal = signal<ModalKind>(null);
  submitting = signal(false);
  cancelling = signal(false);
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
  TX_LABEL: any = { collect: 'Thu cọc', refund: 'Hoàn cọc', forfeit: 'Giữ cọc (khấu trừ phạt)' };

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

  // Ép kiểu 'any' cho object truyền vào để ngăn chặn lỗi import model strict-mode
  tenantNames(c: any): string {
    if (c?.tenants && c.tenants.length > 0) {
      return c.tenants.map((t: any) => t.full_name).join(', ');
    }
    return (c?.tenant_ids || []).join(', ');
  }

  // Danh sách người dùng khả dụng để thêm vào hợp đồng hiện tại:
  // - phải có role 'tenant'
  // - đang active
  // - chưa nằm trong danh sách tenant_ids của hợp đồng hiện tại
  availableTenants(): UserResponse[] {
    const users = this.allUsers.value()?.data ?? [];
    const c: any = this.contract.value();
    const existingIds: string[] = c?.tenant_ids || [];
    return users.filter(
      u =>
        u.role === 'tenant' &&
        u.is_active &&
        !existingIds.includes(u.id) &&
        // Chỉ hiện người CHƯA có phòng nào (room_id rỗng) — người đã ở
        // phòng khác thì không cho ghép thêm vào phòng này nữa.
        !u.room_id
    );
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
    this.confirm.setProcessing(true);
    try {
      await fn();
      this.cardAnimated = false;
      this.contract.reload();
      this.depositTx.reload();
      this.closeModal();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Có lỗi xảy ra.');
    } finally {
      this.submitting.set(false);
      this.confirm.setProcessing(false);
    }
  }

  // ---- Gia hạn ----
  async submitExtend() {
    this.errorMessage.set('');
    if (!this.extendEndDate()) {
      this.errorMessage.set('Vui lòng chọn ngày kết thúc mới.');
      return;
    }
    const rentText = this.extendRent()
      ? `\nGiá thuê điều chỉnh: ${Number(this.extendRent()).toLocaleString('vi-VN')} ₫/tháng`
      : '';
    const ok = await this.confirm.ask({
      title: 'Xác nhận gia hạn hợp đồng',
      message: `Gia hạn hợp đồng đến ngày ${this.extendEndDate()}?${rentText}`,
      confirmText: 'Xác nhận gia hạn',
    });
    if (!ok) return;
    await this.onExtend();
  }

  private onExtend() {
    return this.runAction(() =>
      this.contractsService.extend(this.id(), {
        new_end_date: this.extendEndDate(),
        new_monthly_rent: this.extendRent() ? Number(this.extendRent()) : undefined,
      })
    );
  }

  // ---- Thu cọc ----
  async submitCollectDeposit() {
    this.errorMessage.set('');
    const amount = Number(this.collectAmount());
    if (!this.collectAmount() || amount <= 0) {
      this.errorMessage.set('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Xác nhận thu cọc',
      message: `Ghi nhận nạp thêm ${amount.toLocaleString('vi-VN')} ₫ vào quỹ tiền cọc của hợp đồng này?`,
      confirmText: 'Xác nhận thu cọc',
    });
    if (!ok) return;
    await this.onCollectDeposit();
  }

  private onCollectDeposit() {
    return this.runAction(() =>
      this.contractsService.collectDeposit(this.id(), {
        amount: Number(this.collectAmount()),
        method: 'cash',
      })
    );
  }

  // ---- Checkout ----
  async submitCheckout() {
    this.errorMessage.set('');
    if (!this.checkoutDate()) {
      this.errorMessage.set('Vui lòng chọn ngày kết thúc thực tế.');
      return;
    }
    const refund = Number(this.refundAmount()) || 0;
    const forfeit = Number(this.forfeitAmount()) || 0;
    const ok = await this.confirm.ask({
      title: 'Xác nhận tất toán bàn giao phòng',
      message: `Checkout ngày ${this.checkoutDate()}.\nHoàn lại khách: ${refund.toLocaleString('vi-VN')} ₫\nKhấu trừ phạt: ${forfeit.toLocaleString('vi-VN')} ₫\n\nHành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Xác nhận thanh lý',
      danger: true,
    });
    if (!ok) return;
    await this.onCheckout();
  }

  private onCheckout() {
    return this.runAction(() =>
      this.contractsService.checkout(this.id(), {
        actual_end_date: this.checkoutDate(),
        refund_amount: Number(this.refundAmount()) || undefined,
        forfeit_amount: Number(this.forfeitAmount()) || undefined,
      })
    );
  }

  // ---- Thêm tenant ----
  async submitAddTenant() {
    this.errorMessage.set('');
    if (!this.newTenantId()) return;
    const tenant = this.availableTenants().find(u => u.id === this.newTenantId());
    const ok = await this.confirm.ask({
      title: 'Xác nhận thêm người ở ghép',
      message: `Thêm ${tenant?.full_name || 'khách thuê này'} vào hợp đồng hiện tại?`,
      confirmText: 'Thêm vào phòng',
    });
    if (!ok) return;
    await this.onAddTenant();
  }

  private onAddTenant() {
    return this.runAction(() => this.contractsService.addTenant(this.id(), this.newTenantId()));
  }

  // ---- Hủy hợp đồng ----
  async submitCancel() {
    this.errorMessage.set('');
    const ok = await this.confirm.ask({
      title: 'Xác nhận hủy hợp đồng',
      message: 'Bạn có chắc chắn muốn hủy hợp đồng này không? Hành động này không thể hoàn tác.',
      confirmText: 'Hủy hợp đồng',
      danger: true,
    });
    if (!ok) return;
    await this.onCancel();
  }

  private async onCancel() {
    this.errorMessage.set('');
    this.cancelling.set(true);
    this.confirm.setProcessing(true);
    try {
      await this.contractsService.cancel(this.id());
      this.cardAnimated = false;
      this.contract.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Hủy hợp đồng thất bại.');
    } finally {
      this.cancelling.set(false);
      this.confirm.setProcessing(false);
    }
  }
}