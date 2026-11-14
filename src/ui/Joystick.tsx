import { useEffect, useRef, useState } from 'react';
import { useGame, view } from '../state';

/**
 * Prototype V5 : joystick tactile. Il traduit la direction du pouce en touches ZQSD,
 * ce qui réutilise tel quel le contrôleur clavier. Visible seulement sur écran tactile ou étroit.
 */
const touch = typeof window !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 760);
if (touch) {
  // Portrait : caméra plus haute et plus loin pour voir devant le robot.
  view.distance = 26;
  view.pitch = 0.74;
}

const press = (key: string, down: boolean) =>
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key }));

export default function Joystick() {
  const state = useGame();
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const held = useRef(new Set<string>());
  const set = (keys: string[]) => {
    for (const k of held.current) if (!keys.includes(k)) press(k, false);
    for (const k of keys) if (!held.current.has(k)) press(k, true);
    held.current = new Set(keys);
  };
  useEffect(() => () => set([]), []);
  const visible =
    touch && state.phase === 'explore' && !state.map && !state.help && !state.detail && !state.reading;
  if (!visible) return null;
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2),
      y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y),
      max = r.width / 2 - 18;
    if (len > max) {
      x = (x / len) * max;
      y = (y / len) * max;
    }
    setKnob([x, y]);
    const keys: string[] = [];
    if (len > 10) {
      if (y < -max * 0.35) keys.push('z');
      if (y > max * 0.35) keys.push('s');
      if (x < -max * 0.35) keys.push('q');
      if (x > max * 0.35) keys.push('d');
      if (len > max * 0.92) keys.push('shift');
    }
    set(keys);
  };
  const end = () => {
    setKnob([0, 0]);
    set([]);
  };
  return (
    <div
      ref={base}
      className='joystick'
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label='Joystick : glisser pour marcher'
    >
      <span className='joystick-knob' style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
    </div>
  );
}
