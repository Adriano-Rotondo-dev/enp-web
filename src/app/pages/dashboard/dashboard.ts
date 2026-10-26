import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import {
  NextEvent, ArchiveEvent, EnpPhoto, EventType, PhotoUploadMeta, UploadSummary
} from '../../models/event.model';
import {
  EVENT_TYPE_PREFIX_REGEX, ParsedPhotoName, findArchiveMatch, formatDay, hasPhotoExtension,
  parsePhotoFileName, photoBaseName, photoDisplayTitle
} from '../../utils/photo-filename';

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

export const PHOTO_PAGE_SIZE = 48;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // limite del backend

const emptyArchiveEvent = (): ArchiveEvent => ({
  id: 0, vol: '', name: '', date: '', description: '', posterUrl: '', eventTypeId: null, eventDay: ''
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  // Iniezione dipendenze
  public auth = inject(AuthService);
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  // helper per il template
  formatDay = formatDay;
  photoTitle = photoDisplayTitle;

  // State Management con Signals
  activeTab = signal<'evento' | 'archivio' | 'foto'>('evento');
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  // Tab 01: Prossimo Evento (Sincronizzato con NextEvent model)
  editableEvent = signal<NextEvent>({
    id: '',
    title: '',
    date: '',
    time: '',
    location: '',
    address: '',
    description: '',
    lineup: []
  });

  // Tab 02: Archivio Eventi
  archiveEvents = this.eventService.archiveEvents; // Usiamo direttamente il signal del service
  newArchiveEvent = signal<ArchiveEvent>(emptyArchiveEvent());
  selectedArchiveFile: File | null = null;
  selectedEditArchiveFile: File | null = null; //
  editingArchiveEvent = signal<ArchiveEvent | null>(null);

  // Tab 02: Tipologie evento
  eventTypes = this.eventService.eventTypes;
  newTypePrefix = signal('');
  newTypeLabel = signal('');
  editingTypeId = signal<number | null>(null);
  editingTypeLabel = signal('');
  // messaggio di validazione del prefisso (null se valido o vuoto)
  newTypePrefixError = computed(() => {
    const prefix = this.newTypePrefix();
    if (!prefix) return null;
    if (!EVENT_TYPE_PREFIX_REGEX.test(prefix)) return 'Solo lettere A-Z e numeri, da 2 a 20 caratteri';
    if (this.eventTypes().some(t => t.prefix === prefix)) return 'Prefisso già esistente';
    return null;
  });
  canAddType = computed(() =>
    !!this.newTypePrefix() && !this.newTypePrefixError() &&
    !!this.newTypeLabel().trim() && this.newTypeLabel().trim().length <= 100
  );

  // Tab 03: Foto — caricamento
  photos = this.eventService.photos; // Usiamo direttamente il signal del service
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

  uploadPercent = computed(() => {
    const p = this.uploadProgress();
    return p && p.total ? Math.round((p.done / p.total) * 100) : 0;
  });

  // Tab 03: Foto — gestione
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

  // Logout UI State
  isConfirmingLogout = signal(false);

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    // Carichiamo i dati tramite gli observable del service
    this.eventService.loadNextEvent().subscribe(event => this.editableEvent.set(event));
    this.eventService.loadArchiveEvents().subscribe();
    this.eventService.loadPhotos().subscribe();
    this.eventService.loadEventTypes().subscribe();
  }

  // --- LOGICA EVENTO CORRENTE ---
  saveCurrentEvent() {
    this.isSaving.set(true);
    this.eventService.updateNextEvent(this.editableEvent()).subscribe({
      next: () => {
        this.toast.success('Evento aggiornato');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Salvataggio non riuscito');
        this.isSaving.set(false);
      }
    });
  }

  // --- LOGICA ARCHIVIO ---
  onArchiveFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedArchiveFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newArchiveEvent.update(prev => ({ ...prev, posterUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  }

  // toast di esito della serata, con le foto collegate a ritroso dal backend
  private archiveSaved(message: string, res: any) {
    const linked = Number(res?.linkedPhotos) || 0;
    if (linked > 0) {
      this.toast.success(`${message} · ${linked} ${linked === 1 ? 'foto collegata' : 'foto collegate'} in automatico`);
      this.eventService.loadPhotos().subscribe();
    } else {
      this.toast.success(message);
    }
    // i conteggi delle tipologie cambiano
    this.eventService.loadEventTypes().subscribe();
  }

  saveToArchive() {
    this.isSaving.set(true);
    this.eventService.addToArchive(this.newArchiveEvent(), this.selectedArchiveFile).subscribe({
      next: (res) => {
        // Reset form
        this.newArchiveEvent.set(emptyArchiveEvent());
        this.selectedArchiveFile = null;
        this.isSaving.set(false);
        this.archiveSaved('Serata aggiunta all\'archivio', res);
        // Ricarica l'archivio per avere gli id reali assegnati dal backend
        this.eventService.loadArchiveEvents().subscribe();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.error ?? 'Salvataggio non riuscito');
      }
    });
  }

  startEditArchiveEvent(event: ArchiveEvent) {
    this.editingArchiveEvent.set({ ...event, eventTypeId: event.eventTypeId ?? null, eventDay: event.eventDay ?? '' });
  }

onEditArchiveFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedEditArchiveFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Aggiorna l'anteprima nell'oggetto che stai editando
      this.editingArchiveEvent.update(prev => prev ? ({ ...prev, posterUrl: e.target.result }) : null);
    };
    reader.readAsDataURL(file);
  }
}

saveArchiveEventEdit() {
  const edited = this.editingArchiveEvent();
  if (!edited) return;
  this.isSaving.set(true);

  this.eventService.updateArchiveEvent(edited, this.selectedEditArchiveFile).subscribe({
    next: (res) => {
      this.editingArchiveEvent.set(null);
      this.selectedEditArchiveFile = null; // Reset del file
      this.isSaving.set(false);
      this.archiveSaved('Serata aggiornata', res);
    },
    error: (err) => {
      this.isSaving.set(false);
      this.toast.error(err?.error?.error ?? 'Salvataggio non riuscito');
    }
  });
}

  deleteArchiveEvent(id: number) {
    if (confirm("Sei sicuro di voler eliminare questo evento dall'archivio?")) {
      this.eventService.deleteArchiveEvent(id).subscribe(() => {
        // le foto della serata eliminata restano senza serata (FK ON DELETE SET NULL)
        this.eventService.loadPhotos().subscribe();
        this.eventService.loadEventTypes().subscribe();
      });
    }
  }

  // --- TIPOLOGIE EVENTO ---
  onNewTypePrefix(value: string) {
    this.newTypePrefix.set((value ?? '').toUpperCase().replace(/\s+/g, ''));
  }

  typeInUse(type: EventType): boolean {
    return (type.archiveCount ?? 0) > 0 || (type.photoCount ?? 0) > 0;
  }

  addEventType() {
    if (!this.canAddType()) {
      this.toast.error(this.newTypePrefixError() ?? 'Prefisso e nome sono obbligatori');
      return;
    }
    this.isSaving.set(true);
    this.eventService.addEventType(this.newTypePrefix(), this.newTypeLabel()).subscribe({
      next: (saved) => {
        this.isSaving.set(false);
        this.newTypePrefix.set('');
        this.newTypeLabel.set('');
        this.toast.success(`Tipologia ${saved.prefix} aggiunta`);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.error ?? (err?.status === 409 ? 'Prefisso già esistente' : 'Salvataggio non riuscito'));
      }
    });
  }

  startEditType(type: EventType) {
    this.editingTypeId.set(type.id);
    this.editingTypeLabel.set(type.label);
  }

  saveTypeEdit() {
    const id = this.editingTypeId();
    const label = this.editingTypeLabel().trim();
    if (id == null) return;
    if (!label || label.length > 100) {
      this.toast.error('Il nome è obbligatorio (max 100 caratteri)');
      return;
    }
    this.isSaving.set(true);
    this.eventService.updateEventType(id, label).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingTypeId.set(null);
        this.toast.success('Tipologia aggiornata');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.error ?? 'Salvataggio non riuscito');
      }
    });
  }

  deleteEventType(type: EventType) {
    if (this.typeInUse(type)) return;
    if (!confirm(`Eliminare la tipologia ${type.prefix}?`)) return;
    this.eventService.deleteEventType(type.id).subscribe({
      next: () => this.toast.success(`Tipologia ${type.prefix} eliminata`),
      error: (err) => {
        if (err?.status === 409) {
          const a = err.error?.archiveCount ?? 0;
          const f = err.error?.photoCount ?? 0;
          this.toast.error(`Tipologia in uso: ${a} serate, ${f} foto`);
          this.eventService.loadEventTypes().subscribe();
        } else {
          this.toast.error(err?.error?.error ?? 'Eliminazione non riuscita');
        }
      }
    });
  }

  // --- LOGICA FOTO: CARICAMENTO ---
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
    const files = this.pendingFiles();
    if (!files.length) {
      this.toast.error('Seleziona dei file o una cartella');
      return;
    }
    this.isUploading.set(true);
    this.uploadSummary.set(null);
    this.eventService.uploadPhotos(files, this.uploadMeta()).subscribe({
      next: (summary) => {
        this.isUploading.set(false);
        this.uploadSummary.set(summary);
        this.pendingFiles.set([]);
        this.skippedFiles.set(0);
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

  // --- LOGICA FOTO: GESTIONE ---
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
    if (confirm("Eliminare definitivamente questa foto?")) {
      this.eventService.deletePhoto(id).subscribe(() => this.eventService.loadEventTypes().subscribe());
    }
  }

  // --- LOGOUT ---
  logout() {
    if (!this.isConfirmingLogout()) {
      this.isConfirmingLogout.set(true);
      setTimeout(() => this.isConfirmingLogout.set(false), 3000);
    } else {
      this.auth.logout(); // naviga già su /backstage
    }
  }
}

// chiave univoca di un file scelto (dalla cartella conta anche il percorso)
function fileKey(file: File): string {
  return `${(file as any).webkitRelativePath || file.name}|${file.size}|${file.lastModified}`;
}
