import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProssimoEvento } from './prossimo-evento';

describe('ProssimoEvento', () => {
  let component: ProssimoEvento;
  let fixture: ComponentFixture<ProssimoEvento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProssimoEvento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProssimoEvento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
