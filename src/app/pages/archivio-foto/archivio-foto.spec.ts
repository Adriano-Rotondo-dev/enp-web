import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ArchivioFotoComponent } from './archivio-foto';

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
});
