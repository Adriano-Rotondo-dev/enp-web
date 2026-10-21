import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProssimoEventoComponent } from './prossimo-evento';

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
});
