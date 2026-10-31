import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardArchivioComponent } from './dashboard-archivio';
import { EventType } from '../../models/event.model';

const TYPES: EventType[] = [
  { id: 1, prefix: 'EMONIGHT', label: 'Emo Night', archiveCount: 1, photoCount: 3 },
  { id: 2, prefix: 'EMOXMAS', label: 'Emo Xmas Night', archiveCount: 0, photoCount: 0 }
];

describe('Dashboard - tipologie evento', () => {
  let component: DashboardArchivioComponent;
  let fixture: ComponentFixture<DashboardArchivioComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardArchivioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardArchivioComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    component.eventTypes.set(TYPES);
  });

  it('converte il prefisso in maiuscolo e lo valida', () => {
    component.onNewTypePrefix('emo halloween');
    expect(component.newTypePrefix()).toBe('EMOHALLOWEEN');
    component.newTypeLabel.set('Emo Halloween Night');
    expect(component.canAddType()).toBe(true);

    component.onNewTypePrefix('emo-x');
    expect(component.newTypePrefixError()).toContain('A-Z');
    component.onNewTypePrefix('emonight');
    expect(component.newTypePrefixError()).toBe('Prefisso già esistente');
    expect(component.canAddType()).toBe(false);

    component.addEventType();
    http.expectNone(r => r.url.endsWith('/event-types/add.php'));
  });

  it('aggiunge una tipologia', () => {
    component.onNewTypePrefix('emoanime');
    component.newTypeLabel.set('Emo Anime Night');
    component.addEventType();
    const req = http.expectOne(r => r.url.endsWith('/event-types/add.php'));
    expect(req.request.body).toEqual({ prefix: 'EMOANIME', label: 'Emo Anime Night' });
    req.flush({ id: 3, prefix: 'EMOANIME', label: 'Emo Anime Night' }, { status: 201, statusText: 'Created' });
    expect(component.eventTypes().map(t => t.prefix)).toContain('EMOANIME');
    expect(component.newTypePrefix()).toBe('');
  });

  it('non elimina una tipologia in uso', () => {
    expect(component.typeInUse(TYPES[0])).toBe(true);
    component.deleteEventType(TYPES[0]);
    http.expectNone(r => r.url.includes('/event-types/delete.php'));
  });

  it('disabilita il pulsante di eliminazione e lo spiega', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(el.querySelectorAll('aside li button')) as HTMLButtonElement[];
    const del = buttons.filter(b => b.textContent?.includes('DELETE'));
    expect(del[0].disabled).toBe(true);
    expect(del[1].disabled).toBe(false);
    expect(el.querySelector('#type-in-use-1')?.textContent).toContain('In uso');
  });

  it('durante il salvataggio copre con il loader solo il riquadro che si sta salvando', async () => {
    const render = async () => { fixture.detectChanges(); await fixture.whenStable(); };
    component.startEditType(TYPES[1]);
    component.editingTypeLabel.set('Emo Christmas');
    component.saveTypeEdit();
    await render();
    const el: HTMLElement = fixture.nativeElement;
    const overlays = el.querySelectorAll('app-loader.overlay');
    expect(overlays.length).toBe(1);
    expect(overlays[0].closest('aside')).not.toBeNull();
    http.expectOne(r => r.url.endsWith('/event-types/update.php')).flush({ id: 2, prefix: 'EMOXMAS', label: 'Emo Christmas' });
    await render();
    expect(el.querySelectorAll('app-loader.overlay').length).toBe(0);
  });

  it('rinomina una tipologia', () => {
    component.startEditType(TYPES[1]);
    component.editingTypeLabel.set('Emo Christmas');
    component.saveTypeEdit();
    const req = http.expectOne(r => r.url.endsWith('/event-types/update.php'));
    expect(req.request.body).toEqual({ id: 2, label: 'Emo Christmas' });
    req.flush({ id: 2, prefix: 'EMOXMAS', label: 'Emo Christmas' });
    expect(component.editingTypeId()).toBeNull();
    expect(component.eventTypes()[1].label).toBe('Emo Christmas');
  });
});
