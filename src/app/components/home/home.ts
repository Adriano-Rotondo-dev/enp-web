import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { EnpEvent } from '../../models/event.model'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './home.html', 
  styleUrl: './home.css'      
})
export class HomeComponent implements OnInit, OnDestroy {
  images = ['/emp_1.webp', '/emp_2.webp', '/emp_3.webp'];
  currentIndex = signal(0);
  
  // Data target definita una sola volta per performance 
  private readonly targetDate = new Date('2026-02-21T21:30:00').getTime();
  
  private carouselTimer: any;
  private countdownTimer: any;

  countdown = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  nextEvent = signal<EnpEvent>({
    id: "1",
    title: 'Emo Night Palermo',
    date: '21 Febbraio 2026',
    location: 'MindHouse, Palermo',
    description: 'Emo Anime Night',
    price: 7
  });

  ngOnInit() {
    // Timer Carosello (5 secondi)
    this.carouselTimer = setInterval(() => this.nextImage(), 5000);

    // Timer Countdown 
    this.updateCountdown(); 
    this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
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
    const now = new Date().getTime();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      // evento iniziato -> ferma il countdown -> ricomincia
      this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (this.countdownTimer) clearInterval(this.countdownTimer);
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