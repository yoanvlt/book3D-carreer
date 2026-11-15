import { Beam, Box, GLASS, Sign } from '../Primitives';
import { Bevel, Planter, Railing, RoofUnit, SolarPanel, WallLamp, Windows } from '../kit';
import { color as C, placeColor } from '../../design/tokens';
import { place } from '../../content';

/** Projet 1 : trois plateaux vitrés décalés, tour de service et diagonales. */
export default function Innovation() {
  return (
    <>
      {/* Tour de service */}
      <Bevel p={[-4.9, 6.9, -1.6]} s={[3.2, 13.8, 8]} color='#ff9d4d' radius={0.2} />
      <Windows p={[-6.52, 7, -1.6]} r={[0, -Math.PI / 2, 0]} w={1.4} h={11} rows={8} glass={C.glassDeep} />
      {[3.5, 7.9, 12.3].map((y) => (
        <Box key={y} p={[-4.9, y, 2.44]} s={[3.25, 0.18, 0.12]} color={C.white} />
      ))}
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          position={[i === 1 ? 1.3 : 0, 1 + i * 4.4, 0]}
          rotation={[0, i === 1 ? -0.12 : 0.08, 0]}
        >
          {/* Vitrage avec menuiseries sur toutes les faces */}
          <Box p={[0, 1.8, 0]} s={[12.2, 3.5, 9.2]} color={i === 1 ? '#5aa7c9' : '#7fc4dd'} finish={GLASS} />
          <Windows
            p={[0, 1.85, 4.62]}
            w={12}
            h={3.3}
            cols={6}
            rows={2}
            glass={i === 1 ? '#5aa7c9' : '#7fc4dd'}
            sill={false}
            lit={i === 0 ? [7, 9] : i === 2 ? [8] : []}
          />
          <Windows
            p={[6.12, 1.85, 0]}
            r={[0, Math.PI / 2, 0]}
            w={9}
            h={3.3}
            cols={4}
            rows={2}
            glass='#6db6d3'
            sill={false}
          />
          <Windows
            p={[0, 1.85, -4.62]}
            r={[0, Math.PI, 0]}
            w={12}
            h={3.3}
            cols={6}
            glass='#6db6d3'
            sill={false}
          />
          {/* Dalles en béton clair, nez de dalle et éclairage en sous-face */}
          <Bevel p={[0, 0, 0]} s={[13.2, 0.36, 10.2]} color={C.white} radius={0.12} />
          <Bevel p={[0, 3.7, 0]} s={[13.2, 0.36, 10.2]} color={C.white} radius={0.12} />
          <Box
            p={[0, 3.5, 5.02]}
            s={[12.6, 0.06, 0.1]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 0.9 }}
            shadow={false}
          />
          {i > 0 && <Railing a={[-6.3, 3.88, 5]} b={[6.3, 3.88, 5]} posts={10} h={0.8} />}
        </group>
      ))}
      {/* Contreventements */}
      <Beam a={[-7, 0, 5.4]} b={[6, 13.8, 5.4]} width={0.38} color={C.orange} />
      <Beam a={[6, 0, 5.4]} b={[-7, 13.8, 5.4]} width={0.24} color={C.white} />
      {/* Toiture : auvent incliné, panneaux et équipements */}
      <Box p={[0, 14.7, -1]} s={[9, 0.25, 7]} r={[0, 0, -0.12]} color={C.orange} />
      <SolarPanel p={[2.5, 14.4, 2.6]} />
      <SolarPanel p={[-0.2, 14.4, 2.6]} />
      <RoofUnit p={[4.6, 14.3, -3]} />
      <Sign
        text={place('project-1').enseigne}
        p={[0, 10.15, 5.16]}
        s={[6.4, 1]}
        color={C.white}
        bg={placeColor['project-1']}
      />
      <Planter p={[-3.8, 0, 7.2]} w={2.2} />
      <Planter p={[3.8, 0, 7.2]} w={2.2} />
      <WallLamp p={[-1.9, 2.7, 6.15]} />
      <WallLamp p={[1.9, 2.7, 6.15]} />
    </>
  );
}
