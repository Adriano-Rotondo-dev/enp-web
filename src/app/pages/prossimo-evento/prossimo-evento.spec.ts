import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProssimoEventoComponent } from './prossimo-evento';
import { EventService } from '../../services/event.service';

describe('ProssimoEvento', () => {
  let component: ProssimoEventoComponent;
  let fixture: ComponentFixture<ProssimoEventoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProssimoEventoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProssimoEventoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // evento futuro arrivato dal backend, con la lineup indicata
  const showEvent = async (lineup: { time: string; act: string }[]) => {
    const service = TestBed.inject(EventService);
    service.nextEvent.set({
      id: '1', title: 'X', date: new Date(Date.now() + 7 * 86400000).toISOString(), time: '22:00',
      location: 'L', address: 'A', description: '', lineup
    });
    service.nextEventStatus.set('ready');
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement.textContent as string;
  };

  it('senza lineup mostra "Lineup in arrivo"', async () => {
    expect(await showEvent([])).toContain('Lineup in arrivo');
  });

  it('mostra solo le righe con orario e nome', async () => {
    const text = await showEvent([{ time: '22:00', act: 'Dj Set' }, { time: '', act: 'Senza orario' }]);
    expect(component.lineup().length).toBe(1);
    expect(text).toContain('Dj Set');
    expect(text).not.toContain('Senza orario');
    expect(text).not.toContain('Lineup in arrivo');
  });
});
