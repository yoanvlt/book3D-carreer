import type { CSSProperties } from 'react';
import { guideExit, guideToStation, interact, setState, useGame } from '../state';
import { stationsFor } from '../world/narrative';
import { placeColor } from '../design/tokens';
import { isOpen, place, stationContentById } from '../content';
import Dialog from './Dialog';
import StationBody from './RichText';

/** Intérieur : nom du lieu, stations à rejoindre, lecture et sortie. */
export default function InteriorHUD() {
  const state = useGame();
  if (!state.interior) return null;
  const id = state.interior;
  const content = place(id);
  const busy = state.phase !== 'explore';
  const overlay = state.reading || state.map || state.help;
  // Seuls les emplacements qui ont un contenu sont proposés au visiteur.
  const slots = stationsFor(id);
  const stations = slots.filter((s) => stationContentById(id, s.id));
  const active = stationContentById(id, state.station);
  const reading = stationContentById(id, state.reading);
  const readingIndex = stations.findIndex((s) => s.id === state.reading);
  const read = stations.filter((s) => state.seen.includes(id + ':' + s.id)).length;
  return (
    <div className='interior-hud' style={{ '--place': placeColor[id] } as CSSProperties}>
      <div className='interior-title panel'>
        <strong>{content.titre}</strong>
        <span>
          {isOpen(id)
            ? `${read} station${read > 1 ? 's' : ''} sur ${stations.length}`
            : 'Bientôt. Je prépare le contenu de ce lieu.'}
          {content.apercu && ' · brouillon'}
        </span>
      </div>
      {!overlay && !busy && active ? (
        <div className='place-card panel'>
          <div className='place-card-text'>
            <strong>{active.titre}</strong>
            <span>Station {stations.findIndex((s) => s.id === state.station) + 1}</span>
          </div>
          <button className='action-primary' onClick={interact}>
            <kbd>E</kbd> Lire
          </button>
        </div>
      ) : (
        stations.length > 0 &&
        !overlay && (
          <nav className='station-nav panel' aria-label='Stations du lieu'>
            {stations.map((s, i) => {
              const title = stationContentById(id, s.id)!.titre;
              return (
                <button
                  key={s.id}
                  disabled={busy}
                  className={state.seen.includes(id + ':' + s.id) ? 'seen' : ''}
                  onClick={() => guideToStation(slots.indexOf(s))}
                  title={title}
                  aria-label={`Aller à la station ${i + 1} : ${title}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
        )
      )}
      <button className='exit-button panel' disabled={busy} onClick={guideExit}>
        Sortir
      </button>
      {reading && (
        <Dialog
          title={reading.titre}
          eyebrow={`${content.titre} · station ${readingIndex + 1} sur ${stations.length}`}
          close={() => setState({ reading: null })}
          className='reading-dialog'
        >
          <StationBody station={reading} />
          <button className='button-primary' onClick={() => setState({ reading: null })}>
            Continuer la visite
          </button>
        </Dialog>
      )}
    </div>
  );
}
