import { type ReactNode } from 'react';
import SlidingDoor from '../SlidingDoor';
import StaticBatch from '../StaticBatch';
import { Box, Sign } from '../Primitives';
import { Planter, Windows } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import type { BuildingId } from '../../world/config';
import { DOOR_PLANTERS, ROWS } from '../../world/narrative';
import { isOpen, place } from '../../content';
import { W, D, WALL_H, Plant } from './parts';

/** Coque de la salle : sol, murs, plafond, fenêtres hautes, porte et titre. */
export default function Room({
  id,
  mood,
  children,
}: {
  id: BuildingId;
  mood: InteriorMood;
  children: ReactNode;
}) {
  const content = place(id);
  const open = isOpen(id);
  return (
    <>
      <StaticBatch>
        <Box p={[0, -0.5, 0]} s={[90, 0.8, 90]} color={mood.ceiling} shadow={false} />
        <Box p={[0, -0.12, 0]} s={[W * 2, 0.24, D * 2]} color={mood.floor} shadow={false} />
        {Array.from({ length: 11 }, (_, i) => (
          <Box
            key={i}
            p={[-W + 1 + i * 2, 0.005, 0]}
            s={[0.03, 0.01, D * 2]}
            color={mood.floorLine}
            shadow={false}
          />
        ))}
        {[-1, 1].map((side) => (
          <group key={side}>
            <Box
              p={[side * (W + 0.2), WALL_H / 2, 0]}
              s={[0.4, WALL_H, D * 2]}
              color={mood.wall}
              shadow={false}
            />
            <Box p={[side * (W - 0.05), 0.15, 0]} s={[0.12, 0.3, D * 2]} color={mood.accent} shadow={false} />
            {/* Fenêtres hautes entre les rangées, au-dessus des écrans */}
            {[ROWS[0] + 2.5, ROWS[1] + 2.5, ROWS[2] + 2.5, ROWS[3] + 2.5, ROWS[3] - 2.5].map((z) => (
              <Windows
                key={z}
                p={[side * (W - 0.02), 5.7, z]}
                r={[0, -side * (Math.PI / 2), 0]}
                w={2.4}
                h={1.3}
                cols={2}
                frame={C.white}
                glass='#bfe6f5'
                sill={false}
              />
            ))}
            <Box
              p={[side * 6.6, WALL_H / 2, D - 0.05]}
              s={[8.8, WALL_H, 0.3]}
              color={mood.wall}
              shadow={false}
            />
          </group>
        ))}
        {DOOR_PLANTERS.map((p) => (
          <Plant key={p[0]} p={p} scale={1.15} pot={mood.accent} />
        ))}
        <Box
          p={[0, WALL_H / 2 + 1.75, D - 0.05]}
          s={[4.4, WALL_H - 3.5, 0.3]}
          color={mood.wall}
          shadow={false}
        />
        <Box p={[0, WALL_H + 0.1, 0]} s={[W * 2 + 0.8, 0.2, D * 2]} color={mood.ceiling} shadow={false} />
        <Box p={[0, WALL_H / 2, -D]} s={[W * 2, WALL_H, 0.4]} color={mood.backWall} shadow={false} />
        {children}
        <Planter p={[-4, 0, D - 1.4]} w={2} color={mood.accent} />
        <Planter p={[4, 0, D - 1.4]} w={2} color={mood.accent} />
      </StaticBatch>
      <group position={[0, 0, D - 0.2]} rotation={[0, Math.PI, 0]}>
        <SlidingDoor id={id} />
      </group>
      <Sign
        text='Sortie'
        p={[0, 4.1, D - 0.25]}
        s={[2.4, 0.7]}
        rotation={[0, Math.PI, 0]}
        color={C.white}
        bg={C.ink}
      />
      {/* Titre du lieu sur le mur du fond, au-dessus du mobilier, rien devant. */}
      <Sign
        text={content.titre}
        p={[0, open ? 4.4 : 4.9, -D + 0.24]}
        s={[10, 1.5]}
        color={C.white}
        bg='transparent'
      />
      {!open && (
        <Sign text='Bientôt' p={[0, 3.1, -D + 0.24]} s={[7, 1.4]} color={mood.backWall} bg={C.white} />
      )}
    </>
  );
}
