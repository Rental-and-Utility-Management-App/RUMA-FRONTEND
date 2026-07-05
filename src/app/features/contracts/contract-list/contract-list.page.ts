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
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { ContractsService } from '../../../core/services/contracts.service';
import { ContractStatus, DEPOSIT_STATUS_COLOR, DEPOSIT_STATUS_LABEL } from '../../../core/models/contract.model';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  active: 'Đang hiệu lực',
  ended: 'Đã kết thúc',
  terminated: 'Đã chấm dứt',
  cancelled: 'Đã hủy',
};

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [RouterLink, UiBadge, DecimalPipe, DatePipe, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Sidebar theo vai trò -->
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <!-- Ảnh nền mờ chìm -->
      <div class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]" style="background-image: url('/dashboard-bg.jpg');"></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <!-- Nền gradient động -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div #blob1 class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"></div>
        <div #blob2 class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-5xl mx-auto p-6 md:p-10">
          
          <!-- Header -->
          <div #hero class="mb-8 flex flex-wrap items-end justify-between gap-4 opacity-0">
            <div>
              <p class="text-sm font-medium text-[#B8860B] mb-1">Hồ sơ pháp lý</p>
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
                Danh sách
                <span class="relative inline-block">
                  hợp đồng
                  <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                  </svg>
                </span>
              </h1>
              <p class="mt-3 text-[#8A8270]">Quản lý thời hạn điều khoản, trạng thái tiền cọc và lịch sử thuê phòng.</p>
            </div>

            @if (auth.isManager()) {
              <a routerLink="/contracts/new" class="flex items-center gap-2 rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tạo hợp đồng
              </a>
            }
          </div>

          <!-- Bộ lọc & Tìm kiếm (MỚI) -->
          <div #filterBar class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo mã phòng hoặc ID phòng..."
                (input)="searchQuery.set($any($event.target).value)"
                class="w-full rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 py-2 pl-10 pr-4 text-sm text-[#221D0F] placeholder-[#8A8270] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div class="shrink-0">
              <select
                (change)="statusFilter.set($any($event.target).value)"
                class="rounded-full border border-[#EFE6CC] bg-[#FBF7ED]/50 px-4 py-2 text-sm text-[#221D0F] focus:border-[#FFC629] focus:bg-white focus:outline-none transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hiệu lực</option>
                <option value="ended">Đã kết thúc</option>
                <option value="terminated">Đã chấm dứt</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <!-- Content List -->
          @if (contracts.isLoading()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách hợp đồng...</p>
            </div>
          } @else if (contracts.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được danh sách hợp đồng.</p>
            </div>
          } @else {
            <div class="flex flex-col gap-4">
              @for (c of filteredContracts(); track c.id) {
                <a
                  #card
                  [routerLink]="['/contracts', c.id]"
                  class="group relative rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden"
                >
                  <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"></div>
                  
                  <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#221D0F] text-[#FFC629]">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <span class="font-bold text-lg text-[#221D0F]">Phòng {{ c.room_code || c.room_id }}</span>
                        <p class="text-xs text-[#8A8270] mt-0.5">ID: {{ c.id }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2 self-start sm:self-auto">
                      <ui-badge [colorClass]="DEPOSIT_STATUS_COLOR[c.deposit_status]">
                        {{ DEPOSIT_STATUS_LABEL[c.deposit_status] }}
                      </ui-badge>
                      <ui-badge colorClass="bg-[#F1EBD8] text-[#6B6455]">
                        {{ CONTRACT_STATUS_LABEL[c.status] }}
                      </ui-badge>
                    </div>
                  </div>

                  <div class="relative border-t border-[#F1EBD8] pt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-[#6B6455]">
                    <div class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#8A8270]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{{ c.start_date | date: 'dd/MM/yyyy' }} — {{ c.end_date | date: 'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="font-bold text-[#221D0F]">
                      {{ c.monthly_rent | number }} ₫/tháng
                    </div>
                  </div>
                </a>
              } @empty {
                <div class="rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
                  <p class="text-[#8A8270]">Không tìm thấy hợp đồng nào phù hợp.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ContractListPage {
  auth = inject(AuthService);
  private contractsService = inject(ContractsService);
  contracts = this.contractsService.contractsResource;

  searchQuery = signal('');
  statusFilter = signal('all');

  DEPOSIT_STATUS_COLOR = DEPOSIT_STATUS_COLOR;
  DEPOSIT_STATUS_LABEL = DEPOSIT_STATUS_LABEL;
  CONTRACT_STATUS_LABEL = CONTRACT_STATUS_LABEL;

  // Lọc dữ liệu client-side mượt mà theo thời gian thực (MỚI)
  filteredContracts = computed(() => {
    const list = this.contracts.value()?.data ?? [];
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((c) => {
      const roomKey = (c.room_code || c.room_id || '').toLowerCase();
      const matchesSearch = !search || roomKey.includes(search);
      const matchesStatus = status === 'all' || c.status === status;
      return matchesSearch && matchesStatus;
    });
  });

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private filterBar = viewChild<ElementRef<HTMLElement>>('filterBar');
  private cards = viewChildren<ElementRef<HTMLElement>>('card');
  private animatedCards = false;

  constructor() {
    // Animation Layout nền và tiêu đề
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const filterEl = this.filterBar()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) {
        tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' });
      }
      if (heroEl) {
        tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');
      }
      if (filterEl) {
        tl.fromTo(filterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');
      }

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // Animation cho danh sách thẻ khi data load thành công
    effect(() => {
      const cardEls = this.cards().map((c) => c.nativeElement).filter((el): el is HTMLElement => !!el);

      if (cardEls.length > 0 && !this.animatedCards) {
        this.animatedCards = true;
        setTimeout(() => {
          gsap.fromTo(cardEls, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.07, ease: 'power3.out' });
        }, 50);
      }
    });
  }
}