export interface EnpEvent {
  id: string;
  title: string;
  date: string; // debugging 
  location: string;
  description: string;
  price?: number; // optional price
}