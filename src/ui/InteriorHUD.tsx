import { guideExit, guideToStation, interact, setState, useGame } from '../state';
import { stationsFor } from '../world/narrative';
import { isOpen, place, stationContentById } from '../content';
import Dialog from './Dialog';
import StationBody from './RichText';

/** Interface d'un intérieur : titre du lieu, stations à rejoindre, lecture et sortie. */
export default function InteriorHUD() {
  const state = useGame();
  if (!state.interior) return null;
  const id = state.interior;
  const content = place(id);
  const busy = state.phase !== 'explore';
  // Seuls les emplacements qui ont un contenu sont proposés au visiteur.
  const stations = stationsFor(id).filter((s) => stationContentById(id, s.id));
  const active = stationContentById(id, state.station);
  const readingIndex = stations.findIndex((s) => s.id === state.reading);
  const reading = stationContentById(id, state.reading);
  const count = stations.filter((s) => state.seen.includes(id + ':' + s.id)).length;
  return (
    <>
      <div className='interior-title'>
        <span className='eyebrow'>{content.titre}</span>
        <strong>{content.sous_titre}</strong>
        <span>
          {isOpen(id)
            ? `${count} station${count > 1 ? 's' : ''} lue${count > 1 ? 's' : ''} sur ${stations.length}`
            : 'Bientôt. Je prépare le contenu de ce lieu.'}
          {content.apercu && ' · brouillon'}
        </span>
      </div>
      {stations.length > 0 && (
        <nav className='station-nav' aria-label='Stations du lieu'>
          {stations.map((s, i) => {
            const title = stationContentById(id, s.id)!.titre;
            return (
              <button
                key={s.id}
                disabled={busy}
                className={state.station === s.id ? 'active' : ''}
                onClick={() => guideToStation(stationsFor(id).indexOf(s))}
                title={title}
                aria-label={`Rejoindre la station ${i + 1} : ${title}`}
              >
                {i + 1}
                {state.seen.includes(id + ':' + s.id) && <i />}
              </button>
            );
          })}
        </nav>
      )}
      {!busy && !state.reading && !state.map && !state.help && active && (
        <button className='interaction' onClick={interact}>
          <kbd>E</kbd>
          <span>
            Lire la station<strong>{active.titre}</strong>
          </span>
        </button>
      )}
      <button className='exit-interior' disabled={busy} onClick={guideExit}>
        Rejoindre la sortie
      </button>
      {reading && (
        <Dialog
          title={reading.titre}
          eyebrow={`Station ${readingIndex + 1} sur ${stations.length}`}
          close={() => setState({ reading: null })}
          className='detail-dialog'
        >
          <StationBody station={reading} />
          <button className='primary' onClick={() => setState({ reading: null })}>
            Reprendre la visite
          </button>
        </Dialog>
      )}
    </>
  );
}
