import { ArchiveEvent, EnpPhoto, EventType } from '../models/event.model';

// Stessa regola del backend (SPEC §3). Il backend resta la fonte di verità:
// qui serve solo per l'anteprima prima dell'invio.
export const PHOTO_FILENAME_REGEX =
  /^([A-Za-z0-9]{2,20})-(\d{2})(\d{2})(\d{4})-(\d{1,4})\.(jpe?g|jfif|png|webp)$/i;

export const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'jfif', 'png', 'webp'];

// Prefisso di una tipologia: solo A-Z e 0-9, 2-20 caratteri (dopo il maiuscolo)
export const EVENT_TYPE_PREFIX_REGEX = /^[A-Z0-9]{2,20}$/;

export interface ParsedPhotoName {
  conforme: boolean;
  prefix: string | null;
  eventType: EventType | null;
  eventDay: string | null;   // YYYY-MM-DD
  sequence: number | null;
  motivo: string | null;     // perché non è conforme
}

/** true se l'estensione è tra quelle accettate (jpg, jpeg, jfif, png, webp) */
export function hasPhotoExtension(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return name.includes('.') && PHOTO_EXTENSIONS.includes(ext);
}

/** Nome salvato dal backend come originalName: trim(basename(nome)) */
export function photoBaseName(name: string): string {
  return (name.replace(/\\/g, '/').split('/').pop() ?? '').trim();
}

/** Equivalente di checkdate() in PHP */
export function isValidDate(day: number, month: number, year: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  // setUTCFullYear: Date.UTC trasformerebbe gli anni 0-99 in 1900-1999
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Anteprima del nome file PREFISSO-GGMMAAAA-NNN.ext.
 * Conforme solo se la regex combacia, il prefisso esiste tra le tipologie e la data è valida.
 */
export function parsePhotoFileName(name: string, types: EventType[]): ParsedPhotoName {
  const fail = (motivo: string, prefix: string | null = null): ParsedPhotoName => ({
    conforme: false, prefix, eventType: null, eventDay: null, sequence: null, motivo
  });

  // come il backend: solo il nome (senza percorso), senza spazi ai lati
  const m = PHOTO_FILENAME_REGEX.exec(photoBaseName(name));
  if (!m) return fail('Nome non nel formato PREFISSO-GGMMAAAA-NNN');

  const prefix = m[1].toUpperCase();
  const eventType = types.find(t => t.prefix.toUpperCase() === prefix) ?? null;
  if (!eventType) return fail(`Prefisso ${prefix} sconosciuto`, prefix);

  const [dd, mm, yyyy] = [m[2], m[3], m[4]];
  if (!isValidDate(+dd, +mm, +yyyy)) return fail(`Data ${dd}.${mm}.${yyyy} non valida`, prefix);

  return {
    conforme: true,
    prefix,
    eventType,
    eventDay: `${yyyy}-${mm}-${dd}`,
    sequence: parseInt(m[5], 10),
    motivo: null
  };
}

/** La serata a cui il backend collegherà la foto: solo se ce n'è esattamente una */
export function findArchiveMatch(
  eventTypeId: number | null | undefined,
  eventDay: string | null | undefined,
  events: ArchiveEvent[]
): { match: ArchiveEvent | null; count: number } {
  if (eventTypeId == null || !eventDay) return { match: null, count: 0 };
  const found = events.filter(e => e.eventTypeId === eventTypeId && e.eventDay === eventDay);
  return { match: found.length === 1 ? found[0] : null, count: found.length };
}

/** YYYY-MM-DD → gg.mm.aaaa */
export function formatDay(day: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day ?? '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/** Titolo da mostrare: il titolo, altrimenti "{tipologia} {gg.mm.aaaa}", altrimenti niente */
export function photoDisplayTitle(photo: Pick<EnpPhoto, 'title' | 'eventTypeLabel' | 'eventDay'>): string {
  const title = photo.title?.trim();
  if (title) return title;
  return [photo.eventTypeLabel?.trim(), formatDay(photo.eventDay)].filter(Boolean).join(' ');
}
