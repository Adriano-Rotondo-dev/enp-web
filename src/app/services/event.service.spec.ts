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
