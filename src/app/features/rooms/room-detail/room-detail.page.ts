import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { RoomStatus } from '../../../core/models';
import { DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  available: 'bg-[#FFE9AC] text-[#8A6200]',
  occupied: 'bg-[#E9E4D6] text-[#6B6455]',
};
const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  available: 'Còn trống',
  occupied: 'Đã thuê',
};

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, DatePipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
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
          
          <div #hero class="mb-8 opacity-0">
            <a routerLink="/rooms" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách phòng
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
              Chi tiết phòng
            </h1>
          </div>

          @if (room.isLoading()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải thông tin phòng...</p>
            </div>
          } @else if (room.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được thông tin phòng. Vui lòng thử lại.</p>
            </div>
          } @else if (room.value(); as r) {
            
            <div #roomCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] mb-8 opacity-0">
              <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>
              
              <div class="relative flex items-center justify-between mb-8 pb-6 border-b border-[#F1EBD8]">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF7ED] text-xl font-bold text-[#8A6200]">
                    {{ r.code }}
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-[#221D0F]">Phòng {{ r.code }}</h2>
                    <p class="text-sm text-[#8A8270] mt-1">Thông tin cơ bản & biểu phí</p>
                  </div>
                </div>
                <ui-badge [colorClass]="ROOM_STATUS_COLOR[r.status]">
                  {{ ROOM_STATUS_LABEL[r.status] }}
                </ui-badge>
              </div>

              <!-- Lưới thông tin -->
              <div class="relative grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Sức chứa</span>
                  <span class="font-bold text-[#221D0F]">{{ r.occupants }}{{ r.capacity }} người</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Giá thuê</span>
                  <span class="font-bold text-[#221D0F]">{{ r.monthly_rent | number }} ₫/tháng</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Giá điện</span>
                  <span class="font-bold text-[#221D0F]">{{ r.price_electricity | number }} ₫/kWh</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Giá nước</span>
                  <span class="font-bold text-[#221D0F]">{{ r.price_water | number }} ₫/khối</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Phí quản lý</span>
                  <span class="font-bold text-[#221D0F]">{{ r.management_fee_per_person | number }} ₫/người</span>
                </div>
                @if (r.note) {
                  <div class="flex flex-col gap-1.5 md:col-span-3">
                    <span class="text-sm text-[#8A8270]">Ghi chú</span>
                    <span class="font-medium text-[#221D0F]">{{ r.note }}</span>
                  </div>
                }
              </div>

              <!-- HIỂN THỊ DANH SÁCH NGƯỜI ĐANG Ở TRONG PHÒNG -->
              @if (r.tenants && r.tenants.length > 0) {
                <div class="relative mt-6 mb-8 pt-6 border-t border-[#F1EBD8]">
                  <h3 class="text-sm font-bold text-[#221D0F] mb-4">Người đang ở ({{ r.tenants.length }})</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (tenant of r.tenants; track tenant.id) {
                      <a 
                        [routerLink]="['/tenants', tenant.id]"
                        class="group flex items-center gap-3 rounded-xl bg-[#FBF7ED] p-3 border border-[#EFE6CC] transition-all hover:bg-white hover:border-[#FFC629] hover:shadow-sm"
                      >
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#8A6200] shadow-sm border border-[#EFE6CC] group-hover:bg-[#FFC629] group-hover:text-[#221D0F] transition-colors">
                          {{ tenant.full_name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-bold text-[#221D0F] truncate" [title]="tenant.full_name">{{ tenant.full_name }}</p>
                          <p class="text-xs text-[#8A8270] truncate">{{ tenant.phone }}</p>
                        </div>
                      </a>
                    }
                  </div>
                </div>
              }

              <!-- Nút hành động -->
              @if (auth.isManager()) {
                <div class="relative flex flex-wrap gap-3 pt-6 border-t border-[#F1EBD8]">
                  <a
                    [routerLink]="['/rooms', r.id, 'edit']"
                    class="rounded-full bg-[#F1EBD8] px-6 py-2.5 text-sm font-semibold text-[#221D0F] transition hover:bg-[#E9E4D6]"
                  >
                    Sửa thông tin
                  </a>
                  @if (r.status === 'available') {
                    <a
                      [routerLink]="['/contracts/new']"
                      [queryParams]="{ room_id: r.id }"
                      class="flex items-center gap-2 rounded-full bg-[#FFC629] px-6 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tạo hợp đồng
                    </a>
                  }
                </div>
              }
            </div>
          }

          <!-- Danh sách Hợp đồng -->
          <div #contractsHeader class="mb-4 opacity-0">
            <h3 class="text-lg font-bold text-[#221D0F]">Hợp đồng hiện tại</h3>
            <p class="text-sm text-[#8A8270]">Lịch sử và trạng thái thuê phòng</p>
          </div>

          @if (contracts.isLoading()) {
            <p class="text-sm text-[#8A8270] animate-pulse">Đang tải dữ liệu hợp đồng...</p>
          } @else {
            <div class="space-y-3">
              @for (c of activeContracts(); track c.id) {
                <a
                  #contractCard
                  [routerLink]="['/contracts', c.id]"
                  class="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#EFE6CC] bg-white p-5 opacity-0
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(34,29,15,0.04)]"
                >
                  <div>
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-base font-bold text-[#221D0F]">
                        {{ c.start_date | date: 'dd/MM/yyyy' }} &rarr; {{ c.end_date | date: 'dd/MM/yyyy' }}
                      </span>
                      <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                        {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
                      </ui-badge>
                    </div>
                    <p class="text-sm text-[#8A8270] flex items-center gap-1.5">
                      <span class="h-1.5 w-1.5 rounded-full bg-[#FFC629]"></span>
                      Đã cọc: <span class="font-semibold text-[#221D0F]">{{ c.deposit_paid | number }} ₫</span> / {{ c.deposit_amount | number }} ₫
                    </p>
                  </div>
                  
                  <div class="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF7ED] text-[#B8860B] transition-transform group-hover:translate-x-1 group-hover:bg-[#FFC629] group-hover:text-[#221D0F]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              } @empty {
                <div #contractCard class="rounded-2xl border border-dashed border-[#D8D2C2] bg-white/50 p-8 text-center opacity-0">
                  <p class="text-[#8A8270]">Chưa có hợp đồng nào đang hiệu lực cho phòng này.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RoomDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private roomsService = inject(RoomsService);
  private contractsService = inject(ContractsService);

  room = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.roomsService.getById(params.id),
  });

  contracts = this.contractsService.contractsByRoom(() => this.id());

  activeContracts() {
    return (this.contracts.value()?.data ?? []).filter((c) => c.status === 'active');
  }

  ROOM_STATUS_COLOR = ROOM_STATUS_COLOR;
  ROOM_STATUS_LABEL = ROOM_STATUS_LABEL;
  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private roomCardEl = viewChild<ElementRef<HTMLElement>>('roomCard');
  private contractsHeader = viewChild<ElementRef<HTMLElement>>('contractsHeader');
  private contractCards = viewChildren<ElementRef<HTMLElement>>('contractCard');

  private layoutAnimated = false;
  private roomAnimated = false;
  private contractsAnimated = false;

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
      const card = this.roomCardEl()?.nativeElement;
      if (card && this.room.value() && !this.roomAnimated) {
        this.roomAnimated = true;
        setTimeout(() => {
          gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        }, 50);
      }
    });

    effect(() => {
      const header = this.contractsHeader()?.nativeElement;
      const cards = this.contractCards().map(c => c.nativeElement).filter(el => !!el);

      if (this.contracts.value() && !this.contractsAnimated) {
        this.contractsAnimated = true;
        setTimeout(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          if (header) tl.fromTo(header, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
          if (cards.length) tl.fromTo(cards, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.1 }, '-=0.1');
        }, 50);
      }
    });
  }
}