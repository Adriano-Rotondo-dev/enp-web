import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EnpPhoto {
  id: number;
  url: string;
  title: string;
  tag: string;
}

@Component({
  selector: 'app-archivio-foto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archivio-foto.html'
})
export class ArchivioFotoComponent {
  // Signal che contiene i placeholder. 
  photos = signal<EnpPhoto[]>([
    { id: 1, url: '/emp_1.webp', title: 'Moshpit Vol. 1', tag: 'MindHouse' },
    { id: 2, url: '/emp_2.webp', title: 'Sad Souls', tag: 'Crowd' },
    { id: 3, url: '/emp_3.webp', title: 'Punk Vibes', tag: 'Stage' },
    { id: 4, url: '/emp_1.webp', title: 'Nightline', tag: 'Backstage' },
    { id: 5, url: '/emp_2.webp', title: 'Raw Emotions', tag: 'Concert' },
    { id: 6, url: '/emp_3.webp', title: 'Nightline', tag: 'Backstage' },
  ]);

  /* REMINDER: La griglia è adattabile. Basta aggiungere oggetti all'array qui sopra.
     TODO: Collegamento al backend/DB per il caricamento dinamico delle foto.
  */
}