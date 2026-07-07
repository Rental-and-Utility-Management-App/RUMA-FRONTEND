import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SIDEBAR_ICONS } from '../../../shared/ui/sidebar/sidebar-icons';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="mobileOpen.set(true)"
      class="md:hidden fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl
             bg-white border border-[#EFE6CC] shadow-sm text-[#6B6455] hover:text-[#221D0F] hover:border-[#FFC629]/50"
      aria-label="Mở menu"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    @if (mobileOpen()) {
      <div class="fixed inset-0 z-40 bg-[#221D0F]/40 backdrop-blur-sm md:hidden" (click)="mobileOpen.set(false)"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#EFE6CC] bg-[#FFFDF7]/95
             backdrop-blur-xl transition-transform duration-300 ease-out md:translate-x-0"
      [class.translate-x-0]="mobileOpen()"
      [class.-translate-x-full]="!mobileOpen()"
    >
      <div class="flex items-center gap-2.5 px-5 h-16 border-b border-[#EFE6CC] shrink-0">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#221D0F] text-[#FFC629] font-bold text-sm shadow-md shadow-[#221D0F]/10">
          R
        </div>
        <div class="leading-tight">
          <p class="text-sm font-bold text-[#221D0F]">RUMA</p>
          <p class="text-[11px] text-[#8A8270]">Bảng điều khiển quản lý</p>
        </div>
        <button type="button" (click)="mobileOpen.set(false)" class="ml-auto md:hidden text-[#8A8270] hover:text-[#221D0F]" aria-label="Đóng menu">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-[#FFC629] text-[#221D0F] shadow-sm"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            #rla="routerLinkActive"
            (click)="mobileOpen.set(false)"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6B6455]
                   transition-colors duration-200 hover:bg-[#FFF6DC] hover:text-[#221D0F]"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center" [class.text-[#221D0F]]="rla.isActive" [class.text-[#B8B096]]="!rla.isActive">
              <span [innerHTML]="icons[item.icon]"></span>
            </span>
            {{ item.label }}
            @if (rla.isActive) {
              <span class="ml-auto h-1.5 w-1.5 rounded-full bg-[#221D0F]"></span>
            }
          </a>
        }
      </nav>

      <div class="shrink-0 border-t border-[#EFE6CC] p-3">
        <a
          routerLink="/profile"
          routerLinkActive="bg-[#FFF6DC]"
          (click)="mobileOpen.set(false)"
          class="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-[#FFF6DC]"
        >
          @if (auth.currentUser()?.avatar_url) {
            <img
              [src]="auth.currentUser()?.avatar_url"
              alt=""
              class="h-9 w-9 shrink-0 rounded-full object-cover border border-[#EFE6CC]"
            />
          } @else {
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFE9AC] text-[#8A6200] font-semibold text-sm">
              {{ initials() }}
            </div>
          }
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-[#221D0F]">{{ auth.currentUser()?.full_name ?? 'Quản lý' }}</p>
            <p class="truncate text-xs text-[#8A8270]">Quản lý</p>
          </div>
          <svg class="h-4 w-4 shrink-0 text-[#B8B096]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <button
          type="button"
          (click)="onLogout()"
          [disabled]="loggingOut()"
          class="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#8A8270]
                 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="flex h-5 w-5 shrink-0 items-center justify-center">
            @if (loggingOut()) {
              <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            } @else {
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            }
          </span>
          Đăng xuất
        </button>
      </div>
    </aside>
  `,
})
export class ManagerSidebar {
  auth = inject(AuthService);
  private router = inject(Router);

  mobileOpen = signal(false);
  loggingOut = signal(false);
  icons = SIDEBAR_ICONS;

  readonly navItems: NavItem[] = [
    { label: 'Tổng quan', route: '/dashboard', icon: 'home' },
    { label: 'Phòng', route: '/rooms', icon: 'door' },
    { label: 'Người thuê', route: '/tenants', icon: 'users' },
    { label: 'Hợp đồng', route: '/contracts', icon: 'file' },
    { label: 'Hóa đơn', route: '/invoices', icon: 'invoice' },
  ];

  initials = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  });

  async onLogout() {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    try {
      await this.auth.logout();
    } finally {
      this.loggingOut.set(false);
      this.router.navigate(['/login']);
    }
  }
}