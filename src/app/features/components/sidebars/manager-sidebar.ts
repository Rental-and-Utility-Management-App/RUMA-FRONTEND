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
             bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-primary hover:border-primary/40"
      aria-label="Mở menu"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    @if (mobileOpen()) {
      <div class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" (click)="mobileOpen.set(false)"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/70 bg-white/90
             backdrop-blur-xl transition-transform duration-300 ease-out md:translate-x-0"
      [class.translate-x-0]="mobileOpen()"
      [class.-translate-x-full]="!mobileOpen()"
    >
      <div class="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200/70 shrink-0">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-indigo-500 text-white font-bold text-sm shadow-md shadow-primary/25">
          R
        </div>
        <div class="leading-tight">
          <p class="text-sm font-bold text-slate-900">RUMA</p>
          <p class="text-[11px] text-slate-400">Bảng điều khiển quản lý</p>
        </div>
        <button type="button" (click)="mobileOpen.set(false)" class="ml-auto md:hidden text-slate-400 hover:text-slate-700" aria-label="Đóng menu">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary/10 text-primary"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            #rla="routerLinkActive"
            (click)="mobileOpen.set(false)"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600
                   transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center" [class.text-primary]="rla.isActive" [class.text-slate-400]="!rla.isActive">
              <span [innerHTML]="icons[item.icon]"></span>
            </span>
            {{ item.label }}
            @if (rla.isActive) {
              <span class="ml-auto h-1.5 w-1.5 rounded-full bg-primary"></span>
            }
          </a>
        }
      </nav>

      <div class="shrink-0 border-t border-slate-200/70 p-3">
        <div class="flex items-center gap-3 rounded-xl px-2 py-2">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold text-sm">
            {{ initials() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-900">{{ auth.currentUser()?.full_name ?? 'Quản lý' }}</p>
            <p class="truncate text-xs text-slate-400">Quản lý</p>
          </div>
        </div>

        <button
          type="button"
          (click)="onLogout()"
          [disabled]="loggingOut()"
          class="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500
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
    { label: 'Tenant', route: '/tenants', icon: 'users' },
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