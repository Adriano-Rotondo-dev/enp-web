import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { ArchiveEvent, EventType } from '../../models/event.model';
import { EVENT_TYPE_PREFIX_REGEX, formatDay } from '../../utils/photo-filename';
import { LoaderComponent } from '../../components/loader/loader';

const emptyArchiveEvent = (): ArchiveEvent => ({
  id: 0, vol: '', name: '', date: '', description: '', posterUrl: '', eventTypeId: null, eventDay: ''
});

// Scheda 02 della dashboard: serate dell'archivio e tipologie evento
@Component({
  selector: 'app-dashboard-archivio',
  standalone: true,
  imports: [FormsModule, LoaderComponent],
  templateUrl: './dashboard-archivio.html'
})
export class DashboardArchivioComponent {
  private eventService = inject(EventService);
  private toast = inject(ToastService);

  formatDay = formatDay;
  // riquadro in salvataggio (nuova serata, serata in modifica, tipologie): lì compare il loader
  saving = signal<'' | 'new' | 'edit' | 'type'>('');
  isSaving = computed(() => !!this.saving());

  // Serate
  archiveEvents = this.eventService.archiveEvents;
  newArchiveEvent = signal<ArchiveEvent>(emptyArchiveEvent());
  selectedArchiveFile: File | null = null;
  selectedEditArchiveFile: File | null = null;
  editingArchiveEvent = signal<ArchiveEvent | null>(null);

  // Tipologie evento
  eventTypes = this.eventService.eventTypes;
  newTypePrefix = signal('');
  newTypeLabel = signal('');
  editingTypeId = signal<number | null>(null);
  editingTypeLabel = signal('');
  // messaggio di validazione del prefisso (null se valido o vuoto)
  newTypePrefixError = computed(() => {
    const prefix = this.newTypePrefix();
    if (!prefix) return null;
    if (!EVENT_TYPE_PREFIX_REGEX.test(prefix)) return 'Solo lettere A-Z e numeri, da 2 a 20 caratteri';
    if (this.eventTypes().some(t => t.prefix === prefix)) return 'Prefisso già esistente';
    return null;
  });
  canAddType = computed(() =>
    !!this.newTypePrefix() && !this.newTypePrefixError() &&
    !!this.newTypeLabel().trim() && this.newTypeLabel().trim().length <= 100
  );

  private saveFailed = (err: any) => {
    this.saving.set('');
    this.toast.error(err?.error?.error ?? 'Salvataggio non riuscito');
  };

  // --- SERATE ---

  // anteprima del poster scelto, nel modulo nuovo o in quello di modifica
  onPosterSelected(event: Event, target: 'new' | 'edit') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (target === 'new') this.selectedArchiveFile = file; else this.selectedEditArchiveFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const posterUrl = reader.result as string;
      if (target === 'new') this.newArchiveEvent.update(prev => ({ ...prev, posterUrl }));
      else this.editingArchiveEvent.update(prev => prev ? { ...prev, posterUrl } : null);
    };
    reader.readAsDataURL(file);
  }

  // toast di esito della serata, con le foto collegate a ritroso dal backend
  private archiveSaved(message: string, res: any) {
    const linked = Number(res?.linkedPhotos) || 0;
    if (linked > 0) {
      this.toast.success(`${message} · ${linked} ${linked === 1 ? 'foto collegata' : 'foto collegate'} in automatico`);
      this.eventService.loadPhotos().subscribe();
    } else {
      this.toast.success(message);
    }
    // i conteggi delle tipologie cambiano
    this.eventService.loadEventTypes().subscribe();
  }

  saveToArchive() {
    this.saving.set('new');
    this.eventService.addToArchive(this.newArchiveEvent(), this.selectedArchiveFile).subscribe({
      next: (res) => {
        this.newArchiveEvent.set(emptyArchiveEvent());
        this.selectedArchiveFile = null;
        this.saving.set('');
        this.archiveSaved('Serata aggiunta all\'archivio', res);
        // ricarica l'archivio per avere l'id vero assegnato dal backend
        this.eventService.loadArchiveEvents().subscribe();
      },
      error: this.saveFailed
    });
  }

  startEditArchiveEvent(event: ArchiveEvent) {
    this.editingArchiveEvent.set({ ...event, eventTypeId: event.eventTypeId ?? null, eventDay: event.eventDay ?? '' });
  }

  saveArchiveEventEdit() {
    const edited = this.editingArchiveEvent();
    if (!edited) return;
    this.saving.set('edit');
    this.eventService.updateArchiveEvent(edited, this.selectedEditArchiveFile).subscribe({
      next: (res) => {
        this.editingArchiveEvent.set(null);
        this.selectedEditArchiveFile = null;
        this.saving.set('');
        this.archiveSaved('Serata aggiornata', res);
      },
      error: this.saveFailed
    });
  }

  deleteArchiveEvent(id: number) {
    if (!confirm("Sei sicuro di voler eliminare questo evento dall'archivio?")) return;
    this.eventService.deleteArchiveEvent(id).subscribe({
      next: () => {
        // le foto della serata eliminata restano senza serata (FK ON DELETE SET NULL)
        this.eventService.loadPhotos().subscribe();
        this.eventService.loadEventTypes().subscribe();
      },
      error: (err) => this.toast.error(err?.error?.error ?? 'Eliminazione non riuscita')
    });
  }

  // --- TIPOLOGIE EVENTO ---

  onNewTypePrefix(value: string) {
    this.newTypePrefix.set((value ?? '').toUpperCase().replace(/\s+/g, ''));
  }

  typeInUse(type: EventType): boolean {
    return (type.archiveCount ?? 0) > 0 || (type.photoCount ?? 0) > 0;
  }

  addEventType() {
    if (!this.canAddType()) {
      this.toast.error(this.newTypePrefixError() ?? 'Prefisso e nome sono obbligatori');
      return;
    }
    this.saving.set('type');
    this.eventService.addEventType(this.newTypePrefix(), this.newTypeLabel()).subscribe({
      next: (saved) => {
        this.saving.set('');
        this.newTypePrefix.set('');
        this.newTypeLabel.set('');
        this.toast.success(`Tipologia ${saved.prefix} aggiunta`);
      },
      error: (err) => {
        this.saving.set('');
        this.toast.error(err?.error?.error ?? (err?.status === 409 ? 'Prefisso già esistente' : 'Salvataggio non riuscito'));
      }
    });
  }

  startEditType(type: EventType) {
    this.editingTypeId.set(type.id);
    this.editingTypeLabel.set(type.label);
  }

  saveTypeEdit() {
    const id = this.editingTypeId();
    const label = this.editingTypeLabel().trim();
    if (id == null) return;
    if (!label || label.length > 100) {
      this.toast.error('Il nome è obbligatorio (max 100 caratteri)');
      return;
    }
    this.saving.set('type');
    this.eventService.updateEventType(id, label).subscribe({
      next: () => {
        this.saving.set('');
        this.editingTypeId.set(null);
        this.toast.success('Tipologia aggiornata');
      },
      error: this.saveFailed
    });
  }

  deleteEventType(type: EventType) {
    if (this.typeInUse(type)) return;
    if (!confirm(`Eliminare la tipologia ${type.prefix}?`)) return;
    this.eventService.deleteEventType(type.id).subscribe({
      next: () => this.toast.success(`Tipologia ${type.prefix} eliminata`),
      error: (err) => {
        if (err?.status === 409) {
          const a = err.error?.archiveCount ?? 0;
          const f = err.error?.photoCount ?? 0;
          this.toast.error(`Tipologia in uso: ${a} serate, ${f} foto`);
          this.eventService.loadEventTypes().subscribe();
        } else {
          this.toast.error(err?.error?.error ?? 'Eliminazione non riuscita');
        }
      }
    });
  }
}
