import { Component } from '@angular/core';

@Component({
  selector: 'app-prossimo-evento',
  imports: [],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent {

  openMaps(): void {
    // URL diretto per il Mind House di Palermo
    const url = 'https://www.google.com/maps/search/?api=1&query=Mind+House+Palermo+Via+San+Lorenzo+273';
    window.open(url, '_blank');
  }

}
