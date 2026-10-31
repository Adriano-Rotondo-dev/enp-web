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

  it('mostra le foto a blocchi di 48 e riparte dal primo blocco cambiando filtro', () => {
    component.allPhotos.set(Array.from({ length: 100 }, (_, i) => ({ id: i + 1, url: `u${i}`, eventTypePrefix: 'EMONIGHT' })));
    expect(component.visiblePhotos().length).toBe(48);
    component.showMorePhotos();
    component.showMorePhotos();
    expect(component.visiblePhotos().length).toBe(100);
    component.activeType.set('EMONIGHT');
    expect(component.visiblePhotos().length).toBe(48);
  });

  it('il lightbox scorre in cerchio e riparte dalla prima se la foto non è più in lista', () => {
    component.allPhotos.set(PHOTOS);
    component.openPhoto(PHOTOS[2]);
    component.nextPhoto();
    expect(component.selectedPhoto()?.id).toBe(1);
    component.prevPhoto();
    expect(component.selectedPhoto()?.id).toBe(3);
    component.setTypeFilter('EMOXMAS');
    component.nextPhoto();
    expect(component.selectedPhoto()?.id).toBe(2);
  });

  it('senza elenco tipologie usa quelle presenti nelle foto e filtra per tipologia', () => {
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

  it('mostra tutte le tipologie, anche quelle ancora senza foto', () => {
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(r => r.url.endsWith('/event-types/get.php')).flush([
      { id: 4, prefix: 'EMOMTV', label: 'Emo MTV Night', archiveCount: 0, photoCount: 0 },
      { id: 1, prefix: 'EMONIGHT', label: 'Emo Night', archiveCount: 1, photoCount: 1 }
    ]);
    component.allPhotos.set(PHOTOS);
    expect(component.availableTypes().map(t => t.prefix)).toEqual(['EMOMTV', 'EMONIGHT', 'EMOXMAS']);
    // nessun filtro scelto: si vedono tutte le foto
    expect(component.photos().length).toBe(3);
    component.setTypeFilter('EMOMTV');
    expect(component.photos()).toEqual([]);
    expect(component.activeTypeLabel()).toBe('Emo MTV Night');
  });

  it('nel lightbox mostra il pulsante per scaricare la foto', async () => {
    component.allPhotos.set(PHOTOS);
    component.openPhoto(PHOTOS[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a[download]');
    expect(link?.textContent?.trim()).toBe('Vuoi scaricare la foto e ripubblicarla? Clicca qui!');
    expect(link?.getAttribute('href')).toMatch(/\/photos\/download\.php\?id=2$/);
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
