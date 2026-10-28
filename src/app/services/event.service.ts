import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, defer, EMPTY } from 'rxjs';
import { tap, catchError, concatMap, finalize, map, toArray } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NextEvent, ArchiveEvent, EnpPhoto, EventType, PhotoUploadMeta, UploadedPhoto, UploadProgress, UploadSummary
} from '../models/event.model';

export type LoadStatus = 'loading' | 'ready' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class EventService {

  //! Unica riga da cambiare quando il backend è pronto
  private USE_BACKEND = true;
  // cambiando environment.prod.ts in produzione Angular userà automaticamente quello corretto
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient);

  // ─── DATI MOCK ───

  private mockNextEvent: NextEvent = {
    id: '1',
    title: 'The Next Chapter',
    date: '2026-05-08T21:30:00',
    time: '21:30',
    location: 'MindHouse',
    address: 'Via San Lorenzo, 273/A, Palermo',
    mapsUrl: 'https://maps.google.com/?cid=14345277083304058247&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ',
    description: 'Tutti i dettagli sulla prossima Emo Night Palermo.',
    price: 7,
    lineup: [
      { time: '21:30', act: 'Opening & warmup' },
      { time: '22:30', act: 'Main Set' },
      { time: '00:00', act: 'Dj Set' },
      { time: '01:30', act: 'Closing Act' }
    ]
  };

  private mockArchiveEvents: ArchiveEvent[] = [
    { id: 9, vol: 'VOL. 8', name:'NIGHT OF ANIME', date: '21 FEB', description: 'Anime Night with Cyber, CosplayNight and more.', posterUrl: '/emp_1.webp' },
    { id: 8, vol: 'VOL. 7', name: 'NIGHT OF XMAS', date: '19 DIC', description: 'Cold weather for REFRAINED.', posterUrl: '/emp_1.webp' },
    { id: 7, vol: 'VOL. 6', name: 'NIGHT OF HALLOWEEN 2.0', date: '25 OTT', description: 'This is Halloween, everybody make a SCREAM with Nihil', posterUrl: '/emp_1.webp' },
    { id: 6, vol: 'VOL. 5', name: 'NIGHT OF COMICON', date: '14 SET', description: 'Expanding our influence. Yuriko Tiger Dj', posterUrl: '/emp_1.webp' },
    { id: 5, vol: 'VOL. 4', name: 'NIGHT OF MAKERS', date: '10 MAG', description: 'MEET MY MAKER bring Tesla in the Mosh', posterUrl: '/emp_1.webp' },
    { id: 4, vol: 'VOL. 3', name: 'NIGHT OF DIAMONDS', date: '22 MAR', description: 'XDIEMONDX was here', posterUrl: '/emp_1.webp' },
    { id: 3, vol: 'VOL. 2', name: 'NIGHT OF HALLOWEEN', date: '31 OTT', description: 'This Halloween is Ours', posterUrl: '/emp_1.webp' },
    { id: 2, vol: 'VOL. 1', name: 'NIGHT OF REBELLION', date: '14 SET', description: 'Notte di fuoco e lacrime. La famiglia cresce.', posterUrl: '/emp_1.webp' },
    { id: 1, vol: 'VOL. 0', name: 'THE BEGINNING', date: '29 GIU', description: 'Dove tutto è iniziato. Un piccolo locale pieno di emozioni.', posterUrl: '/emp_1.webp' }
  ];

  private mockPhotos: EnpPhoto[] = [
    { id: 1, url: '/emp_1.webp', title: 'Moshpit Vol. 1', tag: 'MindHouse', eventDate:'x', author:'x' },
    { id: 2, url: '/emp_2.webp', title: 'Sad Souls', tag: 'Crowd', eventDate:'x', author:'x' },
    { id: 3, url: '/emp_3.webp', title: 'Punk Vibes', tag: 'Stage', eventDate:'x', author:'x' },
    { id: 4, url: '/emp_1.webp', title: 'Nightline', tag: 'Backstage', eventDate:'x', author:'x' },
    { id: 5, url: '/emp_2.webp', title: 'Raw Emotions', tag: 'Concert', eventDate:'x', author:'x' },
    { id: 6, url: '/emp_3.webp', title: 'Elders', tag: 'Elder Crew', eventDate:'x', author:'x' }
  ];

  // ─── SEGNALI CENTRALI ───

  nextEvent = signal<NextEvent>(this.mockNextEvent);
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
  // archivio e foto partono vuoti: i mock si usano solo con USE_BACKEND = false
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
    if (this.USE_BACKEND) {
      return this.http.get<NextEvent>(`${this.apiUrl}/get-event.php`).pipe(
        tap(event => {
          this.nextEvent.set(event);
          this.nextEventStatus.set('ready');
        }),
        catchError(err => {
          console.error('Errore caricamento evento:', err);
          // niente dati finti in pagina: le viste mostrano lo "Stay Tuned"
          if (this.nextEventStatus() !== 'ready') this.nextEventStatus.set('unavailable');
          // mai l'evento finto: la dashboard lo caricherebbe nel modulo e si potrebbe salvare
          return this.nextEventStatus() === 'ready' ? of(this.nextEvent()) : EMPTY;
        })
      );
    }
    this.nextEvent.set(this.mockNextEvent);
    this.nextEventStatus.set('ready');
    return of(this.mockNextEvent);
  }

  updateNextEvent(event: NextEvent): Observable<any> {
    if (this.USE_BACKEND) {
      return this.http.post(`${this.apiUrl}/update-event.php`, event).pipe(
        tap(() => {
          this.nextEvent.set(event);
          this.nextEventStatus.set('ready');
        }),
        catchError(err => { throw err; })
      );
    }
    this.nextEvent.set(event);
    return of({ success: true });
  }

  // ─── TIPOLOGIE EVENTO ───

  loadEventTypes(): Observable<EventType[]> {
    if (this.USE_BACKEND) {
      return this.http.get<EventType[]>(`${this.apiUrl}/event-types/get.php`).pipe(
        tap(types => this.eventTypes.set(types)),
        catchError(err => {
          console.error('Errore caricamento tipologie:', err);
          return of(this.eventTypes());
        })
      );
    }
    return of(this.eventTypes());
  }

  addEventType(prefix: string, label: string): Observable<EventType> {
    const body = { prefix: prefix.trim().toUpperCase(), label: label.trim() };
    const add = (saved: EventType) => this.eventTypes.update(types =>
      [...types, { archiveCount: 0, photoCount: 0, ...saved }]
        .sort((a, b) => a.prefix.localeCompare(b.prefix))
    );
    if (this.USE_BACKEND) {
      return this.http.post<EventType>(`${this.apiUrl}/event-types/add.php`, body).pipe(tap(add));
    }
    const saved = { id: Date.now(), ...body };
    add(saved);
    return of(saved);
  }

  updateEventType(id: number, label: string): Observable<EventType> {
    const rename = (saved: Pick<EventType, 'id' | 'label'>) => {
      this.eventTypes.update(types => types.map(t => t.id === saved.id ? { ...t, label: saved.label } : t));
      // le serate e le foto mostrano il nome della tipologia: lo teniamo allineato
      this.archiveEvents.update(events => events.map(e =>
        e.eventTypeId === saved.id ? { ...e, eventTypeLabel: saved.label } : e));
      this.photos.update(photos => photos.map(p =>
        p.eventTypeId === saved.id ? { ...p, eventTypeLabel: saved.label } : p));
    };
    const body = { id, label: label.trim() };
    if (this.USE_BACKEND) {
      return this.http.post<EventType>(`${this.apiUrl}/event-types/update.php`, body).pipe(tap(saved => rename(saved)));
    }
    rename(body);
    return of({ ...this.eventTypes().find(t => t.id === id)!, label: body.label });
  }

  deleteEventType(id: number): Observable<any> {
    const remove = () => this.eventTypes.update(types => types.filter(t => t.id !== id));
    if (this.USE_BACKEND) {
      return this.http.delete(`${this.apiUrl}/event-types/delete.php?id=${id}`).pipe(tap(remove));
    }
    remove();
    return of({ success: true });
  }

  // completa prefisso e nome della tipologia a partire dall'id
  private withTypeInfo<T extends { eventTypeId?: number | null }>(item: T): T {
    const type = item.eventTypeId != null ? this.eventTypes().find(t => t.id === item.eventTypeId) : undefined;
    return { ...item, eventTypePrefix: type?.prefix ?? null, eventTypeLabel: type?.label ?? null };
  }

  // corpo JSON della serata: tipologia e data vuote diventano null
  private archivePayload(event: ArchiveEvent) {
    return {
      ...event,
      eventTypeId: event.eventTypeId ?? null,
      eventDay: event.eventDay || null
    };
  }

  // ─── ARCHIVE EVENTS ───

  loadArchiveEvents(): Observable<ArchiveEvent[]> {
    if (this.USE_BACKEND) {
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
  this.archiveEvents.set(this.mockArchiveEvents);
  this.archiveStatus.set('ready');
  return of(this.mockArchiveEvents);
}

  // la risposta contiene anche linkedPhotos: le foto collegate in automatico
  addToArchive(event: ArchiveEvent, file: File | null): Observable<any> {
    if (this.USE_BACKEND) {
      const formData = new FormData();
      formData.append('event', JSON.stringify(this.archivePayload(event)));
      if (file) formData.append('file', file);
      return this.http.post(`${this.apiUrl}/archive-events/add.php`, formData).pipe(
        tap((res:any) => {
          const newEvent = this.withTypeInfo({ ...event, posterUrl: res?.posterUrl || event.posterUrl });

          this.archiveEvents.update(events =>
            [newEvent,...events].sort((a, b) => b.id - a.id)
          );
        }),
        catchError(err => { throw err; })
      );
    }
    this.archiveEvents.update(events =>
      [...events, event].sort((a, b) => b.id - a.id)
    );
    return of({ success: true, linkedPhotos: 0 });
  }

 updateArchiveEvent(event: ArchiveEvent, file: File | null): Observable<any> {
  if (this.USE_BACKEND) {
const formData = new FormData();
formData.append('event', JSON.stringify(this.archivePayload(event)));
if (file) {
      formData.append('file', file);
    }

return this.http.post(`${this.apiUrl}/archive-events/update.php`, formData).pipe(
      tap((res: any) => {
        this.archiveEvents.update(events =>
          events.map(e => e.id === event.id
            ? this.withTypeInfo({ ...event, posterUrl: res?.posterUrl || event.posterUrl })
            : e
          )
        );
      }),
      catchError(err => { throw err; })
    );
  }
this.archiveEvents.update(events =>
    events.map(e => e.id === event.id ? event : e)
  );
  return of({ success: true, linkedPhotos: 0 });
}

deleteArchiveEvent(id: number): Observable<any> {
  if (this.USE_BACKEND) {
    return this.http.delete(`${this.apiUrl}/archive-events/delete.php?id=${id}`).pipe(
      tap(() => {
        this.archiveEvents.update(events => events.filter(e => e.id !== id));
      }),
      catchError(err => { throw err; })
    );
  }
  this.archiveEvents.update(events => events.filter(e => e.id !== id));
  return of({ success: true });
}

  // ─── PHOTOS ───

  // Link di download pubblico: il backend invia la foto come allegato con il nome originale
  photoDownloadUrl(id: number): string {
    return `${this.apiUrl}/photos/download.php?id=${id}`;
  }

  loadPhotos(): Observable<EnpPhoto[]> {
    if (this.USE_BACKEND) {
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
    this.photos.set(this.mockPhotos);
    this.photosStatus.set('ready');
    return of(this.mockPhotos);
  }

// Titolo, tag, autore e serata sono facoltativi: si inviano solo se compilati.
// Senza serata esplicita il backend collega la foto in base al nome del file.
uploadPhoto(meta: PhotoUploadMeta, file: File): Observable<UploadedPhoto> {
  if (this.USE_BACKEND) {
    const formData = new FormData();
    const photo: Record<string, string | number> = {};
    if (meta.title?.trim()) photo['title'] = meta.title.trim();
    if (meta.tag?.trim()) photo['tag'] = meta.tag.trim();
    if (meta.author?.trim()) photo['author'] = meta.author.trim();
    if (meta.archiveEventId != null) photo['archiveEventId'] = meta.archiveEventId;
    if (Object.keys(photo).length) formData.append('photo', JSON.stringify(photo));
    formData.append('file', file);
    return this.http.post<UploadedPhoto>(`${this.apiUrl}/photos/upload.php`, formData).pipe(
      tap(saved => this.photos.update(photos => [saved, ...photos])),
      catchError(err => { throw err; })
    );
  }
  const mockPhoto: UploadedPhoto = {
    ...meta,
    id: this.photos().length + 1,
    url: URL.createObjectURL(file),
    originalName: file.name,
    parsed: false,
    autoLinked: false
  };
  this.photos.update(photos => [mockPhoto, ...photos]);
  return of(mockPhoto);
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
    if (this.USE_BACKEND) {
      return this.http.delete(`${this.apiUrl}/photos/delete.php?id=${id}`).pipe(
        tap(() => this.photos.update(photos => photos.filter(p => p.id !== id))),
        catchError(err => { throw err; })
      );
    }
    this.photos.update(photos => photos.filter(p => p.id !== id));
    return of({ success: true });
  }

updatePhoto(photo: EnpPhoto): Observable<any> {
  if (this.USE_BACKEND) {
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
      tap(() => {
        this.photos.update(photos =>
          photos.map(p => p.id === photo.id ? this.withTypeInfo(photo) : p)
        );
      }),
      catchError(err => { throw err; })
    );
  }
  this.photos.update(photos =>
    photos.map(p => p.id === photo.id ? photo : p)
  );
  return of({ success: true });
}


}
