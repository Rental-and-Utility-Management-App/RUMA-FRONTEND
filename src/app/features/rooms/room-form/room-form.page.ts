import { ChangeDetectionStrategy, Component, effect, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { RoomsService } from '../../../core/services/rooms.service';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [UiButton, UiInput, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-lg mx-auto p-6">
      <a routerLink="/rooms" class="text-sm text-slate-500 hover:text-primary mb-4 inline-block">
        &larr; Danh sách phòng
      </a>

      <h1 class="text-xl font-semibold text-slate-900 mb-6">
        {{ isEdit() ? 'Sửa phòng' : 'Tạo phòng mới' }}
      </h1>

      <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
        <ui-input label="Mã phòng" [(value)]="code" />
        <ui-input label="Tên phòng (tuỳ chọn)" [(value)]="name" />
        <ui-input label="Sức chứa" type="number" [(value)]="capacity" />
        <ui-input label="Giá thuê / tháng" type="number" [(value)]="monthlyRent" />
        <ui-input label="Giá điện / kWh" type="number" [(value)]="priceElectricity" />
        <ui-input label="Giá nước / khối" type="number" [(value)]="priceWater" />
        <ui-input label="Phí quản lý / người" type="number" [(value)]="managementFee" />
        <ui-input label="Ghi chú" [(value)]="note" />

        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }

        <div class="flex gap-2 mt-2">
          <ui-button type="submit" [loading]="saving()">
            {{ isEdit() ? 'Lưu thay đổi' : 'Tạo phòng' }}
          </ui-button>
          <ui-button variant="secondary" (click)="router.navigate(['/rooms'])">Hủy</ui-button>
        </div>
      </form>
    </div>
  `,
})
export class RoomFormPage {
  /** Có giá trị khi vào route /rooms/:id/edit, rỗng khi /rooms/new */
  id = input<string>('');

  router = inject(Router);
  private roomsService = inject(RoomsService);

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
  errorMessage = signal('');

  existingRoom = resource({
    params: () => (this.id() ? { id: this.id() } : undefined),
    loader: ({ params }) => this.roomsService.getById(params!.id),
  });

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
    this.errorMessage.set('');
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
      this.router.navigate(['/rooms']);
    } catch (err: any) {
      this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Có lỗi xảy ra, thử lại.');
    } finally {
      this.saving.set(false);
    }
  }
}
