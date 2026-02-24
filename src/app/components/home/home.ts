import { Component, signal, computed, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private eventService = inject(EventService);

  // Legge lo stesso segnale centrale — nessuna duplicazione di dati
  nextEvent = this.eventService.nextEvent;

  images = ['/emp_1.webp', '/emp_2.webp', '/emp_3.webp'];
  currentIndex = signal(0);
  countdown = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  private carouselTimer: any;
  private countdownTimer: any;

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.eventService.loadNextEvent().subscribe();
    this.carouselTimer = setInterval(() => this.nextImage(), 5000);
    this.updateCountdown();
    this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
  }
}

  ngOnDestroy() {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  goToNextEventPage() { this.router.navigate(['/prossimo-evento']); }
  nextImage() { this.currentIndex.update(i => (i + 1) % this.images.length); }

  updateCountdown() {
    const target = new Date(this.nextEvent().date).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target) || diff <= 0) {
      this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    this.countdown.set({
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    });
  }
}