import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string | null;
  const logout = vi.fn();

  beforeEach(() => {
    token = 'abc';
    logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => token, logout } }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  const call401 = (url: string) => {
    http.get(url).subscribe({ error: () => {} });
    backend.expectOne(url).flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  };

  it('aggiunge il token', () => {
    http.get('/x').subscribe();
    expect(backend.expectOne('/x').request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('con un 401 e il token scaduto torna al login', () => {
    call401('/photos/delete.php');
    expect(logout).toHaveBeenCalled();
  });

  it('non esce per un 401 del login (password sbagliata)', () => {
    call401('/login.php');
    expect(logout).not.toHaveBeenCalled();
  });

  it('non esce per un 401 senza token', () => {
    token = null;
    call401('/photos/delete.php');
    expect(logout).not.toHaveBeenCalled();
  });
});
