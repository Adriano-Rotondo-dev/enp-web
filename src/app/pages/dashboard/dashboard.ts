import { Component, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ArchiveEvent, EnpPhoto, NextEvent } from '../../models/event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  private platformId = inject(PLATFORM_ID);
  protected auth = inject(AuthService);
  private eventService = inject(EventService);
  private router = inject(Router);

  get archiveEvents() {
  return this.eventService.archiveEvents;
}

  // ─── SEGNALI DAL SERVICE ───────────────────────────────────────
  eventData = this.eventService.nextEvent;
  photos = this.eventService.photos;

// Copia locale editabile per il form — evita il problema del ngModel sui segnali
editableEvent = signal<NextEvent>({ ...this.eventService.nextEvent() });
editablePhoto = signal<Omit<EnpPhoto, 'id'>>({ url: '',
  title: '',
  tag: '',
  eventDate:'',
  author:'' });

  // ─── NAVIGAZIONE INTERNA ───────────────────────────────────────
  activeTab = signal<'evento' | 'archivio' | 'foto'>('evento');

  // ─── STATO UI ─────────────────────────────────────────────────
  isSaving = signal(false);
  saveError = signal('');

  // ─── FORM ARCHIVIO EVENTI ─────────────────────────────────────
  selectedFile: File | null = null;

  newArchiveEvent = signal<ArchiveEvent>({
    id: 9,
    vol: 'VOL. ',
    name: '',
    date: '',
    description: '',
    posterUrl: '/poster_placeholder.webp'
  });

  // ─── FORM ARCHIVIO FOTO ───────────────────────────────────────
  selectedPhotoFile: File | null = null;
  photoPreviewUrl = signal<string>('');

  newPhoto = signal<Omit<EnpPhoto, 'id'>>({
    url: '',
    title: '',
    tag: ''
  });

  // ──────────────────────────────────────────────────────────────

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/backstage']);
    }
  this.eventService.loadNextEvent().subscribe(event => {
    this.editableEvent.set({ ...event }); // sincronizza la copia locale
  });

  this.eventService.loadPhotos().subscribe();
}
  // ─── LOGOUT ───────────────────────────────────────────────────

  logout() {
    this.auth.logout();
  }

  // ─── EVENTO PRINCIPALE ────────────────────────────────────────

  saveCurrentEvent() {
  this.isSaving.set(true);
  this.saveError.set('');

  this.eventService.updateNextEvent(this.editableEvent()).subscribe({
    next: () => {
      this.isSaving.set(false);
      alert('Dati aggiornati con successo, emoboy!');
    },
    error: () => {
      this.isSaving.set(false);
      this.saveError.set('Errore durante il salvataggio. Riprova.');
    }
  });
}

  // ─── ARCHIVIO EVENTI ──────────────────────────────────────────

  saveToArchive() {
    const data = this.newArchiveEvent();

    if (!data.name || !data.vol || !data.date) {
      alert('Nome, Volume e Data sono obbligatori.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.addToArchive(data, this.selectedFile).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert(`${data.vol} aggiunto con successo!`);
        this.resetArchiveForm(data.id);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Errore durante il salvataggio. Riprova.');
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Seleziona un'immagine valida (JPEG, PNG o WEBP)");
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newArchiveEvent.update(ev => ({
        ...ev,
        posterUrl: e.target.result as string
      }));
    };
    reader.readAsDataURL(file);
  }

editingArchiveEvent = signal<ArchiveEvent | null>(null);

startEditArchiveEvent(event: ArchiveEvent) {
  this.editingArchiveEvent.set({ ...event }); // copia locale, stesso pattern di editableEvent
}

cancelEditArchiveEvent() {
  this.editingArchiveEvent.set(null);
}

saveArchiveEventEdit() {
  const event = this.editingArchiveEvent();
  if (!event) return;

  if (!event.name || !event.vol || !event.date) {
    alert('Nome, Volume e Data sono obbligatori.');
    return;
  }

  this.isSaving.set(true);
  this.saveError.set('');

  this.eventService.updateArchiveEvent(event).subscribe({
    next: () => {
      this.isSaving.set(false);
      this.editingArchiveEvent.set(null);
      alert('Evento aggiornato con successo!');
    },
    error: () => {
      this.isSaving.set(false);
      this.saveError.set('Errore durante il salvataggio. Riprova.');
    }
  });
}

deleteArchiveEvent(id: number) {
  if (!confirm('Sei sicuro di voler eliminare questo evento dall\'archivio?')) return;

  this.eventService.deleteArchiveEvent(id).subscribe({
    error: () => this.saveError.set("Errore durante l'eliminazione.")
  });
}

  // ─── ARCHIVIO FOTO ────────────────────────────────────────────

  onPhotoFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Seleziona un'immagine valida (JPEG, PNG o WEBP)");
      return;
    }

    this.selectedPhotoFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoPreviewUrl.set(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  uploadPhoto() {
  if (!this.selectedPhotoFile) {
    alert('Seleziona un file prima di caricare.');
    return;
  }
  if (!this.editablePhoto().title || !this.editablePhoto().tag) {
    alert('Titolo e tag sono obbligatori.');
    return;
  }

  this.isSaving.set(true);
  this.saveError.set('');

  this.eventService.uploadPhoto(this.editablePhoto(), this.selectedPhotoFile).subscribe({
    next: () => {
      this.isSaving.set(false);
      alert('Foto caricata con successo!');
      this.resetPhotoForm();
    },
    error: () => {
      this.isSaving.set(false);
      this.saveError.set('Errore durante il caricamento. Riprova.');
    }
  });
}

  deletePhoto(id: number) {
    if (!confirm('Sei sicuro di voler eliminare questa foto?')) return;

    this.eventService.deletePhoto(id).subscribe({
      error: () => this.saveError.set("Errore durante l'eliminazione.")
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────

  private resetArchiveForm(lastId: number) {
    this.newArchiveEvent.set({
      id: lastId + 1,
      vol: 'VOL. ',
      name: '',
      date: '',
      description: '',
      posterUrl: '/poster_placeholder.webp'
    });
    this.selectedFile = null;
  }

private resetPhotoForm() {
  this.editablePhoto.set({ url: '', title: '', tag: '' });
  this.photoPreviewUrl.set('');
  this.selectedPhotoFile = null;
  }
}