import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard';
import { EnpPhoto, EventType } from '../../models/event.model';

const TYPES: EventType[] = [
  { id: 1, prefix: 'EMONIGHT', label: 'Emo Night', archiveCount: 1, photoCount: 3 },
  { id: 2, prefix: 'EMOXMAS', label: 'Emo Xmas Night', archiveCount: 0, photoCount: 0 }
];

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('modifica una foto e invia i nuovi metadati al backend', () => {
    const photo = { id: 7, url: 'https://x/p.webp', title: 'Vecchio', tag: 'Crowd', eventDate: '', author: '', archiveEventId: null };
    component.startEditPhoto(photo);
    component.editingPhoto()!.title = 'Nuovo titolo';
    component.editingPhoto()!.archiveEventId = 16;
    component.editingPhoto()!.eventTypeId = 2;
    component.editingPhoto()!.eventDay = '2025-12-24';
    component.savePhotoEdit();

    const req = http.expectOne(r => r.url.endsWith('/photos/update.php'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toContain('title=Nuovo+titolo');
    expect(req.request.body).toContain('archiveEventId=16');
    expect(req.request.body).toContain('eventTypeId=2');
    expect(req.request.body).toContain('eventDay=2025-12-24');
    req.flush({ success: true });
    expect(component.editingPhoto()).toBeNull();
  });

  it('salva una foto anche senza titolo e tag', () => {
    component.startEditPhoto({ id: 7, url: 'https://x/p.webp', title: null, tag: null, archiveEventId: null });
    component.savePhotoEdit();
    const req = http.expectOne(r => r.url.endsWith('/photos/update.php'));
    expect(req.request.body).toContain('title=&tag=&');
    req.flush({ success: true });
    expect(component.editingPhoto()).toBeNull();
  });

  it('scegliendo la serata completa tipologia e data vuote', () => {
    component.archiveEvents.set([
      { id: 5, vol: 'VOL. 9', name: 'X', date: '', description: '', posterUrl: '', eventTypeId: 1, eventDay: '2026-10-17' }
    ]);
    component.startEditPhoto({ id: 7, url: 'u', archiveEventId: null });
    component.onEditPhotoEventChange(5);
    expect(component.editingPhoto()).toEqual(expect.objectContaining({ archiveEventId: 5, eventTypeId: 1, eventDay: '2026-10-17' }));
  });

  describe('gestione foto', () => {
    const many = (n: number, extra: Partial<EnpPhoto> = {}): EnpPhoto[] =>
      Array.from({ length: n }, (_, i) => ({ id: i + 1, url: `u${i}`, archiveEventId: i % 2 ? null : 5, ...extra }));

    it('mostra le foto non collegate', () => {
      component.photos.set(many(10));
      expect(component.unlinkedCount()).toBe(5);
      component.setPhotoView('non-collegate');
      expect(component.filteredPhotos().every(p => p.archiveEventId == null)).toBe(true);
      expect(component.filteredPhotos().length).toBe(5);
    });

    it('filtra per tipologia, serata e giorno', () => {
      component.photos.set([
        { id: 1, url: 'a', eventTypeId: 1, eventDay: '2026-10-17', archiveEventId: 5 },
        { id: 2, url: 'b', eventTypeId: 1, eventDay: '2026-10-18', archiveEventId: null },
        { id: 3, url: 'c', eventTypeId: 2, eventDay: '2026-10-17', archiveEventId: 6 }
      ]);
      component.setPhotoFilter('type', 1);
      expect(component.filteredPhotos().map(p => p.id)).toEqual([1, 2]);
      component.setPhotoFilter('day', '2026-10-17');
      expect(component.filteredPhotos().map(p => p.id)).toEqual([1]);
      component.resetPhotoFilters();
      component.setPhotoFilter('event', 6);
      expect(component.filteredPhotos().map(p => p.id)).toEqual([3]);
    });

    it('mostra le foto a blocchi di 48', () => {
      component.photos.set(many(100));
      expect(component.visiblePhotos().length).toBe(48);
      component.showMorePhotos();
      expect(component.visiblePhotos().length).toBe(96);
      component.showMorePhotos();
      expect(component.visiblePhotos().length).toBe(100);
      // cambiando filtro si riparte dal primo blocco
      component.setPhotoView('non-collegate');
      expect(component.visibleCount()).toBe(48);
    });
  });

  describe('caricamento a lotti', () => {
    beforeEach(() => {
      component.eventTypes.set(TYPES);
      component.archiveEvents.set([
        { id: 5, vol: 'VOL. 9', name: 'Emo Night', date: '', description: '', posterUrl: '', eventTypeId: 1, eventDay: '2026-10-17' }
      ]);
    });

    it('scarta i file che non sono immagini e mostra l\'anteprima', () => {
      component.photos.set([{ id: 1, url: 'u', originalName: 'EMONIGHT-17102026-002.jpg' }]);
      component.addPendingFiles([
        file('EMONIGHT-17102026-001.jpg'), file('EMONIGHT-17102026-002.jpg'), file('EMOXMAS-24122025-001.png'),
        file('IMG_1.jpg'), file('note.txt'), file('.DS_Store')
      ]);
      expect(component.skippedFiles()).toBe(2);
      const rows = component.uploadPreview();
      expect(rows.length).toBe(4);
      expect(rows[0].parsed.conforme).toBe(true);
      expect(rows[0].serata?.id).toBe(5);
      expect(rows[1].giaCaricata).toBe(true);
      expect(rows[2].parsed.eventType?.prefix).toBe('EMOXMAS');
      expect(rows[2].serata).toBeNull();
      expect(rows[3].parsed.conforme).toBe(false);
      expect(component.uploadPreviewStats()).toEqual({ totale: 4, conformi: 3, collegate: 2, giaCaricate: 1, troppoGrandi: 0 });
    });

    it('segnala prima dell\'invio i file oltre 5 MB', () => {
      const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'EMONIGHT-17102026-003.jpg', { type: 'image/jpeg' });
      component.addPendingFiles([big, file('EMONIGHT-17102026-004.jpg')]);
      expect(component.uploadPreview().map(r => r.troppoGrande)).toEqual([true, false]);
      expect(component.uploadPreviewStats().troppoGrandi).toBe(1);
    });

    it('la serata scelta a mano vale per tutto il lotto', () => {
      component.addPendingFiles([file('IMG_1.jpg')]);
      component.uploadMeta.set({ archiveEventId: 5 });
      expect(component.uploadPreview()[0].serata?.id).toBe(5);
    });

    it('invia i file e mostra il riepilogo', () => {
      component.addPendingFiles([file('EMONIGHT-17102026-001.jpg'), file('IMG_1.jpg')]);
      component.startUpload();
      expect(component.isUploading()).toBe(true);
      http.expectOne(r => r.url.endsWith('/photos/upload.php'))
        .flush({ id: 1, url: 'u', parsed: true, autoLinked: true }, { status: 201, statusText: 'Created' });
      http.expectOne(r => r.url.endsWith('/photos/upload.php'))
        .flush({ error: 'Foto già caricata', existingId: 9 }, { status: 409, statusText: 'Conflict' });
      expect(component.isUploading()).toBe(false);
      expect(component.pendingFiles().length).toBe(0);
      expect(component.uploadSummary()?.caricate).toBe(1);
      expect(component.uploadSummary()?.duplicate).toBe(1);
    });
  });

  describe('tipologie evento', () => {
    beforeEach(() => component.eventTypes.set(TYPES));

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
      // token finto con scadenza tra un'ora: la dashboard si vede solo da autenticati
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      sessionStorage.setItem('enp_token', `x.${payload}.y`);
      component.activeTab.set('archivio');
      // isAuthenticated() non è un signal: la vista va segnata a mano (zoneless)
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      await fixture.whenStable();
      const el: HTMLElement = fixture.nativeElement;
      const buttons = Array.from(el.querySelectorAll('aside li button')) as HTMLButtonElement[];
      const del = buttons.filter(b => b.textContent?.includes('DELETE'));
      expect(del[0].disabled).toBe(true);
      expect(del[1].disabled).toBe(false);
      expect(el.querySelector('#type-in-use-1')?.textContent).toContain('In uso');
      sessionStorage.removeItem('enp_token');
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
});

