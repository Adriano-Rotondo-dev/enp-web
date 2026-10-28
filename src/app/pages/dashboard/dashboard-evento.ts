import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { NextEvent } from '../../models/event.model';

// Scheda 01 della dashboard: modifica del prossimo evento
@Component({
  selector: 'app-dashboard-evento',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard-evento.html'
})
export class DashboardEventoComponent implements OnInit {
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  isSaving = signal(false);
  editableEvent = signal<NextEvent>({
    id: '', title: '', date: '', time: '', location: '', address: '', description: '', lineup: []
  });

  ngOnInit() {
    this.eventService.loadNextEvent().subscribe({
      // copia: il modulo modifica l'oggetto, che non deve cambiare nel service finché non si salva
      next: event => this.editableEvent.set(structuredClone(event)),
      complete: () => {
        if (this.eventService.nextEventStatus() !== 'ready') {
          this.toast.error('Evento attuale non caricato: ricarica la pagina prima di salvare');
        }
      }
    });
  }

  saveCurrentEvent() {
    this.isSaving.set(true);
    this.eventService.updateNextEvent(structuredClone(this.editableEvent())).subscribe({
      next: () => {
        this.toast.success('Evento aggiornato');
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('Salvataggio non riuscito');
        this.isSaving.set(false);
      }
    });
  }
}
