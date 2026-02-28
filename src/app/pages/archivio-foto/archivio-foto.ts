import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EnpPhoto } from '../../models/event.model';

@Component({
  selector: 'app-archivio-foto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archivio-foto.html'
})
export class ArchivioFotoComponent implements OnInit {
  private eventService = inject(EventService);
  private route = inject(ActivatedRoute);

  // ─── FILTRI ───
  activeEventId = signal<number | null>(null);
  activeTag = signal<string | null>(null);

  // ─── LIGHTBOX ───
  selectedPhoto = signal<EnpPhoto | null>(null);

  // ─── DATI ───
  allPhotos = this.eventService.photos;
  archiveEvents = this.eventService.archiveEvents;

  // Tag unici dalle foto caricate
  availableTags = computed(() => {
    const tags = this.allPhotos()
      .map(p => p.tag)
      .filter((t): t is string => !!t);
    return [...new Set(tags)];
  });

  // Label VOL dell'evento attivo per l'indicatore filtro
  activeEventLabel = computed(() => {
    if (this.activeEventId() === null) return null;
    return this.archiveEvents().find(e => e.id === this.activeEventId())?.vol ?? null;
  });

  // Foto filtrate per eventId e/o tag
  photos = computed(() => {
    let filtered = this.allPhotos();

    if (this.activeEventId() !== null) {
      filtered = filtered.filter(p => p.archiveEventId === this.activeEventId());
    }

    if (this.activeTag() !== null) {
      filtered = filtered.filter(p => p.tag === this.activeTag());
    }

    return filtered;
  });

  ngOnInit() {
    this.eventService.loadPhotos().subscribe();
    this.eventService.loadArchiveEvents().subscribe();

    // Legge il query param ?eventId= passato dall'archivio eventi
    this.route.queryParams.subscribe(params => {
      const id = params['eventId'];
      this.activeEventId.set(id ? Number(id) : null);
    });
  }

  // ─── FILTRO EVENTO ───
  setEventFilter(id: number | null) {
    this.activeEventId.set(id);
    this.activeTag.set(null);
  }

  // ─── FILTRO TAG ───
  setTagFilter(tag: string | null) {
    this.activeTag.set(tag);
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
    if (idx < list.length - 1) this.selectedPhoto.set(list[idx + 1]);
  }

  prevPhoto() {
    const current = this.selectedPhoto();
    if (!current) return;
    const list = this.photos();
    const idx = list.findIndex(p => p.id === current.id);
    if (idx > 0) this.selectedPhoto.set(list[idx - 1]);
  }
}