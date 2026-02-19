import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home'; 
import { ArchivioFotoComponent } from './pages/archivio-foto/archivio-foto';
import { ArchivioEventiComponent } from './pages/archivio-eventi/archivio-eventi';
import { ChiSiamoComponent } from './pages/chi-siamo/chi-siamo';
import{ ProssimoEventoComponent } from './pages/prossimo-evento/prossimo-evento'
import { ContactsComponent } from './components/contacts/contacts';
import { BackstageComponent } from './components/backstage/backstage';
import { NotFoundComponent } from './components/not-found/not-found';
//! CHECK NAMES  

export const routes: Routes = [
  
{ path: '', component: HomeComponent },

  { path: 'prossimo-evento', component: ProssimoEventoComponent },
  { path: 'archivio-foto', component: ArchivioFotoComponent },
  { path: 'archivio-eventi', component: ArchivioEventiComponent },
  { path: 'chi-siamo', component: ChiSiamoComponent },
  { path: 'contact-us', component: ContactsComponent},
  {path: 'backstage', component: BackstageComponent},
//ERROR HANDLING URL
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' }
 
]