import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'enp_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);

  // ─── TOKEN ───

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage.getItem(TOKEN_KEY) : null;
  }

  // ─── AUTH STATE ───

  // Controlla solo la scadenza del JWT: la firma la verifica il backend a ogni richiesta
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      // Il payload JWT è base64url: va convertito in base64 standard prima di atob
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // ─── LOGIN ───

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login.php`, { username: username.trim(), password }).pipe(
      tap(res => sessionStorage.setItem(TOKEN_KEY, res.token))
    );
  }

  // ─── LOGOUT ───

  logout(): void {
    if (isPlatformBrowser(this.platformId)) sessionStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/backstage']);
  }
}
