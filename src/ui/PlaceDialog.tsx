import type { CSSProperties } from 'react';
import { discover, setState, useGame } from '../state';
import { placeColor } from '../design/tokens';
import { isOpen, place } from '../content';
import Dialog from './Dialog';
import StationBody from './RichText';

/** Fiche d'un lieu (mobile et plan) : résumé, stations à lire, aperçu 3D. */
export default function PlaceDialog() {
  const state = useGame();
  if (!state.detail) return null;
  const id = state.detail;
  const content = place(id);
  const open = isOpen(id);
  const close = () => setState({ detail: null });
  return (
    <Dialog title={content.titre} eyebrow={content.sous_titre} close={close} className='place-dialog'>
      <div className='place-dialog-body' style={{ '--place': placeColor[id] } as CSSProperties}>
        {content.apercu && <p className='draft-note'>Brouillon : visible uniquement en local.</p>}
        {open ? (
          <>
            {content.resume && <p className='lead'>{content.resume}</p>}
            {content.tags.length > 0 && (
              <ul className='tags'>
                {content.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
            <div className='station-list'>
              {content.stations.map((station, i) => (
                <details key={i}>
                  <summary>{station.titre}</summary>
                  <StationBody station={station} />
                </details>
              ))}
            </div>
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
          </>
        ) : (
          <p className='lead'>Bientôt. Je prépare le contenu de ce lieu.</p>
        )}
        <div className='dialog-actions'>
          <button className='button-secondary' disabled={!state.ready} onClick={() => discover(id, true)}>
            Voir le bâtiment
          </button>
          <button className='button-primary' onClick={close}>
            Fermer
          </button>
        </div>
      </div>
    </Dialog>
  );
}
