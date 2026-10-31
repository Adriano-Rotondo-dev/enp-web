import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { ArchiveEvent, EnpPhoto, PhotoUploadMeta, UploadSummary } from '../../models/event.model';
import {
  PHOTO_PAGE_SIZE, ParsedPhotoName, findArchiveMatch, formatDay, hasPhotoExtension, parsePhotoFileName, photoBaseName,
  photoDisplayTitle
} from '../../utils/photo-filename';
import { LoaderComponent } from '../../components/loader/loader';

// riga dell'anteprima prima dell'invio
export interface UploadPreviewRow {
  key: string;
  file: File;
  name: string;
  parsed: ParsedPhotoName;
  serata: ArchiveEvent | null;   // serata a cui verrà collegata
  serataNote: string;            // spiegazione quando non c'è collegamento
  giaCaricata: boolean;          // conforme e già presente sul server (sarà un 409)
  troppoGrande: boolean;         // oltre 5 MB: il backend risponde 413
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // limite del backend

// chiave univoca di un file scelto (dalla cartella conta anche il percorso)
function fileKey(file: File): string {
  return `${(file as any).webkitRelativePath || file.name}|${file.size}|${file.lastModified}`;
}

// Scheda 03 della dashboard: caricamento e gestione delle foto
@Component({
  selector: 'app-dashboard-foto',
  standalone: true,
  imports: [FormsModule, LoaderComponent],
  templateUrl: './dashboard-foto.html'
})
export class DashboardFotoComponent {
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  formatDay = formatDay;
  photoTitle = photoDisplayTitle;
  isSaving = signal(false);

  archiveEvents = this.eventService.archiveEvents;
  eventTypes = this.eventService.eventTypes;

  // --- Caricamento ---
  photos = this.eventService.photos;
  uploadMeta = signal<PhotoUploadMeta>({ title: '', tag: '', author: '', archiveEventId: null });
  pendingFiles = signal<File[]>([]);
  isUploading = signal(false);
  uploadProgress = this.eventService.uploadProgress;
  uploadSummary = signal<UploadSummary | null>(null);
  skippedFiles = signal(0); // file scartati dalla cartella perché non sono immagini

  private originalNames = computed(() =>
    new Set(this.photos().map(p => p.originalName?.toLowerCase()).filter(Boolean))
  );

  uploadPreview = computed<UploadPreviewRow[]>(() => {
    const types = this.eventTypes();
    const events = this.archiveEvents();
    const chosenId = this.uploadMeta().archiveEventId;
    const chosen = chosenId != null ? events.find(e => e.id === chosenId) ?? null : null;
    const known = this.originalNames();

    return this.pendingFiles().map(file => {
      const parsed = parsePhotoFileName(file.name, types);
      let serata: ArchiveEvent | null = null;
      let serataNote = '';
      if (chosen) {
        serata = chosen;
        serataNote = 'scelta a mano';
      } else if (parsed.conforme) {
        const { match, count } = findArchiveMatch(parsed.eventType!.id, parsed.eventDay, events);
        serata = match;
        serataNote = match ? 'automatica' : count > 1 ? `${count} serate quel giorno: nessun collegamento` : 'nessuna serata quel giorno';
      } else {
        serataNote = 'da collegare a mano';
      }
      return {
        key: fileKey(file),
        file,
        name: file.name,
        parsed,
        serata,
        serataNote,
        giaCaricata: parsed.conforme && known.has(photoBaseName(file.name).toLowerCase()),
        troppoGrande: file.size > MAX_PHOTO_BYTES
      };
    });
  });

  uploadPreviewStats = computed(() => {
    const rows = this.uploadPreview();
    return {
      totale: rows.length,
      conformi: rows.filter(r => r.parsed.conforme).length,
      collegate: rows.filter(r => r.serata).length,
      giaCaricate: rows.filter(r => r.giaCaricata).length,
      troppoGrandi: rows.filter(r => r.troppoGrande).length
    };
  });

  // file che verranno davvero inviati: i già caricati (sarebbero un 409) si saltano
  filesToSend = computed(() => this.uploadPreview().filter(r => !r.giaCaricata).map(r => r.file));

  uploadPercent = computed(() => {
    const p = this.uploadProgress();
    return p && p.total ? Math.round((p.done / p.total) * 100) : 0;
  });

  // --- Gestione ---
  photoView = signal<'tutte' | 'non-collegate'>('tutte');
  filterTypeId = signal<number | null>(null);
  filterEventId = signal<number | null>(null);
  filterDay = signal('');
  visibleCount = signal(PHOTO_PAGE_SIZE);
  editingPhoto = signal<EnpPhoto | null>(null);

  unlinkedCount = computed(() => this.photos().filter(p => p.archiveEventId == null).length);

  filteredPhotos = computed(() => {
    let list = this.photos();
    if (this.photoView() === 'non-collegate') list = list.filter(p => p.archiveEventId == null);
    const typeId = this.filterTypeId();
    if (typeId != null) list = list.filter(p => p.eventTypeId === typeId);
    const eventId = this.filterEventId();
    if (eventId != null) list = list.filter(p => p.archiveEventId === eventId);
    const day = this.filterDay();
    if (day) list = list.filter(p => p.eventDay === day);
    return list;
  });

  visiblePhotos = computed(() => this.filteredPhotos().slice(0, this.visibleCount()));

  hasPhotoFilters = computed(() =>
    this.filterTypeId() != null || this.filterEventId() != null || !!this.filterDay()
  );

  // --- CARICAMENTO ---

  onPhotoFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // permette di riscegliere gli stessi file
    this.addPendingFiles(files);
  }

  addPendingFiles(files: File[]) {
    const images = files.filter(f => hasPhotoExtension(f.name));
    const skipped = files.length - images.length;
    this.skippedFiles.set(skipped);
    if (skipped > 0) {
      this.toast.info(`${skipped} file ignorati: si caricano solo jpg, jpeg, jfif, png e webp`);
    }
    if (!images.length) return;
    this.uploadSummary.set(null);
    this.pendingFiles.update(current => {
      const keys = new Set(current.map(fileKey));
      return [...current, ...images.filter(f => !keys.has(fileKey(f)))];
    });
  }

  removePendingFile(key: string) {
    this.pendingFiles.update(files => files.filter(f => fileKey(f) !== key));
  }

  clearPendingFiles() {
    this.pendingFiles.set([]);
    this.skippedFiles.set(0);
  }

  startUpload() {
    if (!this.pendingFiles().length) {
      this.toast.error('Seleziona dei file o una cartella');
      return;
    }
    const files = this.filesToSend();
    const skipped = this.uploadPreview().filter(r => r.giaCaricata).map(r => r.name);
    if (!files.length) {
      this.toast.error('Tutti i file sono già caricati');
      return;
    }
    this.isUploading.set(true);
    this.uploadSummary.set(null);
    this.eventService.uploadPhotos(files, this.uploadMeta()).subscribe({
      next: (summary) => {
        // i già caricati saltati contano come duplicati nel riepilogo
        summary.duplicate += skipped.length;
        summary.nomiDuplicati.push(...skipped);
        this.isUploading.set(false);
        this.uploadSummary.set(summary);
        this.clearPendingFiles();
        const ko = summary.errori.length;
        const msg = `${summary.caricate} foto caricate` +
          (summary.duplicate ? ` · ${summary.duplicate} già presenti` : '') +
          (ko ? ` · ${ko} errori` : '');
        if (ko || summary.annullato) this.toast.error(msg); else this.toast.success(msg);
        // conteggi delle tipologie e nomi delle serate aggiornati
        this.eventService.loadEventTypes().subscribe();
        if (summary.caricate) this.eventService.loadPhotos().subscribe();
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.error('Upload non riuscito');
      }
    });
  }

  cancelUpload() {
    this.eventService.cancelUpload();
    this.toast.info('Il caricamento si ferma dopo il file in corso');
  }

  // --- GESTIONE ---

  setPhotoView(view: 'tutte' | 'non-collegate') {
    this.photoView.set(view);
    this.visibleCount.set(PHOTO_PAGE_SIZE);
  }

  setPhotoFilter(kind: 'type' | 'event' | 'day', value: any) {
    if (kind === 'type') this.filterTypeId.set(value ?? null);
    if (kind === 'event') this.filterEventId.set(value ?? null);
    if (kind === 'day') this.filterDay.set(value ?? '');
    this.visibleCount.set(PHOTO_PAGE_SIZE);
  }

  resetPhotoFilters() {
    this.filterTypeId.set(null);
    this.filterEventId.set(null);
    this.filterDay.set('');
    this.visibleCount.set(PHOTO_PAGE_SIZE);
  }

  showMorePhotos() {
    this.visibleCount.update(n => n + PHOTO_PAGE_SIZE);
  }

  startEditPhoto(photo: EnpPhoto) {
    this.editingPhoto.set({
      ...photo,
      title: photo.title ?? '',
      tag: photo.tag ?? '',
      eventTypeId: photo.eventTypeId ?? null,
      eventDay: photo.eventDay ?? ''
    });
  }

  // scegliendo una serata, tipologia e data vuote si completano con quelle della serata
  onEditPhotoEventChange(eventId: number | null) {
    this.editingPhoto.update(p => {
      if (!p) return p;
      const next: EnpPhoto = { ...p, archiveEventId: eventId };
      const serata = this.archiveEvents().find(e => e.id === eventId);
      if (serata) {
        if (next.eventTypeId == null && serata.eventTypeId != null) next.eventTypeId = serata.eventTypeId;
        if (!next.eventDay && serata.eventDay) next.eventDay = serata.eventDay;
      }
      return next;
    });
  }

  cancelEditPhoto() {
    this.editingPhoto.set(null);
  }

  savePhotoEdit() {
    const photo = this.editingPhoto();
    if (!photo) return;
    this.isSaving.set(true);
    this.eventService.updatePhoto(photo).subscribe({
      next: () => {
        this.editingPhoto.set(null);
        this.isSaving.set(false);
        this.toast.success('Foto aggiornata');
        // ricarica per aggiornare VOL e nome della serata collegata
        this.eventService.loadPhotos().subscribe();
        this.eventService.loadEventTypes().subscribe();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.error ?? 'Salvataggio non riuscito');
      }
    });
  }

  deletePhoto(id: number) {
    if (!confirm('Eliminare definitivamente questa foto?')) return;
    this.eventService.deletePhoto(id).subscribe({
      next: () => this.eventService.loadEventTypes().subscribe(),
      error: (err) => this.toast.error(err?.error?.error ?? 'Eliminazione non riuscita')
    });
  }
}
