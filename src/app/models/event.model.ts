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
  mapsUrl: string;
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
}

export interface EnpPhoto {
  id: number;
  url: string;
  title: string;
  tag: string;
  eventDate?: string;
  author?: string;
}