import { TestBed } from '@angular/core/testing';

import { LoaderComponent } from './loader';

describe('LoaderComponent', () => {
  const render = async (inputs: Record<string, string>) => {
    const fixture = TestBed.createComponent(LoaderComponent);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('grande: scritta SOUNDCHECK ed etichetta, annunciato ai lettori di schermo', async () => {
    const el = await render({ label: 'Caricamento galleria' });
    expect(el.textContent).toContain('Soundcheck');
    expect(el.textContent).toContain('Caricamento galleria');
    expect(el.querySelector('[role=status]')?.getAttribute('aria-label')).toBe('Caricamento galleria');
  });

  it('piccolo: solo icona, senza scritte', async () => {
    const el = await render({ size: 'sm' });
    expect(el.textContent?.trim()).toBe('');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('/emo-boy-loader.webp');
  });
});
