//tipizzare ed esportare il modello EnpEvent

export interface EnpEvent {
  id: string;
  title: string;
  date: string; // debugging/wip purpose
  location: string;
  description: string;
  price?: number; // optional price - //TODO renderlo obbligatorio?
}