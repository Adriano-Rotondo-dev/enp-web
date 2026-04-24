import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NextEvent, ArchiveEvent, EnpPhoto} from '../models/event.model';

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
    { id: 9, vol: 'VOL. 8', name:'NIGHT OF ANIME', date: '21 FEB', description: 'Anime Night with Cyber, CosplayNight and more.', posterUrl: '/poster_placeholder.webp' },
    { id: 8, vol: 'VOL. 7', name: 'NIGHT OF XMAS', date: '19 DIC', description: 'Cold weather for REFRAINED.', posterUrl: '/poster_placeholder.webp' },
    { id: 7, vol: 'VOL. 6', name: 'NIGHT OF HALLOWEEN 2.0', date: '25 OTT', description: 'This is Halloween, everybody make a SCREAM with Nihil', posterUrl: '/poster_placeholder.webp' },
    { id: 6, vol: 'VOL. 5', name: 'NIGHT OF COMICON', date: '14 SET', description: 'Expanding our influence. Yuriko Tiger Dj', posterUrl: '/poster_placeholder.webp' },
    { id: 5, vol: 'VOL. 4', name: 'NIGHT OF MAKERS', date: '10 MAG', description: 'MEET MY MAKER bring Tesla in the Mosh', posterUrl: '/poster_placeholder.webp' },
    { id: 4, vol: 'VOL. 3', name: 'NIGHT OF DIAMONDS', date: '22 MAR', description: 'XDIEMONDX was here', posterUrl: '/poster_placeholder.webp' },
    { id: 3, vol: 'VOL. 2', name: 'NIGHT OF HALLOWEEN', date: '31 OTT', description: 'This Halloween is Ours', posterUrl: '/poster_placeholder.webp' },
    { id: 2, vol: 'VOL. 1', name: 'NIGHT OF REBELLION', date: '14 SET', description: 'Notte di fuoco e lacrime. La famiglia cresce.', posterUrl: '/poster_placeholder.webp' },
    { id: 1, vol: 'VOL. 0', name: 'THE BEGINNING', date: '29 GIU', description: 'Dove tutto è iniziato. Un piccolo locale pieno di emozioni.', posterUrl: '/poster_placeholder.webp' }
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
  archiveEvents = signal<ArchiveEvent[]>(this.mockArchiveEvents);
  photos = signal<EnpPhoto[]>(this.mockPhotos);
  // songRequests = signal<SongRequest[]>([])

  // ─── NEXT EVENT ───

  loadNextEvent(): Observable<NextEvent> {
    if (this.USE_BACKEND) {
      return this.http.get<NextEvent>(`${this.apiUrl}/get-event.php`).pipe(
        tap(event => this.nextEvent.set(event)),
        catchError(err => {
          console.error('Errore caricamento evento:', err);
          return of(this.mockNextEvent);
        })
      );
    }
    this.nextEvent.set(this.mockNextEvent);
    return of(this.mockNextEvent);
  }

  updateNextEvent(event: NextEvent): Observable<any> {
    if (this.USE_BACKEND) {
      return this.http.post(`${this.apiUrl}/update-event.php`, event).pipe(
        tap(() => this.nextEvent.set(event)),
        catchError(err => { throw err; })
      );
    }
    this.nextEvent.set(event);
    return of({ success: true });
  }

  // ─── ARCHIVE EVENTS ───

  loadArchiveEvents(): Observable<ArchiveEvent[]> {
    if (this.USE_BACKEND) {
      return this.http.get<ArchiveEvent[]>(`${this.apiUrl}/archive-events/get.php`).pipe(
        tap(events => this.archiveEvents.set(events)),
        catchError(() => of(this.mockArchiveEvents))
      );
    }
    this.archiveEvents.set(this.mockArchiveEvents);
    return of(this.mockArchiveEvents);
  }

  addToArchive(event: ArchiveEvent, file: File | null): Observable<any> {
    if (this.USE_BACKEND) {
      const formData = new FormData();
      formData.append('event', JSON.stringify(event));
      if (file) formData.append('file', file);
      return this.http.post(`${this.apiUrl}/archive-events/add.php`, formData).pipe(
        tap((res:any) => {
          const newEvent = { ...event, posterUrl: res.url || event.posterUrl };
          
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
    return of({ success: true });
  }

 updateArchiveEvent(event: ArchiveEvent, file: File | null): Observable<any> {
  if (this.USE_BACKEND) {
const formData = new FormData();
formData.append('event', JSON.stringify(event));
if (file) {
      formData.append('file', file);
    }

return this.http.post(`${this.apiUrl}/archive-events/update.php`, formData).pipe(
      tap((res: any) => {
        this.archiveEvents.update(events =>
          events.map(e => e.id === event.id 
            ? { ...event, posterUrl: res.url || event.posterUrl } 
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
  return of({ success: true });
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

  loadPhotos(): Observable<EnpPhoto[]> {
    if (this.USE_BACKEND) {
      return this.http.get<EnpPhoto[]>(`${this.apiUrl}/photos/get.php`).pipe(
        tap(photos => this.photos.set(photos)),
        catchError(() => of(this.mockPhotos))
      );
    }
    this.photos.set(this.mockPhotos);
    return of(this.mockPhotos);
  }

uploadPhoto(photo: Omit<EnpPhoto, 'id'>, file: File): Observable<any> {
  if (this.USE_BACKEND) {
    const formData = new FormData();
    formData.append('photo', JSON.stringify({
      title: photo.title,
      tag: photo.tag,
      eventDate: photo.eventDate ?? '',
      author: photo.author ?? '',
      archiveEventId: photo.archiveEventId ?? null
    }));
    formData.append('file', file);
    return this.http.post<EnpPhoto>(`${this.apiUrl}/photos/upload.php`, formData).pipe(
      tap(saved => this.photos.update(photos => [saved, ...photos])),
      catchError(err => { throw err; })
    );
  }
  const mockPhoto: EnpPhoto = {
    ...photo,
    id: this.photos().length + 1,
    url: URL.createObjectURL(file)
  };
  this.photos.update(photos => [mockPhoto, ...photos]);
  return of({ success: true });
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
    body.set('title', photo.title);
    body.set('tag', photo.tag);
    body.set('eventDate', photo.eventDate ?? '');
    body.set('author', photo.author ?? '');
    body.set('archiveEventId', photo.archiveEventId != null ? String(photo.archiveEventId) : '');

    return this.http.post(`${this.apiUrl}/photos/update.php`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(() => {
        this.photos.update(photos =>
          photos.map(p => p.id === photo.id ? photo : p)
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