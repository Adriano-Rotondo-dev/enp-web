import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiSiamoComponent } from './chi-siamo';

describe('ChiSiamoComponent', () => {
  let component: ChiSiamoComponent;
  let fixture: ComponentFixture<ChiSiamoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiSiamoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiSiamoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
