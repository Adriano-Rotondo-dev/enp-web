import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Meta } from '@angular/platform-browser'

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

  private auth = inject(AuthService);
  private router = inject(Router);

constructor(private meta: Meta){
this.meta.addTag({ name: 'robots', content: 'noindex, nofollow' })
}

  login() {
    if (!this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/backstage/m4N4g3_eNP-v1_01_01_d4shB04Rd_']);
      },
      error: () => {
        this.errorMessage.set('ACCESS DENIED. WRONG KEY.');
        this.isLoading.set(false);
        this.password.set('');
      }
    });
  }
}
