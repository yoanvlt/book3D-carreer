import { useEffect, useRef, useState } from 'react';
import { buildings } from '../world/config';
import { placeColor } from '../design/tokens';
import { endCard, visitComplete } from '../world/passport';
import { setState, useGame } from '../state';
import { place, site, mediaUrl } from '../content';
import { play } from '../audio/sound';
import Dialog from './Dialog';

/** Tampon d'un lieu : pastille de sa couleur, cochée une fois visité. */
export function Stamp({ id, done }: { id: (typeof buildings)[number]['id']; done: boolean }) {
  return (
    <span
      className={`stamp ${done ? 'done' : ''}`}
      style={{ background: done ? placeColor[id] : undefined, borderColor: placeColor[id] }}
      title={`${place(id).titre}${done ? ' : visité' : ''}`}
    >
      {done && (
        <svg viewBox='0 0 16 16' aria-hidden='true'>
          <path d='m4 8.5 2.6 2.6L12 5.5' />
        </svg>
      )}
    </span>
  );
}

/**
 * Passeport en petit dans le HUD : six tampons. Un nouveau tampon s'annonce ; quand les six sont
 * obtenus, la carte de fin s'ouvre une fois (si site.md a un CV ou un contact).
 */
export default function Passport() {
  const state = useGame();
  const count = state.visited.length;
  const previous = useRef(count);
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    if (count > previous.current) {
      const id = state.visited.at(-1)!;
      play('tampon', { volume: 0.7 });
      setFresh(place(id).titre);
      const timer = window.setTimeout(() => setFresh(null), 2600);
      if (visitComplete(state.visited) && endCard(site)) setState({ ending: true });
      previous.current = count;
      return () => window.clearTimeout(timer);
    }
    previous.current = count;
  }, [count, state.visited]);
  if (state.phase === 'home' || state.tour !== null) return null;
  return (
    <>
      {/* En petit dans le HUD extérieur ; en intérieur, le titre du lieu occupe ce coin. */}
      {!state.interior && (
        <div
          className='passport panel'
          aria-label={`Passeport : ${count} lieu${count > 1 ? 'x' : ''} visité${count > 1 ? 's' : ''} sur 6`}
        >
          <span className='passport-label'>Passeport</span>
          {buildings.map((b) => (
            <Stamp key={b.id} id={b.id} done={state.visited.includes(b.id)} />
          ))}
        </div>
      )}
      {fresh && (
        <p className='stamp-toast panel' role='status'>
          Tampon obtenu : {fresh}
        </p>
      )}
    </>
  );
}

/** Carte de fin de visite : CV et contact. Masquée tant que site.md n'en a pas. */
export function EndCard() {
  const state = useGame();
  const card = endCard(site);
  // Attend qu'aucun autre panneau ne soit ouvert (lecture d'une station, plan, aide, fiche).
  const busy = state.reading || state.map || state.help || state.detail || state.phase !== 'explore';
  if (!state.ending || !card || busy) return null;
  return (
    <Dialog
      title='Merci de votre visite'
      eyebrow='Six lieux sur six'
      close={() => setState({ ending: false })}
      className='end-dialog'
    >
      <p className='lead'>Vous avez fait le tour de la ville. Pour aller plus loin :</p>
      <div className='dialog-actions'>
        {card.cv && (
          <a className='button-primary' href={mediaUrl(card.cv)} download>
            Télécharger mon CV
          </a>
        )}
        {card.links.map((l) => (
          <a key={l.href} className='button-secondary' href={l.href} target='_blank' rel='noreferrer'>
            {l.label}
          </a>
        ))}
      </div>
    </Dialog>
  );
}
