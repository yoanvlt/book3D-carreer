import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getState, passage } from '../state';
import { tickMotion } from '../world/motion';
import { play } from '../audio/sound';

/** Exécute le déplacement automatique avant le clavier et la caméra ; fondu et sons de porte. */
export default function Transitions() {
  const stage = useRef('');
  useFrame((_, dt) => {
    tickMotion(dt);
    const curtain = document.getElementById('scene-curtain');
    if (curtain) curtain.style.opacity = String(passage.fade);
    const now = getState().phase === 'doorway' ? passage.stage : '';
    if (now !== stage.current) {
      if (now === 'opening') play('porte-ouvre', { volume: 0.7 });
      if (now === 'closing') play('porte-ferme', { volume: 0.6 });
      stage.current = now;
    }
  }, -3);
  return null;
}
