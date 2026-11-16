import { type ReactNode } from 'react';
import { DoorLeaves } from '../Door';
import StaticBatch from '../StaticBatch';
import { Box, FINISH, Sign, type Finish } from '../Primitives';

import { color as C, type InteriorMood } from '../../design/tokens';
import type { BuildingId } from '../../world/config';
import { DOOR_PLANTERS, ROWS } from '../../world/narrative';
import { isOpen, place } from '../../content';
import { W, D, WALL_H, Plant, Planter, Windows } from './parts';

/** Matières propres à chaque salle : sol, murs, lambris éventuel, plinthes. */
const SHELL: Record<BuildingId, { floor: Finish; wall: Finish; wainscot?: string; plinth: string }> = {
  profile: { floor: FINISH.parquet, wall: FINISH.render, wainscot: '#b98a5c', plinth: C.woodDark },
  'project-1': { floor: { ...FINISH.paving, scale: 0.7, rough: 0.35 }, wall: FINISH.paint, plinth: C.slate },
  'project-2': { floor: FINISH.concrete, wall: FINISH.brick, plinth: C.slate },
  'project-3': {
    floor: { ...FINISH.paving, scale: 0.9 },
    wall: FINISH.render,
    wainscot: '#4a3f8a',
    plinth: '#3a3170',
  },
  missions: { floor: { ...FINISH.parquet, scale: 0.8 }, wall: FINISH.render, plinth: '#d9d2c4' },
  veolia: { floor: { ...FINISH.paving, scale: 1.3, rough: 0.5 }, wall: FINISH.concrete, plinth: C.slate },
};

/** Coque de la salle : sol, murs, lambris, plinthes, plafond, fenêtres hautes, porte et titre. */
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
  const shell = SHELL[id];
  return (
    <>
      <StaticBatch>
        <Box p={[0, -0.5, 0]} s={[90, 0.8, 90]} color={mood.ceiling} shadow={false} />
        <Box
          p={[0, -0.12, 0]}
          s={[W * 2, 0.24, D * 2]}
          color={mood.floor}
          finish={shell.floor}
          shadow={false}
        />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Box
              p={[side * (W + 0.2), WALL_H / 2, 0]}
              s={[0.4, WALL_H, D * 2]}
              color={mood.wall}
              finish={shell.wall}
              shadow={false}
            />
            {/* Plinthe, lambris et cimaise */}
            <Box
              p={[side * (W - 0.04), 0.11, 0]}
              s={[0.08, 0.22, D * 2]}
              color={shell.plinth}
              finish={FINISH.paint}
              shadow={false}
            />
            {shell.wainscot && (
              <>
                <Box
                  p={[side * (W - 0.03), 0.65, 0]}
                  s={[0.06, 1.1, D * 2]}
                  color={shell.wainscot}
                  finish={FINISH.wood}
                  shadow={false}
                />
                <Box
                  p={[side * (W - 0.06), 1.24, 0]}
                  s={[0.1, 0.08, D * 2]}
                  color={shell.plinth}
                  shadow={false}
                />
              </>
            )}
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
              />
            ))}
            <Box
              p={[side * 6.6, WALL_H / 2, D - 0.05]}
              s={[8.8, WALL_H, 0.3]}
              color={mood.wall}
              finish={shell.wall}
              shadow={false}
            />
            <Box
              p={[side * 6.6, 0.11, D - 0.24]}
              s={[8.8, 0.22, 0.08]}
              color={shell.plinth}
              finish={FINISH.paint}
              shadow={false}
            />
            {/* Encadrement intérieur de la porte */}
            <Box
              p={[side * 2.4, 1.8, D - 0.26]}
              s={[0.36, 3.6, 0.14]}
              color={C.white}
              finish={FINISH.paint}
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
          finish={shell.wall}
          shadow={false}
        />
        <Box p={[0, WALL_H + 0.1, 0]} s={[W * 2 + 0.8, 0.2, D * 2]} color={mood.ceiling} shadow={false} />
        <Box p={[0, 3.68, D - 0.26]} s={[5.16, 0.3, 0.14]} color={C.white} finish={FINISH.paint} />
        <Box
          p={[0, WALL_H / 2, -D]}
          s={[W * 2, WALL_H, 0.4]}
          color={mood.backWall}
          finish={FINISH.render}
          shadow={false}
        />
        <Box
          p={[0, 0.11, -D + 0.24]}
          s={[W * 2, 0.22, 0.08]}
          color={shell.plinth}
          finish={FINISH.paint}
          shadow={false}
        />
        {children}
        <Planter p={[-4, 0, D - 1.4]} w={2} color={mood.accent} />
        <Planter p={[4, 0, D - 1.4]} w={2} color={mood.accent} />
      </StaticBatch>
      <group position={[0, 0, D - 0.2]} rotation={[0, Math.PI, 0]}>
        <DoorLeaves id={id} />
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
