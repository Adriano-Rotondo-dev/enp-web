import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard';

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('cambiando scheda nasconde le altre senza smontarle', async () => {
    const tab = (name: string) => fixture.nativeElement.querySelector(`app-dashboard-${name}`) as HTMLElement;
    expect(tab('archivio').classList).toContain('hidden');
    component.activeTab.set('foto');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(tab('foto').classList).not.toContain('hidden');
    expect(tab('evento').classList).toContain('hidden');
  });
});
