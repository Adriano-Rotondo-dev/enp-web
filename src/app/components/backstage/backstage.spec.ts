import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackstageComponent } from './backstage';

describe('Backstage', () => {
  let component: BackstageComponent;
  let fixture: ComponentFixture<BackstageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackstageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackstageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
