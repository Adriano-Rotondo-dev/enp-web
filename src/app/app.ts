import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators' //filtro per eventi router
import { NavbarComponent } from './components/navbar/navbar'; // Assicurati che il file sia navbar.ts
import { FooterComponent } from './components/footer/footer'; // Assicurati che il file sia footer.ts
import { ToastComponent } from './components/toast/toast';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('enp-web'); 
  private router = inject(Router) //inject del Router
  private platformId =inject(PLATFORM_ID) //identificazione - siamo sul browser?
  private document = inject(DOCUMENT);
  private meta = inject(Meta);
  // host canonico del sito (apex, senza www)
  private readonly siteUrl = 'https://emonightpalermo.it';

  constructor(){
    //con il constructor ascoltiamo i cambi di route
    //ScrollToTop
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event)=>{
      this.updateCanonical(event.urlAfterRedirects);
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

  // canonical e og:url per ogni rotta, sempre sull'host canonico
  private updateCanonical(url: string) {
    const path = url.split(/[?#]/)[0];
    const href = this.siteUrl + path;
    let link = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
    this.meta.updateTag({ property: 'og:url', content: href });
  }
}
