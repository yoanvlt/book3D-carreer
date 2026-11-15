/**
 * Projet 3 : l'observatoire. Tambour violet percé de fentes vitrées, terrasse annulaire avec
 * garde-corps, tambour blanc, coupole à lamelles dont la fente ouverte laisse sortir le télescope.
 * Un escalier hélicoïdal extérieur monte à la terrasse ; une petite station météo s'y dresse.
 * Emprise 13 × 13, porte en z = 7.
 */
import { Arc, Ball, Box, Cylinder, FINISH, GLASS, Pipe, Rod, Sign, Torus, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Downpipe, LouvredDome, Planter, SolarPanel, Volume, WallLamp } from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

const VIOLET = '#8f7fd6';
const VIOLET_DARK = '#5d4fa3';
const WHITE = '#f4f2fb';
const STEEL = '#2f3b45';
/** Orientation de la fente et du télescope (radians, 0 = vers la porte). */
const SLIT = 0.75;

/** Escalier hélicoïdal le long du tambour, de a0 à a1 (radians), du sol à la terrasse. */
function SpiralStair({ radius, rise, a0, a1 }: { radius: number; rise: number; a0: number; a1: number }) {
  const steps = Math.round(rise / 0.18);
  const at = (t: number, r: number, y: number): [number, number, number] => {
    const a = a0 + (a1 - a0) * t;
    return [Math.sin(a) * r, y, Math.cos(a) * r];
  };
  return (
    <>
      {times(steps, (i, n) => {
        const t = (i + 0.5) / n;
        const a = a0 + (a1 - a0) * t;
        return (
          <Box
            key={i}
            p={at(t, radius, (rise * (i + 1)) / n - 0.05)}
            s={[1.1, 0.1, ((Math.abs(a1 - a0) * radius) / n) * 1.15]}
            r={[0, a + Math.PI / 2, 0]}
            color={C.concrete}
            finish={FINISH.steel}
          />
        );
      })}
      {/* Limon extérieur, main courante et poteaux */}
      {times(12, (i, n) => (
        <group key={i}>
          <Pipe
            a={at(i / n, radius + 0.58, (rise * i) / n - 0.1)}
            b={at((i + 1) / n, radius + 0.58, (rise * (i + 1)) / n - 0.1)}
            radius={0.08}
            color={STEEL}
          />
          <Pipe
            a={at(i / n, radius + 0.58, (rise * i) / n + 0.95)}
            b={at((i + 1) / n, radius + 0.58, (rise * (i + 1)) / n + 0.95)}
            radius={0.035}
            color={STEEL}
          />
          <Rod p={at(i / n, radius + 0.58, (rise * i) / n + 0.45)} s={[0.03, 1, 0.03]} color={STEEL} />
        </group>
      ))}
      {/* Consoles d'accroche au tambour */}
      <Fine>
        {times(10, (i, n) => (
          <Box
            key={i}
            p={at((i + 0.5) / n, radius - 0.35, (rise * (i + 0.5)) / n - 0.3)}
            s={[0.12, 0.4, 0.12]}
            color={STEEL}
          />
        ))}
      </Fine>
    </>
  );
}

/**
 * Fenêtre qui épouse le tambour de rayon `radius` : vitrage courbe, traverses courbes, montants
 * et appui, centrée sur l'angle `angle` (0 = vers la porte).
 */
function CurvedWindow({
  radius,
  angle,
  width,
  y,
  h,
  lit = false,
}: {
  radius: number;
  angle: number;
  width: number;
  y: number;
  h: number;
  lit?: boolean;
}) {
  const arc = width / radius;
  const glass = lit ? { glow: C.glassLit, glowIntensity: 0.5 } : GLASS;
  return (
    <>
      <Arc
        ry={angle}
        p={[0, y, 0]}
        radius={radius + 0.02}
        height={h}
        arc={arc}
        color={lit ? C.glassLit : '#a9d7ea'}
        finish={glass}
      />
      {[y - h / 2 - 0.05, y + h / 2 + 0.05].map((yy) => (
        <Arc
          key={yy}
          ry={angle}
          p={[0, yy, 0]}
          radius={radius + 0.06}
          height={0.1}
          arc={arc + 0.12 / radius}
          color={WHITE}
        />
      ))}
      {[-1, 1].map((s) => {
        const a = angle + (s * arc) / 2;
        return (
          <Box
            key={s}
            p={[Math.sin(a) * (radius + 0.05), y, Math.cos(a) * (radius + 0.05)]}
            s={[0.07, h, 0.1]}
            r={[0, a, 0]}
            color={WHITE}
            shadow={false}
          />
        );
      })}
      <Box
        p={[Math.sin(angle) * (radius + 0.12), y - h / 2 - 0.12, Math.cos(angle) * (radius + 0.12)]}
        s={[width + 0.15, 0.06, 0.24]}
        r={[0, angle, 0]}
        color={WHITE}
      />
    </>
  );
}

/** Station météo : mât, anémomètre à coupelles, girouette, abri à persiennes, petit panneau solaire. */
function WeatherStation({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <Rod p={[0, 1.6, 0]} s={[0.05, 3.2, 0.05]} color={STEEL} />
      <Rod p={[0, 3.25, 0]} s={[0.03, 0.2, 0.03]} color={STEEL} />
      {times(3, (i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <group key={i}>
            <Box
              p={[Math.sin(a) * 0.22, 3.35, Math.cos(a) * 0.22]}
              s={[0.02, 0.02, 0.44]}
              r={[0, a, 0]}
              color={STEEL}
            />
            <Ball p={[Math.sin(a) * 0.44, 3.35, Math.cos(a) * 0.44]} s={[0.08, 0.08, 0.08]} color={C.white} />
          </group>
        );
      })}
      <Box p={[0, 2.8, 0.3]} s={[0.04, 0.04, 0.8]} color={STEEL} />
      <Box p={[0, 2.8, 0.66]} s={[0.02, 0.2, 0.16]} color={C.red} />
      <Box p={[0, 1.6, 0.2]} s={[0.5, 0.55, 0.4]} color={C.white} finish={FINISH.slats} />
      <Box p={[0, 1.9, 0.2]} s={[0.56, 0.05, 0.46]} color={C.white} />
      <SolarPanel p={[0, 0.6, -0.4]} w={0.7} d={0.5} r={Math.PI} />
    </group>
  );
}

export default function Discovery() {
  return (
    <>
      {/* Tambour principal : socle, enduit violet, bandeau, fentes vitrées. */}
      <Cylinder p={[0, 0.35, 0]} s={[5.85, 0.7, 5.85]} color={C.stoneDark} finish={FINISH.stone} />
      <Cylinder p={[0, 3.6, 0]} s={[5.6, 5.8, 5.6]} color={VIOLET} finish={FINISH.render} />
      <Cylinder p={[0, 4.2, 0]} s={[5.66, 0.18, 5.66]} color={WHITE} />
      {times(16, (i, n) => {
        const a = (i / n) * Math.PI * 2;
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5) return null;
        return (
          <group key={i}>
            <CurvedWindow radius={5.6} angle={a} width={0.6} y={2.4} h={2.2} lit={i % 5 === 2} />
            <Arc ry={a} p={[0, 5.4, 0]} radius={5.62} height={1.0} arc={0.4 / 5.6} color={VIOLET_DARK} />
          </group>
        );
      })}
      {/* Terrasse annulaire et garde-corps circulaire. */}
      <Cylinder p={[0, 6.6, 0]} s={[6.25, 0.3, 6.25]} color={WHITE} finish={FINISH.concrete} />
      <Torus p={[0, 7.75, 0]} r={[Math.PI / 2, 0, 0]} radius={6.1} tube={0.04} segments={48} color={STEEL} />
      <Torus p={[0, 7.2, 0]} r={[Math.PI / 2, 0, 0]} radius={6.1} tube={0.025} segments={48} color={STEEL} />
      {times(28, (i, n) => {
        const a = (i / n) * Math.PI * 2;
        if (a > 3.6 && a < 4.0) return null;
        return (
          <Rod
            key={i}
            p={[Math.sin(a) * 6.1, 7.2, Math.cos(a) * 6.1]}
            s={[0.035, 1.1, 0.035]}
            color={STEEL}
          />
        );
      })}
      {/* Tambour blanc et coupole à lamelles. */}
      <Cylinder p={[0, 9.1, 0]} s={[4.1, 4.8, 4.1]} color={WHITE} finish={FINISH.render} />
      {times(10, (i, n) => (
        <CurvedWindow key={i} radius={4.1} angle={(i / n) * Math.PI * 2 + 0.3} width={0.9} y={9.6} h={0.55} />
      ))}
      <Cylinder p={[0, 11.4, 0]} s={[4.3, 0.2, 4.3]} color={STEEL} />
      <LouvredDome p={[0, 11.5, 0]} radius={4.2} color={WHITE} rib='#c9c6d6' slit={SLIT} />
      {/* Télescope : tube sortant de la fente, bagues, contrepoids. */}
      <group position={[0, 12.6, 0]} rotation={[0, SLIT, 0]}>
        <group rotation={[-0.62, 0, 0]}>
          <Cylinder
            p={[0, 0, 2.2]}
            s={[0.5, 5.4, 0.5]}
            r={[Math.PI / 2, 0, 0]}
            color={C.white}
            finish={FINISH.steel}
          />
          <Cylinder p={[0, 0, 4.95]} s={[0.58, 0.3, 0.58]} r={[Math.PI / 2, 0, 0]} color={VIOLET_DARK} />
          <Cylinder p={[0, 0, 0.6]} s={[0.56, 0.3, 0.56]} r={[Math.PI / 2, 0, 0]} color={STEEL} />
          <Cylinder p={[0.0, 0.6, 1.4]} s={[0.14, 1.4, 0.14]} r={[Math.PI / 2, 0, 0]} color={STEEL} />
          <Fine>
            <Cylinder
              p={[0, 0, 5.11]}
              s={[0.46, 0.02, 0.46]}
              r={[Math.PI / 2, 0, 0]}
              color='#1d1840'
              finish={GLASS}
            />
          </Fine>
        </group>
      </group>

      {/* Escalier hélicoïdal extérieur, de l'est à la terrasse, par l'arrière. */}
      <SpiralStair radius={6.0} rise={6.55} a0={Math.PI * 0.42} a1={Math.PI * 1.2} />
      <WeatherStation p={[-3.6, 6.75, 3.2]} />

      {/* Porche d'entrée, enseigne, appliques. */}
      <Volume
        p={[0, 0, 5.6]}
        w={4.4}
        d={1.8}
        h={4.6}
        color={VIOLET_DARK}
        finish={FINISH.render}
        parapet={{ h: 0.3, color: VIOLET_DARK, coping: WHITE }}
      />
      <Sign
        text={place('project-3').enseigne}
        p={[0, 4.4, 6.52]}
        s={[3.8, 0.55]}
        color={C.white}
        bg={STEEL}
      />
      <WallLamp p={[-2.0, 2.7, 6.5]} />
      <WallLamp p={[2.0, 2.7, 6.5]} />
      <Downpipe p={[-2.2, 0, 6.5]} h={4.6} />
      <Planter p={[-4.3, 0, 6.3]} w={1.6} color={VIOLET_DARK} />
      <Planter p={[4.3, 0, 6.3]} w={1.6} color={VIOLET_DARK} />
    </>
  );
}
