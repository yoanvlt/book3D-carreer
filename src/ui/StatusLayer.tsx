import { cancelJourney, journey, setState, skipJourney, useGame } from '../state';
import { skipCurrent } from '../world/motion';
import { buildings } from '../world/config';
import { place } from '../content';

/** Trajet en cours, message d'avertissement, chargement et annonces pour lecteur d'écran. */
export default function StatusLayer() {
  const state = useGame();
  const nearby = buildings.find((b) => b.id === state.nearby);
  const destination = journey.destination ? place(journey.destination).titre : null;
  return (
    <>
      {state.phase === 'travel' && (
        <div className='journey panel' role='status'>
          <span>{destination ? `En route vers ${destination}` : 'En route'}</span>
          <button className='action-secondary' onClick={cancelJourney}>
            Reprendre la main
          </button>
          <button className='action-primary' onClick={skipJourney}>
            Passer
          </button>
        </div>
      )}
      {['doorway', 'entering', 'homing', 'returning'].includes(state.phase) && (
        <button className='skip-hint panel' onClick={() => skipCurrent()}>
          Passer <kbd>Espace</kbd>
        </button>
      )}
      {state.notice && (
        <button className='notice panel' onClick={() => setState({ notice: '' })}>
          {state.notice} <span aria-hidden='true'>×</span>
        </button>
      )}
      {!state.ready && (
        <p className='status-pill panel loading' role='status'>
          Chargement de la ville…
        </p>
      )}
      <div className='sr-only' aria-live='polite'>
        {nearby && state.phase === 'explore' && !state.interior
          ? `À proximité : ${place(nearby.id).titre}. V pour la présentation, E pour entrer.`
          : ''}
      </div>
    </>
  );
}
