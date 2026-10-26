import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ArchivioFotoComponent } from './archivio-foto';
import { EnpPhoto } from '../../models/event.model';

const PHOTOS: EnpPhoto[] = [
  { id: 1, url: 'a', title: '', tag: 'Crowd', eventTypeId: 1, eventTypePrefix: 'EMONIGHT', eventTypeLabel: 'Emo Night', eventDay: '2026-10-17', archiveEventId: 5 },
  { id: 2, url: 'b', title: 'Xmas', tag: '', eventTypeId: 2, eventTypePrefix: 'EMOXMAS', eventTypeLabel: 'Emo Xmas Night', eventDay: '2025-12-24', archiveEventId: 6 },
  { id: 3, url: 'c', title: null, tag: null, eventTypeId: null, eventTypePrefix: null, eventTypeLabel: null, eventDay: null, archiveEventId: null }
];

describe('ArchivioFotoComponent', () => {
  let component: ArchivioFotoComponent;
  let fixture: ComponentFixture<ArchivioFotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivioFotoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivioFotoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offre solo le tipologie che hanno foto e filtra per tipologia', () => {
    component.allPhotos.set(PHOTOS);
    expect(component.availableTypes()).toEqual([
      { prefix: 'EMONIGHT', label: 'Emo Night' },
      { prefix: 'EMOXMAS', label: 'Emo Xmas Night' }
    ]);
    component.setTypeFilter('EMOXMAS');
    expect(component.photos().map(p => p.id)).toEqual([2]);
    expect(component.activeTypeLabel()).toBe('Emo Xmas Night');
    component.resetFilters();
    expect(component.photos().length).toBe(3);
  });

  it('scegliendo una serata azzera la tipologia', () => {
    component.allPhotos.set(PHOTOS);
    component.setTypeFilter('EMONIGHT');
    component.setEventFilter(5);
    expect(component.activeType()).toBeNull();
    expect(component.photos().map(p => p.id)).toEqual([1]);
  });

  it('usa tipologia e data come titolo di ripiego', () => {
    expect(component.photoTitle(PHOTOS[0])).toBe('Emo Night 17.10.2026');
    expect(component.photoTitle(PHOTOS[1])).toBe('Xmas');
    expect(component.photoTitle(PHOTOS[2])).toBe('');
  });

  it('mostra il filtro Tipologia al posto del Tag', async () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/photos/get.php')).flush(PHOTOS);
    http.expectOne(r => r.url.endsWith('/archive-events/get.php')).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('label[for="filter-type"]')?.textContent).toContain('Tipologia');
    expect(el.textContent).not.toContain('All tags');
    expect(el.textContent).toContain('Emo Night 17.10.2026');
  });
});

describe('ArchivioFotoComponent - link con ?tipo=', () => {
  it('applica il filtro tipologia dal query param', async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivioFotoComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParams: of({ tipo: 'emonight' }) } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(ArchivioFotoComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.allPhotos.set(PHOTOS);
    expect(component.activeType()).toBe('EMONIGHT');
    expect(component.photos().map(p => p.id)).toEqual([1]);
  });
});
