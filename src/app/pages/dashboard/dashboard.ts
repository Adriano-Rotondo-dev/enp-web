import { Component, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { ArchiveEvent, EnpPhoto, NextEvent, SongRequest } from '../../models/event.model';

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
  private toast = inject(ToastService);


  get archiveEvents() {
    return this.eventService.archiveEvents;
  }

  // ─── SEGNALI DAL SERVICE ───────────────────────────────────────
  eventData = this.eventService.nextEvent;
  photos = this.eventService.photos;
  songRequests = this.eventService.songRequests;

  // Copia locale editabile per il form — evita il problema del ngModel sui segnali
  editableEvent = signal<NextEvent>({ ...this.eventService.nextEvent() });
  editablePhoto = signal<Omit<EnpPhoto, 'id'>>({ 
  url: '',
  title: '',
  tag: '',
  eventDate: '',
  author: '',
  archiveEventId: null
});

  // ─── NAVIGAZIONE INTERNA ───────────────────────────────────────
  activeTab = signal<'evento' | 'archivio' | 'foto' | 'richieste'>('evento');

  // ─── STATO UI ─────────────────────────────────────────────────
  isSaving = signal(false);
  saveError = signal('');
  isConfirmingLogout = signal(false);

  // ─── FORM ARCHIVIO EVENTI ─────────────────────────────────────
  selectedFile: File | null = null;

  newArchiveEvent = signal<ArchiveEvent>({
    id: 9,
    vol: 'VOL. ',
    name: '',
    date: '',
    description: '',
    posterUrl: '/poster_placeholder.webp',
    spotifyUrl: '',
    liveMusicUrl: ''
  });

  // ─── FORM ARCHIVIO FOTO ───────────────────────────────────────
  selectedPhotoFile: File | null = null;
  photoPreviewUrl = signal<string>('');
  editingPhoto = signal<EnpPhoto | null>(null);

  newPhoto = signal<Omit<EnpPhoto, 'id'>>({
    url: '',
    title: '',
    tag: ''
  });

  // ─── ngOnInit ───

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/backstage']);
    }
    this.eventService.loadNextEvent().subscribe(event => {
      this.editableEvent.set({ ...event, 
        date: event.date.split(' ')[0]
       });
    });
    this.eventService.loadArchiveEvents().subscribe();
    this.eventService.loadPhotos().subscribe();
    this.eventService.loadSongRequests().subscribe();
  }

  // ─── LOGOUT ───

  logout() {
    if (!this.isConfirmingLogout()) {
      this.isConfirmingLogout.set(true);
      this.playSystemSound(440, 'square');
      setTimeout(() => {
        if (this.isConfirmingLogout()) {
          this.isConfirmingLogout.set(false);
        }
      }, 5000);
    } else {
      this.playSystemSound(220, 'sawtooth');
      this.auth.logout();
    }
  }

  // ─── EVENTO PRINCIPALE ────────────────────────────────────────

  saveCurrentEvent() {
    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.updateNextEvent(this.editableEvent()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Dati aggiornati con successo, emoboy!');
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Errore durante il salvataggio. Riprova.');
      }
    });
  }

  // ─── SONG REQUEST ──

  updateRequestStatus(id: number, status: 'pending' | 'played' | 'rejected') {
    this.eventService.updateSongRequestStatus(id, status).subscribe({
      error: () => this.saveError.set('Errore aggiornamento status.')
    });
  }

  deleteSongRequest(id: number) {
    if (!confirm('Eliminare questa richiesta?')) return;
    this.eventService.deleteSongRequest(id).subscribe({
      error: () => this.saveError.set("Errore durante l'eliminazione.")
    });
  }

  // ─── ARCHIVIO EVENTI ──────────────────────────────────────────

  saveToArchive() {
    const data = this.newArchiveEvent();

    if (!data.name || !data.vol || !data.date) {
      this.toast.success('Nome, Volume e Data sono obbligatori.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.addToArchive(data, this.selectedFile).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success(`${data.vol} aggiunto con successo!`);
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
      this.toast.success("Seleziona un'immagine valida (JPEG, PNG o WEBP)");
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
    this.editingArchiveEvent.set({ ...event });
  }

  cancelEditArchiveEvent() {
    this.editingArchiveEvent.set(null);
  }

  saveArchiveEventEdit() {
    const event = this.editingArchiveEvent();
    if (!event) return;

    if (!event.name || !event.vol || !event.date) {
      this.toast.success('Nome, Volume e Data sono obbligatori.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.updateArchiveEvent(event).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingArchiveEvent.set(null);
        this.toast.success('Evento aggiornato con successo!');
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
      this.toast.success("Seleziona un'immagine valida (JPEG, PNG o WEBP)");
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
      this.toast.success('Seleziona un file prima di caricare.');
      return;
    }
    if (!this.editablePhoto().title || !this.editablePhoto().tag) {
      this.toast.success('Titolo e tag sono obbligatori.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.uploadPhoto(this.editablePhoto(), this.selectedPhotoFile).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Foto caricata con successo!');
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

  startEditPhoto(photo: EnpPhoto) {
    this.editingPhoto.set({ ...photo });
  }

  cancelEditPhoto() {
    this.editingPhoto.set(null);
  }

  savePhotoEdit() {
    const photo = this.editingPhoto();
    if (!photo) return;

    if (!photo.title || !photo.tag) {
      this.toast.success('Titolo e tag sono obbligatori.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    this.eventService.updatePhoto(photo).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingPhoto.set(null);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Errore durante il salvataggio.');
      }
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
      posterUrl: '/poster_placeholder.webp',
      spotifyUrl: '',
      liveMusicUrl: ''
    });
    this.selectedFile = null;
  }

  private resetPhotoForm() {
  this.editablePhoto.set({ url: '', title: '', tag: '', eventDate: '', author: '', archiveEventId: null });
  this.photoPreviewUrl.set('');
  this.selectedPhotoFile = null;
}

  // ─── SYSTEM SOUND ──────────────────────────────────────────────────
  private playSystemSound(frequency: number, type: OscillatorType = 'square') {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
  }
}