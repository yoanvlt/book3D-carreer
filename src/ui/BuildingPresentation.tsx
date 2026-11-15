import { useEffect, useRef } from 'react';
import { endPresentation, presentation, useGame } from '../state';
import { isOpen, place } from '../content';

/** Présentation architecturale : nom du lieu et commandes pour revenir ou entrer. */
export default function BuildingPresentation() {
  const s = useGame();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (s.phase === 'showcase') ref.current?.focus();
  }, [s.phase]);
  if (!s.showcase || s.tour !== null) return null;
  const content = place(s.showcase);
  const returning = s.phase === 'returning';
  return (
    <section className='presentation' aria-label={`Présentation de ${content.titre}`}>
      <div className='presentation-heading panel'>
        <h2>{content.titre}</h2>
        <p>{isOpen(s.showcase) ? content.sous_titre : 'Bientôt'}</p>
      </div>
      <div className='presentation-actions'>
        <button
          ref={ref}
          className='action-secondary panel'
          disabled={returning}
          onClick={() => endPresentation()}
        >
          <kbd>Échap</kbd> {returning ? 'Retour…' : 'Revenir'}
        </button>
        <button className='action-primary' disabled={returning} onClick={() => endPresentation(true)}>
          {presentation.preview ? 'Lire la fiche' : 'Entrer'}
        </button>
      </div>
    </section>
  );
}
