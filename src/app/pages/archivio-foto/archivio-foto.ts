import { Component, computed, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EnpPhoto } from '../../models/event.model';
import { PHOTO_PAGE_SIZE, photoDisplayTitle } from '../../utils/photo-filename';
import { LoaderComponent } from '../../components/loader/loader';

@Component({
  selector: 'app-archivio-foto',
  standalone: true,
  imports: [LoaderComponent],
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

  // foto già arrivate (o fallite): sulle altre resta il loader
  loaded = signal(new Set<number>());
  markLoaded(id: number) {
    this.loaded.update(ids => new Set(ids).add(id));
  }

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

  // ─── MOSTRA ALTRE ───
  // torna al primo blocco a ogni cambio di filtro
  visibleCount = linkedSignal({
    source: () => [this.activeEventId(), this.activeType()],
    computation: () => PHOTO_PAGE_SIZE
  });
  visiblePhotos = computed(() => this.photos().slice(0, this.visibleCount()));

  showMorePhotos() {
    this.visibleCount.update(n => n + PHOTO_PAGE_SIZE);
  }

  ngOnInit() {
    // dati già caricati in questa visita: niente richieste doppie tornando sulla pagina
    if (this.status() !== 'ready') this.eventService.loadPhotos().subscribe();
    if (this.eventService.archiveStatus() !== 'ready') this.eventService.loadArchiveEvents().subscribe();
    if (!this.eventService.eventTypes().length) this.eventService.loadEventTypes().subscribe();

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

  nextPhoto() { this.stepPhoto(1); }
  prevPhoto() { this.stepPhoto(-1); }

  // scorre in cerchio: dopo l'ultima torna alla prima e viceversa
  private stepPhoto(delta: number) {
    const current = this.selectedPhoto();
    const list = this.photos();
    if (!current || !list.length) return;
    // se la foto aperta non è più nella lista filtrata, si riparte dalla prima
    const idx = list.findIndex(p => p.id === current.id);
    this.selectedPhoto.set(idx < 0 ? list[0] : list[(idx + delta + list.length) % list.length]);
  }
}