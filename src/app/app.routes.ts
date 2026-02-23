import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home'; 
import { ArchivioFotoComponent } from './pages/archivio-foto/archivio-foto';
import { ArchivioEventiComponent } from './pages/archivio-eventi/archivio-eventi';
import { ChiSiamoComponent } from './pages/chi-siamo/chi-siamo';
import{ ProssimoEventoComponent } from './pages/prossimo-evento/prossimo-evento'
import { ContactsComponent } from './components/contacts/contacts';
import { BackstageComponent } from './components/backstage/backstage';
import { NotFoundComponent } from './components/not-found/not-found';
import { authGuard } from './auth-guard';
//! CHECK NAMES  

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'prossimo-evento', component: ProssimoEventoComponent },
  { path: 'archivio-foto', component: ArchivioFotoComponent },
  { path: 'archivio-eventi', component: ArchivioEventiComponent },
  { path: 'chi-siamo', component: ChiSiamoComponent },
  { path: 'contact-us', component: ContactsComponent},
  {path: 'backstage', component: BackstageComponent},

  //protected routes
  { path: 'backstage/m4N4g3_eNP-v1_01_01_d4shB04Rd_',
    loadComponent: () => import ('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
   },

//ERROR HANDLING AND REDIRECT 
  {path: 'm4N4g3_eNP-v1_01_01_d4shB04Rd_', redirectTo: '/backstage', pathMatch:'full'},
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' }
]