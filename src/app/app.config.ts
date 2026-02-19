import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router'; // <--- import della transizione fluida. testing in corso.

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes, 
      withViewTransitions() // <--- abilitato. impostazioni di default 
    ), 
    provideClientHydration(withEventReplay())
  ]
};