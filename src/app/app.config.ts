import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import localeIt from '@angular/common/locales/it';
import { registerLocaleData } from '@angular/common';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions()
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};