import { useFrame } from '@react-three/fiber';
import { passage } from '../state';
import { tickMotion } from '../world/motion';
export default function Transitions() {
  useFrame((_, dt) => {
    tickMotion(dt);
    const curtain = document.getElementById('scene-curtain');
    if (curtain) curtain.style.opacity = String(passage.fade);
  }, -3);
  return null;
}
