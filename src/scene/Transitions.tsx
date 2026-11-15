import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getState, passage } from '../state';
import { tickMotion } from '../world/motion';
import { play } from '../audio/sound';

/** Exécute le déplacement automatique avant le clavier et la caméra ; fondu et sons de porte. */
export default function Transitions() {
  const stage = useRef('');
  const cut = useRef({ phase: '', value: 0 });
  useFrame((_, dt) => {
    tickMotion(dt);
    // « Réduire les animations » : pas de vol entre l'accueil et la ville, un fondu simple.
    const s = getState();
    if (s.phase !== cut.current.phase) {
      if (s.reducedMotion && (s.phase === 'entering' || s.phase === 'homing')) cut.current.value = 1;
      cut.current.phase = s.phase;
    }
    cut.current.value = Math.max(0, cut.current.value - Math.min(dt, 0.05) / 0.45);
    const curtain = document.getElementById('scene-curtain');
    if (curtain) curtain.style.opacity = String(Math.max(passage.fade, cut.current.value));
    const now = s.phase === 'doorway' ? passage.stage : '';
    if (now !== stage.current) {
      if (now === 'opening') play('porte-ouvre', { volume: 0.7 });
      if (now === 'closing') play('porte-ferme', { volume: 0.6 });
      stage.current = now;
    }
  }, -3);
  return null;
}
