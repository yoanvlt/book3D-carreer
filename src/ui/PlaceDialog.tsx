import type { CSSProperties } from 'react';
import { discover, setState, useGame } from '../state';
import { buildings } from '../world/config';
import { isOpen, place } from '../content';
import Dialog from './Dialog';
import StationBody from './RichText';

/** Fiche d'un lieu (mobile et plan) : résumé, stations à lire, aperçu 3D. */
export default function PlaceDialog() {
  const state = useGame();
  const building = buildings.find((b) => b.id === state.detail);
  if (!building) return null;
  const content = place(building.id);
  const open = isOpen(building.id);
  const close = () => setState({ detail: null });
  return (
    <Dialog title={content.titre} eyebrow={content.sous_titre} close={close} className='detail-dialog'>
      <div className='detail-art' style={{ '--place-color': building.color } as CSSProperties}>
        <div className={`building-illustration illustration-${building.id}`}>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      {content.apercu && <p className='draft-note'>Brouillon : visible uniquement en local.</p>}
      {open ? (
        <>
          {content.resume && <p className='detail-description'>{content.resume}</p>}
          {content.tags.length > 0 && (
            <div className='tags'>
              {content.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className='detail-description empty-state'>Bientôt. Je prépare le contenu de ce lieu.</p>
      )}
      <button className='secondary' disabled={!state.ready} onClick={() => discover(building.id, true)}>
        Voir le bâtiment en 3D
      </button>
      {open && (
        <div className='compact-reading'>
          {content.stations.map((station, i) => (
            <details key={i}>
              <summary>{station.titre}</summary>
              <StationBody station={station} />
            </details>
          ))}
        </div>
      )}
      {content.liens.length > 0 && (
        <ul className='place-links'>
          {content.liens.map((link) => (
            <li key={link.url}>
              <a href={link.url} target='_blank' rel='noreferrer'>
                {link.texte}
              </a>
            </li>
          ))}
        </ul>
      )}
      <button className='primary' onClick={close}>
        Continuer la visite
      </button>
    </Dialog>
  );
}
