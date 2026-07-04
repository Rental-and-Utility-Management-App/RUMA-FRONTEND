import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantSidebar } from '../../components/sidebars/tenant-sidebar';
import { ManagerSidebar } from '../../components/sidebars/manager-sidebar';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [RouterLink, TenantSidebar, ManagerSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[#FBF7ED]">
      @if (auth.isManager()) {
        <app-manager-sidebar />
      } @else {
        <app-tenant-sidebar />
      }

      <div class="relative md:pl-64">
        <div class="max-w-3xl mx-auto p-6 md:p-10">
          <a routerLink="/contracts" class="inline-flex items-center gap-2 text-sm font-medium text-[#8A8270] hover:text-[#B8860B] transition-colors mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Danh sách hợp đồng
          </a>

          <div class="rounded-3xl border border-dashed border-[#D8D2C2] bg-white/60 p-10 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE9AC] text-[#8A6200]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4m-4-9a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
            </div>
            <h1 class="text-xl font-bold text-[#221D0F] mb-2">Tạo hợp đồng mới</h1>
            <p class="text-sm text-[#8A8270]">Chức năng này đang được phát triển, sẽ sớm ra mắt.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ContractFormPage {
  auth = inject(AuthService);
}