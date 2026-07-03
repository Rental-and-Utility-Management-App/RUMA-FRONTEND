import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { UiButton } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [UiButton, UiInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4"
      (click)="onBackgroundClick()"
    >
      <!-- Nền 1 -->
      <div
        #bg1
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/login-bg-1.jpg')"
      ></div>

      <!-- Nền 2 -->
      <div
        #bg2
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/login-bg-2.jpg')"
      ></div>

      <!-- Overlay tối cho dễ đọc -->
      <div class="absolute inset-0 bg-black/40"></div>

      <!-- Gợi ý nhấn màn hình -->
      @if (!transitioned()) {
        <div
          #hint
          class="pointer-events-none absolute bottom-10 inset-x-0 text-center text-white text-sm font-medium tracking-wide"
        >
          Nhấn vào màn hình để tiếp tục
        </div>
      }

      <!-- Card đăng nhập -->
      <div
        #card
        class="relative z-10 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl border border-white/20"
        [class.pointer-events-none]="!transitioned()"
        (click)="$event.stopPropagation()"
      >
        <h1 class="stagger-item text-xl font-semibold text-white mb-1">Đăng nhập RUMA</h1>
        <p class="stagger-item text-sm text-white/70 mb-6">Quản lý phòng trọ</p>

        <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
          <div class="stagger-item">
            <ui-input label="Số điện thoại" type="tel" [(value)]="phone" />
          </div>
          <div class="stagger-item">
            <ui-input label="Mật khẩu" type="password" [(value)]="password" />
          </div>

          @if (errorMessage()) {
            <p class="stagger-item text-sm text-red-300">{{ errorMessage() }}</p>
          }

          <div class="stagger-item">
            <ui-button type="submit" [loading]="loading()" class="mt-2 w-full">
              Đăng nhập
            </ui-button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  private bg1 = viewChild.required<ElementRef<HTMLDivElement>>('bg1');
  private bg2 = viewChild.required<ElementRef<HTMLDivElement>>('bg2');
  private card = viewChild.required<ElementRef<HTMLDivElement>>('card');
  private hint = viewChild<ElementRef<HTMLDivElement>>('hint');

  phone = signal('');
  password = signal('');
  loading = signal(false);
  errorMessage = signal('');
  transitioned = signal(false);

  private hintTween?: gsap.core.Tween;

  ngAfterViewInit() {
    gsap.set(this.bg2().nativeElement, { opacity: 0 });
    gsap.set(this.card().nativeElement, { opacity: 0, y: 24 });

    // Ken Burns nhẹ cho ảnh nền đầu tiên
    gsap.to(this.bg1().nativeElement, {
      scale: 1.08,
      duration: 14,
      ease: 'none',
    });

    // Hint nhấp nháy mời bấm
    const hintEl = this.hint()?.nativeElement;
    if (hintEl) {
      this.hintTween = gsap.to(hintEl, {
        opacity: 0.35,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  onBackgroundClick() {
    if (this.transitioned()) return;
    this.transitioned.set(true);
    this.hintTween?.kill();

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.to(this.hint()?.nativeElement ?? [], { opacity: 0, y: -8, duration: 0.4 }, 0)
      .to(this.bg1().nativeElement, { opacity: 0, scale: 1.15, duration: 1.1 }, 0)
      .fromTo(
        this.bg2().nativeElement,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1.1 },
        0
      )
      .to(this.card().nativeElement, { opacity: 1, y: 0, duration: 0.7 }, 0.5)
      .from(
        this.card().nativeElement.querySelectorAll('.stagger-item'),
        { opacity: 0, y: 12, duration: 0.45, stagger: 0.08 },
        0.7
      );
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const user = await this.auth.login(this.phone(), this.password());
      this.router.navigate([user.role === 'manager' ? '/dashboard' : '/rooms']);
    } catch (err: any) {
      this.errorMessage.set(
        err?.error?.message ?? err?.message ?? 'Đăng nhập thất bại, vui lòng thử lại.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}