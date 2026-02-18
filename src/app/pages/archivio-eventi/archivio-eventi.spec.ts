import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivioEventi } from './archivio-eventi';

describe('ArchivioEventi', () => {
  let component: ArchivioEventi;
  let fixture: ComponentFixture<ArchivioEventi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivioEventi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivioEventi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
