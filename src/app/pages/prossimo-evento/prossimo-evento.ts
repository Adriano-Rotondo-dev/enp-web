import { Component } from '@angular/core';

@Component({
  selector: 'app-prossimo-evento',
  imports: [],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent {

  openMaps(): void {
    // URL diretto per il Mind House Palermo 
    //TODO: rendere la location un elemento facilmente modificabile per segnare anche altri eventi
    //TODO: ulteriore model/component per gestire il cambio di location e l'inserimento di eventi collegati?
    const url = 'https://www.google.com/maps/search/?api=1&query=Mind+House+Palermo+Via+San+Lorenzo+273';
    window.open(url, '_blank');
  }

}
