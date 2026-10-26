import { ArchiveEvent, EventType } from '../models/event.model';
import {
  findArchiveMatch,
  formatDay,
  hasPhotoExtension,
  isValidDate,
  parsePhotoFileName,
  photoDisplayTitle
} from './photo-filename';

const TYPES: EventType[] = [
  { id: 1, prefix: 'EMONIGHT', label: 'Emo Night' },
  { id: 2, prefix: 'EMOXMAS', label: 'Emo Xmas Night' }
];

const serata = (id: number, eventTypeId: number | null, eventDay: string | null): ArchiveEvent => ({
  id, vol: `VOL. ${id}`, name: 'X', date: '', description: '', posterUrl: '', eventTypeId, eventDay
});

describe('parsePhotoFileName', () => {
  it('riconosce un nome conforme', () => {
    const p = parsePhotoFileName('EMONIGHT-17102026-001.jpg', TYPES);
    expect(p.conforme).toBe(true);
    expect(p.eventType?.id).toBe(1);
    expect(p.eventDay).toBe('2026-10-17');
    expect(p.sequence).toBe(1);
  });

  it('non distingue maiuscole e minuscole', () => {
    const p = parsePhotoFileName('emoxmas-24122025-12.JPEG', TYPES);
    expect(p.conforme).toBe(true);
    expect(p.prefix).toBe('EMOXMAS');
    expect(p.sequence).toBe(12);
  });

  it('accetta jfif, png e webp', () => {
    for (const ext of ['jfif', 'png', 'webp']) {
      expect(parsePhotoFileName(`EMONIGHT-01012026-1.${ext}`, TYPES).conforme).toBe(true);
    }
  });

  it('segnala il prefisso sconosciuto', () => {
    const p = parsePhotoFileName('EMOMTV-17102026-001.jpg', TYPES);
    expect(p.conforme).toBe(false);
    expect(p.prefix).toBe('EMOMTV');
    expect(p.motivo).toContain('sconosciuto');
  });

  it('segnala una data impossibile', () => {
    const p = parsePhotoFileName('EMONIGHT-31022026-001.jpg', TYPES);
    expect(p.conforme).toBe(false);
    expect(p.eventDay).toBeNull();
  });

  it('rifiuta i nomi fuori formato', () => {
    for (const name of ['IMG_1234.jpg', 'EMONIGHT-1710202-001.jpg', 'EMONIGHT-17102026-12345.jpg',
      'EMONIGHT-17102026-001.gif', 'E-17102026-001.jpg', 'EMONIGHT_17102026_001.jpg']) {
      expect(parsePhotoFileName(name, TYPES).conforme).toBe(false);
    }
  });
});

describe('utilità nome file', () => {
  it('filtra le estensioni accettate', () => {
    expect(hasPhotoExtension('a.JPG')).toBe(true);
    expect(hasPhotoExtension('a.jfif')).toBe(true);
    expect(hasPhotoExtension('a.heic')).toBe(false);
    expect(hasPhotoExtension('.DS_Store')).toBe(false);
    expect(hasPhotoExtension('jpg')).toBe(false);
  });

  it('controlla le date come checkdate', () => {
    expect(isValidDate(29, 2, 2024)).toBe(true);
    expect(isValidDate(29, 2, 2025)).toBe(false);
    expect(isValidDate(0, 1, 2025)).toBe(false);
    expect(isValidDate(1, 13, 2025)).toBe(false);
  });

  it('trova la serata solo se è unica', () => {
    const events = [serata(1, 1, '2026-10-17'), serata(2, 1, '2026-10-18'), serata(3, 1, '2026-10-18')];
    expect(findArchiveMatch(1, '2026-10-17', events).match?.id).toBe(1);
    expect(findArchiveMatch(1, '2026-10-18', events)).toEqual({ match: null, count: 2 });
    expect(findArchiveMatch(2, '2026-10-17', events).count).toBe(0);
    expect(findArchiveMatch(null, null, events).match).toBeNull();
  });

  it('compone il titolo di ripiego', () => {
    expect(formatDay('2026-10-17')).toBe('17.10.2026');
    expect(photoDisplayTitle({ title: 'Moshpit', eventTypeLabel: 'Emo Night', eventDay: '2026-10-17' })).toBe('Moshpit');
    expect(photoDisplayTitle({ title: '  ', eventTypeLabel: 'Emo Night', eventDay: '2026-10-17' })).toBe('Emo Night 17.10.2026');
    // il DB salva '' per le foto senza titolo
    expect(photoDisplayTitle({ title: '', eventTypeLabel: 'Emo Night', eventDay: '2026-10-17' })).toBe('Emo Night 17.10.2026');
    expect(photoDisplayTitle({ title: undefined, eventTypeLabel: 'Emo Night', eventDay: null })).toBe('Emo Night');
    expect(photoDisplayTitle({ title: null, eventTypeLabel: null, eventDay: null })).toBe('');
  });
});

describe('allineamento con middleware/photo-name.php (QA)', () => {
  it('ignora spazi ai lati e percorso, come trim(basename()) del backend', () => {
    expect(parsePhotoFileName(' EMONIGHT-17102026-001.jpg ', TYPES).conforme).toBe(true);
    expect(parsePhotoFileName('sub/dir/EMONIGHT-17102026-001.jpg', TYPES).conforme).toBe(true);
    expect(parsePhotoFileName('EMONIGHT-17102026-001 .jpg', TYPES).conforme).toBe(false);
  });

  it('checkdate anche per gli anni 1-99 e rifiuta anno 0', () => {
    expect(isValidDate(1, 1, 29)).toBe(true);
    expect(isValidDate(29, 2, 2000)).toBe(true);
    expect(isValidDate(29, 2, 1900)).toBe(false);
    expect(isValidDate(1, 1, 0)).toBe(false);
  });
});
