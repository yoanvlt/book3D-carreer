import { useEffect, useRef } from 'react';
import { useGame, endPresentation, presentation } from '../state';
import { buildings } from '../world/config';
import { isOpen, place } from '../content';

export default function BuildingPresentation() {
  const s = useGame(),
    ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (s.phase === 'showcase') ref.current?.focus();
    if (s.phase === 'explore') document.querySelector<HTMLElement>('.discover-action')?.focus();
  }, [s.phase]);
  if (!s.showcase) return null;
  const b = buildings.find((b) => b.id === s.showcase)!,
    returning = s.phase === 'returning',
    content = place(b.id);
  return (
    <section className='building-presentation' aria-label={`Présentation de ${content.titre}`}>
      <div className='presentation-heading'>
        <span className='eyebrow'>{content.titre}</span>
        <h2>{content.sous_titre}</h2>
        <p>{isOpen(b.id) ? content.resume : 'Bientôt. Je prépare le contenu de ce lieu.'}</p>
      </div>
      <div className='presentation-actions'>
        <button ref={ref} disabled={returning} onClick={() => endPresentation()}>
          {returning
            ? 'Retour en douceur…'
            : s.reducedMotion
              ? 'Revenir à la visite'
              : 'Passer / revenir à la visite'}{' '}
          <kbd>Échap</kbd>
        </button>
        <button className='presentation-enter' disabled={returning} onClick={() => endPresentation(true)}>
          {presentation.preview ? 'Lire le parcours' : 'Entrer dans le bâtiment'}
        </button>
      </div>
    </section>
  );
}
