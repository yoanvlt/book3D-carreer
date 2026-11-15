/**
 * Mobilier urbain : bancs à lattes sur piètements de fonte, lampadaires, poubelles, bornes,
 * supports à vélos avec leurs vélos, clôtures basses, plaques de rue, pergola. Les positions et
 * les volumes de collision sont dans world/landscape.ts et world/collision.ts.
 */
import { color as C } from '../design/tokens';
import { Ball, Beam, Box, Cone, Cylinder, FINISH, Rod, Sign, Torus } from './Primitives';
import { Fine } from './StaticBatch';
import { Bike } from './kit';
import { groundY } from '../world/decor';
import type { Point } from '../world/config';

const IRON = '#26323b';

/** Banc : deux piètements de fonte avec accoudoirs, cinq lattes d'assise, trois de dossier. */
export function Bench({ p, angle }: { p: Point; angle: number }) {
  return (
    <group position={[p[0], groundY(p[0], p[1], 1.35), p[1]]} rotation={[0, angle, 0]}>
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box p={[0, 0.22, 0.22]} s={[0.08, 0.44, 0.08]} color={IRON} finish={FINISH.steel} />
          <Box
            p={[0, 0.5, -0.24]}
            s={[0.08, 1.0, 0.08]}
            r={[-0.18, 0, 0]}
            color={IRON}
            finish={FINISH.steel}
          />
          <Box p={[0, 0.44, 0]} s={[0.08, 0.06, 0.6]} color={IRON} />
          <Box p={[0, 0.72, 0.05]} s={[0.1, 0.05, 0.6]} color={IRON} />
          <Box p={[0, 0.58, 0.28]} s={[0.06, 0.28, 0.06]} color={IRON} />
        </group>
      ))}
      {[-0.24, -0.12, 0, 0.12, 0.24].map((z) => (
        <Box key={z} p={[0, 0.49, z]} s={[2.7, 0.05, 0.1]} color={C.wood} finish={FINISH.wood} />
      ))}
      {[0.72, 0.86, 1.0].map((y) => (
        <Box
          key={y}
          p={[0, y, -0.31 - (y - 0.72) * 0.18]}
          s={[2.7, 0.1, 0.04]}
          r={[-0.18, 0, 0]}
          color={C.wood}
          finish={FINISH.wood}
        />
      ))}
      <Fine>
        {[-1.0, 1.0].flatMap((x) =>
          [-0.24, 0.24].map((z) => (
            <Box key={`${x}${z}`} p={[x, 0.52, z]} s={[0.03, 0.02, 0.03]} color={IRON} shadow={false} />
          )),
        )}
      </Fine>
    </group>
  );
}

/** Poubelle sur poteau, à côté d'un banc. */
export function Bin({ p, angle = 0 }: { p: Point; angle?: number }) {
  return (
    <group position={[p[0], groundY(p[0], p[1], 0.25), p[1]]} rotation={[0, angle, 0]}>
      <Rod p={[0, 0.5, -0.24]} s={[0.04, 1, 0.04]} color={IRON} />
      <Cylinder p={[0, 0.55, 0]} s={[0.22, 0.6, 0.22]} color='#3c6b55' finish={FINISH.cladding} />
      <Torus p={[0, 0.86, 0]} r={[Math.PI / 2, 0, 0]} radius={0.23} tube={0.025} segments={16} color={IRON} />
      <Fine>
        <Cylinder p={[0, 0.88, 0]} s={[0.18, 0.02, 0.18]} color={C.ink} shadow={false} />
      </Fine>
    </group>
  );
}

/** Borne de fonte à tête ronde et bague. */
export function Bollard({ p }: { p: Point }) {
  return (
    <group position={[p[0], Math.max(groundY(p[0], p[1], 0.15), 0.75), p[1]]}>
      <Cylinder p={[0, 0.4, 0]} s={[0.12, 0.8, 0.12]} color={IRON} finish={FINISH.steel} />
      <Ball p={[0, 0.84, 0]} s={[0.13, 0.1, 0.13]} color={IRON} />
      <Cylinder p={[0, 0.62, 0]} s={[0.14, 0.05, 0.14]} color={C.yellow} />
    </group>
  );
}

/** Support à vélos (arceaux) et vélos garés. */
export function BikeRack({ p, angle, bikes }: { p: Point; angle: number; bikes: string[] }) {
  return (
    <group position={[p[0], groundY(p[0], p[1], 1.6), p[1]]} rotation={[0, angle, 0]}>
      <Box p={[0, 0.02, 0]} s={[3.2, 0.04, 1.6]} color={C.stone} finish={FINISH.paving} />
      {[-1.1, 0, 1.1].map((x) => (
        <Torus key={x} p={[x, 0.08, 0]} radius={0.38} tube={0.04} arc={Math.PI} segments={14} color={IRON} />
      ))}
      {bikes.map((color, i) => (
        <Bike key={i} p={[-1.1 + i * 1.1 + 0.18, 0.02, 0]} ry={Math.PI / 2} color={color} />
      ))}
    </group>
  );
}

/** Clôture basse en bois de a à b : poteaux, deux lisses. */
export function Fence({ a, b }: { a: Point; b: Point }) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const angle = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const posts = Math.round(length / 1.8) + 1;
  return (
    <>
      {Array.from({ length: posts }, (_, i) => {
        const t = i / (posts - 1);
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        const y = groundY(x, z, 0.1);
        return (
          <group key={i} position={[x, y, z]} rotation={[0, angle, 0]}>
            <Box p={[0, 0.45, 0]} s={[0.12, 0.9, 0.12]} color={C.woodDark} finish={FINISH.wood} />
            <Cone p={[0, 0.95, 0]} s={[0.09, 0.12, 0.09]} r={[0, Math.PI / 4, 0]} color={C.woodDark} />
            {i < posts - 1 &&
              [0.35, 0.7].map((h) => (
                <Box
                  key={h}
                  p={[0, h, length / (posts - 1) / 2]}
                  s={[0.05, 0.09, length / (posts - 1)]}
                  color={C.wood}
                  finish={FINISH.wood}
                />
              ))}
          </group>
        );
      })}
    </>
  );
}

/** Lampadaire : socle, fût à bagues, crosse à volute, lanterne vitrée et chapeau. */
export function Lamp({ p, plate }: { p: Point; plate?: string }) {
  return (
    <group position={[p[0], groundY(p[0], p[1], 0.25), p[1]]}>
      <Cylinder p={[0, 0.25, 0]} s={[0.22, 0.5, 0.22]} color={IRON} finish={FINISH.steel} />
      <Cylinder p={[0, 0.53, 0]} s={[0.16, 0.06, 0.16]} color={IRON} />
      <Rod p={[0, 2.2, 0]} s={[0.07, 3.4, 0.07]} color={IRON} finish={FINISH.steel} />
      {[1.2, 3.6].map((y) => (
        <Cylinder key={y} p={[0, y, 0]} s={[0.1, 0.08, 0.1]} color={IRON} />
      ))}
      <Box p={[0.32, 3.86, 0]} s={[0.72, 0.07, 0.07]} color={IRON} />
      <Fine>
        <Torus p={[0.22, 3.62, 0]} radius={0.2} tube={0.025} arc={Math.PI * 1.4} segments={12} color={IRON} />
        <Ball p={[0, 3.96, 0]} s={[0.07, 0.07, 0.07]} color={IRON} />
      </Fine>
      {/* Lanterne */}
      <group position={[0.62, 3.5, 0]}>
        <Box
          p={[0, 0, 0]}
          s={[0.28, 0.4, 0.28]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 1.3 }}
          shadow={false}
        />
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <Box
              key={`${sx}${sz}`}
              p={[sx * 0.14, 0, sz * 0.14]}
              s={[0.03, 0.42, 0.03]}
              color={IRON}
              shadow={false}
            />
          )),
        )}
        <Cone p={[0, 0.3, 0]} s={[0.24, 0.2, 0.24]} r={[0, Math.PI / 4, 0]} color={IRON} />
        <Box p={[0, -0.23, 0]} s={[0.2, 0.06, 0.2]} color={IRON} />
        <Rod p={[0, 0.3, 0]} s={[0.015, 0.36, 0.015]} color={IRON} shadow={false} />
      </group>
      {plate && (
        // Plaque de rue fixée au fût par deux pattes, à 2,6 m, lisible des deux côtés.
        <group position={[0, 2.6, 0]}>
          {[0.12, -0.12].map((y) => (
            <Box key={y} p={[0.12, y, 0]} s={[0.18, 0.04, 0.04]} color={IRON} />
          ))}
          <Box p={[0.95, 0, 0]} s={[1.5, 0.36, 0.04]} color={C.blueDeep} />
          <Sign
            text={plate}
            p={[0.95, 0, 0.025]}
            s={[1.42, 0.28]}
            color={C.white}
            bg={C.blueDeep}
            rounded={false}
          />
          <Sign
            text={plate}
            p={[0.95, 0, -0.025]}
            rotation={[0, Math.PI, 0]}
            s={[1.42, 0.28]}
            color={C.white}
            bg={C.blueDeep}
            rounded={false}
          />
        </group>
      )}
    </group>
  );
}

export function Pergola() {
  return (
    <group position={[-43, groundY(-43, 20, 2.6), 20]} rotation={[0, -0.3, 0]}>
      <Box p={[0, 0.04, 0]} s={[5, 0.08, 3.8]} color={C.stone} finish={FINISH.paving} />
      {[-2, 2].flatMap((x) =>
        [-1.5, 1.5].map((z) => (
          <Box key={`${x}${z}`} p={[x, 1.7, z]} s={[0.18, 3.4, 0.18]} color={C.cream} finish={FINISH.wood} />
        )),
      )}
      {[-2, -1, 0, 1, 2].map((x) => (
        <Box key={x} p={[x, 3.5, 0]} s={[0.14, 0.2, 4]} color={C.wood} finish={FINISH.wood} />
      ))}
      <Beam a={[-2.3, 3.35, -1.5]} b={[2.3, 3.35, -1.5]} width={0.2} color={C.cream} />
      <Beam a={[-2.3, 3.35, 1.5]} b={[2.3, 3.35, 1.5]} width={0.2} color={C.cream} />
      {/* Glycine : grappes et feuillage sur la charpente */}
      {[-1.6, -0.4, 0.8, 1.8].map((x, i) => (
        <group key={x}>
          <Ball p={[x, 3.7, i % 2 ? 0.8 : -0.6]} s={[0.7, 0.3, 0.6]} color={C.leaf} />
          <Ball p={[x + 0.2, 3.25, i % 2 ? 0.9 : -0.7]} s={[0.14, 0.28, 0.14]} color={C.violetSoft} />
        </group>
      ))}
      <Fine>
        {[-2, 2].map((x) => (
          <Ball key={x} p={[x, 2.2, 1.5]} s={[0.3, 1.0, 0.3]} color={C.leafDark} />
        ))}
      </Fine>
    </group>
  );
}
