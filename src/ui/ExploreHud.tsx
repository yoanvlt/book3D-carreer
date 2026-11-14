import type { CSSProperties } from 'react';
import { discover, openBuilding, useGame } from '../state';
import { buildings } from '../world/config';
import { placeColor } from '../design/tokens';
import { isOpen, place } from '../content';

/** Exploration extérieure : aide au premier pas, puis carte du lieu le plus proche. */
export default function ExploreHud() {
  const state = useGame();
  if (state.phase === 'home' || state.interior) return null;
  const busy = state.phase !== 'explore';
  const nearby = buildings.find((b) => b.id === state.nearby);
  const overlay = state.map || state.detail || state.help;
  return (
    <>
      {nearby && !busy && !overlay ? (
        <div className='place-card panel' style={{ '--place': placeColor[nearby.id] } as CSSProperties}>
          <div className='place-card-text'>
            <strong>{place(nearby.id).titre}</strong>
            <span>{isOpen(nearby.id) ? place(nearby.id).sous_titre : 'Bientôt'}</span>
          </div>
          <button className='action-secondary' onClick={() => discover(nearby.id)}>
            <kbd>V</kbd> Présentation
          </button>
          <button className='action-primary' onClick={() => openBuilding(nearby.id)}>
            <kbd>E</kbd> Entrer
          </button>
        </div>
      ) : (
        !state.moved &&
        state.phase === 'explore' &&
        !overlay && (
          <p className='hint panel desktop-only'>
            <kbd>ZQSD</kbd> ou flèches pour marcher · glisser pour regarder autour · <kbd>M</kbd> plan
          </p>
        )
      )}
      {state.phase === 'entering' && (
        <p className='status-pill panel' role='status'>
          {state.nearby ? 'Je vous emmène…' : 'Bienvenue.'}
        </p>
      )}
    </>
  );
}
