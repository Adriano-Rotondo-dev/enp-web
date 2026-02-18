import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivioFoto } from './archivio-foto';

describe('ArchivioFoto', () => {
  let component: ArchivioFoto;
  let fixture: ComponentFixture<ArchivioFoto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivioFoto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivioFoto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
