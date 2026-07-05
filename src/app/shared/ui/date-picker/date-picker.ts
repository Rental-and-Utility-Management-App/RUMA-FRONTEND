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
 * LƯU Ý QUAN TRỌNG về altInput: khi bật `altInput: true`, flatpickr set
 * input gốc (#inputEl) thành `type="hidden"` và TẠO MỚI một <input> khác
 * chèn cạnh nó để hiển thị/thao tác. Input mới này KHÔNG kế thừa `class`
 * của input gốc — nó chỉ nhận đúng những gì khai báo trong `altInputClass`.
 * Vì vậy toàn bộ class Tailwind style phải được truyền qua `altInputClass`,
 * nếu không ô hiển thị sẽ bị mất style (chỉ còn input trần mặc định).
 *
 * Popup lịch được flatpickr append trực tiếp vào <body>, nằm ngoài phạm vi
 * ViewEncapsulation của component này -> style + animation cho popup phải
 * xử lý qua: (1) class `.ui-date-picker-calendar` gắn ở onReady để CSS global
 * scope đúng, (2) GSAP chạy trong onOpen/onClose vì không thể dùng Angular
 * animation hay CSS transition scoped bình thường.
 */
const INPUT_CLASS =
  'w-full rounded-xl border border-[#D8D2C2] bg-white px-4 py-2.5 text-sm text-[#221D0F] focus:outline-none focus:ring-2 focus:ring-[#FFC629] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

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
        [class]="INPUT_CLASS"
      />
    </div>
  `,
})
export class UiDatePicker implements OnDestroy {
  protected readonly INPUT_CLASS = INPUT_CLASS;

  label = input<string>('');
  placeholder = input<string>('dd/mm/yyyy');
  disabled = input<boolean>(false);
  minDate = input<string>(''); // ISO yyyy-MM-dd, tùy chọn

  // Giá trị thật, ISO yyyy-MM-dd — tương thích ngược với chỗ đang dùng startDate/endDate signal.
  value = model<string>('');

  private inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  private fp: ReturnType<typeof flatpickr> | null = null;

  constructor() {
    afterNextRender(() => {
      this.fp = flatpickr(this.inputEl().nativeElement, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altInputClass: INPUT_CLASS,
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
          gsap.to(instance.calendarContainer, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.22,
            ease: 'power2.out',
          });
        },
        onClose: (_dates, _str, instance) => {
          // KHÔNG gọi instance.open()/close() lại — điều đó sẽ trigger toàn bộ
          // logic mở thật (tính lại vị trí, bắn lại onOpen), gây giật/nhấp nháy.
          // Thay vào đó tự giữ popup hiển thị bằng đúng class + display mà CSS
          // của flatpickr dùng để control visibility ('.flatpickr-calendar.open'),
          // rồi tự dọn lại sau khi GSAP tween xong — không đụng đến state nội bộ
          // (isOpen) của flatpickr nên không re-trigger onOpen/onClose.
          const el = instance.calendarContainer;
          el.classList.add('open');
          el.style.display = 'block';
          gsap.to(el, {
            opacity: 0,
            y: -8,
            scale: 0.96,
            duration: 0.16,
            ease: 'power2.in',
            onComplete: () => {
              el.classList.remove('open');
              el.style.display = '';
              // Reset về trạng thái ẩn sẵn cho lần mở kế tiếp (tránh chớp opacity:1
              // một khung hình trước khi onOpen tween chạy lại).
              gsap.set(el, { opacity: 0, y: -8, scale: 0.96 });
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

    // Đồng bộ `disabled`: flatpickr chỉ copy giá trị này MỘT LẦN lúc tạo altInput,
    // nên nếu binding [disabled] đổi giá trị sau đó, phải tự set lại tay ở cả
    // input gốc (đã bị ẩn) lẫn altInput (input thật hiển thị cho người dùng).
    effect(() => {
      const d = this.disabled();
      const instance = this.fp as any;
      if (instance?.altInput) instance.altInput.disabled = d;
      if (instance?.input) instance.input.disabled = d;
    });

    // Đồng bộ `minDate`: cũng chỉ được đọc 1 lần lúc khởi tạo, nếu cần đổi động
    // (vd sau khi load dữ liệu ngày bắt đầu hợp đồng) phải set lại qua API của flatpickr.
    effect(() => {
      const min = this.minDate();
      const instance = this.fp as any;
      if (instance) instance.set('minDate', min || null);
    });
  }

  ngOnDestroy() {
    (this.fp as any)?.destroy();
  }
}