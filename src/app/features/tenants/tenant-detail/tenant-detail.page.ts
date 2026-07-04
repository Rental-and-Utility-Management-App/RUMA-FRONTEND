import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
  signal,
  computed,
  ElementRef,
  viewChild,
  afterNextRender,
  effect
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiBadge } from '../../../shared/ui/badge/badge';
import { UsersService } from '../../../core/services/users.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { Room } from '../../../core/models';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [RouterLink, UiBadge, TenantSidebar, ManagerSidebar],
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
        <div class="max-w-3xl mx-auto p-6 md:p-10">

          <div #hero class="mb-8 opacity-0">
            <a routerLink="/tenants" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Danh sách người thuê
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Hồ sơ tài khoản</h1>
          </div>

          <!--
            QUAN TRỌNG: chỉ hiện màn "Đang tải dữ liệu..." khi CHƯA từng có data (lần load đầu).
            Nếu chỉ check tenant.isLoading(), thì mỗi lần gọi tenant.reload() (sau khi gán phòng,
            khoá tài khoản...) khối @else if bên dưới sẽ bị unmount rồi tạo lại DOM mới, khiến
            detailCard mất animation (do cờ cardAnimated chỉ chạy 1 lần) và bị kẹt ở opacity-0
            -> nhìn như "trắng trang". Dùng !tenant.hasValue() để giữ nguyên DOM cũ trong lúc
            reload ngầm phía sau.
          -->
          @if (tenant.isLoading() && !tenant.hasValue()) {
            <div class="flex justify-center py-10">
              <p class="text-sm text-[#8A8270] animate-pulse">Đang tải dữ liệu...</p>
            </div>
          } @else if (tenant.error()) {
            <div class="flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
              <p>Không thể tải dữ liệu người thuê. Vui lòng thử lại.</p>
            </div>
          } @else if (tenant.value(); as t) {
            <div #detailCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] mb-6 opacity-0">
              <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#F1EBD8]">
                <div class="flex items-center gap-4">
                  <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBF7ED] text-2xl font-bold text-[#8A6200] border border-[#EFE6CC]">
                    {{ t.full_name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-[#221D0F]">{{ t.full_name }}</h2>
                    <p class="text-sm text-[#8A8270] mt-1">{{ t.phone }}</p>
                  </div>
                </div>
                <ui-badge [colorClass]="t.is_active ? 'bg-[#E5F5E9] text-[#166534]' : 'bg-[#F1EBD8] text-[#6B6455]'">
                  {{ t.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
                </ui-badge>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Email đăng ký</span>
                  <span class="font-bold text-[#221D0F]">{{ t.email || '—' }}</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-sm text-[#8A8270]">Phòng hiện tại đang ở</span>
                  <span class="font-bold text-[#221D0F]">
                    @if (!t.room_id) {
                      Chưa gán phòng
                    } @else if (rooms.isLoading() && !rooms.hasValue()) {
                      Đang tải...
                    } @else if (currentRoom(); as r) {
                      {{ r.name }}
                    } @else {
                      {{ t.room_id }}
                    }
                  </span>
                </div>
              </div>

              <!-- Khu vực Hành động -->
              <div class="rounded-2xl bg-[#FBF7ED] p-5 border border-[#F1EBD8]">
                <h3 class="text-sm font-bold text-[#221D0F] mb-4">Quản lý không gian</h3>

                @if (!t.room_id) {
                  <div class="flex flex-col sm:flex-row items-end gap-3">
                    <div class="w-full sm:flex-1 flex flex-col gap-1.5">
                      <label class="text-sm text-[#8A8270]">Chọn phòng còn trống</label>
                      <select
                        [value]="roomIdInput()"
                        (change)="onRoomSelect($event)"
                        [disabled]="rooms.isLoading()"
                        class="w-full rounded-xl border border-[#D8D2C2] bg-white px-4 py-2.5 text-sm text-[#221D0F] focus:outline-none focus:ring-2 focus:ring-[#FFC629] disabled:opacity-60"
                      >
                        <option value="" disabled selected>
                          {{ rooms.isLoading() ? 'Đang tải danh sách phòng...' : '-- Chọn phòng --' }}
                        </option>
                        @for (r of availableRooms(); track r.id) {
                          <option [value]="r.id">
                            {{ r.name }} (Còn {{ r.capacity - r.occupants }}/{{ r.capacity }} chỗ)
                          </option>
                        }
                        @if (!rooms.isLoading() && availableRooms().length === 0) {
                          <option disabled>Không còn phòng trống</option>
                        }
                      </select>
                    </div>
                    <button (click)="assignRoom()" [disabled]="assigning() || !roomIdInput()" class="w-full sm:w-auto flex justify-center items-center rounded-xl bg-[#221D0F] px-6 py-2.5 text-sm font-semibold text-[#FFC629] transition hover:bg-black disabled:opacity-70">
                      {{ assigning() ? 'Đang gán...' : 'Gán phòng' }}
                    </button>
                  </div>
                } @else {
                  <button (click)="unassignRoom()" [disabled]="unassigning()" class="rounded-full bg-white border border-[#D8D2C2] px-6 py-2.5 text-sm font-semibold text-[#6B6455] transition hover:bg-[#F1EBD8] hover:text-[#221D0F] disabled:opacity-70">
                    {{ unassigning() ? 'Đang xử lý...' : 'Thu hồi quyền sử dụng phòng' }}
                  </button>
                }
              </div>

              <!-- Khu vực bảo mật tài khoản -->
              <div class="mt-6 pt-6 border-t border-[#F1EBD8] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-[#221D0F]">Bảo mật tài khoản</p>
                  <p class="text-xs text-[#8A8270] mt-0.5">Khóa tài khoản để ngăn người này đăng nhập.</p>
                </div>

                <button
                  (click)="toggleActive()"
                  [disabled]="togglingActive()"
                  [class]="t.is_active
                    ? 'rounded-full bg-[#F4D9D2] px-6 py-2.5 text-sm font-semibold text-[#9A3412] transition hover:bg-[#F0C9BE]'
                    : 'rounded-full bg-[#FFC629] px-6 py-2.5 text-sm font-semibold text-[#221D0F] transition hover:bg-[#FFD764]'"
                >
                  @if (togglingActive()) {
                    Đang xử lý...
                  } @else {
                    {{ t.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
                  }
                </button>
              </div>

              @if (errorMessage()) {
                <div class="mt-6 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <p>{{ errorMessage() }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class TenantDetailPage {
  id = input.required<string>();

  auth = inject(AuthService);
  private usersService = inject(UsersService);
  private roomsService = inject(RoomsService);

  tenant = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.usersService.getById(params.id),
  });

  // RoomsService đã tự expose httpResource() sẵn, dùng lại luôn thay vì tạo resource riêng
  rooms = this.roomsService.roomsResource;

  private roomsList = computed<Room[]>(() => this.rooms.value()?.data ?? []);

  // Danh sách phòng còn slot trống (dùng cho dropdown gán phòng)
  availableRooms = computed(() =>
    this.roomsList().filter((r) => r.occupants < r.capacity)
  );

  // Phòng hiện tại của tenant (tra theo room_id trong danh sách đã tải)
  currentRoom = computed(() => {
    const roomId = this.tenant.value()?.room_id;
    if (!roomId) return null;
    return this.roomsList().find((r) => r.id === roomId) ?? null;
  });

  roomIdInput = signal('');
  assigning = signal(false);
  unassigning = signal(false);
  togglingActive = signal(false);
  errorMessage = signal('');

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private detailCard = viewChild<ElementRef<HTMLElement>>('detailCard');

  // Theo dõi chính element đã được animate, thay vì chỉ 1 boolean dùng chung mãi mãi.
  // Nhờ vậy nếu detailCard bị Angular huỷ và tạo lại (DOM node mới), effect vẫn nhận ra
  // đây là node "chưa từng animate" và chạy lại GSAP, tránh bug kẹt opacity-0.
  private animatedCardEl: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
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
      const card = this.detailCard()?.nativeElement;
      const hasValue = this.tenant.hasValue();

      if (card && hasValue && this.animatedCardEl !== card) {
        this.animatedCardEl = card;
        setTimeout(() => {
          gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
        }, 50);
      }

      if (!card) {
        // Card đã bị unmount (vd: chuyển sang trạng thái error/loading ban đầu) -> reset
        this.animatedCardEl = null;
      }
    });
  }

  onRoomSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.roomIdInput.set(value);
  }

  async assignRoom() {
    if (!this.roomIdInput()) return;
    this.errorMessage.set('');
    this.assigning.set(true);
    try {
      await this.usersService.assignRoom(this.id(), this.roomIdInput());
      this.tenant.reload();
      this.rooms.reload();
      this.roomIdInput.set('');
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Gán phòng thất bại.');
    } finally {
      this.assigning.set(false);
    }
  }

  async unassignRoom() {
    this.errorMessage.set('');
    this.unassigning.set(true);
    try {
      await this.usersService.unassignRoom(this.id());
      this.tenant.reload();
      this.rooms.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Trả phòng thất bại.');
    } finally {
      this.unassigning.set(false);
    }
  }

  async toggleActive() {
    const current = this.tenant.value();
    if (!current) return;
    this.errorMessage.set('');
    this.togglingActive.set(true);
    try {
      await this.usersService.update(this.id(), { is_active: !current.is_active });
      this.tenant.reload();
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Cập nhật trạng thái thất bại.');
    } finally {
      this.togglingActive.set(false);
    }
  }
}