import { Component, signal, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Meta } from '@angular/platform-browser'

@Component({
  selector: 'app-backstage',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './backstage.html',
  styleUrls: ['./backstage.css']
})
export class BackstageComponent implements OnDestroy {
  username = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  private auth = inject(AuthService);
  private router = inject(Router);

constructor(private meta: Meta){
this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' })
}

  ngOnDestroy() {
    // evita che il noindex resti sulle pagine visitate dopo (navigazione SPA)
    this.meta.removeTag("name='robots'");
  }

  login() {
    if (!this.username().trim() || !this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.username(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/backstage/m4N4g3_eNP-v1_01_01_d4shB04Rd_']);
      },
      error: (err) => {
        // messaggio generico: non rivela se è sbagliato l'utente o la password
        this.errorMessage.set(
          err?.status === 429 ? 'TOO MANY ATTEMPTS. RETRY IN 15 MIN.' : 'ACCESS DENIED. WRONG USER OR KEY.'
        );
        this.isLoading.set(false);
        this.password.set('');
      }
    });
  }
}
