import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  model,
  viewChild
} from '@angular/core';
import flatpickr from 'flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn.js';
import gsap from 'gsap';

/**
 * Ô chọn ngày dùng flatpickr, thay cho <input type="date"> gốc của trình duyệt.
 *
 * Lý do cần component này: <input type="date"> native luôn hiển thị theo
 * locale của trình duyệt/hệ điều hành người dùng, KHÔNG thể ép định dạng
 * bằng code. flatpickr cho phép tách 2 giá trị:
 *  - altFormat 'd/m/Y'  -> cái người dùng NHÌN THẤY (dd/mm/yyyy, cố định).
 *  - dateFormat 'Y-m-d' -> giá trị THẬT SỰ lưu vào `value` (ISO yyyy-MM-dd),
 *    giữ nguyên format cũ để không phải sửa lại phần gửi API.
 *
 * Popup lịch được flatpickr append trực tiếp vào <body>, nằm ngoài phạm vi
 * ViewEncapsulation của component này -> style + animation cho popup phải
 * xử lý qua: (1) class `.ui-date-picker-calendar` gắn ở onReady để CSS global
 * scope đúng, (2) GSAP chạy trong onOpen/onClose vì không thể dùng Angular
 * animation hay CSS transition scoped bình thường.
 */
@Component({
  selector: 'ui-date-picker',
  standalone: true,
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label class="text-sm text-[#8A8270]">{{ label() }}</label>
      }
      <input
        #inputEl
        type="text"
        [placeholder]="placeholder()"
        readonly
        [disabled]="disabled()"
        class="w-full rounded-xl border border-[#D8D2C2] bg-white px-4 py-2.5 text-sm text-[#221D0F] focus:outline-none focus:ring-2 focus:ring-[#FFC629] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  `,
})
export class UiDatePicker implements OnDestroy {
  label = input<string>('');
  placeholder = input<string>('dd/mm/yyyy');
  disabled = input<boolean>(false);
  minDate = input<string>(''); // ISO yyyy-MM-dd, tùy chọn

  // Giá trị thật, ISO yyyy-MM-dd — tương thích ngược với chỗ đang dùng startDate/endDate signal.
  value = model<string>('');

  private inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  private fp: ReturnType<typeof flatpickr> | null = null;

  // Chặn flatpickr đóng popup ngay lập tức để GSAP kịp chạy hiệu ứng fade-out.
  private closing = false;

  constructor() {
    afterNextRender(() => {
      this.fp = flatpickr(this.inputEl().nativeElement, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd/m/Y',
        locale: Vietnamese,
        defaultDate: this.value() || undefined,
        minDate: this.minDate() || undefined,
        onChange: (_dates, dateStr) => {
          this.value.set(dateStr);
        },
        onReady: (_dates, _str, instance) => {
          // Gắn class riêng để CSS global chỉ override đúng popup của component
          // này, không ảnh hưởng flatpickr instance khác nếu sau này dùng thêm nơi khác.
          instance.calendarContainer.classList.add('ui-date-picker-calendar');
          // Set trạng thái ban đầu để tránh "chớp" 1 khung hình style mặc định
          // trước khi GSAP kịp chạy ở lần mở đầu tiên.
          gsap.set(instance.calendarContainer, { opacity: 0, y: -8, scale: 0.96 });
        },
        onOpen: (_dates, _str, instance) => {
          this.closing = false;
          gsap.to(instance.calendarContainer, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.22,
            ease: 'power2.out',
          });
        },
        onClose: (_dates, _str, instance) => {
          // flatpickr ẩn popup ngay khi onClose chạy xong (đồng bộ) nên phải
          // tự "giữ" popup lại bằng open() rồi để GSAP tween xong mới đóng thật.
          if (this.closing) return; // lần gọi lại sau khi tween xong, cho đóng luôn
          this.closing = true;

          instance.open(); // huỷ lệnh đóng của flatpickr, giữ popup hiển thị
          gsap.to(instance.calendarContainer, {
            opacity: 0,
            y: -8,
            scale: 0.96,
            duration: 0.16,
            ease: 'power2.in',
            onComplete: () => {
              instance.close(); // đóng thật, lần này onClose sẽ thấy this.closing=true và bỏ qua
            },
          });
        },
      });
    });

    // Đồng bộ ngược: nếu value bị set từ bên ngoài (vd reset form), cập nhật lại lịch.
    effect(() => {
      const v = this.value();
      const instance = this.fp as any;
      if (instance && v !== instance.input.value) {
        instance.setDate(v || null, false);
      }
    });
  }

  ngOnDestroy() {
    (this.fp as any)?.destroy();
  }
}