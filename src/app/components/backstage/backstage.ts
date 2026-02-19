import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-backstage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backstage.html',
  styleUrls: ['./backstage.css']
})
export class BackstageComponent {
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(private router: Router) {}

  handleLogin() {
    this.isLoading.set(true);
    
    // Simulazione controllo credenziali
    setTimeout(() => {
      if (this.password() === 'emo-night-2026') { // Password dummy
        console.log('Accesso autorizzato');
        //TODO: token di sessione - prossimo lavoro
        this.isLoading.set(false);
      } else {
        this.errorMessage.set('ACCESS DENIED. WRONG KEY.');
        this.isLoading.set(false);
        this.password.set('');
      }
    }, 1000);
  }
}