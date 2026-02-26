import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'; 
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contacts.html'
})
export class ContactsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private lastSentAt: number = 0;
  private COOLDOWN_MS = 30000 // 30 secs cd
  private toast = inject(ToastService)

  socials = [
    { name: 'Instagram', link: 'https://instagram.com/emonightpalermo', handle: '@emonightpalermo' },
    { name: 'TikTok', link: 'https://www.tiktok.com/@emonightpalermo', handle: '@emonightpalermo' },
    { name: 'Telegram', link: '#', handle: 'Emo Night Palermo' },
    { name: 'Whatsapp', link: '#', handle: 'Emo Night Palermo' }
  ];

 ngOnInit() {
    this.eventService.loadNextEvent().subscribe();
  }

  //* fix type safety-> nonNullable
  songForm = this.fb.nonNullable.group({
    userEmail: ['', [Validators.required, Validators.email]],
    songRequest: ['', [Validators.required, Validators.minLength(3)]]
  });

  isSending = false;
  sentStatus: 'idle' | 'success' | 'error' = 'idle';

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

  // in contacts.ts
emailCopied = false;

copyEmail() {
  navigator.clipboard.writeText('info@emonightpalermo.it').then(() => {
    this.emailCopied = true;
    setTimeout(() => this.emailCopied = false, 2000);
  });
}
  isEasterEgg(): boolean {
  const value = this.songForm.get('songRequest')?.value?.toLowerCase() || '';
  const cults = [
    'chelsea smile', 
    'bring me the horizon', 
    'if it means a lot to you', 
    'a day to remember',
    'in the end',
    'linkin park',
    'all i wanted',
    'paramore',
  ];
  return cults.some(cult => value.includes(cult));
}
}