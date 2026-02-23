import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms'; 
import { EventService } from '../../services/event.service';
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contacts.html'
})
export class ContactsComponent {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private lastSentAt: number = 0;
  private COOLDOWN_MS = 30000 // 30 secs cd


  socials = [
    { name: 'Instagram', link: 'https://instagram.com/emonightpalermo', handle: '@emonightpalermo' },
    { name: 'TikTok', link: 'https://www.tiktok.com/@emonightpalermo', handle: '@emonightpalermo' },
    { name: 'Telegram', link: '#', handle: 'Emo Night Palermo' },
    { name: 'Whatsapp', link: '#', handle: 'Emo Night Palermo' }
  ];

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
    alert('Aspetta qualche secondo prima di inviare un\'altra richiesta.');
    return;
  }
  this.isSending = true;
  this.lastSentAt = now;
    //* Logica di invio 
    //todo:creazione di mail per la gestione delle request ->EMAILJS    
    //!rischiamo spam a mai finire? ->integrazione di un rate limiting/captcha nel back end
    //niente server
    // questo console.log sarà con la funzione di EMAILJS
    console.log('Invio richiesta a: music-requests@emonightpalermo.it', this.songForm.getRawValue());

    setTimeout(() => {
      this.isSending = false;
      this.sentStatus = 'success';
      this.songForm.reset();
      
      setTimeout(() => this.sentStatus = 'idle', 3000);
    }, 1500);
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