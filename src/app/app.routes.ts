import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home'; 
import { ArchivioFotoComponent } from './pages/archivio-foto/archivio-foto';
import { ArchivioEventiComponent } from './pages/archivio-eventi/archivio-eventi';
import { ChiSiamoComponent } from './pages/chi-siamo/chi-siamo';
import{ProssimoEventoComponent} from './pages/prossimo-evento/prossimo-evento'
//! CHECK NAMES  

export const routes: Routes = [
  
{ path: '', component: HomeComponent },

  { path: 'prossimo-evento', component: ProssimoEventoComponent },
  { path: 'archivio-foto', component: ArchivioFotoComponent },
  { path: 'archivio-eventi', component: ArchivioEventiComponent },
  { path: 'chi-siamo', component: ChiSiamoComponent },
  { path: '**', redirectTo: '' } // Se l'utente scrive cavolate, torna in Home
 
]