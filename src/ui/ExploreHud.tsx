import type { CSSProperties } from 'react';
import { discover, openBuilding, showPanel, travel, useGame } from '../state';
import { buildings } from '../world/config';
import { place } from '../content';

/** Interface de l'exploration extérieure : lieu proche, navigation rapide, aide et actions de porte. */
export default function ExploreHud() {
  const state = useGame();
  if (state.phase === 'home' || state.interior) return null;
  const busy = state.phase !== 'explore';
  const nearby = buildings.find((b) => b.id === state.nearby);
  return (
    <>
      <div className='location-label'>
        <span className='eyebrow'>VOUS EXPLOREZ</span>
        <strong>{nearby ? place(nearby.id).sous_titre : 'La place des possibles'}</strong>
      </div>
      <nav className='quick-nav' aria-label='Navigation rapide'>
        <span className='quick-title'>LES LIEUX</span>
        {buildings.map((b) => (
          <button
            key={b.id}
            disabled={busy}
            title={place(b.id).titre}
            aria-label={`Rejoindre ${place(b.id).titre}`}
            className={state.nearby === b.id ? 'active' : ''}
            onClick={() => travel(b.id)}
            style={{ '--place-color': b.color } as CSSProperties}
          >
            <span>{b.number}</span>
            <i />
            {state.visited.includes(b.id) && <sup>✓</sup>}
          </button>
        ))}
      </nav>
      <div className='explore-footer'>
        <button className='map-pill' onClick={() => showPanel('map')}>
          <span>⌖</span> Plan du campus <kbd>M</kbd>
        </button>
        <span className='controls-hint desktop-only'>
          <kbd>ZQSD</kbd> / <kbd>WASD</kbd> se déplacer <span>·</span> glisser pour regarder <span>·</span>{' '}
          <kbd>E</kbd> entrer · <kbd>V</kbd> découvrir
        </span>
        <span className='visited-count'>
          {String(state.visited.length).padStart(2, '0')} <span>/ 06 LIEUX DÉCOUVERTS</span>
        </span>
      </div>
      {nearby && !busy && !state.map && !state.detail && !state.help && (
        <div className='building-actions'>
          <button className='discover-action' onClick={() => discover(nearby.id)}>
            <kbd>V</kbd> Découvrir le bâtiment
          </button>
          <button className='interaction' onClick={() => openBuilding(nearby.id)}>
            <kbd>E</kbd>
            <span>
              Entrer dans <strong>{place(nearby.id).titre}</strong>
            </span>
          </button>
        </div>
      )}
      {state.phase === 'entering' && (
        <div className='transition-caption' role='status'>
          <i /> {state.nearby ? 'En route vers votre destination…' : 'Bienvenue dans la ville.'}
        </div>
      )}
    </>
  );
}
