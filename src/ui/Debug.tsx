import { useEffect } from 'react';
import * as game from '../state';

/** `?debug=1` : relevé de rendu (FPS, draw calls) et commandes pour les captures automatiques. */
export const debugEnabled = new URLSearchParams(window.location.search).has('debug');

declare global {
  interface Window {
    __careerverse?: typeof hooks;
  }
}
const hooks = {
  state: () => game.getState(),
  player: () => ({ ...game.player }),
  enter: game.enter,
  travel: game.travel,
  openBuilding: game.openBuilding,
  discover: game.discover,
  guideToStation: game.guideToStation,
  interact: game.interact,
  leave: game.guideExit,
  goHome: game.goHome,
  setState: game.setState,
};

export default function Debug() {
  useEffect(() => {
    window.__careerverse = hooks;
    return () => {
      delete window.__careerverse;
    };
  }, []);
  return <output id='diagnostics' className='diagnostics' aria-label='Diagnostic de rendu' />;
}
