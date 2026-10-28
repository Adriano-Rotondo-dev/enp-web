import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-prossimo-evento',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent implements OnInit {
  private eventService = inject(EventService);
  private platformId = inject(PLATFORM_ID);

  eventData = this.eventService.nextEvent;
  eventStatus = this.eventService.nextEventStatus;
  hasUpcomingEvent = this.eventService.hasUpcomingEvent;

  // ─── MAPS ───
  openMaps() {
    if (isPlatformBrowser(this.platformId)) {
      const query = encodeURIComponent(
        `${this.eventData().location} ${this.eventData().address}`
      );
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.eventService.loadNextEvent().subscribe();
    }
  }
}