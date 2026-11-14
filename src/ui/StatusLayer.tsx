import { cancelJourney, setState, skipJourney, useGame } from '../state';
import { buildings } from '../world/config';
import { place } from '../content';

/** Messages d'état : trajet en cours, avertissement, chargement, annonce pour lecteur d'écran. */
export default function StatusLayer() {
  const state = useGame();
  const nearby = buildings.find((b) => b.id === state.nearby);
  return (
    <>
      {state.phase === 'travel' && (
        <div className='journey-caption' role='status'>
          <span>En route · suivez le robot</span>
          <button onClick={cancelJourney}>Reprendre la marche</button>
          <button onClick={skipJourney}>Passer le trajet</button>
        </div>
      )}
      {state.notice && (
        <button className='notice' onClick={() => setState({ notice: '' })}>
          {state.notice} ×
        </button>
      )}
      {!state.ready && (
        <div className='loading' role='status'>
          <span className='loading-orbit' />
          <span>Chargement de la ville…</span>
        </div>
      )}
      <div className='sr-only' aria-live='polite'>
        {nearby && state.phase !== 'home'
          ? `À proximité : ${place(nearby.id).titre}. Appuyez sur V pour découvrir le bâtiment ou E pour entrer.`
          : ''}
      </div>
    </>
  );
}
