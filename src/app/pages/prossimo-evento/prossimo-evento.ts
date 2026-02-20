import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prossimo-evento',
  imports: [CommonModule],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent {
  // TODO: release futura - caricamento dei dati tramite database
  eventData = signal({
    title: 'The Next Chapter',
    location: 'MindHouse',
    address: 'Via San Lorenzo, 273/A, Palermo',
    mapsUrl: 'https://www.google.com/maps/search/MindHouse+Palermo',
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