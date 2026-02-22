import { Component, signal, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { EnpEvent } from '../../models/event.model'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './home.html', 
  styleUrl: './home.css'      
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(private router: Router) {} //inietta il router
  goToNextEventPage(){
    this.router.navigate(['/prossimo-evento'])
  }

  private platformId = inject(PLATFORM_ID);

  images = ['/emp_1.webp', '/emp_2.webp', '/emp_3.webp'];
  currentIndex = signal(0);
  
  private carouselTimer: any;
  private countdownTimer: any;

  countdown = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  //data in formato ISO
  nextEvent = signal<EnpEvent>({
    id: "1",
    title: 'Emo Night Palermo',
    date: '2026-05-09T21:30:00', //ISO: YYYY-MM-DDTHH:mm:ss
    location: 'MindHouse, Palermo',
    description: 'Emo Night',
    price: 7
  });

  ngOnInit() {
if (isPlatformBrowser(this.platformId)) {
      this.carouselTimer = setInterval(() => this.nextImage(), 5000);
      
      this.updateCountdown(); 
      this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
    }
  }

  ngOnDestroy() {
    // Pulizia processi in background
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  nextImage() {
    this.currentIndex.update(index => (index + 1) % this.images.length);
  }

  
  updateCountdown() {
   const target = new Date(this.nextEvent().date).getTime();
   const now = new Date().getTime();
   const diff = target - now;

    // Se la data è invalida o passata
    if (isNaN(target) || diff <= 0) {
      this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    this.countdown.set({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    });
  }
}