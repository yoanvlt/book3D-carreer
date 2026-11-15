import { Box, Cylinder, GLASS, Sign, material } from '../Primitives';
import { Bevel, Railing, WallLamp } from '../kit';
import { color as C, placeColor } from '../../design/tokens';
import { place } from '../../content';

/** Projet 3 : observatoire, plateaux en spirale et coupole. */
export default function Discovery() {
  return (
    <>
      <Cylinder p={[0, 0.2, 0]} s={[6.4, 0.4, 6.4]} color={C.stoneDark} />
      <Cylinder p={[0, 2.6, 0]} s={[6, 4.8, 6]} color='#8a74e8' />
      {/* Fentes vitrées du socle */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) return null;
        return (
          <Box
            key={i}
            p={[Math.sin(a) * 6.01, 2.8, Math.cos(a) * 6.01]}
            s={[0.55, 3, 0.1]}
            r={[0, a, 0]}
            color={i % 4 === 1 ? C.glassLit : '#a9e0f2'}
            finish={i % 4 === 1 ? { glow: C.glassLit, glowIntensity: 0.5 } : GLASS}
          />
        );
      })}
      <Cylinder p={[0, 5.2, 0]} s={[6.6, 0.45, 6.6]} color={C.white} />
      <Cylinder p={[-1, 8.7, -0.6]} s={[3.1, 7, 3.1]} color='#8fd0e6' finish={GLASS} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Box
            key={i}
            p={[-1 + Math.sin(a) * 3.12, 8.7, -0.6 + Math.cos(a) * 3.12]}
            s={[0.12, 7, 0.12]}
            r={[0, a, 0]}
            color={C.white}
          />
        );
      })}
      {[6.2, 8.5, 10.8, 13].map((y, i) => (
        <group key={y} rotation={[0, i * 0.45, 0]}>
          <Bevel p={[0, y, 0]} s={[11, 0.3, 4.5]} color={i % 2 ? C.white : '#b4a6f2'} radius={0.12} />
          <Box p={[5, y + 0.6, 0]} s={[0.1, 1, 4.5]} color={C.white} />
          <Railing a={[-5.4, y + 0.15, 2.2]} b={[4.9, y + 0.15, 2.2]} posts={8} h={0.75} />
          <Box
            p={[0, y - 0.18, 2.24]}
            s={[10.6, 0.05, 0.08]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 0.8 }}
            shadow={false}
          />
        </group>
      ))}
      <Cylinder p={[-1, 14.6, -0.6]} s={[4.3, 3.3, 4.3]} color='#b4a6f2' />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <Box
            key={i}
            p={[-1 + Math.sin(a) * 4.32, 14.6, -0.6 + Math.cos(a) * 4.32]}
            s={[0.45, 1.1, 0.08]}
            r={[0, a, 0]}
            color='#a9e0f2'
            finish={GLASS}
          />
        );
      })}
      {/* Coupole, nervures et fente d'observation */}
      <mesh position={[-1, 16.3, -0.6]} castShadow material={material(C.white)}>
        <sphereGeometry args={[4.3, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[-1, 16.3, -0.6]}
          rotation={[0, (i * Math.PI) / 3, 0]}
          material={material(C.concrete)}
        >
          <torusGeometry args={[4.33, 0.07, 5, 28, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[-1, 16.3, -0.6]} rotation={[0, -0.5, 0]} material={material(C.ink)}>
        <torusGeometry args={[4.36, 0.42, 4, 24, Math.PI / 2.4]} />
      </mesh>
      <Cylinder p={[1.7, 17.2, 1.4]} s={[0.7, 5, 0.7]} r={[Math.PI / 2 - 0.4, 0, -0.5]} color={C.ink} />
      <Cylinder
        p={[-1, 16.35, -0.6]}
        s={[4.45, 0.12, 4.45]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 0.6 }}
        shadow={false}
      />
      {/* Entrée */}
      <Box p={[0, 3.95, 6.6]} s={[4.4, 0.25, 1.6]} color={C.white} />
      {[-2, 2].map((x) => (
        <Cylinder key={x} p={[x, 1.95, 7.2]} s={[0.12, 3.9, 0.12]} color={C.white} />
      ))}
      <Sign
        text={place('project-3').enseigne}
        p={[0, 4.55, 6.62]}
        s={[5.6, 0.9]}
        color={C.white}
        bg={placeColor['project-3']}
      />
      <WallLamp p={[-1.9, 2.7, 5.6]} />
      <WallLamp p={[1.9, 2.7, 5.6]} />
    </>
  );
}
