import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prossimo-evento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent {
  //TODO: release futura - caricamenti dati tramite database/cambiamento dati tramite dashboard->database->front
  eventData = signal({
    title: 'The Next Chapter',
    date: '2026-02-21',
    time: '21:30',      
    location: 'MindHouse',
    address: 'Via San Lorenzo, 273/A, Palermo',
    mapsUrl: 'https://maps.app.goo.gl/3fX8N7z9z9z9z9z9z',
    description: 'Tutti i dettagli sulla prossima Emo Night Palermo.',
    lineup: [
      { time: '21:30', act: 'Opening & warmup' },
      { time: '22:30', act: ' Main Set con CyberBoy' },
      { time: '00:00', act: 'Dj Set'},
      { time: '01:30', act: 'Closing Act'}
    ]
  });

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