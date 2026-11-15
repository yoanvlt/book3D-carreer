/** Mode de caméra selon la phase du jeu (déplacé de state.ts en V8, ré-exporté par state.ts). */
import { getState, type CameraMode } from './state';

export function cameraMode(s = getState()): CameraMode {
  if (s.phase === 'explore') return s.interior ? 'interior' : 'exterior';
  return (
    {
      home: 'aerial',
      entering: 'arrival',
      travel: 'guided',
      doorway: 'door',
      showcase: 'presentation',
      returning: 'return',
      homing: 'homeward',
    } as const
  )[s.phase];
}
