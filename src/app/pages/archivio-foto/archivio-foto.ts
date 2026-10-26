import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EnpPhoto } from '../../models/event.model';
import { photoDisplayTitle } from '../../utils/photo-filename';

@Component({
  selector: 'app-archivio-foto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archivio-foto.html'
})
export class ArchivioFotoComponent implements OnInit {
  private eventService = inject(EventService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // titolo della foto, o "{tipologia} {gg.mm.aaaa}" se manca
  photoTitle = photoDisplayTitle;

  // link per scaricare la foto aperta nel lightbox
  downloadUrl(photo: EnpPhoto): string {
    return this.eventService.photoDownloadUrl(photo.id);
  }

  // ─── FILTRI ───
  activeEventId = signal<number | null>(null);
  activeType = signal<string | null>(null); // prefisso, es. EMONIGHT

  // ─── LIGHTBOX ───
  selectedPhoto = signal<EnpPhoto | null>(null);

  // ─── DATI ───
  allPhotos = this.eventService.photos;
  archiveEvents = this.eventService.archiveEvents;
  status = this.eventService.photosStatus;

  // Tutte le tipologie (anche senza foto) + quelle presenti nelle foto, in ordine di nome
  availableTypes = computed(() => {
    const types = new Map<string, string>();
    for (const t of this.eventService.eventTypes()) {
      types.set(t.prefix, t.label || t.prefix);
    }
    // ripiego: se l'elenco tipologie non arriva, restano quelle lette dalle foto
    for (const p of this.allPhotos()) {
      if (p.eventTypePrefix && !types.has(p.eventTypePrefix)) {
        types.set(p.eventTypePrefix, p.eventTypeLabel || p.eventTypePrefix);
      }
    }
    return [...types].map(([prefix, label]) => ({ prefix, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  activeTypeLabel = computed(() => {
    const prefix = this.activeType();
    if (prefix === null) return null;
    return this.availableTypes().find(t => t.prefix === prefix)?.label ?? prefix;
  });

  // Label VOL dell'evento attivo per l'indicatore filtro
  activeEventLabel = computed(() => {
    if (this.activeEventId() === null) return null;
    return this.archiveEvents().find(e => e.id === this.activeEventId())?.vol ?? null;
  });

  // Foto filtrate per serata e/o tipologia
  photos = computed(() => {
    let filtered = this.allPhotos();

    if (this.activeEventId() !== null) {
      filtered = filtered.filter(p => p.archiveEventId === this.activeEventId());
    }

    if (this.activeType() !== null) {
      filtered = filtered.filter(p => p.eventTypePrefix === this.activeType());
    }

    return filtered;
  });

  ngOnInit() {
    this.eventService.loadPhotos().subscribe();
    this.eventService.loadArchiveEvents().subscribe();
    this.eventService.loadEventTypes().subscribe();

    // Legge i query param ?eventId= (dall'archivio eventi) e ?tipo=PREFIX
    this.route.queryParams.subscribe(params => {
      const id = params['eventId'];
      this.activeEventId.set(id ? Number(id) : null);
      const tipo = params['tipo'];
      this.activeType.set(tipo ? String(tipo).toUpperCase() : null);
    });
  }

  // ─── FILTRO EVENTO ───
  setEventFilter(id: number | null) {
    this.activeEventId.set(id);
    this.activeType.set(null);
    this.syncUrl();
  }

  // ─── FILTRO TIPOLOGIA ───
  setTypeFilter(prefix: string | null) {
    this.activeType.set(prefix);
    this.syncUrl();
  }

  resetFilters() {
    this.activeEventId.set(null);
    this.activeType.set(null);
    this.syncUrl();
  }

  // i filtri restano nell'URL, così il link si può condividere
  private syncUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { eventId: this.activeEventId(), tipo: this.activeType() },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // ─── LIGHTBOX ───
  openPhoto(photo: EnpPhoto) {
    this.selectedPhoto.set(photo);
  }

  closePhoto() {
    this.selectedPhoto.set(null);
  }

 nextPhoto() {
  const current = this.selectedPhoto();
  if (!current) return;
  const list = this.photos();
  const idx = list.findIndex(p => p.id === current.id);
  const nextIdx = idx === list.length - 1 ? 0 : idx + 1;
  this.selectedPhoto.set(list[nextIdx]);
}

  prevPhoto() {
    const current = this.selectedPhoto();
    if (!current) return;
    const list = this.photos();
    const idx = list.findIndex(p => p.id === current.id);
    // Se è la prima, vai all'ultima
  const prevIdx = idx === 0 ? list.length - 1 : idx - 1;
  this.selectedPhoto.set(list[prevIdx]);
  }
}