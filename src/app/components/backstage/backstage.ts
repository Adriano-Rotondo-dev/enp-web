import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-backstage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './backstage.html',
  styleUrls: ['./backstage.css']
})
export class BackstageComponent {
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  private platformId = inject(PLATFORM_ID);

  
  constructor(private router: Router) {}

  login() {
    this.isLoading.set(true);
    this.errorMessage.set('') //reset errore
//controllo credenziali
    setTimeout(() => {
      if (this.password() === 'emo') { // Password dummy
        // Controllo di sicurezza per SSR
      if (isPlatformBrowser(this.platformId)) {
        //token di accesso
        sessionStorage.setItem('enp_access_granted', 'true')
      }
        console.log('Accesso autorizzato');
        this.isLoading.set(false);
        //rendirizzamento alla route
        this.router.navigate(['/backstage/dashboard'])
      } else {
        this.errorMessage.set('ACCESS DENIED. WRONG KEY.');
        this.isLoading.set(false);
        this.password.set('');
      }
    }, 1000);
  }
}
