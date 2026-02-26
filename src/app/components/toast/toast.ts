import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-6 py-4 font-black uppercase text-[10px] tracking-widest animate-in slide-in-from-bottom-4 fade-in duration-300"
          [class.bg-white]="toast.type === 'success'"
          [class.text-black]="toast.type === 'success'"
          [class.bg-red-600]="toast.type === 'error'"
          [class.text-white]="toast.type === 'error'"
          [class.bg-purple-600]="toast.type === 'info'"
          [class.text-white]="toast.type === 'info'"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}