import { Component, inject, signal } from '@angular/core';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'app-contacts',
  standalone: true,
  templateUrl: './contacts.html'
})
export class ContactsComponent {
  private toast = inject(ToastService)

  socials = [
    { name: 'Instagram', link: 'https://instagram.com/emonightpalermo', handle: '@emonightpalermo' },
    { name: 'TikTok', link: 'https://www.tiktok.com/@emonightpalermo', handle: '@emonightpalermo' },
    // Telegram nascosto finché non c'è il link reale al canale
    // { name: 'Telegram', link: '', handle: 'Emo Night Palermo' },
    { name: 'Whatsapp', link: 'https://chat.whatsapp.com/Cr2lbpKJHzfI8sHTtbxB0r', handle: 'Emo Night Palermo' }
  ];

readonly contactEmail = 'emonightpalermo@gmail.com';
emailCopied = signal(false);

copyEmail() {
  const onError = () => this.toast.error(`Copia non riuscita: scrivi a ${this.contactEmail}`);
  if (!navigator.clipboard) {
    onError();
    return;
  }
  navigator.clipboard.writeText(this.contactEmail).then(() => {
    this.emailCopied.set(true);
    setTimeout(() => this.emailCopied.set(false), 2000);
  }).catch(onError);
}
}
