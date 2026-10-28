import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { DashboardEventoComponent } from './dashboard-evento';
import { DashboardArchivioComponent } from './dashboard-archivio';
import { DashboardFotoComponent } from './dashboard-foto';

// Cornice della dashboard: menu, schede e logout. Le schede restano montate (solo nascoste),
// così file in caricamento, filtri e moduli non si perdono cambiando scheda.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardEventoComponent, DashboardArchivioComponent, DashboardFotoComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private eventService = inject(EventService);

  activeTab = signal<'evento' | 'archivio' | 'foto'>('evento');
  isConfirmingLogout = signal(false);

  ngOnInit() {
    // dati condivisi dalle schede Archivio e Foto (il prossimo evento lo carica la sua scheda)
    this.eventService.loadArchiveEvents().subscribe();
    this.eventService.loadPhotos().subscribe();
    this.eventService.loadEventTypes().subscribe();
  }

  logout() {
    if (!this.isConfirmingLogout()) {
      this.isConfirmingLogout.set(true);
      setTimeout(() => this.isConfirmingLogout.set(false), 3000);
    } else {
      this.auth.logout(); // naviga già su /backstage
    }
  }
}
