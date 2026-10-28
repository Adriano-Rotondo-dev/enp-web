import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment'

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ← Unica riga da cambiare quando il backend è pronto
  private USE_BACKEND = true;
  private apiUrl = environment.apiUrl;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);

  // ─── TOKEN ───

  private saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('enp_token', token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('enp_token');
    }
    return null;
  }

  // ─── AUTH STATE ───

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    if (this.USE_BACKEND) {
      // Valida il JWT: controlla la scadenza dal payload
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

    // Modalità mock: usa il flag semplice (compatibile con auth-guard attuale)
    return sessionStorage.getItem('enp_access_granted') === 'true';
  }

  // ─── LOGIN ───

  login(username: string, password: string): Observable<{ token: string } | { success: boolean }> {
    if (this.USE_BACKEND) {
      return this.http.post<{ token: string }>(`${this.apiUrl}/login.php`, { username: username.trim(), password }).pipe(
        tap((res) => {
          if ('token' in res) {
            this.saveToken(res.token);
            // Mantiene il flag per compatibilità con auth-guard
            sessionStorage.setItem('enp_access_granted', 'true');
          }
        }),
        catchError(err => {
          console.error('Errore login:', err);
          throw err; 
        })
      );
    }

    // Senza backend non si può verificare nessuna credenziale: nessuna password nel client
    return throwError(() => new Error('Login non disponibile senza backend'));
  }

  // ─── LOGOUT ───

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('enp_access_granted');
      sessionStorage.removeItem('enp_token');
    }
    this.router.navigate(['/backstage']);
  }
}