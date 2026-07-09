import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  resource,
  signal,
  ElementRef,
  viewChild,
  afterNextRender
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { UiInput } from '../../../shared/ui/input/input';
import { RoomsService } from '../../../core/services/rooms.service';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';
import { ToastService } from '../../../shared/ui/toast/toast';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [UiInput, RouterLink, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      <!-- Route này chỉ manager mới truy cập được (managerGuard) -->
      <app-manager-sidebar />

      <!-- Ảnh nền mờ chìm -->
      <div
        class="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-[0.05]"
        style="background-image: url('/dashboard-bg.jpg');"
      ></div>
      <div class="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-[#FBF7ED]/60 via-[#FBF7ED]/85 to-[#FBF7ED]"></div>

      <!-- Nền gradient động -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          #blob1
          class="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-linear-to-br from-[#FFC629]/35 to-[#FFE29A]/20 blur-3xl"
        ></div>
        <div
          #blob2
          class="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-[#FFD764]/25 to-[#FFC629]/15 blur-3xl"
        ></div>
      </div>

      <div class="relative md:pl-64">
        <div class="max-w-4xl mx-auto p-6 md:p-10">
          
          <!-- Header -->
          <div #hero class="mb-8 opacity-0">
            <a routerLink="/rooms" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách
            </a>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-[#221D0F]">
              {{ isEdit() ? 'Cập nhật phòng' : 'Tạo phòng mới' }}
            </h1>
            <p class="mt-2 text-[#8A8270]">
              {{ isEdit() ? 'Chỉnh sửa thông tin cơ bản và biểu phí của phòng hiện tại.' : 'Thiết lập thông tin cho phòng mới để bắt đầu cho thuê.' }}
            </p>
          </div>

          <!-- Form Card -->
          <div #formCard class="relative overflow-hidden rounded-3xl border border-[#EFE6CC] bg-white p-6 md:p-8 shadow-[0_2px_14px_rgba(34,29,15,0.05)] opacity-0">
            <!-- Vòng tròn trang trí góc Card -->
            <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFC629]/10 blur-2xl pointer-events-none"></div>

            <form (submit)="onSubmit($event)">
              
              <!-- Khối 1: Thông tin cơ bản -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Thông tin cơ bản</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ui-input class="block w-full" label="Mã phòng (*)" [(value)]="code" />
                  <ui-input class="block w-full" label="Tên phòng (tuỳ chọn)" [(value)]="name" />
                  <ui-input class="block w-full md:col-span-2" label="Sức chứa tối đa (người)" type="number" [(value)]="capacity" />
                </div>
              </div>

              <!-- Đường phân cách -->
              <hr class="border-[#F1EBD8] my-6" />

              <!-- Khối 2: Biểu phí -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Biểu phí dịch vụ</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ui-input class="block w-full" label="Giá thuê / tháng (₫)" type="number" [(value)]="monthlyRent" />
                  <ui-input class="block w-full" label="Phí quản lý / người (₫)" type="number" [(value)]="managementFee" />
                  <ui-input class="block w-full" label="Giá điện / kWh (₫)" type="number" [(value)]="priceElectricity" />
                  <ui-input class="block w-full" label="Giá nước / khối (₫)" type="number" [(value)]="priceWater" />
                </div>
              </div>

              <!-- Đường phân cách -->
              <hr class="border-[#F1EBD8] my-6" />

              <!-- Khối 3: Ghi chú -->
              <div class="mb-8">
                <h3 class="text-base font-bold text-[#221D0F] mb-4">Khác</h3>
                <ui-input class="block w-full" label="Ghi chú thêm" [(value)]="note" />
              </div>

              <!-- Buttons -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  [disabled]="saving()"
                  class="flex items-center justify-center gap-2 rounded-full bg-[#FFC629] px-8 py-3 text-sm font-bold text-[#221D0F] shadow-sm transition hover:bg-[#FFD764] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  @if (saving()) {
                    <svg class="h-4 w-4 animate-spin text-[#221D0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  } @else {
                    {{ isEdit() ? 'Lưu thay đổi' : 'Hoàn tất tạo phòng' }}
                  }
                </button>
                <button
                  type="button"
                  (click)="router.navigate(['/rooms'])"
                  [disabled]="saving()"
                  class="rounded-full bg-[#F1EBD8] px-6 py-3 text-sm font-semibold text-[#6B6455] transition hover:bg-[#E9E4D6] hover:text-[#221D0F] disabled:opacity-60"
                >
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
export class RoomFormPage {
  /** Có giá trị khi vào route /rooms/:id/edit, rỗng khi /rooms/new */
  id = input<string>('');

  router = inject(Router);
  private roomsService = inject(RoomsService);
  private toast = inject(ToastService);

  isEdit = () => !!this.id();

  code = signal('');
  name = signal('');
  capacity = signal('1');
  monthlyRent = signal('0');
  priceElectricity = signal('0');
  priceWater = signal('0');
  managementFee = signal('0');
  note = signal('');

  saving = signal(false);

  existingRoom = resource({
    params: () => (this.id() ? { id: this.id() } : undefined),
    loader: ({ params }) => this.roomsService.getById(params!.id),
  });

  // Refs cho GSAP
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

      if (blob1El && blob2El) {
        tl.fromTo(
          [blob1El, blob2El],
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
        );
      }

      if (heroEl) tl.fromTo(heroEl, { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.4');
      if (formCardEl) tl.fromTo(formCardEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');

      // Anim loop lơ lửng cho blobs
      if (blob1El) gsap.to(blob1El, { x: 20, y: 15, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
      if (blob2El) gsap.to(blob2El, { x: -15, y: -20, duration: 7, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
  }

  private fillFormEffect = effect(() => {
    const r = this.existingRoom.value();
    if (!r) return;
    this.code.set(r.code);
    this.name.set(r.name ?? '');
    this.capacity.set(String(r.capacity));
    this.monthlyRent.set(String(r.monthly_rent));
    this.priceElectricity.set(String(r.price_electricity));
    this.priceWater.set(String(r.price_water));
    this.managementFee.set(String(r.management_fee_per_person));
    this.note.set(r.note ?? '');
  });

  async onSubmit(event: Event) {
    event.preventDefault();
    this.saving.set(true);
    
    const payload = {
      code: this.code(),
      name: this.name() || undefined,
      capacity: Number(this.capacity()),
      monthly_rent: Number(this.monthlyRent()),
      price_electricity: Number(this.priceElectricity()),
      price_water: Number(this.priceWater()),
      management_fee_per_person: Number(this.managementFee()),
      note: this.note() || undefined,
    };
    
    try {
      if (this.isEdit()) {
        await this.roomsService.update(this.id(), payload);
      } else {
        await this.roomsService.create(payload);
      }
      this.roomsService.roomsResource.reload();
      this.toast.success(this.isEdit() ? 'Cập nhật phòng thành công.' : 'Tạo phòng thành công.');
      this.router.navigate(['/rooms']);
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      this.saving.set(false);
    }
  }
}