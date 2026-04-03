import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; 
import { EventService } from '../../services/event.service'; 
import { Router } from '@angular/router';
import { NextEvent, ArchiveEvent, EnpPhoto } from '../../models/event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  // Iniezione dipendenze
  public auth = inject(AuthService);
  private eventService = inject(EventService);
  private router = inject(Router);

  // State Management con Signals
  activeTab = signal<'evento' | 'archivio' | 'foto' | 'richieste'>('evento');
  isSaving = signal(false);
  saveError = signal<string | null>(null);
  
  // Tab 01: Prossimo Evento (Sincronizzato con NextEvent model)
  editableEvent = signal<NextEvent>({
    id: '',
    title: '',
    date: '',
    time: '',
    location: '',
    address: '',
    description: '',
    lineup: []
  });

  // Tab 02: Archivio Eventi
  archiveEvents = this.eventService.archiveEvents; // Usiamo direttamente il signal del service
  newArchiveEvent = signal<ArchiveEvent>({
    id: 0,
    vol: '',
    name: '',
    date: '',
    description: '',
    posterUrl: ''
  });
  selectedArchiveFile: File | null = null;
  selectedEditArchiveFile: File | null = null; //
  editingArchiveEvent = signal<ArchiveEvent | null>(null);

  // Tab 03: Foto
  photos = this.eventService.photos; // Usiamo direttamente il signal del service
  editablePhoto = signal<Omit<EnpPhoto, 'id'>>({
    title: '',
    tag: '',
    url: '',
    eventDate: '',
    author: '',
    archiveEventId: undefined
  });
  selectedPhotoFile: File | null = null;
  photoPreviewUrl = signal<string | null>(null);
  editingPhoto = signal<EnpPhoto | null>(null);

  // Logout UI State
  isConfirmingLogout = signal(false);

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    // Carichiamo i dati tramite gli observable del service
    this.eventService.loadNextEvent().subscribe(event => this.editableEvent.set(event));
    this.eventService.loadArchiveEvents().subscribe();
    this.eventService.loadPhotos().subscribe();
  }

  // --- LOGICA EVENTO CORRENTE ---
  saveCurrentEvent() {
    this.isSaving.set(true);
    this.eventService.updateNextEvent(this.editableEvent()).subscribe({
      next: () => {
        alert("STAGE_INFO_UPDATED");
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  // --- LOGICA ARCHIVIO ---
  onArchiveFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedArchiveFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newArchiveEvent.update(prev => ({ ...prev, posterUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  }

  saveToArchive() {
    this.isSaving.set(true);
    this.eventService.addToArchive(this.newArchiveEvent(), this.selectedArchiveFile).subscribe({
      next: () => {
        // Reset form
        this.newArchiveEvent.set({ id: 0, vol: '', name: '', date: '', description: '', posterUrl: '' });
        this.selectedArchiveFile = null;
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  startEditArchiveEvent(event: ArchiveEvent) {
    this.editingArchiveEvent.set({ ...event });
  }

onEditArchiveFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedEditArchiveFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Aggiorna l'anteprima nell'oggetto che stai editando
      this.editingArchiveEvent.update(prev => prev ? ({ ...prev, posterUrl: e.target.result }) : null);
    };
    reader.readAsDataURL(file);
  }
}

saveArchiveEventEdit() {
  const edited = this.editingArchiveEvent();
  if (!edited) return;
  this.isSaving.set(true);

  this.eventService.updateArchiveEvent(edited, this.selectedEditArchiveFile).subscribe({
    next: () => {
      this.editingArchiveEvent.set(null);
      this.selectedEditArchiveFile = null; // Reset del file
      this.isSaving.set(false);
    },
    error: () => this.isSaving.set(false)
  });
}

  deleteArchiveEvent(id: number) {
    if (confirm("Sei sicuro di voler eliminare questo evento dall'archivio?")) {
      this.eventService.deleteArchiveEvent(id).subscribe();
    }
  }



  // --- LOGICA FOTO ---
  onPhotoFileSelected(event: any) {
    this.selectedPhotoFile = event.target.files[0];
    if (this.selectedPhotoFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.photoPreviewUrl.set(e.target.result);
      reader.readAsDataURL(this.selectedPhotoFile);
    }
  }

  uploadPhoto() {
    if (!this.selectedPhotoFile) {
      this.saveError.set("SELEZIONA UN FILE");
      return;
    }
    this.isSaving.set(true);
    this.eventService.uploadPhoto(this.editablePhoto(), this.selectedPhotoFile).subscribe({
      next: () => {
        this.photoPreviewUrl.set(null);
        this.selectedPhotoFile = null;
        this.editablePhoto.set({ title: '', tag: '', url: '', eventDate: '', author: '', archiveEventId: undefined });
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  deletePhoto(id: number) {
    if (confirm("Eliminare definitivamente questa foto?")) {
      this.eventService.deletePhoto(id).subscribe();
    }
  }

  // --- LOGOUT ---
  logout() {
    if (!this.isConfirmingLogout()) {
      this.isConfirmingLogout.set(true);
      setTimeout(() => this.isConfirmingLogout.set(false), 3000);
    } else {
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }
}