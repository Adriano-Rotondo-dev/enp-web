# Enp-web

Frontend Angular per **Emo Night Palermo** — sito pubblico e pannello admin per la gestione dell'evento.  
Progetto companion: [enp-backend](../enp-backend/README.md)

---

## Stack

- Angular 19 (Standalone Components, Signals)
- TailwindCSS
- SSR con Angular Universal / hydration
- TypeScript strict

---

## Struttura cartelle

```
src/app/
├── components/
│   ├── backstage/          # Pagina login admin
│   ├── contacts/           # Pagina contatti — socials, business & booking, FAQ
│   ├── footer/             # Footer globale
│   ├── home/               # Home page con countdown e carousel
│   ├── navbar/             # Navbar globale
│   ├── not-found/          # Pagina 404
│   └── toast/              # Componente toast notifiche
├── guards/
│   └── auth.guard.ts       # Protezione route dashboard
├── interceptors/
│   └── auth.interceptor.ts # Aggiunge JWT header a tutte le richieste HTTP
├── models/
│   └── event.model.ts      # Interfacce TypeScript
├── pages/
│   ├── archivio-eventi/    # Pagina pubblica eventi passati
│   ├── archivio-foto/      # Pagina pubblica galleria foto con filtri e lightbox
│   ├── chi-siamo/          # Pagina crew
│   ├── dashboard/          # Pannello admin (lazy loaded, auth guard)
│   └── prossimo-evento/    # Pagina dettaglio prossimo evento
└── services/
    ├── auth.service.ts     # Login, logout, gestione JWT
    ├── event.service.ts    # Tutti i dati dell'app (segnali centrali)
    └── toast.service.ts    # Gestione notifiche toast
```

---

## Setup locale

### Requisiti
- Node.js 18+
- Angular CLI 19+

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
Pagina principale. Mostra countdown al prossimo evento, carousel foto e link alle sezioni. Usa `isPlatformBrowser()` per proteggere il countdown da SSR.

### `ProssimoEventoComponent`
Dettaglio del prossimo evento: titolo, data, orario, location, lineup completa. Il bottone Google Maps genera il link dinamicamente da `location` e `address` tramite `https://www.google.com/maps/search/?api=1&query=` — nessun campo `mapsUrl` nel DB. `openMaps()` è protetto da `isPlatformBrowser()`.

### `ArchivioEventiComponent`
Lista di tutte le serate passate in ordine cronologico inverso. Per ogni evento mostra tre bottoni condizionali:
- **Gallery** — sempre visibile, naviga a `/archivio-foto?eventId={id}`
- **Setlist** — visibile solo se `spotifyUrl` è presente, apre Spotify in nuova tab
- **Live Music** — visibile solo se `liveMusicUrl` è presente, apre Instagram in nuova tab

### `ArchivioFotoComponent`
Galleria foto con doppio sistema di filtri e lightbox.

**Filtri:**
- Select *Night* — filtra per serata tramite `archiveEventId` (FK)
- Select *Tag* — filtra per categoria (Crowd, Stage, Backstage, ecc.)
- I filtri sono combinabili. Il reset azzera entrambi.
- I tag disponibili vengono calcolati dinamicamente dalle foto caricate (`availableTags` computed signal)
- Il query param `?eventId=` viene letto da `ActivatedRoute` — consente il deep link dalla pagina archivio eventi

**Lightbox:**
- Click su qualsiasi foto apre il lightbox fullscreen
- Navigazione prev/next tra le foto filtrate
- Click sull'overlay chiude il lightbox
- Navigazione mobile con bottoni dedicati

### `ContactsComponent`
Pagina contatti con tre sezioni:
- **Socials** — link a Instagram, TikTok, Telegram, WhatsApp
- **Business & Booking** — copia email con feedback visivo
- **FAQ** — domande frequenti con accordion nativo HTML `<details>`

### `ChiSiamoComponent`
Pagina crew — contenuto statico.

### `BackstageComponent`
Form di login admin. Redirige alla dashboard dopo autenticazione.

### `NotFoundComponent`
Pagina 404 con link alla home.

---

## Dashboard admin

Accessibile solo dopo login su `/backstage`. Il path della dashboard è offuscato.

### Tab `[01] Prossimo Evento`
Modifica i dati del prossimo evento: titolo, data, orario, location, indirizzo, lineup (time + act per ogni slot), descrizione. Il salvataggio aggiorna sia `next_event` che `next_event_lineup` in un'unica chiamata.

### Tab `[02] Gestione Archivio`
Gestione completa degli eventi passati.

**Aggiunta nuovo evento:**
- Vol, nome, data, descrizione
- Spotify URL (opzionale) — link playlist della serata
- Live Music IG URL (opzionale) — link Instagram del feat
- Upload poster (WebP/JPG/PNG, max 5MB)
- Live preview card durante la compilazione

**Edit/Delete inline:**
- Ogni evento in lista ha modalità edit con tutti i campi inclusi i due URL opzionali
- Pattern `@if (editingArchiveEvent(); as editing)` per evitare errori null su ngModel

### Tab `[03] Archivio Foto`
Gestione foto delle serate.

**Upload:**
- Selezione file con preview istantanea
- Metadati: titolo, tag, data evento, fotografo
- Dropdown *Collega a Evento* — associa la foto a una serata tramite `archive_event_id`

**Griglia foto esistenti:**
- Hover mostra titolo, tag, VOL dell'evento collegato
- Edit inline con tutti i campi incluso il dropdown di collegamento evento
- Delete con conferma

---

## Servizi

### `EventService`
Unica sorgente di verità per tutti i dati dell'app. Espone segnali centrali:

```typescript
nextEvent = signal<NextEvent>(mockNextEvent);
archiveEvents = signal<ArchiveEvent[]>(mockArchiveEvents);
photos = signal<EnpPhoto[]>(mockPhotos);
```

Tutti i componenti leggono da questi segnali. I mock vengono sovrascritti dai dati reali al primo `load*()`. Il flag `USE_BACKEND = true` abilita le chiamate reali — con `false` usa solo i mock per sviluppo offline.

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

`authInterceptor` aggiunge automaticamente `Authorization: Bearer <token>` a tutte le richieste HTTP quando il token è presente.

`authGuard` protegge la route della dashboard — redirige su `/backstage` se non autenticato.

Il path della dashboard è offuscato per ridurre la superficie di attacco da bot e scanner automatici.

---

## SSR

L'app usa Angular SSR con hydration. Tutti i timer (`setInterval`, `setTimeout`) e le chiamate browser-only (`AudioContext`, `sessionStorage`) sono protetti con `isPlatformBrowser()`. La prima immagine LCP usa `loading="eager"`, le successive `loading="lazy"`.

---

## Build produzione

```bash
ng build --configuration production
```

L'output viene generato in `dist/`. Aggiorna `environment.prod.ts` prima del build.

---

## Privacy e dati personali

Il sito non raccoglie dati personali degli utenti. Non vengono usati cookie di tracciamento, analytics di terze parti o social widget embedded. I link Google Maps e social aprono una nuova scheda verso servizi esterni senza embedding di iframe.

