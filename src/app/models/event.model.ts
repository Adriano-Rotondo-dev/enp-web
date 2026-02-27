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

export interface ArchiveEvent {
  id: number;
  vol: string;
  name: string;
  date: string;
  description: string;
  posterUrl: string;
  spotifyUrl?: string; //? non obbligatorio
  liveMusicUrl?: string; //? non obbligatorio
}

export interface EnpPhoto {
  id: number;
  url: string;
  title: string;
  tag: string;
  eventDate?: string; //? non obbligatorio
  author?: string; //? non obbligatorio
  archiveEventId?: number | null; //? non obbligatorio
  eventVol?: string; //? non obbligatorio
  eventName?: string; //? non obbligatorio
}

export interface SongRequest {
  id: number;
  event_id: number | null;
  user_email: string;
  song_request: string;
  requested_at: string;
  status: 'pending' | 'played' | 'rejected';
  event_title?: string; //? non obbligatorio
}