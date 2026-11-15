/**
 * Toitures : terrasse gravillonnée (acrotère, lanterneaux, équipements), deux pans en tuiles,
 * sheds en dents de scie, dôme à lamelles avec fente d'observation, verrière ; équipements de
 * toiture. Coordonnées du bâtiment ; y est le niveau de la toiture.
 */
import { color as C } from '../../design/tokens';
import { Box, Cylinder, Dome, FINISH, Gable, GLASS, Ramp, Rod, Torus, type V3, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Parapet, Gutter } from './facade';

/** Équipement de toiture : caisson, ventilateur, pieds. */
export function RoofUnit({ p, s = [1.6, 0.8, 1.1], ry = 0 }: { p: V3; s?: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, s[1] / 2 + 0.12, 0]} s={s} color={C.concrete} finish={FINISH.cladding} />
      <Cylinder
        p={[s[0] * 0.2, s[1] + 0.15, 0]}
        s={[s[2] * 0.32, 0.06, s[2] * 0.32]}
        color={C.slate}
        shadow={false}
      />
      <Fine>
        <Box
          p={[-s[0] * 0.25, s[1] + 0.13, 0]}
          s={[s[0] * 0.3, 0.03, s[2] * 0.7]}
          color={C.metal}
          finish={FINISH.slats}
          shadow={false}
        />
        {[-1, 1].map((x) => (
          <Box
            key={x}
            p={[x * s[0] * 0.4, 0.06, 0]}
            s={[0.1, 0.12, s[2] + 0.1]}
            color={C.slate}
            shadow={false}
          />
        ))}
      </Fine>
    </group>
  );
}

/** Panneau solaire incliné sur châssis. */
export function SolarPanel({ p, w = 2.2, d = 1.3, r = 0 }: { p: V3; w?: number; d?: number; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.35, 0]} s={[w, 0.06, d]} r={[-0.42, 0, 0]} color={C.blueDeep} finish={GLASS} />
      <Box
        p={[0, 0.39, 0.02]}
        s={[w + 0.04, 0.02, d * 0.02]}
        r={[-0.42, 0, 0]}
        color={C.white}
        shadow={false}
      />
      <Box p={[0, 0.15, -0.3]} s={[w * 0.9, 0.06, 0.06]} color={C.metal} shadow={false} />
      {[-w / 2 + 0.2, w / 2 - 0.2].map((x) => (
        <Box key={x} p={[x, 0.18, -0.2]} s={[0.06, 0.36, 0.06]} color={C.metal} shadow={false} />
      ))}
    </group>
  );
}

/** Lanterneau : costière et vitrage en pyramide basse. */
function Skylight({ p, w = 1.4, d = 1.4 }: { p: V3; w?: number; d?: number }) {
  return (
    <group position={p}>
      <Box p={[0, 0.2, 0]} s={[w + 0.2, 0.4, d + 0.2]} color={C.concrete} finish={FINISH.paint} />
      <Gable p={[0, 0.4, 0]} s={[w, 0.35, d]} color={C.glass} finish={GLASS} />
      <Fine>
        <Box p={[0, 0.76, 0]} s={[0.05, 0.05, d]} color={C.white} shadow={false} />
      </Fine>
    </group>
  );
}

/** Terrasse gravillonnée avec acrotère, lanterneaux, équipements et ventilations. */
export function GravelRoof({
  y,
  w,
  d,
  wall,
  parapet = 0.55,
  skylights = [],
  units = [],
  vents = [],
  x = 0,
  z = 0,
}: {
  y: number;
  w: number;
  d: number;
  wall: string;
  parapet?: number;
  skylights?: [number, number][];
  units?: [number, number, number?][];
  vents?: [number, number][];
  x?: number;
  z?: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <Box
        p={[0, y + 0.03, 0]}
        s={[w - 0.3, 0.06, d - 0.3]}
        color={C.stone}
        finish={FINISH.gravel}
        shadow={false}
      />
      <Parapet y={y} w={w} d={d} h={parapet} color={wall} />
      {skylights.map(([sx, sz]) => (
        <Skylight key={`${sx},${sz}`} p={[sx, y, sz]} />
      ))}
      {units.map(([ux, uz, ry = 0]) => (
        <RoofUnit key={`${ux},${uz}`} p={[ux, y, uz]} ry={ry} />
      ))}
      <Fine>
        {vents.map(([vx, vz]) => (
          <group key={`${vx},${vz}`} position={[vx, y, vz]}>
            <Rod p={[0, 0.35, 0]} s={[0.1, 0.7, 0.1]} color={C.metal} finish={FINISH.steel} />
            <Cylinder p={[0, 0.72, 0]} s={[0.18, 0.06, 0.18]} color={C.slate} />
          </group>
        ))}
      </Fine>
    </group>
  );
}

/**
 * Toit à deux pans couvert de tuiles : pans, pignons, faîtage, rives, gouttières.
 * Le faîtage suit l'axe x ; w est la longueur, d la profondeur (pans vers ±z), h la hauteur.
 */
export function GableRoof({
  y,
  w,
  d,
  h,
  color = C.brick,
  gable,
  overhang = 0.45,
  x = 0,
  z = 0,
}: {
  y: number;
  w: number;
  d: number;
  h: number;
  color?: string;
  /** Couleur des pignons (le mur) ; sans elle, pas de pignon plein. */
  gable?: string;
  overhang?: number;
  x?: number;
  z?: number;
}) {
  const half = d / 2 + overhang;
  const slope = Math.atan2(h, d / 2);
  const length = Math.hypot(half, h * (half / (d / 2)));
  return (
    <group position={[x, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            p={[0, h / 2 - (overhang * Math.tan(slope)) / 2 + 0.08, (s * (d / 2 + overhang)) / 2]}
            s={[w + overhang * 2, 0.16, length]}
            r={[s * slope, 0, 0]}
            color={color}
            finish={FINISH.tiles}
          />
          {/* Rive de bas de pente et gouttière */}
          <Box
            p={[0, -overhang * Math.tan(slope) + 0.02, s * (d / 2 + overhang)]}
            s={[w + overhang * 2, 0.14, 0.08]}
            color={C.white}
            finish={FINISH.paint}
          />
          <Gutter
            x0={-w / 2 - overhang}
            x1={w / 2 + overhang}
            y={-overhang * Math.tan(slope) - 0.05}
            z={s * (d / 2 + overhang + 0.08)}
          />
        </group>
      ))}
      {gable &&
        [-1, 1].map((s) => (
          <Gable
            key={s}
            p={[s * (w / 2 - 0.1), 0, 0]}
            s={[d, h, 0.2]}
            r={[0, Math.PI / 2, 0]}
            color={gable}
            finish={FINISH.render}
          />
        ))}
      {/* Rives de pignon */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Box
            key={`${sx}${sz}`}
            p={[
              sx * (w / 2 + overhang),
              h / 2 - (overhang * Math.tan(slope)) / 2 + 0.12,
              (sz * (d / 2 + overhang)) / 2,
            ]}
            s={[0.08, 0.22, length]}
            r={[sz * slope, 0, 0]}
            color={C.white}
            finish={FINISH.paint}
          />
        )),
      )}
      <Rod
        p={[0, h + 0.12, 0]}
        s={[0.13, w + overhang * 2 + 0.1, 0.13]}
        r={[0, 0, Math.PI / 2]}
        color={color}
        finish={FINISH.tiles}
      />
    </group>
  );
}

/**
 * Sheds en dents de scie : pans opaques inclinés et vitrages verticaux tournés vers -z (lumière
 * du nord). `teeth` dents sur la profondeur d.
 */
export function SawtoothRoof({
  y,
  w,
  d,
  teeth,
  h = 1.6,
  color = C.concrete,
  frame = C.white,
}: {
  y: number;
  w: number;
  d: number;
  teeth: number;
  h?: number;
  color?: string;
  frame?: string;
}) {
  const bay = d / teeth;
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: teeth }, (_, i) => {
        const z = -d / 2 + bay * (i + 0.5);
        return (
          <group key={i} position={[0, 0, z]}>
            {/* Pan incliné : rampe dont la face verticale regarde -z. */}
            <Ramp
              p={[0, 0, 0]}
              s={[bay, h, w]}
              r={[0, Math.PI / 2, 0]}
              color={color}
              finish={FINISH.cladding}
            />
            <Box
              p={[0, h * 0.48, -bay / 2 - 0.02]}
              s={[w - 0.3, h * 0.8, 0.05]}
              color={C.glass}
              finish={GLASS}
              shadow={false}
            />
            {times(Math.round(w / 1.3) + 1, (k, n) => (
              <Box
                key={k}
                p={[-w / 2 + 0.15 + ((w - 0.3) * k) / (n - 1), h * 0.48, -bay / 2 + 0.01]}
                s={[0.07, h * 0.82, 0.08]}
                color={frame}
                shadow={false}
              />
            ))}
            <Box
              p={[0, h + 0.04, -bay / 2 + 0.06]}
              s={[w + 0.1, 0.1, 0.2]}
              color={frame}
              finish={FINISH.paint}
            />
          </group>
        );
      })}
    </group>
  );
}

/**
 * Coupole d'observatoire à lamelles : tambour, coque, nervures méridiennes, lamelles horizontales,
 * fente d'observation ouverte (volet replié) tournée vers `slit` radians.
 */
export function LouvredDome({
  p,
  radius,
  color = C.white,
  rib = C.concrete,
  slit = 0,
}: {
  p: V3;
  radius: number;
  color?: string;
  rib?: string;
  slit?: number;
}) {
  const slitWidth = radius * 0.32;
  return (
    <group position={p}>
      <Cylinder p={[0, 0.3, 0]} s={[radius + 0.08, 0.6, radius + 0.08]} color={rib} finish={FINISH.steel} />
      <Dome p={[0, 0.6, 0]} s={[radius, radius, radius]} color={color} finish={FINISH.cladding} />
      {/* Lamelles horizontales */}
      {[0.25, 0.5, 0.72, 0.88].map((t) => (
        <Torus
          key={t}
          p={[0, 0.6 + radius * Math.sin((t * Math.PI) / 2), 0]}
          r={[Math.PI / 2, 0, 0]}
          radius={radius * Math.cos((t * Math.PI) / 2) + 0.02}
          tube={0.05}
          segments={40}
          color={rib}
        />
      ))}
      {/* Nervures méridiennes */}
      {Array.from({ length: 8 }, (_, i) => (
        <Torus
          key={i}
          p={[0, 0.6, 0]}
          r={[0, (i * Math.PI) / 8, 0]}
          radius={radius + 0.03}
          tube={0.06}
          arc={Math.PI}
          segments={24}
          color={rib}
        />
      ))}
      {/* Fente d'observation : bande sombre du pied au sommet, deux rails, volet replié au sommet. */}
      <group rotation={[0, slit, 0]} position={[0, 0.6, 0]}>
        {Array.from({ length: 9 }, (_, k) => {
          const a = ((k + 0.5) / 9) * (Math.PI / 2);
          return (
            <Box
              key={k}
              p={[0, radius * Math.sin(a), radius * Math.cos(a) + 0.01]}
              s={[slitWidth, (radius * Math.PI) / 2 / 9 + 0.04, 0.08]}
              r={[-a, 0, 0]}
              color={C.ink}
              shadow={false}
            />
          );
        })}
        {[-1, 1].map((s) => (
          <Torus
            key={s}
            p={[s * (slitWidth / 2 + 0.06), 0, 0]}
            r={[0, -Math.PI / 2, 0]}
            radius={radius + 0.06}
            tube={0.07}
            arc={Math.PI / 2}
            segments={16}
            color={rib}
          />
        ))}
        <Box
          p={[0, radius + 0.12, -radius * 0.25]}
          s={[slitWidth + 0.3, 0.12, radius * 0.6]}
          r={[0.25, 0, 0]}
          color={color}
          finish={FINISH.cladding}
        />
      </group>
    </group>
  );
}

/** Verrière à deux pans : vitrages, chevrons et faîtage. Faîtage selon x. */
export function GlassRoof({
  p,
  w,
  d,
  h,
  frame = C.white,
}: {
  p: V3;
  w: number;
  d: number;
  h: number;
  frame?: string;
}) {
  const slope = Math.atan2(h, d / 2);
  const length = Math.hypot(d / 2, h);
  return (
    <group position={p}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            p={[0, h / 2, (s * d) / 4]}
            s={[w, 0.05, length]}
            r={[s * slope, 0, 0]}
            color={C.glass}
            finish={GLASS}
            shadow={false}
          />
          {times(Math.round(w / 0.9) + 1, (i, n) => (
            <Box
              key={i}
              p={[-w / 2 + (w * i) / (n - 1), h / 2 + 0.04, (s * d) / 4]}
              s={[0.07, 0.08, length]}
              r={[s * slope, 0, 0]}
              color={frame}
              shadow={false}
            />
          ))}
        </group>
      ))}
      <Box p={[0, h + 0.04, 0]} s={[w + 0.1, 0.12, 0.14]} color={frame} />
      <Box p={[0, 0.03, 0]} s={[w + 0.12, 0.08, d + 0.12]} color={frame} />
    </group>
  );
}
