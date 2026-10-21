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
