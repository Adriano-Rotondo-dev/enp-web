import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

//TODO: aggiungere computed signals 

interface EnpEvent {
  id: number;
  vol: string;
  name: string;
  date: string;
  description: string;
  posterUrl: string;
}

@Component({
  selector: 'app-archivio-eventi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archivio-eventi.html'
})
export class ArchivioEventiComponent {
  // todo: trasformare l'array in un computed 
  //* assicurarsi che l'ordine venga mantenuto anche con inserimenti disordinati dal back
  //? ordinamento per data invece che per id -> string date -> object Date -> confronto 
  events = signal<EnpEvent[]>([  
      {
      id: 8,
      vol: 'VOL. 7',
      name: 'NIGHT OF XMAS',
      date: '19 DIC',
      description: 'Cold weather for REFRAINED.',
      posterUrl: '/poster_placeholder.webp'
    },
  {
      id: 7,
      vol: 'VOL. 6',
      name: 'NIGHT OF HALLOWEEN 2.0',
      date: '25 OTT',
      description: 'This is Halloween, everybody make a SCREAM with Nihil',
      posterUrl: '/poster_placeholder.webp'
    },
      {
      id: 6,
      vol: 'VOL. 5',
      name: 'NIGHT OF COMICON',
      date: '14 SET',
      description: 'Expanding our influence. Yuriko Tiger Dj',
      posterUrl: '/poster_placeholder.webp'
    },
      {
      id: 5,
      vol: 'VOL. 4',
      name: 'NIGHT OF MAKERS',
      date: '10 MAG',
      description: 'MEET MY MAKER bring Tesla in the Mosh',
      posterUrl: '/poster_placeholder.webp'
    },
      {
      id: 4,
      vol: 'VOL. 3',
      name: 'NIGHT OF DIAMONDS',
      date: '22 MAR',
      description: 'XDIEMONDX was here',
      posterUrl: '/poster_placeholder.webp'
    },
    {    
      id: 3,
      vol: 'VOL. 2',
      name: 'NIGHT OF HALLOWEEN',
      date: '31 OTT',
      description: 'This Halloween is Ours',
      posterUrl: '/poster_placeholder.webp'
    },
    {
      id: 2,
      vol: 'VOL. 1',
      name: 'NIGHT OF REBELLION',
      date: '14 SET',
      description: 'Notte di fuoco e lacrime. La famiglia cresce.',
      posterUrl: '/poster_placeholder.webp'
    },
    {
      id: 1,
      vol: 'VOL. 0',
      name: 'THE BEGINNING',
      date: '29 GIU',
      description: 'Dove tutto è iniziato. Un piccolo locale pieno di emozioni.',
      posterUrl: '/poster_placeholder.webp'
    }
  ]);

  //todo: ordinamento inverso da inserire col Computed Signal
  //* sort((a, b) => b.id - a.id)
}