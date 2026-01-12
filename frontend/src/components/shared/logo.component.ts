
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-[#E50914] rounded-full flex items-center justify-center">
        <span class="text-white font-bold text-xl">IT</span>
      </div>
      <span class="text-white text-2xl font-light tracking-wider">Lean</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
