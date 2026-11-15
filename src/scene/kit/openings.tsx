/**
 * Ouvertures : fenêtres en retrait (cadre, appui, meneaux, linteau ; stores, volets, jardinières,
 * vitrage éclairé), murs-rideaux, portes complètes (encadrement, marquise, marches, poignée,
 * paillasson, numéro) et auvents. Dessinées face à +Z, centrées sur le nu du mur (z = 0).
 */
import { color as C } from '../../design/tokens';
import { Ball, Beam, Box, FINISH, GLASS, Rod, Sign, type Finish, type V3, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import { WallLamp } from './facade';

const litFinish = (on: boolean): Finish =>
  on ? { rough: 0.4, glow: C.glassLit, glowIntensity: 0.55 } : GLASS;

export interface WindowProps {
  p: V3;
  ry?: number;
  w?: number;
  h?: number;
  /** Carreaux : colonnes (meneaux) et rangées (traverses). */
  cols?: number;
  rows?: number;
  frame?: string;
  glass?: string;
  /** Couleur de l'embrasure (le mur autour) ; sans elle, l'embrasure prend la couleur du cadre. */
  wall?: string;
  /** Profondeur de l'embrasure. */
  depth?: number;
  sill?: string | false;
  lintel?: string | false;
  lit?: boolean;
  variant?: 'plain' | 'blind' | 'shutters' | 'box';
  /** Couleur des stores, volets ou jardinière. */
  accent?: string;
}

/** Fenêtre en retrait : embrasure, vitrage, cadre et petits-bois, appui et linteau. */
export function Window({
  p,
  ry = 0,
  w = 1.2,
  h = 1.6,
  cols = 2,
  rows = 1,
  frame = C.white,
  glass = C.glass,
  wall,
  depth = 0.18,
  sill = C.stone,
  lintel = false,
  lit = false,
  variant = 'plain',
  accent = C.slate,
}: WindowProps) {
  const reveal = wall ?? frame;
  const bar = 0.06;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* Embrasure : le vitrage paraît en retrait du nu du mur. */}
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (w / 2 + 0.05), 0, depth / 2]} s={[0.1, h + 0.2, depth]} color={reveal} />
      ))}
      <Box p={[0, h / 2 + 0.05, depth / 2]} s={[w, 0.1, depth]} color={reveal} />
      <Box
        p={[0, 0, 0.01]}
        s={[w, h, 0.04]}
        color={lit ? C.glassLit : glass}
        finish={litFinish(lit)}
        shadow={false}
      />
      {/* Dormant et petits-bois */}
      <Box p={[-w / 2 + bar / 2, 0, 0.05]} s={[bar, h, 0.08]} color={frame} shadow={false} />
      <Box p={[w / 2 - bar / 2, 0, 0.05]} s={[bar, h, 0.08]} color={frame} shadow={false} />
      <Box p={[0, h / 2 - bar / 2, 0.05]} s={[w, bar, 0.08]} color={frame} shadow={false} />
      <Box p={[0, -h / 2 + bar / 2, 0.05]} s={[w, bar, 0.08]} color={frame} shadow={false} />
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Box
          key={'c' + i}
          p={[-w / 2 + (w / cols) * (i + 1), 0, 0.05]}
          s={[0.05, h, 0.07]}
          color={frame}
          shadow={false}
        />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <Box
          key={'r' + i}
          p={[0, -h / 2 + (h / rows) * (i + 1), 0.05]}
          s={[w, 0.05, 0.07]}
          color={frame}
          shadow={false}
        />
      ))}
      {sill && <Box p={[0, -h / 2 - 0.07, depth * 0.6]} s={[w + 0.3, 0.1, depth + 0.2]} color={sill} />}
      {lintel && (
        <Box p={[0, h / 2 + 0.2, depth / 2 + 0.03]} s={[w + 0.4, 0.22, depth + 0.06]} color={lintel} />
      )}
      {variant === 'blind' && (
        <Box
          p={[0, h / 2 - h * 0.17, 0.04]}
          s={[w - 0.1, h * 0.34, 0.03]}
          color={accent}
          finish={FINISH.slats}
          shadow={false}
        />
      )}
      {variant === 'shutters' &&
        [-1, 1].map((s) => (
          <Box
            key={s}
            p={[s * (w * 0.75 + 0.14), 0, depth + 0.03]}
            s={[w / 2, h + 0.04, 0.05]}
            color={accent}
            finish={FINISH.slats}
          />
        ))}
      {variant === 'box' && (
        <>
          <Box p={[0, -h / 2 - 0.3, depth + 0.2]} s={[w * 0.92, 0.3, 0.32]} color={accent} />
          <Fine>
            {times(Math.max(2, Math.round(w / 0.3)), (i, n) => (
              <Ball
                key={i}
                p={[-w * 0.4 + (w * 0.8 * i) / (n - 1), -h / 2 - 0.08, depth + 0.2]}
                s={[0.17, 0.15, 0.15]}
                color={i % 2 ? C.flower : C.leafDark}
              />
            ))}
          </Fine>
        </>
      )}
      <Fine>
        <Box p={[w / 4 - 0.12, -0.05, 0.1]} s={[0.04, 0.16, 0.04]} color={C.metal} shadow={false} />
      </Fine>
    </group>
  );
}

/** Rangée de fenêtres identiques, régulièrement espacées ; `lit` : indices des fenêtres éclairées. */
export function WindowRow({
  count,
  spacing,
  lit = [],
  ...window
}: Omit<WindowProps, 'lit'> & { count: number; spacing: number; lit?: number[] | boolean }) {
  const { p, ry = 0 } = window;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {Array.from({ length: count }, (_, i) => (
        <Window
          key={i}
          {...window}
          p={[(i - (count - 1) / 2) * spacing, 0, 0]}
          ry={0}
          lit={Array.isArray(lit) ? lit.includes(i) : lit}
        />
      ))}
    </group>
  );
}

/**
 * Mur-rideau en grille sur un plan vertical : vitrages, meneaux, traverses et appui.
 * Dessiné dans le plan XY, face à +Z ; la position et la rotation placent la façade.
 */
export function Windows({
  p,
  r = [0, 0, 0],
  w,
  h,
  cols = 1,
  rows = 1,
  frame = C.white,
  glass = C.glass,
  bar = 0.12,
  sill = true,
  lit = [],
}: {
  p: V3;
  r?: V3;
  w: number;
  h: number;
  cols?: number;
  rows?: number;
  frame?: string;
  glass?: string;
  bar?: number;
  sill?: boolean;
  /** Indices (ligne * cols + colonne) des carreaux éclairés. */
  lit?: number[];
}) {
  const cw = w / cols;
  const rh = h / rows;
  const panes = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const on = lit.includes(i);
      panes.push(
        <Box
          key={i}
          p={[-w / 2 + cw * (col + 0.5), -h / 2 + rh * (row + 0.5), -0.02]}
          s={[cw - bar, rh - bar, 0.06]}
          color={on ? C.glassLit : glass}
          finish={litFinish(on)}
          shadow={false}
        />,
      );
    }
  return (
    <group position={p} rotation={r}>
      {panes}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <Box
          key={'v' + i}
          p={[-w / 2 + cw * i, 0, 0.03]}
          s={[bar, h + bar, 0.14]}
          color={frame}
          shadow={false}
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Box
          key={'h' + i}
          p={[0, -h / 2 + rh * i, 0.03]}
          s={[w + bar, bar, 0.14]}
          color={frame}
          shadow={false}
        />
      ))}
      {sill && <Box p={[0, -h / 2 - bar, 0.12]} s={[w + 0.3, 0.1, 0.3]} color={frame} />}
    </group>
  );
}

/** Auvent incliné en toile, avec lambrequin rayé et bras. */
export function Awning({
  p,
  w,
  d = 1.4,
  color,
  stripe = C.white,
}: {
  p: V3;
  w: number;
  d?: number;
  color: string;
  stripe?: string;
}) {
  const stripes = Math.max(3, Math.round(w / 0.5));
  return (
    <group position={p}>
      <Box p={[0, 0, d / 2]} s={[w, 0.08, d]} r={[0.32, 0, 0]} color={color} finish={FINISH.fabric} />
      {Array.from({ length: stripes }, (_, i) => (
        <Box
          key={i}
          p={[-w / 2 + (w / stripes) * (i + 0.5), -0.44, d - 0.02]}
          s={[w / stripes, 0.32, 0.04]}
          color={i % 2 ? stripe : color}
          finish={FINISH.fabric}
          shadow={false}
        />
      ))}
      <Fine>
        {[-1, 1].map((s) => (
          <Beam
            key={s}
            a={[s * (w / 2 - 0.1), -0.7, 0.02]}
            b={[s * (w / 2 - 0.1), -0.25, d - 0.1]}
            width={0.04}
            color={C.ink}
          />
        ))}
      </Fine>
    </group>
  );
}

/**
 * Porte complète : encadrement, vantail vitré ou plein, poignée, seuil et marches, marquise,
 * paillasson, numéro et appliques. Le vantail est en z = 0, la marquise et les marches vers +Z.
 */
export function DoorSet({
  p,
  ry = 0,
  w = 1.2,
  h = 2.3,
  leaf = C.slate,
  frame = C.white,
  glazed = true,
  double = false,
  canopy = 'flat',
  canopyColor = C.white,
  steps = 0,
  mat = true,
  number,
  lamps = true,
}: {
  p: V3;
  ry?: number;
  w?: number;
  h?: number;
  leaf?: string;
  frame?: string;
  glazed?: boolean;
  double?: boolean;
  canopy?: 'flat' | 'glass' | 'none';
  canopyColor?: string;
  /** Marches devant la porte ; le vantail est surélevé d'autant. */
  steps?: number;
  mat?: boolean;
  number?: string;
  lamps?: boolean;
}) {
  const rise = 0.17;
  const y0 = steps * rise;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* Encadrement : piédroits et linteau en saillie */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          p={[s * (w / 2 + 0.1), y0 + h / 2 + 0.05, 0.08]}
          s={[0.2, h + 0.1, 0.24]}
          color={frame}
        />
      ))}
      <Box p={[0, y0 + h + 0.18, 0.09]} s={[w + 0.6, 0.26, 0.28]} color={frame} />
      {/* Vantail(aux) */}
      <Box p={[0, y0 + h / 2, -0.02]} s={[w, h, 0.08]} color={leaf} finish={FINISH.paint} />
      {glazed &&
        (double ? [-w / 4, w / 4] : [0]).map((x) => (
          <Box
            key={x}
            p={[x, y0 + h * 0.6, 0.03]}
            s={[(double ? w / 2 : w) - 0.3, h * 0.55, 0.03]}
            color={C.glass}
            finish={GLASS}
            shadow={false}
          />
        ))}
      {double && <Box p={[0, y0 + h / 2, 0.03]} s={[0.04, h, 0.04]} color={C.ink} shadow={false} />}
      {/* Seuil et marches */}
      <Box p={[0, y0 - 0.03, 0.15]} s={[w + 0.5, 0.06, 0.4]} color={C.stone} />
      {Array.from({ length: steps }, (_, i) => (
        <Box
          key={i}
          p={[0, y0 - rise * (i + 0.5), 0.35 + (i + 1) * 0.3 - 0.15]}
          s={[w + 0.6 + i * 0.2, rise, 0.3 + (i + 1) * 0.3]}
          color={C.stone}
          finish={FINISH.stone}
        />
      ))}
      {canopy !== 'none' && (
        <group position={[0, y0 + h + 0.55, 0]}>
          <Box
            p={[0, 0, 0.6]}
            s={[w + 1, canopy === 'glass' ? 0.05 : 0.14, 1.2]}
            color={canopy === 'glass' ? C.glass : canopyColor}
            finish={canopy === 'glass' ? GLASS : FINISH.paint}
          />
          {canopy === 'glass' && <Box p={[0, 0, 1.2]} s={[w + 1, 0.1, 0.06]} color={C.ink} />}
          <Fine>
            {[-1, 1].map((s) => (
              <Beam
                key={s}
                a={[s * (w / 2 + 0.3), -0.55, 0.05]}
                b={[s * (w / 2 + 0.3), -0.04, 1.05]}
                width={0.05}
                color={C.ink}
              />
            ))}
          </Fine>
        </group>
      )}
      {lamps && (
        <>
          <WallLamp p={[-(w / 2 + 0.55), y0 + h * 0.72, 0]} />
          <WallLamp p={[w / 2 + 0.55, y0 + h * 0.72, 0]} />
        </>
      )}
      <Fine>
        {/* Poignée(s), paillasson, plaque de numéro */}
        {(double ? [-0.08, 0.08] : [w / 2 - 0.18]).map((x) => (
          <Rod
            key={x}
            p={[x, y0 + h * 0.48, 0.07]}
            s={[0.025, 0.4, 0.025]}
            color={C.metal}
            finish={FINISH.metal}
            shadow={false}
          />
        ))}
        {mat && (
          <Box
            p={[0, 0.015, 0.75 + steps * 0.3]}
            s={[w * 0.8, 0.03, 0.55]}
            color={C.slate}
            finish={FINISH.fabric}
            shadow={false}
          />
        )}
        {number && (
          <>
            <Box p={[w / 2 + 0.55, y0 + h * 0.35, 0.02]} s={[0.42, 0.3, 0.04]} color={C.ink} shadow={false} />
            <Sign
              text={number}
              p={[w / 2 + 0.55, y0 + h * 0.35, 0.05]}
              s={[0.36, 0.24]}
              color={C.white}
              bg={C.ink}
              rounded={false}
            />
          </>
        )}
      </Fine>
    </group>
  );
}
