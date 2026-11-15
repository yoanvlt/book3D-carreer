import { Ball, Box, GLASS, Sign } from '../Primitives';
import { Awning, Bevel, Planter, Windows } from '../kit';
import { color as C, placeColor } from '../../design/tokens';
import { place } from '../../content';

/** Autres missions : galerie de trois pavillons. */
export default function Atelier() {
  return (
    <>
      {[-4.7, 0, 4.7].map((x, i) => {
        const roof = i === 1 ? C.white : placeColor.missions;
        const wall = i === 1 ? C.cream : '#d8f1ea';
        return (
          <group key={x} position={[x, 0, i === 1 ? -1 : 0]}>
            <Bevel p={[0, 2.5, 0]} s={[4.3, 5, 8.2]} color={wall} radius={0.12} />
            <Windows
              p={[0, i === 1 ? 2.05 : 2.45, 4.12]}
              w={3.6}
              h={i === 1 ? 3.4 : 4.2}
              cols={i === 1 ? 2 : 3}
              rows={3}
              frame={C.white}
              glass={C.glass}
              sill={false}
              lit={i === 0 ? [1] : i === 2 ? [7] : []}
            />
            <Windows p={[0, 3, -4.12]} r={[0, Math.PI, 0]} w={3} h={2} cols={2} />
            {/* Toiture à un pan : rive, couverture et verrière */}
            <Box p={[0, 5.8, 0]} s={[5, 0.35, 9]} r={[0, 0, i % 2 ? 0.27 : -0.27]} color={roof} />
            <Box p={[0, 5.62, 4.52]} s={[5.05, 0.5, 0.1]} r={[0, 0, i % 2 ? 0.27 : -0.27]} color={C.ink} />
            <Box
              p={[i % 2 ? -0.8 : 0.8, 6.05, -1]}
              s={[1.4, 0.12, 3.2]}
              r={[0, 0, i % 2 ? 0.27 : -0.27]}
              color='#a9e0f2'
              finish={GLASS}
            />
            {[-2, 2].map((s) => (
              <Box key={s} p={[s, 2.9, 4.35]} s={[0.16, 5.8, 0.2]} color={C.white} />
            ))}
            {i !== 1 && <Awning p={[0, 4.95, 4.35]} w={3.8} d={0.9} color={placeColor.missions} />}
          </group>
        );
      })}
      <Sign text={place('missions').enseigne} p={[0, 4.3, 3.3]} s={[3.4, 0.8]} color={C.ink} bg={C.white} />
      {/* Guirlande entre les pavillons */}
      {Array.from({ length: 9 }, (_, i) => (
        <Ball
          key={i}
          p={[-6 + i * 1.5, 5.3 - Math.sin((i / 8) * Math.PI) * 0.5, 5.5]}
          s={[0.1, 0.1, 0.1]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 1.5 }}
        />
      ))}
      <Box p={[-5.4, 0.6, 5.2]} s={[2, 1.2, 0.6]} color={C.orange} />
      <Ball p={[-5.4, 1.8, 5.2]} s={[0.65, 0.9, 0.65]} color={C.violetSoft} />
      <Planter p={[5.4, 0, 5.4]} w={2.2} />
    </>
  );
}
