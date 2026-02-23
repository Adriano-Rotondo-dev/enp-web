import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-archivio-foto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archivio-foto.html'
})
export class ArchivioFotoComponent {
    // Segnale "sorgente" privato
  private eventService = inject(EventService);

  photos = this.eventService.photos;

  ngOnInit() {
    this.eventService.loadPhotos().subscribe();
  }

  
}