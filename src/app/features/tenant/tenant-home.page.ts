import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TenantSidebar } from '../components/sidebars/tenant-sidebar';

interface QuickLink {
  label: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-tenant-home',
  standalone: true,
  imports: [RouterLink, TenantSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f7f4ea] text-[#221d0f]">
      <app-tenant-sidebar />

      <div class="md:pl-64">
        <div class="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-10">
          <section class="overflow-hidden rounded-4xl border border-[#efe6cc] bg-white/90 shadow-[0_18px_60px_rgba(34,29,15,0.08)]">
            <div class="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
              <div class="max-w-2xl">
                <p class="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#b8860b]">
                  {{ today() }}
                </p>
                <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
                  Chào {{ auth.currentUser()?.full_name ?? 'bạn' }},
                  <span class="text-[#b8860b]">đã đến lúc xem lại căn hộ của bạn</span>
                </h1>
                <p class="mt-3 text-sm leading-7 text-[#6b6455] md:text-base">
                  Đây là trung tâm nhanh cho các thông tin quan trọng như phòng ở, hợp đồng, hóa đơn và thanh toán.
                </p>
              </div>

              <div class="rounded-2xl border border-[#efe6cc] bg-[#fff8e5] px-4 py-3 text-sm text-[#6b6455] shadow-sm">
                <p class="font-semibold text-[#221d0f]">Tài khoản</p>
                <p class="mt-1">Vai trò: Người thuê</p>
              </div>
            </div>
          </section>

          <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            @for (link of quickLinks; track link.route) {
              <a
                [routerLink]="link.route"
                class="group rounded-3xl border border-[#efe6cc] bg-white p-5 shadow-[0_10px_30px_rgba(34,29,15,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#ffc629] hover:shadow-[0_16px_40px_rgba(255,198,41,0.18)]"
              >
                <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff2c8] text-xl">
                  {{ link.icon }}
                </div>
                <h2 class="text-lg font-semibold text-[#221d0f]">{{ link.label }}</h2>
                <p class="mt-2 text-sm leading-6 text-[#6b6455]">{{ link.description }}</p>
              </a>
            }
          </section>

          <section class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div class="rounded-[28px] border border-[#efe6cc] bg-[#221d0f] p-6 text-white shadow-[0_16px_45px_rgba(34,29,15,0.14)]">
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-[#ffc629]">Mẹo hôm nay</p>
              <h3 class="mt-3 text-2xl font-semibold">Giữ mọi việc rõ ràng và đúng hạn</h3>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Theo dõi hợp đồng, hóa đơn và lịch thanh toán từ một nơi để luôn chủ động hơn trong việc thuê phòng.
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/contracts" class="rounded-full bg-[#ffc629] px-4 py-2 text-sm font-semibold text-[#221d0f] transition hover:bg-[#ffd764]">
                  Xem hợp đồng
                </a>
                <a routerLink="/invoices" class="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Xem hóa đơn
                </a>
              </div>
            </div>

            <div class="rounded-[28px] border border-[#efe6cc] bg-white p-6 shadow-[0_10px_30px_rgba(34,29,15,0.04)]">
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-[#b8860b]">Thông tin nhanh</p>
              <div class="mt-4 space-y-4">
                <div class="rounded-2xl bg-[#f7f4ea] p-4">
                  <p class="text-sm font-semibold text-[#221d0f]">Phòng của bạn</p>
                  <p class="mt-1 text-sm text-[#6b6455]">Xem chi tiết phòng và thông tin liên quan.</p>
                </div>
                <div class="rounded-2xl bg-[#f7f4ea] p-4">
                  <p class="text-sm font-semibold text-[#221d0f]">Thanh toán</p>
                  <p class="mt-1 text-sm text-[#6b6455]">Kiểm tra trạng thái thanh toán đã hoàn tất.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class TenantHomePage {
  readonly auth = inject(AuthService);

  readonly quickLinks: QuickLink[] = [
    { label: 'Phòng của tôi', description: 'Xem thông tin phòng và địa điểm thuê', route: '/rooms', icon: '🏠' },
    { label: 'Hợp đồng', description: 'Kiểm tra điều khoản và thời hạn hợp đồng', route: '/contracts', icon: '📄' },
    { label: 'Hóa đơn', description: 'Theo dõi hóa đơn và trạng thái thanh toán', route: '/invoices', icon: '🧾' },
    { label: 'Hồ sơ', description: 'Cập nhật thông tin cá nhân và mật khẩu', route: '/profile', icon: '👤' },
  ];

  readonly today = computed(() =>
    new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  );
}
