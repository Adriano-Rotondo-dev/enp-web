import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-prossimo-evento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent implements OnInit {
  private eventService = inject(EventService);

  // Legge direttamente il segnale del service — reattivo automaticamente
  eventData = this.eventService.nextEvent;

  ngOnInit() {
    // Carica i dati (mock o backend, trasparente)
    this.eventService.loadNextEvent().subscribe();
  }

  openMaps() {
    window.open(this.eventData().mapsUrl, '_blank');
  }
}


//TODO: future release
//* generazione url partendo dal nome del locale per l'inserimento tramite pannello Admin
// openMaps() {
//   const query = encodeURIComponent(`${this.eventData().location} ${this.eventData().address}`);
//   window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
// }