import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivioEventiComponent } from './archivio-eventi';

describe('ArchivioEventiComponent', () => {
  let component: ArchivioEventiComponent;
  let fixture: ComponentFixture<ArchivioEventiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivioEventiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivioEventiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
