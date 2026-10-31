import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { LoaderComponent } from '../../components/loader/loader';

@Component({
  selector: 'app-archivio-eventi',
  standalone: true,
  imports: [RouterLink, LoaderComponent],
  templateUrl: './archivio-eventi.html'
})
export class ArchivioEventiComponent implements OnInit {
  private eventService = inject(EventService);
  status = this.eventService.archiveStatus;

  // ordinamento decrescente
  events = computed(() =>
    [...this.eventService.archiveEvents()].sort((a, b) => Number(b.id) - Number(a.id))
  );

  // poster già arrivati (o falliti): sugli altri resta il loader
  loaded = signal(new Set<number>());
  markLoaded(id: number) {
    this.loaded.update(ids => new Set(ids).add(id));
  }

  ngOnInit() {
    if (this.status() !== 'ready') this.eventService.loadArchiveEvents().subscribe();
  }
}
