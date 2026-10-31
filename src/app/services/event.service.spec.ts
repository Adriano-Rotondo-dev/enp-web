import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EventService } from './event.service';

describe('EventService - prossimo evento', () => {
  let service: EventService;
  let http: HttpTestingController;

  const eventOn = (date: Date) => ({
    id: '1', title: 'Test', date: date.toISOString(), time: '21:00', location: 'X',
    address: 'Y', mapsUrl: '', description: '', price: 7, lineup: []
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  it('non mostra eventi finché il backend non risponde', () => {
    expect(service.nextEventStatus()).toBe('loading');
    expect(service.hasUpcomingEvent()).toBe(false);
  });

  it('mostra un evento futuro arrivato dal backend', () => {
    service.loadNextEvent().subscribe();
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(eventOn(new Date(Date.now() + 7 * 86400000)));
    expect(service.hasUpcomingEvent()).toBe(true);
  });

  it('non mostra un evento già passato', () => {
    service.loadNextEvent().subscribe();
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(eventOn(new Date(Date.now() - 3 * 86400000)));
    expect(service.nextEventStatus()).toBe('ready');
    expect(service.hasUpcomingEvent()).toBe(false);
  });

  it('non mostra i dati mock se il backend fallisce', () => {
    service.loadNextEvent().subscribe();
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(service.nextEventStatus()).toBe('unavailable');
    expect(service.hasUpcomingEvent()).toBe(false);
  });

  it('se il backend fallisce non restituisce mai l\'evento finto', () => {
    const received: unknown[] = [];
    service.loadNextEvent().subscribe(e => received.push(e));
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(received).toEqual([]);
  });

  it('se il backend fallisce dopo un caricamento riuscito restituisce l\'ultimo evento vero', () => {
    const real = eventOn(new Date(Date.now() + 86400000));
    service.loadNextEvent().subscribe();
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(real);
    const received: unknown[] = [];
    service.loadNextEvent().subscribe(e => received.push(e));
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(received).toEqual([real]);
  });
});

describe('EventService - archivio e galleria', () => {
  let service: EventService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  it('non mostra un archivio finto se il backend fallisce', () => {
    service.loadArchiveEvents().subscribe();
    http.expectOne(r => r.url.endsWith('/archive-events/get.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(service.archiveStatus()).toBe('unavailable');
    expect(service.archiveEvents()).toEqual([]);
  });

  it('non mostra una galleria finta se il backend fallisce', () => {
    service.loadPhotos().subscribe();
    http.expectOne(r => r.url.endsWith('/photos/get.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(service.photosStatus()).toBe('unavailable');
    expect(service.photos()).toEqual([]);
  });

  it('mostra i poster reali arrivati dal backend', () => {
    service.loadArchiveEvents().subscribe();
    const poster = 'https://enpback.altervista.org/backend/uploads/posters/p.jpg';
    http.expectOne(r => r.url.endsWith('/archive-events/get.php'))
      .flush([{ id: 16, vol: 'VOL. 9', name: 'X', date: '8 MAG', description: '', posterUrl: poster }]);
    expect(service.archiveStatus()).toBe('ready');
    expect(service.archiveEvents()[0].posterUrl).toBe(poster);
  });
});

describe('EventService - caricamento foto a lotti', () => {
  let service: EventService;
  let http: HttpTestingController;
  const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });
  const isUpload = (r: { url: string }) => r.url.endsWith('/photos/upload.php');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('invia un file alla volta e riassume 201, 409 e 415', () => {
    let summary: any = null;
    service.uploadPhotos(
      [file('EMONIGHT-17102026-001.jpg'), file('EMONIGHT-17102026-002.jpg'), file('IMG_1.jpg'), file('strano.webp')],
      { tag: 'Crowd' }
    ).subscribe(s => summary = s);

    // il primo file è in invio, il secondo aspetta
    const first = http.expectOne(isUpload);
    expect(service.uploadProgress()).toEqual({ done: 0, total: 4, current: 'EMONIGHT-17102026-001.jpg' });
    expect((first.request.body as FormData).get('photo')).toBe('{"tag":"Crowd"}');
    first.flush({ id: 1, url: 'u1', parsed: true, autoLinked: true }, { status: 201, statusText: 'Created' });

    expect(service.uploadProgress()?.done).toBe(1);
    http.expectOne(isUpload).flush({ error: 'Foto già caricata', existingId: 1 }, { status: 409, statusText: 'Conflict' });
    http.expectOne(isUpload).flush({ id: 2, url: 'u2', parsed: false, autoLinked: false }, { status: 201, statusText: 'Created' });
    http.expectOne(isUpload).flush({ error: 'Formato non supportato' }, { status: 415, statusText: 'Unsupported Media Type' });

    expect(summary).toEqual({
      caricate: 2, collegateAuto: 1, nonConformi: 1, duplicate: 1,
      errori: [{ nome: 'strano.webp', motivo: 'Formato non supportato' }],
      nomiNonConformi: ['IMG_1.jpg'], nomiDuplicati: ['EMONIGHT-17102026-002.jpg'], annullato: false
    });
    expect(service.uploadProgress()).toBeNull();
    // la lista non cambia durante il lotto: la ricarica la dashboard alla fine
    expect(service.photos()).toEqual([]);
  });

  it('si ferma alla sessione scaduta', () => {
    let summary: any = null;
    service.uploadPhotos([file('a.jpg'), file('b.jpg')]).subscribe(s => summary = s);
    http.expectOne(isUpload).flush({ error: 'Non autorizzato' }, { status: 401, statusText: 'Unauthorized' });
    http.expectNone(isUpload);
    expect(summary.errori.length).toBe(2);
    expect(summary.errori[1].motivo).toContain('Sessione scaduta');
  });

  it('annulla i file non ancora inviati', () => {
    let summary: any = null;
    service.uploadPhotos([file('a.jpg'), file('b.jpg')]).subscribe(s => summary = s);
    service.cancelUpload();
    http.expectOne(isUpload).flush({ id: 1, url: 'u', parsed: false }, { status: 201, statusText: 'Created' });
    http.expectNone(isUpload);
    expect(summary.caricate).toBe(1);
    expect(summary.annullato).toBe(true);
  });

  it('non invia il JSON photo se titolo, tag e serata sono vuoti', () => {
    service.uploadPhoto({ title: ' ', tag: '' }, file('a.jpg')).subscribe();
    const req = http.expectOne(isUpload);
    expect((req.request.body as FormData).has('photo')).toBe(false);
    expect((req.request.body as FormData).get('file')).toBeTruthy();
    req.flush({ id: 1, url: 'u' }, { status: 201, statusText: 'Created' });
  });

  it('invia tipologia e data nella modifica della foto', () => {
    service.updatePhoto({ id: 3, url: 'u', title: null, tag: null, eventTypeId: 2, eventDay: '2026-10-17' }).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/photos/update.php'));
    expect(req.request.body).toContain('eventTypeId=2');
    expect(req.request.body).toContain('eventDay=2026-10-17');
    expect(req.request.body).toContain('title=&');
    req.flush({ success: true });
  });
});

describe('EventService - tipologie evento', () => {
  let service: EventService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carica, aggiunge, rinomina ed elimina', () => {
    service.loadEventTypes().subscribe();
    http.expectOne(r => r.url.endsWith('/event-types/get.php'))
      .flush([{ id: 1, prefix: 'EMONIGHT', label: 'Emo Night', archiveCount: 2, photoCount: 10 }]);
    expect(service.eventTypes().length).toBe(1);

    service.addEventType(' emoxmas ', 'Emo Xmas Night').subscribe();
    const add = http.expectOne(r => r.url.endsWith('/event-types/add.php'));
    expect(add.request.body).toEqual({ prefix: 'EMOXMAS', label: 'Emo Xmas Night' });
    add.flush({ id: 2, prefix: 'EMOXMAS', label: 'Emo Xmas Night' }, { status: 201, statusText: 'Created' });
    expect(service.eventTypes().map(t => t.prefix)).toEqual(['EMONIGHT', 'EMOXMAS']);
    expect(service.eventTypes()[1].photoCount).toBe(0);

    service.photos.set([{ id: 9, url: 'u', eventTypeId: 1, eventTypeLabel: 'Emo Night' }]);
    service.updateEventType(1, 'Emo Night Palermo').subscribe();
    const upd = http.expectOne(r => r.url.endsWith('/event-types/update.php'));
    expect(upd.request.body).toEqual({ id: 1, label: 'Emo Night Palermo' });
    upd.flush({ id: 1, prefix: 'EMONIGHT', label: 'Emo Night Palermo' });
    expect(service.eventTypes()[0].label).toBe('Emo Night Palermo');
    expect(service.photos()[0].eventTypeLabel).toBe('Emo Night Palermo');

    service.deleteEventType(2).subscribe();
    const del = http.expectOne(r => r.url.includes('/event-types/delete.php'));
    expect(del.request.method).toBe('DELETE');
    expect(del.request.urlWithParams).toContain('id=2');
    del.flush({ success: true });
    expect(service.eventTypes().map(t => t.id)).toEqual([1]);
  });

  it('manda tipologia e data della serata, null se vuote', () => {
    service.addToArchive({ id: 0, vol: 'VOL. 9', name: 'X', date: '', description: '', posterUrl: '', eventTypeId: null, eventDay: '' }, null).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/archive-events/add.php'));
    const sent = JSON.parse((req.request.body as FormData).get('event') as string);
    expect(sent.eventTypeId).toBeNull();
    expect(sent.eventDay).toBeNull();
    req.flush({ success: true, linkedPhotos: 0 });
  });

  it('non rimanda l\'anteprima base64 del poster insieme al file', () => {
    const preview = 'data:image/webp;base64,' + 'A'.repeat(1000);
    service.updateArchiveEvent({ id: 3, vol: 'VOL. 1', name: 'X', date: '', description: '', posterUrl: preview }, new File(['x'], 'p.webp')).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/archive-events/update.php'));
    const body = req.request.body as FormData;
    expect(JSON.parse(body.get('event') as string).posterUrl).toBeUndefined();
    expect(body.get('file')).toBeTruthy();
    req.flush({ success: true, posterUrl: 'https://x/p.webp' });
  });
});
