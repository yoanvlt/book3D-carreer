import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useGame } from '../state';
import { actions, stick } from '../world/controls';

/** Écran tactile ou étroit : joystick et bouton de saut affichés. Évalué à l'affichage, pas au chargement. */
function touchScreen() {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
}

/**
 * Joystick analogique : la position du pouce, normalisée dans le disque, alimente directement le
 * vecteur d'entrée du contrôleur (world/controls.ts). Au-delà de 90 % de la course, le robot court.
 */
export default function Joystick() {
  const state = useGame();
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const [touch, setTouch] = useState(touchScreen);
  useEffect(() => {
    const update = () => setTouch(touchScreen());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const release = () => {
    setKnob([0, 0]);
    stick.x = 0;
    stick.y = 0;
    stick.run = false;
  };
  useEffect(() => release, []);
  const visible =
    touch && state.phase === 'explore' && !state.map && !state.help && !state.detail && !state.reading;
  useEffect(() => {
    if (!visible) release();
  }, [visible]);
  if (!visible) return null;
  const move = (e: PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    const max = r.width / 2 - 20;
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const length = Math.hypot(x, y);
    if (length > max) {
      x = (x / length) * max;
      y = (y / length) * max;
    }
    setKnob([x, y]);
    // Zone morte de 12 % au centre, puis réponse linéaire.
    const amount = Math.max(0, (Math.min(length, max) / max - 0.12) / 0.88);
    const scale = length ? amount / Math.min(1, length / max) / max : 0;
    stick.x = x * scale;
    stick.y = -y * scale;
    stick.run = amount > 0.9;
  };
  return (
    <>
      <div
        ref={base}
        className='joystick'
        role='application'
        aria-label='Joystick : glisser le pouce pour marcher'
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => e.buttons && move(e)}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <span className='joystick-knob' style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
      </div>
      <button className='jump-button' aria-label='Sauter' onPointerDown={() => actions.jump++}>
        <svg viewBox='0 0 24 24' aria-hidden='true'>
          <path d='M12 19V6m-6 6 6-6 6 6' />
        </svg>
      </button>
    </>
  );
}
