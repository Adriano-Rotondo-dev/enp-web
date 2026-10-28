import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BackstageComponent } from './backstage';

describe('Backstage', () => {
  let component: BackstageComponent;
  let fixture: ComponentFixture<BackstageComponent>;
  let http: HttpTestingController;
  const isLogin = (r: { url: string }) => r.url.endsWith('/login.php');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackstageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackstageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra il campo utente e blocca l\'invio senza utente o password', async () => {
    const el: HTMLElement = fixture.nativeElement;
    const user = el.querySelector<HTMLInputElement>('input#user');
    expect(user).not.toBeNull();
    expect(user?.getAttribute('autocomplete')).toBe('username');

    const submit = () => el.querySelector<HTMLButtonElement>('button[type=submit]')!;
    component.password.set('segreta');
    fixture.detectChanges();
    expect(submit().disabled).toBe(true);

    component.username.set('dani');
    fixture.detectChanges();
    expect(submit().disabled).toBe(false);

    component.username.set('   ');
    component.login();
    http.expectNone(isLogin);
  });

  it('invia utente e password e apre la dashboard', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.username.set('  dani ');
    component.password.set('segreta');
    component.login();

    const req = http.expectOne(isLogin);
    expect(req.request.body).toEqual({ username: 'dani', password: 'segreta' });
    req.flush({ token: 'a.b.c' });
    expect(navigate).toHaveBeenCalled();
  });

  it('con credenziali errate mostra un messaggio generico e svuota solo la password', () => {
    component.username.set('dani');
    component.password.set('sbagliata');
    component.login();
    http.expectOne(isLogin).flush({ error: 'Credenziali non valide' }, { status: 401, statusText: 'Unauthorized' });
    expect(component.errorMessage()).toBe('ACCESS DENIED. WRONG USER OR KEY.');
    expect(component.username()).toBe('dani');
    expect(component.password()).toBe('');
  });

  it('dopo troppi tentativi avvisa di aspettare', () => {
    component.username.set('dani');
    component.password.set('x');
    component.login();
    http.expectOne(isLogin).flush({ error: 'Troppi tentativi' }, { status: 429, statusText: 'Too Many Requests' });
    expect(component.errorMessage()).toBe('TOO MANY ATTEMPTS. RETRY IN 15 MIN.');
  });
});
