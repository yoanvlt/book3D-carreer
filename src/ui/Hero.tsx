import { enter, showPanel, useGame } from '../state';
import { site } from '../content';
import { themed } from '../theme';

const start = () => {
  (document.activeElement as HTMLElement)?.blur();
  enter();
};

/** Accueil : nom, rôle, une phrase et deux actions. */
export default function Hero() {
  const state = useGame();
  const home = state.phase === 'home';
  if (themed)
    return (
      <section className={`hero hero4 ${!home ? 'hero-hidden' : ''}`} aria-hidden={!home} inert={!home}>
        <p className='hero4-role'>{site.role}</p>
        <h1 className='hero4-title'>{site.nom}</h1>
        <p className='hero4-text'>{site.accroche}</p>
        <div className='hero4-actions'>
          <button className='hero4-primary desktop-only' onClick={start} disabled={!state.ready}>
            Explorer la ville
          </button>
          <button className='hero4-primary mobile-only' onClick={() => showPanel('map')}>
            Voir les lieux
          </button>
          <button className='hero4-secondary' onClick={() => showPanel('map')}>
            Plan
          </button>
        </div>
        <p className='hero4-keys desktop-only'>
          <kbd>ZQSD</kbd> marcher <kbd>E</kbd> entrer <kbd>M</kbd> plan
        </p>
      </section>
    );
  // Accueil V3, conservé tant que le paramètre ?theme existe (supprimé en phase 2).
  return (
    <>
      <section className={`hero ${!home ? 'hero-hidden' : ''}`} aria-hidden={!home} inert={!home}>
        <div className='eyebrow hero-eyebrow'>
          <span className='tiny-sun'>✳</span> BIENVENUE DANS MON UNIVERS
        </div>
        <h1>
          Un parcours.
          <br />
          Tout un <em>monde.</em>
        </h1>
        <div className='hero-rule' />
        <p className='intro-name'>
          {site.nom}
          <span>DATA · IA · PROJETS</span>
        </p>
        <p className='hero-description'>{site.accroche}</p>
        <div className='hero-buttons'>
          <button className='primary desktop-only' onClick={start} disabled={!state.ready}>
            Entrer dans la ville
          </button>
          <button className='primary mobile-only' onClick={() => showPanel('map')}>
            Explorer les lieux
          </button>
          <button className='secondary' onClick={() => showPanel('map')}>
            Voir le plan
          </button>
        </div>
      </section>
      {home && (
        <footer className='home-footer'>
          <span>UN PETIT MONDE, DE GRANDES IDÉES.</span>
          <span className='footer-center'>
            <i /> OUVERT À LA CURIOSITÉ
          </span>
          <span>ÉDITION 03 / 2026</span>
        </footer>
      )}
    </>
  );
}
