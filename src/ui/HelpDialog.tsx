import { resetPlayer, setState, useGame } from '../state';
import Dialog from './Dialog';

const CONTROLS: [string, string[] | string][] = [
  ['Marcher', ['ZQSD', 'WASD', '↑ ← ↓ →']],
  ['Accélérer', ['Maj']],
  ['Regarder autour de soi', 'Cliquer et glisser'],
  ['Ajuster la distance', 'Molette'],
  ['Entrer, lire une station', ['E']],
  ['Présentation du bâtiment', ['V']],
  ['Ouvrir le plan', ['M']],
  ['Recentrer la caméra', ['C']],
  ['Retourner sur la place', ['R']],
];

/** Commandes, qualité graphique et confort. */
export default function HelpDialog() {
  const state = useGame();
  if (!state.help) return null;
  return (
    <Dialog title='Aide et réglages' close={() => setState({ help: false })} className='help-dialog'>
      <dl className='controls-list'>
        {CONTROLS.map(([label, keys]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {typeof keys === 'string'
                ? keys
                : keys.map((key, i) => (
                    <span key={key}>
                      {i > 0 && ' '}
                      <kbd>{key}</kbd>
                    </span>
                  ))}
            </dd>
          </div>
        ))}
      </dl>
      <div className='settings-row'>
        <label htmlFor='quality'>Qualité graphique</label>
        <select
          id='quality'
          value={state.quality}
          onChange={(e) => setState({ quality: e.target.value as 'high' | 'low', qualityAuto: false })}
        >
          <option value='high'>Soignée · ombres activées</option>
          <option value='low'>Légère · sans ombres</option>
        </select>
      </div>
      <label className='motion-setting'>
        <input
          type='checkbox'
          checked={state.reducedMotion}
          onChange={(e) => setState({ reducedMotion: e.target.checked })}
        />{' '}
        Réduire les mouvements de caméra
      </label>
      <div className='performance'>
        <span>{state.fps || '—'} FPS</span> mesurés sur cet appareil
      </div>
      <p className='help-links'>
        <a href='?lecture'>Lire le portfolio en version texte</a>
      </p>
      <button className='button-secondary' onClick={resetPlayer}>
        Revenir sur la place centrale
      </button>
    </Dialog>
  );
}
