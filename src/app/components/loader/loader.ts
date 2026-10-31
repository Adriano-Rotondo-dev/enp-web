import { booleanAttribute, Component, input } from '@angular/core';

// Loader "Amp Pulse": l'icona emo pulsa come una cassa con onde viola.
// size 'lg' per le pagine (con la scritta SOUNDCHECK), 'sm' sopra poster e foto in caricamento.
// overlay: copre con un velo scuro il riquadro che lo contiene (che deve avere position: relative).
@Component({
  selector: 'app-loader',
  standalone: true,
  host: { '[class.overlay]': 'overlay()' },
  template: `
    <div class="loader" [class.sm]="size() === 'sm'" role="status" [attr.aria-label]="label() || 'Caricamento in corso'">
      <div class="stage">
        <span class="ring"></span><span class="ring"></span><span class="ring"></span>
        <img class="icon" src="/emo-boy-loader.webp" alt="" width="256" height="256" />
      </div>
      @if (size() === 'lg') {
        <p class="big" data-t="Soundcheck...">Soundcheck...</p>
      }
      @if (label()) {
        <p class="label"><b>//</b> {{ label() }}</p>
      }
    </div>
  `,
  styles: `
    :host(.overlay) { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; background: rgba(0, 0, 0, .75); }
    .loader { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .stage { position: relative; width: 220px; height: 220px; display: grid; place-items: center; }
    .ring { position: absolute; inset: 55px; border: 2px solid var(--color-purple-500); border-radius: 50%;
      opacity: 0; animation: ring 1.8s cubic-bezier(0, .4, .6, 1) infinite; }
    .ring:nth-child(2) { animation-delay: .6s; }
    .ring:nth-child(3) { animation-delay: 1.2s; }
    .icon { width: 210px; height: 210px; filter: drop-shadow(0 0 18px rgba(168, 61, 184, .6));
      animation: thump .6s ease-in-out infinite; }
    .big { position: relative; margin-top: 28px; font-weight: 900; font-style: italic; font-size: 22px;
      letter-spacing: -.03em; text-transform: uppercase; color: #fff; }
    .big::after { content: attr(data-t); position: absolute; left: 2px; top: 0; color: var(--color-purple-500);
      clip-path: inset(0 0 55% 0); opacity: 0; animation: glitch 1.6s steps(1) infinite; }
    .label { margin-top: 10px; font: 900 10px ui-monospace, monospace; letter-spacing: .45em;
      text-transform: uppercase; color: #9ca3af; text-align: center; }
    .label b { color: var(--color-purple-500); }
    .sm .stage { width: 110px; height: 110px; }
    .sm .ring { inset: 28px; }
    .sm .icon { width: 105px; height: 105px; filter: drop-shadow(0 0 10px rgba(168, 61, 184, .6)); }
    .sm .label { margin-top: 4px; letter-spacing: .3em; }
    @keyframes ring { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(1.6); opacity: 0; } }
    @keyframes thump { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.08) rotate(-3deg); } }
    @keyframes glitch { 0%, 80%, 100% { transform: none; opacity: 0; } 82% { transform: translate(-3px, 1px); opacity: 1; } 88% { transform: translate(3px, -1px); opacity: 1; } }
  `
})
export class LoaderComponent {
  label = input('');
  size = input<'lg' | 'sm'>('lg');
  overlay = input(false, { transform: booleanAttribute });
}
