import { goHome, isBusy, showPanel, useGame } from '../state';
import { setSound, useSound } from '../audio/sound';
import { site } from '../content';

/** Monogramme « YV » et nom, couleurs des tokens. */
function Brand() {
  return (
    <span className='brand'>
      <span className='monogram' aria-hidden='true'>
        YV
      </span>
      <span className='brand-name'>{site.nom}</span>
    </span>
  );
}

/** Son : coupé par défaut, choix mémorisé dans le navigateur. */
function SoundButton() {
  const on = useSound();
  return (
    <button
      className='sound-button panel'
      aria-pressed={on}
      aria-label={on ? 'Couper le son' : 'Activer le son'}
      title={on ? 'Couper le son' : 'Activer le son'}
      onClick={() => setSound(!on)}
    >
      <svg viewBox='0 0 24 24' aria-hidden='true'>
        <path d='M4 9.5h3.5L12 5.5v13l-4.5-4H4z' />
        {on ? <path d='M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11' /> : <path d='m16 9.5 5 5m0-5-5 5' />}
      </svg>
    </button>
  );
}

/** Marque (retour à la vue d'ensemble), son, plan et aide. */
export default function Header() {
  const state = useGame();
  const busy = isBusy(state);
  return (
    <header className='topbar'>
      <button
        className='brand-button panel'
        disabled={busy || !!state.interior}
        aria-label='Revenir à la vue d’ensemble'
        onClick={goHome}
      >
        <Brand />
      </button>
      <div className='header-actions'>
        <SoundButton />
        <button
          className='plan-button panel'
          aria-label='Plan (M)'
          disabled={busy}
          onClick={() => showPanel('map')}
        >
          <svg viewBox='0 0 24 24' aria-hidden='true'>
            <path d='m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16' />
          </svg>
          <span>Plan</span>
          <kbd>M</kbd>
        </button>
        <button
          className='help-button panel'
          disabled={busy}
          aria-label='Aide et réglages'
          onClick={() => showPanel('help')}
        >
          ?
        </button>
      </div>
    </header>
  );
}
