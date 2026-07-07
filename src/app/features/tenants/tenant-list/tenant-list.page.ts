import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ElementRef,
  viewChild,
  viewChildren,
  afterNextRender,
  effect,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [RouterLink, UiBadge, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Sidebar theo vai trò -->
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
        <div class="max-w-5xl mx-auto p-6 md:p-10">
          
          <!-- Header -->
          <div #hero class="mb-8 flex flex-wrap items-end justify-between gap-4 opacity-0">
            <div>
              <p class="text-sm font-medium text-[#B8860B] mb-1">Quản lý khách hàng</p>
              <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
                Danh sách
                <span class="relative inline-block">
                  người thuê
                  <svg class="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 -2 100 5" stroke="#FFC629" stroke-width="5" fill="none" stroke-linecap="round" />
                  </svg>
                </span>
              </h1>
              <p class="mt-3 text-[#8A8270]">Quản lý thông tin, phòng ở và trạng thái tài khoản của người thuê.</p>
            </div>

            @if (auth.isManager()) {
              <a
                routerLink="/tenants/new"
                class="flex items-center gap-2 rounded-full bg-[#FFC629] px-5 py-2.5 text-sm font-semibold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Tạo tài khoản
              </a>
            }
          </div>

          <!-- Bộ lọc & Tìm kiếm -->
          <div #filterBar class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EFE6CC] bg-white p-4 shadow-[0_2px_10px_rgba(34,29,15,0.02)] opacity-0">
            <div class="relative flex-1 min-w-60">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8A8270]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc số điện thoại..."
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
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
            </div>
          </div>

          <!-- Content -->
          @if (users.isLoading()) {
            <div class="flex items-center justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải danh sách...</p>
            </div>
          } @else if (users.error()) {
            <div class="rounded-3xl border border-[#F4D9D2] bg-white p-6 text-center shadow-sm">
              <p class="text-sm font-medium text-[#9A3412]">Không tải được danh sách người thuê.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (u of filteredUsers(); track u.id) {
                <a
                  #card
                  [routerLink]="['/tenants', u.id]"
                  class="group relative flex flex-col rounded-3xl border border-[#EFE6CC] bg-white p-6 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,198,41,0.25)] overflow-hidden h-full"
                >
                  <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FFC629]/15 transition-transform duration-500 group-hover:scale-150"></div>
                  
                  <div class="relative flex items-start gap-4 mb-5">
                    @if (u.avatar_url) {
                      <img
                        [src]="u.avatar_url"
                        alt=""
                        class="h-14 w-14 shrink-0 rounded-full object-cover border border-[#F1EBD8]"
                      />
                    } @else {
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FBF7ED] text-xl font-bold text-[#8A6200] border border-[#F1EBD8]">
                        {{ u.full_name.charAt(0).toUpperCase() }}
                      </div>
                    }
                    
                    <div class="min-w-0 flex-1 pt-0.5">
                      <h3 class="text-base font-bold text-[#221D0F] truncate" [title]="u.full_name">{{ u.full_name }}</h3>
                      <p class="text-sm text-[#8A8270] mt-0.5 mb-2.5 truncate">{{ u.phone }}</p>
                      
                      @if (u.room_id) {
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs text-[#8A8270] shrink-0">Phòng:</span>
                          <span 
                            class="inline-block max-w-40 truncate rounded-md bg-[#FFC629] px-2 py-0.5 text-xs font-bold text-[#221D0F] shadow-sm"
                            [title]="u.room?.code || u.room_id"
                          >
                            {{ u.room?.code || u.room_id }}
                          </span>
                        </div>
                      } @else {
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs text-[#8A8270] shrink-0">Phòng:</span>
                          <span class="inline-block rounded-md bg-[#F1EBD8] px-2 py-0.5 text-xs font-medium text-[#8A8270]">
                            Chưa có
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <div class="relative mt-auto border-t border-[#F1EBD8] pt-4 flex items-center justify-between">
                    <span class="text-sm text-[#8A8270]">Trạng thái tài khoản</span>
                    <ui-badge [colorClass]="u.is_active ? 'bg-[#E5F5E9] text-[#166534]' : 'bg-[#F1EBD8] text-[#6B6455]'">
                      {{ u.is_active ? 'Hoạt động' : 'Đã khóa' }}
                    </ui-badge>
                  </div>
                </a>
              } @empty {
                <div class="col-span-full rounded-3xl border border-[#EFE6CC] bg-white p-10 text-center shadow-sm">
                  <p class="text-[#8A8270]">Không tìm thấy người thuê nào phù hợp với bộ lọc.</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class TenantListPage {
  auth = inject(AuthService);
  private usersService = inject(UsersService);
  users = this.usersService.usersResource;

  // --- STATE TÌM KIẾM VÀ LỌC ---
  searchQuery = signal('');
  statusFilter = signal('all');

  // Computed tự động tính toán lại danh sách khi search/filter hoặc data thay đổi
  filteredUsers = computed(() => {
    const list = this.users.value()?.data ?? [];
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((u) => {
      // 1. Kiểm tra tìm kiếm (Tên hoặc SĐT)
      const matchesSearch = !search || 
                            u.full_name.toLowerCase().includes(search) || 
                            u.phone.includes(search);
      
      // 2. Kiểm tra bộ lọc trạng thái
      let matchesStatus = true;
      if (status === 'active') matchesStatus = u.is_active === true;
      if (status === 'inactive') matchesStatus = u.is_active === false;

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
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const filterEl = this.filterBar()?.nativeElement;
      
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.45');
      if (filterEl) tl.fromTo(filterEl, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.2');
      
      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // Khi data mới load hoặc filter thay đổi thì re-animate các thẻ
    effect(() => {
      const cardEls = this.cards().map(c => c.nativeElement).filter(el => !!el);
      if (cardEls.length > 0) {
        // Hủy cờ để animation luôn chạy khi kết quả search thay đổi
        this.animatedCards = false; 
        setTimeout(() => {
          gsap.fromTo(cardEls, { y: 16, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.05, ease: 'power3.out' });
        }, 50);
      }
    });
  }
}