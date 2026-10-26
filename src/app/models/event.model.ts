export interface Lineup {
  time: string;
  act: string;
}

export interface NextEvent {
  id: string;
  title: string;
  date: string;          // ISO: YYYY-MM-DDTHH:mm:ss
  time: string;
  location: string;
  address: string;
  mapsUrl?: string; // deprecato - generato programmaticamente tramite query a GoogleMaps
  description: string;
  price?: number;         //? inserimento non obbligatorio, check
  lineup: Lineup[];
}

// Tipologia di serata: il prefisso coincide con quello del nome file delle foto
export interface EventType {
  id: number;
  prefix: string;          // A-Z e 0-9, maiuscolo, 2-20 caratteri
  label: string;           // nome leggibile, es. "Emo Xmas Night"
  archiveCount?: number;   // serate che la usano (solo da GET)
  photoCount?: number;     // foto che la usano (solo da GET)
}

export interface ArchiveEvent {
  id: number;
  vol: string;
  name: string;
  date: string;            // testo mostrato nel sito, es. "8 MAG"
  description: string;
  posterUrl: string;
  spotifyUrl?: string; //? non obbligatorio
  liveMusicUrl?: string; //? non obbligatorio
  eventTypeId?: number | null;
  eventTypePrefix?: string | null;
  eventTypeLabel?: string | null;
  eventDay?: string | null; // data vera della serata, YYYY-MM-DD
}

export interface EnpPhoto {
  id: number;
  url: string;
  title?: string | null;   // facoltativo
  tag?: string | null;     // facoltativo
  eventDate?: string; //? legacy, testo libero
  author?: string; //? non obbligatorio
  archiveEventId?: number | null; //? non obbligatorio
  eventVol?: string; //? non obbligatorio
  eventName?: string; //? non obbligatorio
  eventTypeId?: number | null;
  eventTypePrefix?: string | null;
  eventTypeLabel?: string | null;
  eventDay?: string | null;   // YYYY-MM-DD, dal nome file o inserita a mano
  sequence?: number | null;   // NNN del nome file
  originalName?: string | null;
}

// Risposta 201 di /photos/upload.php
export interface UploadedPhoto extends EnpPhoto {
  parsed?: boolean;      // nome file conforme
  autoLinked?: boolean;  // collegata in automatico a una serata
}

// Metadati facoltativi applicati a tutte le foto di un lotto
export interface PhotoUploadMeta {
  title?: string;
  tag?: string;
  author?: string;
  archiveEventId?: number | null;
}

export interface UploadProgress {
  done: number;
  total: number;
  current: string | null; // nome del file in invio
}

export interface UploadSummary {
  caricate: number;
  collegateAuto: number;
  nonConformi: number;
  duplicate: number;
  errori: { nome: string; motivo: string }[];
  // dettagli in più per il riepilogo in dashboard
  nomiNonConformi: string[];
  nomiDuplicati: string[];
  annullato: boolean;
}
