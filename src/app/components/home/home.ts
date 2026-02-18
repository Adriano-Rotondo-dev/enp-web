import { Component, signal } from '@angular/core';
// interfaccia 
import { EnpEvent } from '../../models/event.model'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html', 
  styleUrl: './home.css'      
})
export class HomeComponent {
// * signal in fase di debug - precedente al database
nextEvent = signal<EnpEvent>({
  id:"1",
title: 'Emo Night Palermo',
    date: '21 Febbario 2026',
    location: 'MindHouse, Palermo, Via San Lorenzo, 273/A',
    description: 'Emo Anime Night - Work in Progress',
    price: 7
})
} 
//!CHECK NAMES FOR IMPORT