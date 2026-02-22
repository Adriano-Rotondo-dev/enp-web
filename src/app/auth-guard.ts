import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID)

// Se siamo sul server, blocchiamo il rendering della Dashboard
  if (!isPlatformBrowser(platformId)) {
    return false; 
  }

  // se realmente nel browser
  const isAuthenticated = sessionStorage.getItem('enp_access_granted') === 'true';

  if (isAuthenticated) {
    return true;
  } else {
    router.navigate(['/backstage']); // Se non sei autorizzato, torni al form
    return false;
  }
};