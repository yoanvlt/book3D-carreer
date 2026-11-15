/**
 * Structures : garde-corps, balcons, escaliers extérieurs, échelles à crinoline, passerelles.
 * Les pièces sont placées par leurs extrémités ou leur point de départ, en coordonnées du bâtiment.
 */
import { color as C } from '../../design/tokens';
import { Box, FINISH, Pipe, Rod, Torus, type V3, times } from '../Primitives';
import { Fine } from '../StaticBatch';

/** Garde-corps de a à b : main courante, lisse basse et barreaux. */
export function Railing({
  a,
  b,
  h = 1,
  posts,
  color = C.white,
  bars = true,
}: {
  a: V3;
  b: V3;
  h?: number;
  /** Nombre de poteaux ; par défaut un tous les 1,2 m. */
  posts?: number;
  color?: string;
  /** Barreaux entre les poteaux (petits détails). */
  bars?: boolean;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const count = posts ?? Math.max(2, Math.round(length / 1.2) + 1);
  const at = (t: number): V3 => [0, dy * t, length * t];
  return (
    <group position={a} rotation={[0, angle, 0]}>
      <Pipe a={[0, h, 0]} b={[0, h + dy, length]} radius={0.045} color={color} finish={FINISH.steel} />
      <Pipe
        a={[0, 0.12, 0]}
        b={[0, 0.12 + dy, length]}
        radius={0.025}
        color={color}
        finish={FINISH.steel}
        shadow={false}
      />
      {Array.from({ length: count }, (_, i) => {
        const [, y, z] = at(i / (count - 1));
        return <Rod key={i} p={[0, y + h / 2, z]} s={[0.04, h, 0.04]} color={color} finish={FINISH.steel} />;
      })}
      {bars && (
        <Fine>
          {times(Math.max(0, Math.round(length / 0.16)), (i, n) => {
            const [, y, z] = at((i + 0.5) / n);
            return (
              <Box
                key={i}
                p={[0, y + 0.12 + (h - 0.12) / 2, z]}
                s={[0.02, h - 0.14, 0.02]}
                color={color}
                shadow={false}
              />
            );
          })}
        </Fine>
      )}
    </group>
  );
}

/** Balcon en saillie : dalle, nez de dalle, garde-corps sur trois côtés, consoles. */
export function Balcony({
  p,
  ry = 0,
  w = 2.4,
  d = 1.1,
  color = C.white,
  rail = C.ink,
}: {
  p: V3;
  ry?: number;
  w?: number;
  d?: number;
  color?: string;
  rail?: string;
}) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, -0.09, d / 2]} s={[w, 0.18, d]} color={color} finish={FINISH.concrete} />
      <Box p={[0, -0.1, d]} s={[w + 0.04, 0.24, 0.06]} color={color} finish={FINISH.paint} />
      <Railing a={[-w / 2 + 0.05, 0, d - 0.05]} b={[w / 2 - 0.05, 0, d - 0.05]} color={rail} />
      <Railing a={[-w / 2 + 0.05, 0, 0.05]} b={[-w / 2 + 0.05, 0, d - 0.05]} color={rail} />
      <Railing a={[w / 2 - 0.05, 0, 0.05]} b={[w / 2 - 0.05, 0, d - 0.05]} color={rail} />
      <Fine>
        {[-w / 3, w / 3].map((x) => (
          <Box key={x} p={[x, -0.32, 0.25]} s={[0.08, 0.3, 0.5]} color={color} shadow={false} />
        ))}
      </Fine>
    </group>
  );
}

/**
 * Escalier droit : marches, limons, main courante. Part de p (pied, au centre de la première
 * marche) et monte de `rise` sur `run` dans la direction ry.
 */
export function Stair({
  p,
  ry = 0,
  rise,
  run,
  width = 1.1,
  color = C.concrete,
  rail = C.ink,
  sides = [-1, 1],
}: {
  p: V3;
  ry?: number;
  rise: number;
  run: number;
  width?: number;
  color?: string;
  rail?: string;
  /** Côtés munis d'une main courante (-1 gauche, 1 droite). */
  sides?: number[];
}) {
  const n = Math.max(2, Math.round(rise / 0.18));
  const step = run / n;
  const riseStep = rise / n;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <Box
          key={i}
          p={[0, riseStep * (i + 1) - 0.04, step * (i + 0.5)]}
          s={[width, 0.08, step + 0.02]}
          color={color}
          finish={FINISH.steel}
        />
      ))}
      {[-1, 1].map((s) => (
        <Pipe
          key={s}
          a={[s * (width / 2 + 0.04), -0.05, 0]}
          b={[s * (width / 2 + 0.04), rise - 0.05, run]}
          radius={0.07}
          color={rail}
          finish={FINISH.steel}
        />
      ))}
      {sides.map((s) => (
        <Railing
          key={s}
          a={[s * (width / 2 + 0.06), 0, 0]}
          b={[s * (width / 2 + 0.06), rise, run]}
          color={rail}
          bars={false}
          posts={Math.max(2, Math.round(run / 1.4) + 1)}
        />
      ))}
    </group>
  );
}

/** Échelle à crinoline : montants, échelons, arceaux et barres de la cage à partir de 2,3 m. */
export function CageLadder({
  p,
  ry = 0,
  h,
  color = C.metal,
}: {
  p: V3;
  ry?: number;
  h: number;
  color?: string;
}) {
  const hoops = Math.max(0, Math.floor((h - 2.3) / 0.75));
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {[-0.22, 0.22].map((x) => (
        <Rod key={x} p={[x, h / 2, 0.18]} s={[0.035, h, 0.035]} color={color} finish={FINISH.steel} />
      ))}
      {Array.from({ length: Math.floor(h / 0.3) }, (_, i) => (
        <Box key={i} p={[0, 0.3 + i * 0.3, 0.18]} s={[0.44, 0.03, 0.03]} color={color} shadow={false} />
      ))}
      {Array.from({ length: hoops }, (_, i) => (
        <Torus
          key={i}
          p={[0, 2.3 + i * 0.75, 0.5]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.36}
          tube={0.02}
          arc={Math.PI}
          segments={12}
          color={color}
        />
      ))}
      {hoops > 0 &&
        [-0.36, -0.12, 0.12, 0.36].map((x) => (
          <Box
            key={x}
            p={[x, 2.3 + ((hoops - 1) * 0.75) / 2, 0.5 + Math.sqrt(Math.max(0, 0.36 ** 2 - x * x))]}
            s={[0.025, (hoops - 1) * 0.75 + 0.05, 0.025]}
            color={color}
            shadow={false}
          />
        ))}
    </group>
  );
}

/** Passerelle de a à b : caillebotis, garde-corps des deux côtés, poutres de rive. */
export function Walkway({
  a,
  b,
  width = 1.1,
  color = C.metal,
  rail = C.ink,
}: {
  a: V3;
  b: V3;
  width?: number;
  color?: string;
  rail?: string;
}) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <group position={a} rotation={[0, angle, 0]}>
      <Box p={[0, -0.04, length / 2]} s={[width, 0.06, length]} color={color} finish={FINISH.slats} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            p={[s * (width / 2 + 0.03), -0.12, length / 2]}
            s={[0.06, 0.22, length]}
            color={rail}
            finish={FINISH.steel}
          />
          <Railing a={[s * (width / 2), 0, 0]} b={[s * (width / 2), 0, length]} color={rail} />
        </group>
      ))}
    </group>
  );
}
