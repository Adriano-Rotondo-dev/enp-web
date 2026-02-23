import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  // Menu State
  isMenuOpen = signal(false);

  // Link dinamici 
  navLinks = [
    { path: '/', label: 'Home'},
    { path: '/prossimo-evento', label: 'Next Night' },
    { path: '/archivio-eventi', label: 'Past Nights' },
    { path: '/archivio-foto', label: 'Gallery' },
    { path: '/chi-siamo', label: 'Crew' }
  ];

  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
}
}