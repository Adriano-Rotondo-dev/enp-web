import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <h1 class="text-[12rem] md:text-[18rem] font-black text-white/5 leading-none absolute select-none">
        404
      </h1>
      
      <div class="z-10 mt-10">
        <h2 class="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
          Lost in the <span class="text-purple-600">dark?</span>
        </h2>
        <p class="text-gray-500 font-bold uppercase tracking-widest text-xs mb-12">
          La pagina che cerchi è sparita come la frangia di PillsInPieces.
        </p>
        
        <a routerLink="/" 
           class="inline-block border-2 border-white text-white font-black px-10 py-4 uppercase text-sm 
                  hover:bg-white hover:text-black transition-all transform hover:-rotate-2">
          Torna alla Home
          </a>
      </div>

      <p class="absolute bottom-10 text-[10px] text-gray-800 uppercase tracking-[0.5em]">
        "I'm not okay (I promise)"
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; overflow: hidden; }
  `]
})
export class NotFoundComponent {}