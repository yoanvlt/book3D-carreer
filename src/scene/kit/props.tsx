/**
 * Accessoires posés autour des bâtiments : jardinières, caisses, palettes, fûts, vélo, boîte aux
 * lettres, vannes et brides de canalisation, panneaux techniques.
 */
import { color as C } from '../../design/tokens';
import { Ball, Box, Cylinder, FINISH, Pipe, Rod, Torus, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';

/** Jardinière plantée : bac à rebord, terre, touffes et fleurs. */
export function Planter({ p, w = 1.6, color = C.stoneDark }: { p: V3; w?: number; color?: string }) {
  const count = Math.max(2, Math.round(w / 0.45));
  return (
    <group position={p}>
      <Box p={[0, 0.3, 0]} s={[w, 0.6, 0.7]} color={color} finish={FINISH.concrete} />
      <Box p={[0, 0.62, 0]} s={[w + 0.08, 0.06, 0.78]} color={color} finish={FINISH.paint} />
      <Box
        p={[0, 0.6, 0]}
        s={[w - 0.14, 0.04, 0.56]}
        color={C.woodDark}
        finish={FINISH.gravel}
        shadow={false}
      />
      {Array.from({ length: count }, (_, i) => (
        <Ball
          key={i}
          p={[-w / 2 + (w / count) * (i + 0.5), 0.8 + (i % 2) * 0.06, i % 2 ? 0.08 : -0.06]}
          s={[0.26, 0.24 + (i % 2) * 0.08, 0.24]}
          color={i % 3 === 1 ? C.leaf : C.leafDark}
        />
      ))}
      <Fine>
        {Array.from({ length: count * 2 }, (_, i) => (
          <Ball
            key={i}
            p={[
              -w / 2 + 0.15 + ((w - 0.3) * i) / (count * 2 - 1),
              0.98 + (i % 3) * 0.05,
              i % 2 ? -0.16 : 0.18,
            ]}
            s={[0.07, 0.07, 0.07]}
            color={i % 3 ? C.flower : C.yellowSoft}
            shadow={false}
          />
        ))}
      </Fine>
    </group>
  );
}

/** Caisse en bois : planches et renforts. */
export function Crate({
  p,
  s = 0.9,
  ry = 0,
  color = C.wood,
}: {
  p: V3;
  s?: number;
  ry?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, s / 2, 0]} s={[s, s, s]} color={color} finish={FINISH.wood} />
      {[-1, 1].map((k) => (
        <Box key={k} p={[0, s / 2 + (k * s) / 2.6, 0]} s={[s + 0.04, 0.08, s + 0.04]} color={C.woodDark} />
      ))}
      <Fine>
        <Box
          p={[0, s / 2, s / 2 + 0.02]}
          s={[s * 1.25, 0.08, 0.03]}
          r={[0, 0, 0.78]}
          color={C.woodDark}
          shadow={false}
        />
      </Fine>
    </group>
  );
}

/** Palette de manutention, éventuellement chargée de sacs. */
export function Pallet({ p, ry = 0, load = false }: { p: V3; ry?: number; load?: boolean }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {[-0.45, 0, 0.45].map((z) => (
        <Box key={z} p={[0, 0.06, z]} s={[1.2, 0.12, 0.14]} color={C.woodDark} />
      ))}
      <Box p={[0, 0.15, 0]} s={[1.2, 0.05, 1.05]} color={C.wood} finish={FINISH.wood} />
      {load &&
        [-0.3, 0.3].flatMap((x) =>
          [-0.25, 0.25].map((z) => (
            <Box
              key={`${x}${z}`}
              p={[x, 0.36, z]}
              s={[0.55, 0.36, 0.48]}
              color={C.sand}
              finish={FINISH.fabric}
            />
          )),
        )}
    </group>
  );
}

/** Fût métallique cerclé. */
export function Barrel({ p, color = C.blueDeep }: { p: V3; color?: string }) {
  return (
    <group position={p}>
      <Cylinder p={[0, 0.45, 0]} s={[0.3, 0.9, 0.3]} color={color} finish={FINISH.steel} />
      {[0.25, 0.65].map((y) => (
        <Torus
          key={y}
          p={[0, y, 0]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.31}
          tube={0.025}
          segments={18}
          color={C.metal}
        />
      ))}
    </group>
  );
}

/** Vélo de ville : roues, cadre, selle, guidon, panier. */
export function Bike({ p, ry = 0, color = C.teal }: { p: V3; ry?: number; color?: string }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {[-0.52, 0.52].map((x) => (
        <group key={x}>
          <Torus p={[x, 0.36, 0]} radius={0.33} tube={0.035} segments={20} color={C.ink} />
          <Fine>
            <Cylinder
              p={[x, 0.36, 0]}
              s={[0.05, 0.08, 0.05]}
              r={[Math.PI / 2, 0, 0]}
              color={C.metal}
              shadow={false}
            />
          </Fine>
        </group>
      ))}
      <Pipe a={[-0.52, 0.36, 0]} b={[-0.05, 0.38, 0]} radius={0.025} color={color} />
      <Pipe a={[-0.05, 0.38, 0]} b={[-0.15, 0.82, 0]} radius={0.03} color={color} />
      <Pipe a={[-0.15, 0.8, 0]} b={[0.42, 0.78, 0]} radius={0.03} color={color} />
      <Pipe a={[-0.05, 0.38, 0]} b={[0.42, 0.78, 0]} radius={0.03} color={color} />
      <Pipe a={[0.52, 0.36, 0]} b={[0.42, 0.95, 0]} radius={0.025} color={color} />
      <Pipe a={[-0.52, 0.36, 0]} b={[-0.15, 0.8, 0]} radius={0.02} color={color} />
      <Box p={[-0.17, 0.9, 0]} s={[0.24, 0.05, 0.1]} color={C.ink} />
      <Box p={[0.42, 0.97, 0]} s={[0.05, 0.04, 0.5]} color={C.ink} />
      <Fine>
        <Box p={[0.62, 0.9, 0]} s={[0.24, 0.16, 0.3]} color={C.woodDark} finish={FINISH.slats} />
      </Fine>
    </group>
  );
}

/** Boîte aux lettres sur pied. */
export function Mailbox({ p, ry = 0, color = C.yellow }: { p: V3; ry?: number; color?: string }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Rod p={[0, 0.5, 0]} s={[0.05, 1, 0.05]} color={C.ink} />
      <Box p={[0, 1.15, 0]} s={[0.42, 0.34, 0.52]} color={color} finish={FINISH.paint} />
      <Cylinder
        p={[0, 1.32, 0]}
        s={[0.21, 0.52, 0.21]}
        r={[Math.PI / 2, 0, 0]}
        color={color}
        finish={FINISH.paint}
      />
      <Fine>
        <Box p={[0, 1.18, 0.265]} s={[0.26, 0.04, 0.02]} color={C.ink} shadow={false} />
        <Box p={[0.23, 1.32, 0.1]} s={[0.03, 0.26, 0.05]} color={C.red} shadow={false} />
      </Fine>
    </group>
  );
}

/** Vanne à volant sur une conduite verticale ou horizontale. */
export function Valve({
  p,
  r = [0, 0, 0],
  size = 1,
  color = C.red,
}: {
  p: V3;
  r?: V3;
  size?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={r} scale={size}>
      <Box p={[0, 0, 0]} s={[0.36, 0.3, 0.36]} color={C.slate} finish={FINISH.steel} />
      <Rod p={[0, 0.3, 0]} s={[0.04, 0.35, 0.04]} color={C.metal} />
      <Torus p={[0, 0.48, 0]} r={[Math.PI / 2, 0, 0]} radius={0.22} tube={0.03} segments={16} color={color} />
      <Fine>
        <Box p={[0, 0.48, 0]} s={[0.42, 0.03, 0.03]} color={color} shadow={false} />
        <Box p={[0, 0.48, 0]} s={[0.03, 0.03, 0.42]} color={color} shadow={false} />
      </Fine>
    </group>
  );
}

/** Bride de canalisation (anneau boulonné) autour d'un tuyau d'axe y. */
export function Flange({
  p,
  r = [0, 0, 0],
  radius = 0.25,
  color = C.slate,
}: {
  p: V3;
  r?: V3;
  radius?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={r}>
      <Cylinder p={[0, 0, 0]} s={[radius * 1.45, 0.08, radius * 1.45]} color={color} finish={FINISH.steel} />
    </group>
  );
}
