import { Component, computed, inject, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service'

@Component({
  selector: 'app-archivio-eventi',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './archivio-eventi.html'
})
export class ArchivioEventiComponent implements OnInit {
  // Segnale "sorgente" privato
 private eventService = inject(EventService);

 // Computed -> ordinamento decrescente 
events = computed(() =>
  [...this.eventService.archiveEvents()].sort((a, b) => Number(b.id) - Number(a.id))
);

   ngOnInit() {
    this.eventService.loadArchiveEvents().subscribe();
  }
}