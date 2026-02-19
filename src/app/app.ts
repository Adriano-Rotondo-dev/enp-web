import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import {filter} from 'rxjs/operators' //filtro per eventi router
import { NavbarComponent } from './components/navbar/navbar'; // Assicurati che il file sia navbar.ts
import { FooterComponent } from './components/footer/footer'; // Assicurati che il file sia footer.ts

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('enp-web'); 
  private router = inject(Router) //inject del Router
  private platformId =inject(PLATFORM_ID) //identificazione - siamo sul browser?

  constructor(){
    //con il constructor ascoltiamo i cambi di route
    //ScrollToTop
    this.router.events.pipe(
      filter(event=>event instanceof NavigationEnd)
    ).subscribe(()=>{
      // scroll SOLO su browser
      if (isPlatformBrowser(this.platformId)){
        window.scrollTo({
          // transizione smooth e non scattosa
          top:0,
          behavior:'smooth'
        })
      }
    })

  }
}