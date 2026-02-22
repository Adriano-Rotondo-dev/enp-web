import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import localeIt from '@angular/common/locales/it'
import { registerLocaleData } from '@angular/common';
import { provideRouter, withViewTransitions } from '@angular/router'; // <--- import della transizione fluida. testing in corso.

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes, 
      withViewTransitions() // <--- abilitato. impostazioni di default 
    ), 
    provideClientHydration(withEventReplay())
  ]
};