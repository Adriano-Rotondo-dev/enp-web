import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard';

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('modifica una foto e invia i nuovi metadati al backend', () => {
    const http = TestBed.inject(HttpTestingController);
    const photo = { id: 7, url: 'https://x/p.webp', title: 'Vecchio', tag: 'Crowd', eventDate: '', author: '', archiveEventId: null };
    component.startEditPhoto(photo);
    component.editingPhoto()!.title = 'Nuovo titolo';
    component.editingPhoto()!.archiveEventId = 16;
    component.savePhotoEdit();

    const req = http.expectOne(r => r.url.endsWith('/photos/update.php'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toContain('title=Nuovo+titolo');
    expect(req.request.body).toContain('archiveEventId=16');
    req.flush({ success: true });
    expect(component.editingPhoto()).toBeNull();
  });

  it('non salva una foto senza titolo o tag', () => {
    const http = TestBed.inject(HttpTestingController);
    component.startEditPhoto({ id: 7, url: 'https://x/p.webp', title: 'X', tag: '', archiveEventId: null });
    component.savePhotoEdit();
    http.expectNone(r => r.url.endsWith('/photos/update.php'));
    expect(component.editingPhoto()).not.toBeNull();
  });
});
