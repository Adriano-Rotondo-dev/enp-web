import { Component, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from  '@angular/router';

interface EnpEvent {
  id: number;
  vol: string;
  name: string;
  date: string;
  description: string;
  posterUrl: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})

export class DashboardComponent implements OnInit{

constructor(private router: Router){} 

logout(){
  if (isPlatformBrowser(this.platformId)) {
    sessionStorage.removeItem('enp_access_granted');
    this.router.navigate(['/backstage'])
  }
}

//logica di sicurezza ed SSR
  isClient = false;
  isAuthorized = false;
  private platformId = inject(PLATFORM_ID);
 
  // Stato della navigazione interna alla dashboard
  activeTab = signal<'evento' | 'archivio' | 'richieste'>('evento');

  // Memorizzazione del file fisico
  selectedFile: File | null = null;

  // State per il form del nuovo evento in archivio
  //* Valori placeholder!!
  newArchiveEvent = signal<EnpEvent>({
    id: 9, // Esempio: il prossimo dopo l'8
    vol: 'VOL. 8',
    name: '',
    date: '',
    description: '',
    posterUrl: '/poster_placeholder.webp'
  });

  // Mock dei dati attuali 
  //TODO: creazione del database, inserimento dei dati del db 
  eventData = signal({
    title: 'The Next Chapter',
    date: '2026-02-21',
    time: '21:30',
    location: 'MindHouse',
    address: 'Via San Lorenzo, 273/A, Palermo',
    mapsUrl: 'https://www.google.com/maps/search/MindHouse+Palermo',
    description: 'Tutti i dettagli sulla prossima Emo Night Palermo.',
    lineup: [
      { time: '21:30', act: 'Opening & warmup' },
      { time: '22:30', act: ' Main Set con CyberBoy' },
      { time: '00:00', act: 'Dj Set'},
      { time: '01:30', act: 'Closing Act'}
    ]
  });

ngOnInit() {
    // Verifica se siamo nel browser ->evita il "flash" della dashboard in SSR
    if (isPlatformBrowser(this.platformId)) {
      this.isClient = true;
      this.isAuthorized = sessionStorage.getItem('enp_access_granted') === 'true';
    }
  }


  // metodi Action
  saveToArchive(){
    const data = this.newArchiveEvent();

    //validazione
    if (!data.name || !data.vol || !data.date){
      alert('ERRORE: Nome, Volume e Data sono obbligatori per l\'archivio');
      return;
    }
    //* data.posterUrl contiene il base64 per la preview
    //* selectedFile contiene il file da mandare al PHP
    console.log('Pushing to DB...', { ...data, rawFile: this.selectedFile });

    //? richiamare il service php per l'insert nel DB
    alert(`Volume ${data.vol} aggiunto con successo al DB di ENP.`)

//form reset
this.newArchiveEvent.set({
  id: data.id+1,
  vol: 'VOL. ',
  name: '',
  date: '',
  description: '',
  posterUrl: '/poster_placeholder.webp'
})
// Reset del file
this.selectedFile = null; 
}

onFileSelected(event: any) {
  const file: File = event.target.files[0];

  if (file) {
    // Validazione base (estensione)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Seleziona un'immagine valida (JPEG, PNG o WEBP)");
      return;
    }

    // salvataggio del file
    this.selectedFile = file 

    // Per la preview nella Dashboard:
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // aggiornamento del segnale con Base64 per la preview, work in progress 
      // l'img non carica correttamente al momento, revisione necessaria con il backend funzionante
      this.newArchiveEvent.update(ev => ({
        ...ev,
        posterUrl: e.target.result as string //esplicito, debugging 
      }));
    };
    reader.readAsDataURL(file);
    
    // TODO: Memorizzare l'oggetto 'file' per inviarlo al DB tramite Service
    console.log("File pronto per l'upload:", file.name);
  }
}

saveCurrentEvent() {
    console.log('Salvataggio in corso...', this.eventData());
    //TODO: INSERIRE QUI LA CHIAMATA AL DB 
    alert('Dati aggiornati con successo, emoboy!');
  }
}