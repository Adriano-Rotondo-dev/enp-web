import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-prossimo-evento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prossimo-evento.html',
  styleUrl: './prossimo-evento.css',
})
export class ProssimoEventoComponent implements OnInit {
  private eventService = inject(EventService);
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  eventData = this.eventService.nextEvent;

  // ─── SONG BOX ───
  private COOLDOWN_MS = 30000;

  private get lastSentAt(): number {
    return Number(sessionStorage.getItem('song_last_sent') ?? 0);
  }
  private set lastSentAt(value: number) {
    sessionStorage.setItem('song_last_sent', String(value));
  }

  songForm = this.fb.nonNullable.group({
    userEmail: ['', [Validators.required, Validators.email]],
    songRequest: ['', [Validators.required, Validators.minLength(3)]]
  });

  isSending = false;
  sentStatus: 'idle' | 'success' | 'error' = 'idle';

  isEasterEgg(): boolean {
    const value = this.songForm.get('songRequest')?.value?.toLowerCase() || '';
    const cults = [
      'chelsea smile',
      'bring me the horizon',
      'if it means a lot to you',
      'a day to remember',
      'in the end',
      'linkin park',
      'all i want',
      'paramore',
      'avril'
    ];
    return cults.some(cult => value.includes(cult));
  }

  sendRequest() {
    if (this.songForm.invalid || this.isSending) return;

    const now = Date.now();
    if (now - this.lastSentAt < this.COOLDOWN_MS) {
      this.toast.info('Aspetta qualche secondo prima di inviare un\'altra richiesta.');
      return;
    }

    this.isSending = true;
    this.lastSentAt = now;

    const { userEmail, songRequest } = this.songForm.getRawValue();
    const eventId = this.eventService.nextEvent().id;

    this.eventService.submitSongRequest(userEmail, songRequest, eventId).subscribe({
      next: () => {
        this.isSending = false;
        this.sentStatus = 'success';
        this.songForm.reset();
        setTimeout(() => this.sentStatus = 'idle', 3000);
      },
      error: (err) => {
        this.isSending = false;
        if (err.status === 429) {
          this.toast.error('Hai già inviato troppe richieste per questo evento.');
        } else {
          this.sentStatus = 'error';
          setTimeout(() => this.sentStatus = 'idle', 3000);
        }
      }
    });
  }

  // ─── MAPS ───
  openMaps() {
    if (isPlatformBrowser(this.platformId)) {
      const query = encodeURIComponent(
        `${this.eventData().location} ${this.eventData().address}`
      );
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        '_blank'
      );
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.eventService.loadNextEvent().subscribe();
    }
  }
}