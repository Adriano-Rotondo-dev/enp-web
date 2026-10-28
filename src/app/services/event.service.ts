import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, defer, EMPTY } from 'rxjs';
import { tap, catchError, concatMap, finalize, map, toArray } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NextEvent, ArchiveEvent, EnpPhoto, EventType, PhotoUploadMeta, UploadedPhoto, UploadProgress, UploadSummary
} from '../models/event.model';

export type LoadStatus = 'loading' | 'ready' | 'unavailable';

const emptyNextEvent = (): NextEvent => ({
  id: '', title: '', date: '', time: '', location: '', address: '', description: '', lineup: []
});

@Injectable({ providedIn: 'root' })
export class EventService {
  // in produzione Angular sostituisce environment.ts con environment.prod.ts
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // ─── SEGNALI CENTRALI ───

  nextEvent = signal<NextEvent>(emptyNextEvent());
  // 'loading' finché il backend non risponde, 'unavailable' se la chiamata fallisce
  nextEventStatus = signal<LoadStatus>('loading');
  // true solo se l'evento arriva dal backend e non è ancora concluso
  // (la serata resta "in corso" fino alle 6 del giorno dopo)
  hasUpcomingEvent = computed(() => {
    if (this.nextEventStatus() !== 'ready') return false;
    const day = new Date(this.nextEvent().date);
    if (isNaN(day.getTime())) return false;
    day.setHours(0, 0, 0, 0);
    return Date.now() < day.getTime() + 30 * 3600000;
  });
  archiveEvents = signal<ArchiveEvent[]>([]);
  archiveStatus = signal<LoadStatus>('loading');
  photos = signal<EnpPhoto[]>([]);
  photosStatus = signal<LoadStatus>('loading');
  // tipologie di serata (prefisso del nome file)
  eventTypes = signal<EventType[]>([]);
  // avanzamento del caricamento a lotti, null quando non c'è nulla in corso
  uploadProgress = signal<UploadProgress | null>(null);
  private uploadCancelled = false;

  // ─── NEXT EVENT ───

  loadNextEvent(): Observable<NextEvent> {
    return this.http.get<NextEvent>(`${this.apiUrl}/get-event.php`).pipe(
      tap(event => {
        this.nextEvent.set(event);
        this.nextEventStatus.set('ready');
      }),
      catchError(err => {
        console.error('Errore caricamento evento:', err);
        // niente dati finti in pagina: le viste mostrano lo "Stay Tuned"
        if (this.nextEventStatus() !== 'ready') this.nextEventStatus.set('unavailable');
        // solo l'ultimo evento vero, mai uno finto: la dashboard lo caricherebbe nel modulo
        return this.nextEventStatus() === 'ready' ? of(this.nextEvent()) : EMPTY;
      })
    );
  }

  updateNextEvent(event: NextEvent): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-event.php`, event).pipe(
      tap(() => {
        this.nextEvent.set(event);
        this.nextEventStatus.set('ready');
      })
    );
  }

  // ─── TIPOLOGIE EVENTO ───

  loadEventTypes(): Observable<EventType[]> {
    return this.http.get<EventType[]>(`${this.apiUrl}/event-types/get.php`).pipe(
      tap(types => this.eventTypes.set(types)),
      catchError(err => {
        console.error('Errore caricamento tipologie:', err);
        return of(this.eventTypes());
      })
    );
  }

  addEventType(prefix: string, label: string): Observable<EventType> {
    const body = { prefix: prefix.trim().toUpperCase(), label: label.trim() };
    return this.http.post<EventType>(`${this.apiUrl}/event-types/add.php`, body).pipe(
      tap(saved => this.eventTypes.update(types =>
        [...types, { archiveCount: 0, photoCount: 0, ...saved }]
          .sort((a, b) => a.prefix.localeCompare(b.prefix))
      ))
    );
  }

  updateEventType(id: number, label: string): Observable<EventType> {
    return this.http.post<EventType>(`${this.apiUrl}/event-types/update.php`, { id, label: label.trim() }).pipe(
      tap(saved => {
        this.eventTypes.update(types => types.map(t => t.id === saved.id ? { ...t, label: saved.label } : t));
        // le serate e le foto mostrano il nome della tipologia: lo teniamo allineato
        this.archiveEvents.update(events => events.map(e =>
          e.eventTypeId === saved.id ? { ...e, eventTypeLabel: saved.label } : e));
        this.photos.update(photos => photos.map(p =>
          p.eventTypeId === saved.id ? { ...p, eventTypeLabel: saved.label } : p));
      })
    );
  }

  deleteEventType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/event-types/delete.php?id=${id}`).pipe(
      tap(() => this.eventTypes.update(types => types.filter(t => t.id !== id)))
    );
  }

  // completa prefisso e nome della tipologia a partire dall'id
  private withTypeInfo<T extends { eventTypeId?: number | null }>(item: T): T {
    const type = item.eventTypeId != null ? this.eventTypes().find(t => t.id === item.eventTypeId) : undefined;
    return { ...item, eventTypePrefix: type?.prefix ?? null, eventTypeLabel: type?.label ?? null };
  }

  // corpo multipart della serata: tipologia e data vuote diventano null
  private archiveForm(event: ArchiveEvent, file: File | null): FormData {
    const formData = new FormData();
    formData.append('event', JSON.stringify({
      ...event,
      eventTypeId: event.eventTypeId ?? null,
      eventDay: event.eventDay || null
    }));
    if (file) formData.append('file', file);
    return formData;
  }

  // ─── ARCHIVE EVENTS ───

  loadArchiveEvents(): Observable<ArchiveEvent[]> {
    return this.http.get<ArchiveEvent[]>(`${this.apiUrl}/archive-events/get.php`).pipe(
      tap(events => {
        this.archiveEvents.set(events);
        this.archiveStatus.set('ready');
      }),
      catchError(err => {
        console.error('Errore caricamento archivio:', err);
        // niente archivio finto: la pagina mostra "non disponibile"
        if (this.archiveStatus() !== 'ready') this.archiveStatus.set('unavailable');
        return of(this.archiveEvents());
      })
    );
  }

  // la risposta contiene anche linkedPhotos: le foto collegate in automatico.
  // La lista non si aggiorna qui: la dashboard ricarica l'archivio per avere l'id vero
  addToArchive(event: ArchiveEvent, file: File | null): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive-events/add.php`, this.archiveForm(event, file));
  }

  updateArchiveEvent(event: ArchiveEvent, file: File | null): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive-events/update.php`, this.archiveForm(event, file)).pipe(
      tap((res: any) => this.archiveEvents.update(events =>
        events.map(e => e.id === event.id
          ? this.withTypeInfo({ ...event, posterUrl: res?.posterUrl || event.posterUrl })
          : e)
      ))
    );
  }

  deleteArchiveEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/archive-events/delete.php?id=${id}`).pipe(
      tap(() => this.archiveEvents.update(events => events.filter(e => e.id !== id)))
    );
  }

  // ─── PHOTOS ───

  // Link di download pubblico: il backend invia la foto come allegato JPG con un nome casuale
  photoDownloadUrl(id: number): string {
    return `${this.apiUrl}/photos/download.php?id=${id}`;
  }

  loadPhotos(): Observable<EnpPhoto[]> {
    return this.http.get<EnpPhoto[]>(`${this.apiUrl}/photos/get.php`).pipe(
      tap(photos => {
        this.photos.set(photos);
        this.photosStatus.set('ready');
      }),
      catchError(err => {
        console.error('Errore caricamento foto:', err);
        // niente galleria finta: la pagina mostra "non disponibile"
        if (this.photosStatus() !== 'ready') this.photosStatus.set('unavailable');
        return of(this.photos());
      })
    );
  }

  // Titolo, tag, autore e serata sono facoltativi: si inviano solo se compilati.
  // Senza serata esplicita il backend collega la foto in base al nome del file.
  uploadPhoto(meta: PhotoUploadMeta, file: File): Observable<UploadedPhoto> {
    const formData = new FormData();
    const photo: Record<string, string | number> = {};
    if (meta.title?.trim()) photo['title'] = meta.title.trim();
    if (meta.tag?.trim()) photo['tag'] = meta.tag.trim();
    if (meta.author?.trim()) photo['author'] = meta.author.trim();
    if (meta.archiveEventId != null) photo['archiveEventId'] = meta.archiveEventId;
    if (Object.keys(photo).length) formData.append('photo', JSON.stringify(photo));
    formData.append('file', file);
    return this.http.post<UploadedPhoto>(`${this.apiUrl}/photos/upload.php`, formData).pipe(
      tap(saved => this.photos.update(photos => [saved, ...photos]))
    );
  }

  /**
   * Carica i file uno alla volta (Altervista limita la dimensione di ogni richiesta).
   * L'avanzamento è nel signal uploadProgress; alla fine emette il riepilogo.
   * Un errore su un file non ferma il lotto, tranne la sessione scaduta (401).
   */
  uploadPhotos(files: File[], meta: PhotoUploadMeta = {}): Observable<UploadSummary> {
    const summary: UploadSummary = {
      caricate: 0, collegateAuto: 0, nonConformi: 0, duplicate: 0, errori: [],
      nomiNonConformi: [], nomiDuplicati: [], annullato: false
    };
    this.uploadCancelled = false;
    let stopReason: string | null = null;
    let done = 0;
    this.uploadProgress.set({ done: 0, total: files.length, current: files[0]?.name ?? null });

    const uploadOne = (file: File) => defer(() => {
      if (this.uploadCancelled || stopReason) {
        if (stopReason) summary.errori.push({ nome: file.name, motivo: stopReason });
        return EMPTY;
      }
      this.uploadProgress.set({ done, total: files.length, current: file.name });
      return this.uploadPhoto(meta, file).pipe(
        tap(saved => {
          summary.caricate++;
          if (saved.autoLinked) summary.collegateAuto++;
          if (saved.parsed === false) {
            summary.nonConformi++;
            summary.nomiNonConformi.push(file.name);
          }
        }),
        catchError(err => {
          if (err?.status === 409) {
            summary.duplicate++;
            summary.nomiDuplicati.push(file.name);
          } else {
            const motivo = err?.error?.error ?? (err?.status === 0 ? 'Connessione non riuscita' : 'Upload non riuscito');
            summary.errori.push({ nome: file.name, motivo });
            if (err?.status === 401) stopReason = 'Sessione scaduta: rifai il login';
          }
          return EMPTY;
        }),
        finalize(() => {
          done++;
          this.uploadProgress.set({ done, total: files.length, current: null });
        })
      );
    });

    return from(files).pipe(
      concatMap(uploadOne),
      toArray(),
      map(() => {
        summary.annullato = this.uploadCancelled;
        this.uploadProgress.set(null);
        return summary;
      })
    );
  }

  /** Ferma il lotto dopo il file in corso */
  cancelUpload() {
    this.uploadCancelled = true;
  }

  deletePhoto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/photos/delete.php?id=${id}`).pipe(
      tap(() => this.photos.update(photos => photos.filter(p => p.id !== id)))
    );
  }

  updatePhoto(photo: EnpPhoto): Observable<any> {
    const body = new URLSearchParams();
    body.set('id', String(photo.id));
    body.set('title', photo.title ?? '');
    body.set('tag', photo.tag ?? '');
    body.set('eventDate', photo.eventDate ?? '');
    body.set('author', photo.author ?? '');
    body.set('archiveEventId', photo.archiveEventId != null ? String(photo.archiveEventId) : '');
    body.set('eventTypeId', photo.eventTypeId != null ? String(photo.eventTypeId) : '');
    body.set('eventDay', photo.eventDay ?? '');

    return this.http.post(`${this.apiUrl}/photos/update.php`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(() => this.photos.update(photos =>
        photos.map(p => p.id === photo.id ? this.withTypeInfo(photo) : p)
      ))
    );
  }
}
