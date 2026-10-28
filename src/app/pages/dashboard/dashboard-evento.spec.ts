import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardEventoComponent } from './dashboard-evento';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

const EVENT = {
  id: '1', title: 'X', date: '2026-10-17T00:00:00', time: '22:00', location: '', address: '', description: '', lineup: []
};

describe('Dashboard - prossimo evento', () => {
  let component: DashboardEventoComponent;
  let fixture: ComponentFixture<DashboardEventoComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEventoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardEventoComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  it('se l\'evento non si carica il modulo resta vuoto e compare un avviso', () => {
    const toast = TestBed.inject(ToastService);
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush('errore', { status: 500, statusText: 'Server Error' });
    expect(component.editableEvent().title).toBe('');
    expect(toast.toasts().some(t => t.type === 'error')).toBe(true);
  });

  it('mostra la data dell\'evento nel campo Data (il backend la manda con l\'ora)', async () => {
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(EVENT);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input[type=date]') as HTMLInputElement;
    expect(input.value).toBe('2026-10-17');
  });

  it('con la lineup vuota offre comunque 4 righe da compilare', () => {
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(EVENT);
    expect(component.editableEvent().lineup.length).toBe(4);
  });

  it('le modifiche non salvate non cambiano l\'evento mostrato nel sito', () => {
    http.expectOne(r => r.url.endsWith('/get-event.php')).flush(EVENT);
    component.editableEvent().title = 'Bozza';
    expect(TestBed.inject(EventService).nextEvent().title).toBe('X');
  });
});
