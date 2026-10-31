# Enp-web

Frontend Angular per **Emo Night Palermo** — sito pubblico e pannello admin per la gestione dell'evento.  
Progetto companion: [enp-backend](https://github.com/Adriano-Rotondo-dev/enp-backend/blob/main/README.md)
---

## Stack

- Angular 21 (Standalone Components, Signals, zoneless)
- Tailwind CSS 4 (+ `tw-animate-css`)
- Vitest per i test (`npx ng test --watch=false`)
- TypeScript strict
- Sito statico su Vercel (niente SSR)

---

## Struttura cartelle

```
src/app/
├── components/
│   ├── backstage/          # Pagina login admin
│   ├── contacts/           # Pagina contatti — socials, business & booking, FAQ
│   ├── footer/             # Footer globale
│   ├── home/               # Home page con countdown e carousel
│   ├── loader/             # Loader "Amp Pulse" (pagine, immagini, salvataggi)
│   ├── navbar/             # Navbar globale
│   ├── not-found/          # Pagina 404
│   └── toast/              # Componente toast notifiche
├── auth-guard.ts           # Protezione route dashboard
├── interceptors/
│   └── auth.interceptor.ts # Aggiunge il JWT alle richieste; con un 401 riporta al login
├── models/
│   └── event.model.ts      # Interfacce TypeScript
├── pages/
│   ├── archivio-eventi/    # Pagina pubblica eventi passati
│   ├── archivio-foto/      # Pagina pubblica galleria foto con filtri e lightbox
│   ├── chi-siamo/          # Pagina crew
│   ├── dashboard/          # Pannello admin (lazy loaded, auth guard): cornice + una scheda per file
│   │                       #   dashboard-evento / dashboard-archivio / dashboard-foto
│   ├── privacy-policy/     # Pagina /legal
│   └── prossimo-evento/    # Pagina dettaglio prossimo evento
├── services/
│   ├── auth.service.ts     # Login, logout, gestione JWT
│   ├── event.service.ts    # Tutti i dati dell'app (segnali centrali)
│   └── toast.service.ts    # Gestione notifiche toast
└── utils/
    └── photo-filename.ts   # Regole del nome file PREFISSO-GGMMAAAA-NNN (identiche al backend)
```

---

## Setup locale

### Requisiti
- Node.js 20+
- npm 10

### Installazione

```bash
npm install
ng serve
```

L'app gira su `http://localhost:4200`.

### Connessione al backend

In `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost/enp-backend/public'
};
```

Per la produzione, aggiorna `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tuo-dominio.it/api/public'
};
```

---

## Route

| Path | Componente | Guard |
|------|-----------|-------|
| `/` | HomeComponent | — |
| `/prossimo-evento` | ProssimoEventoComponent | — |
| `/archivio-eventi` | ArchivioEventiComponent | — |
| `/archivio-foto` | ArchivioFotoComponent | — |
| `/chi-siamo` | ChiSiamoComponent | — |
| `/contact-us` | ContactsComponent | — |
| `/legal` | PrivacyPolicyComponent | — |
| `/backstage` | BackstageComponent | — |
| `/backstage/m4N4g3_eNP-v1_01_01_d4shB04Rd_` | DashboardComponent | authGuard |
| `/404` | NotFoundComponent | — |
| `/**` | redirect → `/404` | — |

La dashboard è lazy loaded con `loadComponent`.

---

## Modelli

```typescript
interface NextEvent {
  id: string;
  title: string;
  date: string;          // ISO: YYYY-MM-DDTHH:mm:ss
  time: string;
  location: string;
  address: string;
  description: string;
  price?: number;
  lineup: Lineup[];
}

interface Lineup {
  time: string;
  act: string;
}

interface ArchiveEvent {
  id: number;
  vol: string;
  name: string;
  date: string;
  description: string;
  posterUrl: string;
  spotifyUrl?: string;    // Link playlist Spotify — opzionale
  liveMusicUrl?: string;  // Link Instagram feat/live — opzionale
}

interface EnpPhoto {
  id: number;
  url: string;
  title: string;
  tag: string;
  eventDate?: string;
  author?: string;
  archiveEventId?: number | null;  // FK verso archive_events
  eventVol?: string;               // Popolato dalla JOIN in get.php
  eventName?: string;              // Popolato dalla JOIN in get.php
}
```

---

## Componenti pubblici

### `HomeComponent`
Pagina principale. Mostra countdown al prossimo evento, carousel foto e link alle sezioni. Mentre l'evento si carica compare il loader piccolo.

### `ProssimoEventoComponent`
Dettaglio del prossimo evento: titolo, data, orario, location, lineup. Una riga di lineup si vede solo se ha orario **e** nome (stessa regola del backend); senza righe valide compare il riquadro **"// TBA_ Lineup in arrivo"**. Il bottone Google Maps genera il link da `location` e `address` (`https://www.google.com/maps/search/?api=1&query=`).

### `ArchivioEventiComponent`
Lista di tutte le serate passate in ordine cronologico inverso. Sopra ogni poster resta il loader finché l'immagine non è arrivata. Per ogni evento mostra tre bottoni condizionali:
- **Gallery** — sempre visibile, naviga a `/archivio-foto?eventId={id}`
- **Setlist** — visibile solo se `spotifyUrl` è presente, apre Spotify in nuova tab
- **Live Music** — visibile solo se `liveMusicUrl` è presente, apre Instagram in nuova tab

### `ArchivioFotoComponent`
Galleria foto con filtri, blocchi "Mostra altre" e lightbox.

**Filtri:**
- *Serata* — per `archiveEventId`; *Tipologia* — per prefisso (EMONIGHT, EMOXMAS…), mostra tutte le tipologie anche senza foto
- I filtri restano nell'URL (`?eventId=` e `?tipo=`), così il link si può condividere; dalla pagina Past Nights si arriva già filtrati

**Caricamento:** 48 foto per volta (`PHOTO_PAGE_SIZE` in `utils/photo-filename.ts`) con il pulsante "[ Mostra altre — X di N ]"; cambiando filtro si riparte dal primo blocco. Sopra ogni foto resta il loader finché l'immagine non è arrivata.

**Lightbox:**
- Click su una foto apre il lightbox a tutto schermo, con nome del fotografo se presente
- Navigazione prev/next in cerchio tra le foto filtrate
- Pulsante di download: `photos/download.php` restituisce un JPG con nome casuale (il backend converte WebP/PNG una sola volta e poi riusa la copia)

### `ContactsComponent`
Pagina contatti con tre sezioni:
- **Socials** — link a Instagram, TikTok, WhatsApp (Telegram nascosto finché non c'è il link)
- **Business & Booking** — copia email con feedback visivo
- **FAQ** — domande frequenti con accordion nativo HTML `<details>`

### `ChiSiamoComponent`
Pagina crew — contenuto statico.

### `BackstageComponent`
Form di login admin con username e password (account separati nella tabella `admins`). Redirige alla dashboard dopo l'autenticazione; dopo troppi tentativi falliti il backend risponde 429.

### `NotFoundComponent`
Pagina 404 con link alla home.

### `LoaderComponent` (`app-loader`)
Loader "Amp Pulse": l'icona emo (`public/emo-boy-loader.webp`, 2,4 KB) pulsa con onde viola.
- `label` — testo sotto l'icona, es. `label="Caricamento galleria"`
- `size` — `'lg'` per le pagine (con la scritta SOUNDCHECK...), `'sm'` per riquadri e immagini
- `overlay` — copre con un velo scuro il riquadro che lo contiene (che deve avere `position: relative`)

Rispetta "riduci movimento" del sistema operativo.

---

## Dashboard admin

Accessibile solo dopo login su `/backstage`. Il path della dashboard è offuscato.

`DashboardComponent` è solo la cornice (menu, schede, logout). Ogni scheda è un componente a sé, sempre montato e solo nascosto quando non è attivo: cambiando scheda non si perdono file in caricamento, filtri e moduli. Le classi dei campi (`enp-input`, `enp-label`…) sono definite in `src/styles.css`.

Durante un salvataggio, solo il riquadro interessato viene coperto da `<app-loader overlay>` con "// Salvataggio"; alla risposta il velo sparisce e il dato aggiornato è già visibile. Il caricamento delle foto a lotti usa invece la sua barra di avanzamento.

### `[01] Prossimo Evento` (`dashboard-evento`)
Modifica titolo, data, orario, location, indirizzo, lineup e descrizione. Il modulo lavora su una copia: le modifiche arrivano al sito solo dopo il salvataggio. Se l'evento non si carica, il modulo resta vuoto e compare un avviso. La lineup offre sempre almeno 4 righe: lasciandole vuote, sul sito compare "Lineup in arrivo".

### `[02] Gestione Archivio` (`dashboard-archivio`)
- Serate: volume, nome, tipologia, data vera, data mostrata, descrizione, poster (max 5 MB), Spotify e Live Music in modifica.
- Salvando una serata, le foto con stessa tipologia e stessa data si collegano da sole.
- Riquadro **Tipologie evento**: aggiunta, rinomina, eliminazione (solo se non in uso).

### `[03] Archivio Foto` (`dashboard-foto`)
- "Carica file" e "Carica cartella", con anteprima: conforme, già caricata, oltre 5 MB, serata collegata.
- Invio un file alla volta con barra di avanzamento, STOP e riepilogo.
- Gestione: schede Tutte / Foto non collegate, filtri Tipologia/Serata/Data, blocchi da 48, modifica ed eliminazione.

---

## Servizi

### `EventService`
Unica sorgente di verità per tutti i dati dell'app. Espone segnali centrali:

`nextEvent`, `archiveEvents`, `photos`, `eventTypes`, con lo stato di caricamento in `nextEventStatus`, `archiveStatus` e `photosStatus` (`loading` / `ready` / `unavailable`).

Tutti i componenti leggono da questi segnali. Non ci sono dati finti: se il backend non risponde, le pagine mostrano "Stay Tuned" o "momentaneamente non disponibile".

Metodi principali:

| Metodo | Descrizione |
|--------|-------------|
| `loadNextEvent()` | Carica prossimo evento |
| `updateNextEvent()` | Aggiorna evento e lineup |
| `loadArchiveEvents()` | Carica storico serate |
| `addToArchive()` | Aggiunge serata con upload poster |
| `updateArchiveEvent()` | Aggiorna serata inclusi spotifyUrl e liveMusicUrl |
| `deleteArchiveEvent()` | Elimina serata |
| `loadPhotos()` | Carica foto con JOIN archive_events |
| `uploadPhoto()` | Carica foto con archive_event_id |
| `updatePhoto()` | Aggiorna metadati + archive_event_id |
| `deletePhoto()` | Elimina foto |

### `AuthService`
Gestisce login, logout e stato autenticazione.

- Token JWT salvato in `sessionStorage` sotto la chiave `enp_token`
- `isAuthenticated()` decodifica il payload lato client e verifica la scadenza
- `logout()` rimuove il token e redirige a `/backstage`

### `ToastService`
Notifiche globali in sostituzione degli `alert()` nativi. Toast bottom-right con auto-dismiss dopo 3 secondi.

```typescript
this.toast.success('Operazione completata');
this.toast.error('Qualcosa è andato storto');
this.toast.info('Messaggio informativo');
```

---

## Autenticazione e sicurezza

`authInterceptor` aggiunge automaticamente `Authorization: Bearer <token>` a tutte le richieste HTTP quando il token è presente. Se il backend risponde 401 (token scaduto o non valido), fa logout e torna a `/backstage` con l'avviso "Sessione scaduta".

`authGuard` protegge la route della dashboard — redirige su `/backstage` se non autenticato.

Il path della dashboard è offuscato per ridurre la superficie di attacco da bot e scanner automatici.

---

## Build produzione

```bash
ng build --configuration production
```

L'output viene generato in `dist/enp-web/browser`, che Vercel pubblica come sito statico (`vercel.json`: rewrite verso `index.html`, header di sicurezza e CSP con `script-src 'self'`). La prima immagine LCP usa `loading="eager"`, le successive `loading="lazy"`.

**Primo avvio senza lampi:**
- `angular.json` → `optimization.styles.inlineCritical: false`: il CSS (circa 9 KB compressi) si carica prima di disegnare la pagina, invece che in modo asincrono.
- `src/index.html` contiene dentro `<app-root>` un loader con stile incorporato, visibile prima di CSS e JavaScript; Angular lo sostituisce quando la pagina è pronta.
- Il font del logo (`public/fonts/AnotherDangerSlanted.otf`) e l'icona del loader sono precaricati con `<link rel="preload">`.

**Dominio:** il dominio primario è `emonightpalermo.it`; `www.emonightpalermo.it` fa redirect 308 verso di esso (impostato in Vercel → Domains, non in `vercel.json`). Canonical, `og:url` e sitemap usano l'apex.

---

## Privacy e dati personali

L'informativa completa (art. 13 GDPR) è nella pagina `/legal` (`pages/privacy-policy`). **Da completare:** i dati identificativi del titolare del trattamento (commento `TODO titolare` nel template).

In sintesi:
- nessun form, cookie, `localStorage` o contenuto incorporato di terzi nelle pagine pubbliche; i font sono ospitati sul sito;
- statistiche con Vercel Web Analytics (`@vercel/analytics`), aggregate e senza cookie;
- le foto delle serate ritraggono persone e sono scaricabili: chi compare può chiederne la rimozione all'email del sito;
- l'area staff (non citata in /legal perché riguarda solo lo staff) usa `sessionStorage` per il token; il backend conserva per 15 minuti l'hash degli IP dei tentativi di login falliti.

