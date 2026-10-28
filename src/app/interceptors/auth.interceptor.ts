import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const token = auth.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // token scaduto o non valido: si torna al login (il 401 del login è solo una password sbagliata)
      if (err.status === 401 && token && !req.url.endsWith('/login.php')) {
        auth.logout();
        toast.error('Sessione scaduta: rifai il login');
      }
      return throwError(() => err);
    })
  );
};
