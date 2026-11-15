import type { CSSProperties } from 'react';
import { endPresentation, stopTour, TOUR, useGame } from '../state';
import { placeColor } from '../design/tokens';
import { isOpen, place } from '../content';

/** Fiche de la visite guidée : lieu présenté, progression, suivant et quitter. */
export default function Tour() {
  const state = useGame();
  if (state.tour === null) return null;
  const id = TOUR.order[state.tour];
  const content = place(id);
  return (
    <section className='tour panel' aria-live='polite' style={{ '--place': placeColor[id] } as CSSProperties}>
      <p className='tour-progress'>
        Visite guidée · {state.tour + 1} / {TOUR.order.length}
      </p>
      <h2>{content.titre}</h2>
      <p className='tour-text'>
        {isOpen(id) ? content.resume || content.sous_titre : `${content.sous_titre}. Bientôt.`}
      </p>
      <div className='tour-dots' aria-hidden='true'>
        {TOUR.order.map((p, i) => (
          <i key={p} className={i <= (state.tour ?? 0) ? 'done' : ''} />
        ))}
      </div>
      <div className='tour-actions'>
        <button className='action-secondary' onClick={stopTour}>
          <kbd>Échap</kbd> Quitter
        </button>
        <button
          className='action-primary'
          disabled={state.phase !== 'showcase'}
          onClick={() => endPresentation()}
        >
          {state.tour + 1 < TOUR.order.length ? 'Lieu suivant' : 'Terminer'}
        </button>
      </div>
    </section>
  );
}
