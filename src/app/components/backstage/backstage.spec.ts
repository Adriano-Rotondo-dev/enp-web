import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BackstageComponent } from './backstage';

describe('Backstage', () => {
  let component: BackstageComponent;
  let fixture: ComponentFixture<BackstageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackstageComponent],
      providers: [provideRouter([])]
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
