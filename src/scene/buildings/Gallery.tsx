/**
 * Autres missions : la galerie. Grand hall en pierre claire couvert d'un toit vert d'eau à
 * lanterneau vitré ; en façade, une colonnade portant un entablement, des bannières suspendues et
 * deux vitrines éclairées ; de part et d'autre, deux jardins de sculptures. Emprise 14 × 9, porte en z = 5.
 */
import { Ball, Box, Cylinder, FINISH, Rod, Sign, Torus, times, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Downpipe, GableRoof, GlassRoof, Volume, Window } from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

const STONE = '#efe8da';
const TEAL = '#3f9c88';
const TEAL_DARK = '#2a6f62';
const BANNERS = ['#3f9c88', '#e8774f', '#8f7fd6', '#e8ad45'];

/** Colonne : base, fût cannelé (seize cannelures fines), chapiteau. */
function Column({ p, h }: { p: V3; h: number }) {
  return (
    <group position={p}>
      <Box p={[0, 0.15, 0]} s={[0.8, 0.3, 0.8]} color={STONE} finish={FINISH.stone} />
      <Cylinder p={[0, 0.38, 0]} s={[0.36, 0.16, 0.36]} color={STONE} />
      <Cylinder p={[0, h / 2, 0]} s={[0.3, h - 0.9, 0.3]} color={C.white} finish={FINISH.render} />
      <Cylinder p={[0, h - 0.38, 0]} s={[0.38, 0.16, 0.38]} color={STONE} />
      <Box p={[0, h - 0.15, 0]} s={[0.86, 0.3, 0.86]} color={STONE} finish={FINISH.stone} />
      <Fine>
        {times(12, (i, n) => {
          const a = (i / n) * Math.PI * 2;
          return (
            <Box
              key={i}
              p={[Math.sin(a) * 0.29, h / 2, Math.cos(a) * 0.29]}
              s={[0.04, h - 1, 0.04]}
              r={[0, a, 0]}
              color='#e2dccf'
              shadow={false}
            />
          );
        })}
      </Fine>
    </group>
  );
}

/** Bannière suspendue à l'entablement : hampe, toile à motif géométrique, lest. */
function Banner({ p, color, motif }: { p: V3; color: string; motif: number }) {
  return (
    <group position={p}>
      <Rod p={[0, 0, 0]} s={[0.03, 1.3, 0.03]} r={[0, 0, Math.PI / 2]} color={C.ink} />
      <Box p={[0, -1.3, 0]} s={[1.1, 2.5, 0.04]} color={color} finish={FINISH.fabric} />
      {motif === 0 && <Ball p={[0, -1.0, 0.03]} s={[0.32, 0.32, 0.02]} color={C.white} shadow={false} />}
      {motif === 1 && (
        <Box p={[0, -1.0, 0.03]} s={[0.5, 0.5, 0.02]} r={[0, 0, 0.78]} color={C.white} shadow={false} />
      )}
      {motif === 2 &&
        times(3, (i) => (
          <Box key={i} p={[0, -0.7 - i * 0.3, 0.03]} s={[0.7, 0.1, 0.02]} color={C.white} shadow={false} />
        ))}
      {motif === 3 && <Torus p={[0, -1.0, 0.03]} radius={0.28} tube={0.06} segments={20} color={C.white} />}
      <Box p={[0, -2.6, 0]} s={[1.14, 0.08, 0.08]} color={C.ink} />
    </group>
  );
}

/** Vitrine éclairée en saillie : socle, caisson vitré clair, objet exposé, filet lumineux. */
function Showcase({ p, object }: { p: V3; object: number }) {
  return (
    <group position={p}>
      <Box p={[0, 0.35, 0.35]} s={[1.6, 0.7, 0.8]} color={STONE} finish={FINISH.stone} />
      <Box
        p={[0, 1.45, 0.35]}
        s={[1.5, 1.5, 0.7]}
        color='#dff3ef'
        finish={FINISH.clearGlass}
        shadow={false}
      />
      <Box p={[0, 2.25, 0.35]} s={[1.6, 0.12, 0.8]} color={C.ink} />
      <Box
        p={[0, 2.17, 0.35]}
        s={[1.3, 0.04, 0.5]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.2 }}
        shadow={false}
      />
      {object === 0 ? (
        <>
          <Cylinder p={[0, 0.95, 0.35]} s={[0.18, 0.5, 0.18]} color={TEAL} />
          <Ball p={[0, 1.35, 0.35]} s={[0.3, 0.38, 0.3]} color={TEAL} />
          <Cylinder p={[0, 1.78, 0.35]} s={[0.1, 0.22, 0.1]} color={TEAL} />
        </>
      ) : (
        <>
          <Box p={[-0.2, 1.05, 0.35]} s={[0.4, 0.7, 0.3]} color={C.orange} />
          <Ball p={[0.25, 0.95, 0.35]} s={[0.26, 0.26, 0.26]} color={C.violetSoft} />
          <Box p={[0.05, 1.5, 0.35]} s={[0.8, 0.06, 0.3]} r={[0, 0, 0.3]} color={C.ink} />
        </>
      )}
    </group>
  );
}

/** Sculptures extérieures, sur lit de gravier. */
function Sculptures({ side }: { side: number }) {
  return (
    <group position={[side * 6.1, 0, 0]}>
      <Box p={[0, 0.05, 0]} s={[1.6, 0.1, 8.6]} color={C.stone} finish={FINISH.gravel} shadow={false} />
      {side < 0 ? (
        <>
          {/* Arche de pierre et cube en équilibre */}
          <Box p={[0, 0.3, 2.3]} s={[1.1, 0.6, 1.1]} color={STONE} finish={FINISH.stone} />
          <Torus
            p={[0, 2.0, 2.3]}
            r={[0, Math.PI / 2, 0]}
            radius={1.0}
            tube={0.2}
            arc={Math.PI}
            segments={20}
            color={C.orange}
            finish={FINISH.paint}
          />
          <Box p={[0, 0.25, -2.2]} s={[0.9, 0.5, 0.9]} color={STONE} finish={FINISH.stone} />
          <Box
            p={[0, 1.15, -2.2]}
            s={[0.9, 0.9, 0.9]}
            r={[0.6, 0.4, 0.62]}
            color={TEAL_DARK}
            finish={FINISH.steel}
          />
        </>
      ) : (
        <>
          {/* Totem de sphères et colonne torse */}
          <Box p={[0, 0.3, 2.3]} s={[1, 0.6, 1]} color={STONE} finish={FINISH.stone} />
          {[0.5, 0.38, 0.28].map((r, i) => (
            <Ball
              key={i}
              p={[0, 1.05 + i * 0.85, 2.3]}
              s={[r, r, r]}
              color={[C.yellow, C.violetSoft, C.white][i]}
              finish={FINISH.paint}
            />
          ))}
          <Box p={[0, 0.2, -2.2]} s={[0.8, 0.4, 0.8]} color={STONE} finish={FINISH.stone} />
          {times(7, (i) => (
            <Box
              key={i}
              p={[0, 0.6 + i * 0.36, -2.2]}
              s={[0.55, 0.34, 0.55]}
              r={[0, i * 0.22, 0]}
              color={TEAL}
              finish={FINISH.paint}
            />
          ))}
        </>
      )}
      <Fine>
        <Box
          p={[side * -0.55, 0.32, 0]}
          s={[0.05, 0.5, 0.4]}
          r={[0, 0, side * 0.3]}
          color={C.ink}
          shadow={false}
        />
      </Fine>
    </group>
  );
}

export default function Atelier() {
  return (
    <>
      {/* Hall : soubassement de pierre, corniche, fenêtres hautes latérales. */}
      <Volume
        p={[0, 0, -0.25]}
        w={10.4}
        d={8.5}
        h={6.2}
        color={STONE}
        finish={FINISH.stone}
        plinth={{ h: 0.6, color: '#d8cfbd' }}
        cornice={C.white}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          {[-2.5, 0.5].map((z) => (
            <Window
              key={z}
              p={[s * 5.2, 4.2, z]}
              ry={(s * Math.PI) / 2}
              w={1.1}
              h={2}
              cols={1}
              rows={3}
              wall={STONE}
              lintel={C.white}
            />
          ))}
          <Downpipe p={[s * 5.2, 0, -4.2]} ry={(s * Math.PI) / 2} h={6.2} />
        </group>
      ))}
      {/* Toit vert d'eau et lanterneau vitré. */}
      <GableRoof y={6.2} w={10.8} d={8.9} h={1.7} color={TEAL} gable={STONE} overhang={0.35} z={-0.25} />
      <GlassRoof p={[0, 7.3, -0.25]} w={6} d={2.2} h={0.8} />
      {/* Colonnade et entablement. */}
      {[-4.4, -2.2, 2.2, 4.4].map((x) => (
        <Column key={x} p={[x, 0, 4.3]} h={5.1} />
      ))}
      <Box p={[0, 5.35, 4.1]} s={[10.2, 0.5, 0.9]} color={STONE} finish={FINISH.stone} />
      <Box p={[0, 5.8, 4.1]} s={[10.2, 0.4, 0.86]} color={TEAL} finish={FINISH.paint} />
      <Box p={[0, 6.1, 4.15]} s={[10.6, 0.2, 1.05]} color={C.white} />
      <Sign
        text={place('missions').enseigne}
        p={[0, 5.8, 4.55]}
        s={[4.2, 0.36]}
        color={C.white}
        bg={TEAL}
        rounded={false}
      />
      <Fine>
        {times(16, (i, n) => (
          <Box
            key={i}
            p={[-5 + (10 * i) / (n - 1), 5.06, 4.56]}
            s={[0.12, 0.1, 0.06]}
            color={C.white}
            shadow={false}
          />
        ))}
      </Fine>
      {/* Bannières entre les colonnes, vitrines au pied. */}
      {[-3.3, 3.3].map((x, i) => (
        <group key={x}>
          <Banner p={[x, 5.0, 4.15]} color={BANNERS[i * 3]} motif={i * 3} />
          <Showcase p={[x, 0, 3.95]} object={i} />
        </group>
      ))}
      <Sculptures side={-1} />
      <Sculptures side={1} />
    </>
  );
}
