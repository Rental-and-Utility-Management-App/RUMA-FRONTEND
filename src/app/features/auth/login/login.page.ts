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
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 font-[Inter]"
      (click)="onBackgroundClick()"
      (mousemove)="onMouseMove($event)"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Nền 1 -->
      <div
        #bg1
        class="absolute -inset-4 bg-cover bg-center will-change-transform"
        style="background-image: url('/login-bg-1.jpg')"
      ></div>

      <!-- Nền 2 -->
      <div
        #bg2
        class="absolute -inset-4 bg-cover bg-center will-change-transform"
        style="background-image: url('/login-bg-2.jpg')"
      ></div>

      <!-- Vignette: tối 2 đầu để chữ dễ đọc, giữ dải sáng giữa như hoàng hôn -->
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,20,.6)_0%,rgba(10,8,20,.25)_35%,rgba(10,8,20,.35)_60%,rgba(10,8,20,.8)_100%)]"
      ></div>

      <!-- Ánh sáng ambient màu amber/tím lan tỏa quanh card -->
      <div
        #glow
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full pointer-events-none"
        style="background: radial-gradient(circle, rgba(245,166,35,0.16) 0%, rgba(168,85,247,0.10) 45%, transparent 70%);"
      ></div>

      <!-- Đèn thành phố trôi nhẹ -->
      <div #particlesLayer class="absolute inset-0 pointer-events-none overflow-hidden">
        @for (p of particles; track $index) {
          <span
            class="particle absolute rounded-full bg-amber-200 blur-[1px]"
            [style.left.%]="p.left"
            [style.top.%]="p.top"
            [style.width.px]="p.size"
            [style.height.px]="p.size"
            [style.opacity]="p.opacity"
            [style.box-shadow]="'0 0 ' + (p.size * 2) + 'px rgba(252,211,132,0.55)'"
          ></span>
        }
        @for (p of farParticles; track $index) {
          <span
            class="particle-far absolute rounded-full bg-fuchsia-100 blur-[2px]"
            [style.left.%]="p.left"
            [style.top.%]="p.top"
            [style.width.px]="p.size"
            [style.height.px]="p.size"
            [style.opacity]="p.opacity"
          ></span>
        }
      </div>

      <!-- Gợi ý nhấn màn hình -->
      @if (!transitioned()) {
        <div
          #hint
          class="pointer-events-none absolute bottom-10 inset-x-0 flex flex-col items-center gap-2"
        >
          <div class="relative w-8 h-8">
            <span
              #hintPing
              class="absolute inset-0 rounded-full border border-amber-200/70"
            ></span>
            <span class="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-amber-200"></span>
          </div>
          <span class="text-white/70 text-xs font-medium tracking-[0.15em] uppercase"
            >Nhấn vào màn hình để tiếp tục</span
          >
        </div>
      }

      <!-- Card đăng nhập -->
      <div
        #card
        class="relative z-10 w-full max-w-sm rounded-[28px] p-px bg-linear-to-br from-amber-300/40 via-white/10 to-fuchsia-300/25 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)]"
        [class.pointer-events-none]="!transitioned()"
        (click)="$event.stopPropagation()"
      >
        <div
          class="rounded-[27px] bg-slate-950/55 backdrop-blur-2xl border border-white/15 p-8"
        >
          <p class="stagger-item text-[11px] font-semibold tracking-[0.25em] text-amber-200/90 uppercase mb-3">
            RUMA · Quản lý phòng trọ
          </p>
          <h1 class="stagger-item font-['Be_Vietnam_Pro'] text-2xl font-bold text-white mb-1 tracking-tight">
            Chào bạn trở lại
          </h1>
          <p class="stagger-item text-sm text-white/70 mb-7">
            Đăng nhập để tiếp tục quản lý phòng trọ của bạn
          </p>

          <form class="flex flex-col gap-5" (submit)="onSubmit($event)">
            <!-- Số điện thoại -->
            <div class="stagger-item group">
              <label class="block text-[11px] font-medium text-white/65 mb-1.5 tracking-wide uppercase"
                >Số điện thoại</label
              >
              <div class="relative flex items-center">
                <svg
                  class="absolute left-3 w-4 h-4 text-white/45 group-focus-within:text-amber-300 transition-colors duration-300"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <input
                  type="tel"
                  [value]="phone()"
                  (input)="phone.set($any($event.target).value)"
                  (focus)="onFocus('phone')"
                  (blur)="onBlur('phone')"
                  placeholder="090 xxx xxxx"
                  autocomplete="tel"
                  class="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-colors duration-300 focus:bg-white/15 focus:border-amber-300/50"
                />
                <span
                  #phoneUnderline
                  class="absolute left-0 -bottom-px h-0.5 w-full origin-left scale-x-0 bg-linear-to-r from-amber-300 via-orange-300 to-fuchsia-300 rounded-full"
                ></span>
              </div>
            </div>

            <!-- Mật khẩu -->
            <div class="stagger-item group">
              <label class="block text-[11px] font-medium text-white/65 mb-1.5 tracking-wide uppercase"
                >Mật khẩu</label
              >
              <div class="relative flex items-center">
                <svg
                  class="absolute left-3 w-4 h-4 text-white/45 group-focus-within:text-amber-300 transition-colors duration-300"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [value]="password()"
                  (input)="password.set($any($event.target).value)"
                  (focus)="onFocus('password')"
                  (blur)="onBlur('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/40 outline-none transition-colors duration-300 focus:bg-white/15 focus:border-amber-300/50"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 text-white/45 hover:text-white/80 transition-colors"
                  aria-label="Hiện hoặc ẩn mật khẩu"
                >
                  @if (showPassword()) {
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  }
                </button>
                <span
                  #passwordUnderline
                  class="absolute left-0 -bottom-px h-0.5 w-full origin-left scale-x-0 bg-linear-to-r from-amber-300 via-orange-300 to-fuchsia-300 rounded-full"
                ></span>
              </div>
            </div>

            @if (errorMessage()) {
              <p class="stagger-item flex items-center gap-1.5 text-xs text-red-300">
                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ errorMessage() }}
              </p>
            }

            <div class="stagger-item mt-1">
              <ui-button type="submit" [loading]="loading()" class="w-full">
                Đăng nhập
              </ui-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  private bg1 = viewChild.required<ElementRef<HTMLDivElement>>('bg1');
  private bg2 = viewChild.required<ElementRef<HTMLDivElement>>('bg2');
  private glow = viewChild.required<ElementRef<HTMLDivElement>>('glow');
  private card = viewChild.required<ElementRef<HTMLDivElement>>('card');
  private hint = viewChild<ElementRef<HTMLDivElement>>('hint');
  private hintPing = viewChild<ElementRef<HTMLDivElement>>('hintPing');
  private particlesLayer = viewChild.required<ElementRef<HTMLDivElement>>('particlesLayer');
  private phoneUnderline = viewChild.required<ElementRef<HTMLSpanElement>>('phoneUnderline');
  private passwordUnderline = viewChild.required<ElementRef<HTMLSpanElement>>('passwordUnderline');

  phone = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  transitioned = signal(false);

  // Lớp hạt sáng gần: nhiều hơn, lấp lánh rõ (amber, có glow)
  readonly particles = Array.from({ length: 40 }).map(() => ({
    left: Math.random() * 100,
    top: 30 + Math.random() * 65,
    size: 1.5 + Math.random() * 3.5,
    opacity: 0.15 + Math.random() * 0.45,
  }));

  // Lớp hạt sáng xa: mờ hơn, to hơn, tạo chiều sâu
  readonly farParticles = Array.from({ length: 22 }).map(() => ({
    left: Math.random() * 100,
    top: 20 + Math.random() * 70,
    size: 3 + Math.random() * 5,
    opacity: 0.06 + Math.random() * 0.18,
  }));

  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private hintTween?: gsap.core.Tween;

  // Gộp 3 hàm parallax vào 1 object để TS narrow đúng và code gọn hơn
  private parallax?: {
    bg1: (x: number, y: number) => void;
    bg2: (x: number, y: number) => void;
    glow: (x: number, y: number) => void;
  };

  ngAfterViewInit() {
    gsap.set(this.bg2().nativeElement, { opacity: 0 });
    gsap.set(this.card().nativeElement, { opacity: 0, y: 24 });

    if (!this.prefersReducedMotion) {
      // Ken Burns nhẹ cho ảnh nền đầu tiên
      gsap.to(this.bg1().nativeElement, { scale: 1.08, duration: 16, ease: 'none' });

      // Đèn thành phố trôi nhẹ (lớp gần: trôi + nhấp nháy + hơi phập phồng)
      const nearNodes = this.particlesLayer().nativeElement.querySelectorAll<HTMLElement>('.particle');
      nearNodes.forEach((el) => {
        gsap.to(el, {
          y: gsap.utils.random(-70, -30),
          x: gsap.utils.random(-18, 18),
          opacity: gsap.utils.random(0.1, 0.6),
          scale: gsap.utils.random(0.85, 1.3),
          duration: gsap.utils.random(4, 10),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: gsap.utils.random(0, 5),
        });
      });

      // Lớp xa: trôi chậm hơn, mờ hơn để tạo chiều sâu
      const farNodes = this.particlesLayer().nativeElement.querySelectorAll<HTMLElement>('.particle-far');
      farNodes.forEach((el) => {
        gsap.to(el, {
          y: gsap.utils.random(-40, -15),
          x: gsap.utils.random(-10, 10),
          opacity: gsap.utils.random(0.05, 0.22),
          duration: gsap.utils.random(8, 16),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: gsap.utils.random(0, 6),
        });
      });

      // Radar ping cho hint
      const ping = this.hintPing()?.nativeElement;
      if (ping) {
        gsap.to(ping, {
          scale: 1.9,
          opacity: 0,
          duration: 1.6,
          repeat: -1,
          ease: 'power1.out',
        });
      }

      // Parallax theo chuột (mượt bằng quickTo)
      const bg1X = gsap.quickTo(this.bg1().nativeElement, 'x', { duration: 0.9, ease: 'power3' });
      const bg1Y = gsap.quickTo(this.bg1().nativeElement, 'y', { duration: 0.9, ease: 'power3' });
      const bg2X = gsap.quickTo(this.bg2().nativeElement, 'x', { duration: 0.9, ease: 'power3' });
      const bg2Y = gsap.quickTo(this.bg2().nativeElement, 'y', { duration: 0.9, ease: 'power3' });
      const glowX = gsap.quickTo(this.glow().nativeElement, 'x', { duration: 0.6, ease: 'power3' });
      const glowY = gsap.quickTo(this.glow().nativeElement, 'y', { duration: 0.6, ease: 'power3' });

      this.parallax = {
        bg1: (x, y) => { bg1X(x); bg1Y(y); },
        bg2: (x, y) => { bg2X(x); bg2Y(y); },
        glow: (x, y) => { glowX(x); glowY(y); },
      };
    }

    // Hint nhấp nháy mời bấm
    const hintEl = this.hint()?.nativeElement;
    if (hintEl) {
      this.hintTween = gsap.to(hintEl, {
        opacity: 0.5,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.prefersReducedMotion || !this.parallax) return;
    const px = event.clientX / window.innerWidth - 0.5;
    const py = event.clientY / window.innerHeight - 0.5;
    this.parallax.bg1(px * -18, py * -18);
    this.parallax.bg2(px * -18, py * -18);
    this.parallax.glow(px * 40, py * 40);
  }

  onMouseLeave() {
    if (this.prefersReducedMotion || !this.parallax) return;
    this.parallax.bg1(0, 0);
    this.parallax.bg2(0, 0);
    this.parallax.glow(0, 0);
  }

  onFocus(field: 'phone' | 'password') {
    const ref = field === 'phone' ? this.phoneUnderline() : this.passwordUnderline();
    gsap.to(ref.nativeElement, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
  }

  onBlur(field: 'phone' | 'password') {
    const ref = field === 'phone' ? this.phoneUnderline() : this.passwordUnderline();
    gsap.to(ref.nativeElement, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
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
        { opacity: 0, y: 12, duration: 0.45, stagger: 0.07 },
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