import { enter, showPanel, startTour, useGame } from '../state';
import { site } from '../content';

const start = () => {
  (document.activeElement as HTMLElement)?.blur();
  enter();
};

/** Accueil : nom, rôle, une phrase et deux actions. */
export default function Hero() {
  const state = useGame();
  const home = state.phase === 'home';
  return (
    <section className={`hero ${home ? '' : 'hero-hidden'}`} aria-hidden={!home} inert={!home}>
      <p className='hero-role'>{site.role}</p>
      <h1 className='hero-title'>{site.nom}</h1>
      <p className='hero-text'>{site.accroche}</p>
      <div className='hero-actions'>
        <button className='button-primary' onClick={start} disabled={!state.ready}>
          Explorer la ville
        </button>
        <button className='button-secondary' onClick={() => showPanel('map')}>
          Plan
        </button>
        <button className='button-secondary' onClick={startTour} disabled={!state.ready}>
          Visite guidée <span className='hero-duration'>1 min</span>
        </button>
      </div>
      <p className='hero-keys desktop-only'>
        <kbd>ZQSD</kbd> ou flèches pour marcher, <kbd>E</kbd> pour entrer, <kbd>Espace</kbd> pour passer
      </p>
      <p className='hero-keys mobile-only'>Joystick pour marcher, toucher le sol pour y aller.</p>
    </section>
  );
}
