import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  resource,
  ElementRef,
  viewChild,
  afterNextRender,
  effect
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiInput } from '../../../shared/ui/input/input';
import { ContractsService } from '../../../core/services/contracts.service';
import { RoomsService } from '../../../core/services/rooms.service';
import { UsersService } from '../../../core/services/users.service';
import { Room, User } from '../../../core/models';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [UiInput, RouterLink, TenantSidebar, ManagerSidebar],
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
              Quay lại danh sách
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">Khởi tạo hợp đồng</h1>
            <p class="mt-2 text-[#8A8270]">Ràng buộc pháp lý giữa quản lý và khách thuê kèm điều khoản tiền cọc phòng.</p>
          </div>

          <!-- Form Card -->
          <div #formCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0">
            <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

            <form (submit)="onSubmit($event)">

              <!-- Khối 1: Đối tượng liên kết -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Thông tin thực thể</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <!-- Dropdown chọn phòng -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm text-[#8A8270]">Phòng (*)</label>
                    <select
                      [value]="roomId()"
                      (change)="onRoomSelect($event)"
                      [disabled]="rooms.isLoading() && !rooms.hasValue()"
                      class="w-full rounded-xl border border-[#D8D2C2] bg-white px-4 py-2.5 text-sm text-[#221D0F] focus:outline-none focus:ring-2 focus:ring-[#FFC629] disabled:opacity-60"
                    >
                      <option value="" disabled selected>
                        {{ rooms.isLoading() && !rooms.hasValue() ? 'Đang tải danh sách phòng...' : '-- Chọn phòng còn trống --' }}
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
                    @if (rooms.error()) {
                      <p class="text-xs text-[#9A3412]">Không thể tải danh sách phòng.</p>
                    }
                  </div>

                  <!-- Danh sách chọn khách thuê (multi-select dạng checkbox) -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm text-[#8A8270]">
                      Khách thuê (*)
                      @if (selectedRoom(); as r) {
                        <span class="text-[#B8860B]"> — tối đa {{ r.capacity }} người</span>
                      }
                    </label>
                    <div class="w-full max-h-48 overflow-y-auto rounded-xl border border-[#D8D2C2] bg-white px-3 py-2 flex flex-col gap-1">
                      @if (users.isLoading() && !users.hasValue()) {
                        <p class="text-sm text-[#8A8270] px-1 py-2">Đang tải danh sách khách thuê...</p>
                      } @else if (users.error()) {
                        <p class="text-xs text-[#9A3412] px-1 py-2">Không thể tải danh sách khách thuê.</p>
                      } @else if (availableTenants().length === 0) {
                        <p class="text-sm text-[#8A8270] px-1 py-2">Không có khách thuê nào đang trống (chưa có phòng).</p>
                      } @else {
                        @for (u of availableTenants(); track u.id) {
                          <label
                            class="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-[#FBF7ED] transition"
                            [class.opacity-40]="isTenantDisabled(u.id)"
                          >
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded border-[#D8D2C2] text-[#FFC629] focus:ring-[#FFC629]"
                              [checked]="isTenantSelected(u.id)"
                              [disabled]="isTenantDisabled(u.id)"
                              (change)="toggleTenant(u.id)"
                            />
                            <span class="text-[#221D0F] font-medium">{{ u.full_name }}</span>
                            <span class="text-[#8A8270] text-xs">{{ u.phone }}</span>
                          </label>
                        }
                      }
                    </div>
                    @if (selectedTenantIds().length > 0) {
                      <p class="text-xs text-[#8A8270]">Đã chọn {{ selectedTenantIds().length }} người.</p>
                    }
                  </div>
                </div>
              </div>

              <hr class="border-[#F1EBD8] my-6" />

              <!-- Khối 2: Chi phí & Giá cọc -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Giá trị giao dịch</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ui-input class="block w-full" label="Giá thuê / tháng (₫) (*)" type="number" [(value)]="monthlyRent" />
                  <ui-input class="block w-full" label="Tổng tiền cọc cam kết (₫) (*)" type="number" [(value)]="depositAmount" />
                </div>
              </div>

              <hr class="border-[#F1EBD8] my-6" />

              <!-- Khối 3: Thời hạn & Ghi chú -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Hiệu lực & Cam kết khác</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ui-input class="block w-full" label="Ngày bắt đầu (*)" type="date" [(value)]="startDate" />
                  <ui-input class="block w-full" label="Ngày kết thúc dự kiến (*)" type="date" [(value)]="endDate" />
                  <ui-input class="block w-full md:col-span-2" label="Ghi chú điều khoản bổ sung (tùy chọn)" [(value)]="note" />
                </div>
              </div>

              <!-- Cảnh báo lỗi -->
              @if (errorMessage()) {
                <div class="mb-6 flex items-center gap-3 rounded-xl bg-[#F4D9D2] p-4 text-sm font-medium text-[#9A3412]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{{ errorMessage() }}</p>
                </div>
              }

              <!-- Submit Buttons -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button type="submit" [disabled]="saving() || !canSubmit()" class="flex items-center justify-center gap-2 rounded-full bg-[#FFC629] px-8 py-3 text-sm font-bold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764] disabled:opacity-60 disabled:cursor-not-allowed">
                  @if (saving()) {
                    <svg class="h-4 w-4 animate-spin text-[#221D0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu trữ...
                  } @else {
                    Ký kết hợp đồng
                  }
                </button>
                <button type="button" (click)="router.navigate(['/contracts'])" [disabled]="saving()" class="rounded-full bg-[#F1EBD8] px-6 py-3 text-sm font-semibold text-[#6B6455] transition hover:bg-[#E9E4D6] hover:text-[#221D0F] disabled:opacity-60">
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ContractFormPage {
  router = inject(Router);
  auth = inject(AuthService);
  private contractsService = inject(ContractsService);
  private roomsService = inject(RoomsService);
  private usersService = inject(UsersService);

  // Dùng lại resource phòng đã có sẵn ở RoomsService (giống pattern trong tenant-detail.ts).
  rooms = this.roomsService.roomsResource;

  // Resource riêng cho danh sách user trong trang này.
  // GIẢ ĐỊNH: UsersService có method `getAll()` trả về Promise<{ data: User[]; message: string; success: boolean }>,
  // tương tự cấu trúc response /rooms bạn đã gửi. Nếu UsersService của bạn dùng tên khác
  // (vd. list(), getAllUsers(), fetchTenants()...), đổi lại dòng loader bên dưới cho khớp.
  users = resource({
    loader: () => this.usersService.getAll(),
  });

  private roomsList = computed<Room[]>(() => this.rooms.value()?.data ?? []);
  private usersList = computed<User[]>(() => this.users.value()?.data ?? []);

  // Phòng còn slot trống để hiện trong dropdown.
  availableRooms = computed(() => this.roomsList().filter((r) => r.occupants < r.capacity));

  // Khách thuê CHƯA có phòng (room_id rỗng) -> đủ điều kiện được gán vào hợp đồng mới,
  // khớp với validate ở backend (CreateContract từ chối nếu tenant.RoomID != nil).
  availableTenants = computed(() =>
    this.usersList().filter((u) => u.role === 'tenant' && !u.room_id)
  );

  roomId = signal('');
  selectedTenantIds = signal<string[]>([]);
  monthlyRent = signal('0');
  depositAmount = signal('0');
  startDate = signal('');
  endDate = signal('');
  note = signal('');

  saving = signal(false);
  errorMessage = signal('');

  // Phòng đang được chọn (dùng để giới hạn số khách thuê theo capacity + gợi ý giá thuê).
  selectedRoom = computed(() => this.availableRooms().find((r) => r.id === this.roomId()) ?? null);

  private maxTenants = computed(() => this.selectedRoom()?.capacity ?? Infinity);

  canSubmit = computed(
    () =>
      !!this.roomId() &&
      this.selectedTenantIds().length > 0 &&
      !!this.startDate() &&
      !!this.endDate()
  );

  private blob1 = viewChild<ElementRef<HTMLElement>>('blob1');
  private blob2 = viewChild<ElementRef<HTMLElement>>('blob2');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private formCard = viewChild<ElementRef<HTMLElement>>('formCard');

  constructor() {
    afterNextRender(() => {
      const blob1El = this.blob1()?.nativeElement;
      const blob2El = this.blob2()?.nativeElement;
      const heroEl = this.hero()?.nativeElement;
      const formCardEl = this.formCard()?.nativeElement;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (blob1El && blob2El) tl.fromTo([blob1El, blob2El], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6 });
      if (heroEl) tl.fromTo(heroEl, { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.4');
      if (formCardEl) tl.fromTo(formCardEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');

      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    // Khi đổi phòng: tự gợi ý giá thuê theo phòng, và cắt bớt danh sách khách thuê
    // đã chọn nếu vượt quá capacity của phòng mới.
    effect(() => {
      const room = this.selectedRoom();
      if (!room) return;

      this.monthlyRent.set(String(room.monthly_rent));

      const max = room.capacity;
      const current = this.selectedTenantIds();
      if (current.length > max) {
        this.selectedTenantIds.set(current.slice(0, max));
      }
    });
  }

  onRoomSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.roomId.set(value);
  }

  isTenantSelected(id: string): boolean {
    return this.selectedTenantIds().includes(id);
  }

  isTenantDisabled(id: string): boolean {
    // Disable các checkbox chưa được chọn khi đã đạt capacity của phòng.
    return !this.isTenantSelected(id) && this.selectedTenantIds().length >= this.maxTenants();
  }

  toggleTenant(id: string) {
    const current = this.selectedTenantIds();
    if (current.includes(id)) {
      this.selectedTenantIds.set(current.filter((x) => x !== id));
    } else {
      if (current.length >= this.maxTenants()) return; // an toàn, phòng khi checkbox lỡ không bị disable kịp
      this.selectedTenantIds.set([...current, id]);
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.canSubmit()) return;

    this.errorMessage.set('');
    this.saving.set(true);
    try {
      await this.contractsService.create({
        room_id: this.roomId(),
        tenant_ids: this.selectedTenantIds(),
        monthly_rent: Number(this.monthlyRent()),
        deposit_amount: Number(this.depositAmount()),
        start_date: this.startDate(),
        end_date: this.endDate(),
        note: this.note() || undefined,
      });
      this.contractsService.contractsResource.reload();
      this.router.navigate(['/contracts']);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Tạo hợp đồng thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}