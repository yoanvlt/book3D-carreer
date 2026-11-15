import { Beam, Box, Cone, Cylinder, METAL, Sign } from '../Primitives';
import { Bevel, Railing, SolarPanel, WallLamp, Windows } from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

/** Veolia : bâtiment technique, cuves, réseaux et passerelle. */
export default function Veolia() {
  return (
    <>
      <Bevel p={[0, 2.3, 0]} s={[16.5, 4.6, 11.8]} color='#f7f4ec' radius={0.18} />
      <Box p={[0, 0.35, 5.93]} s={[16.5, 0.7, 0.06]} color={C.red} />
      {[-1, 1].map((side) => (
        <Windows
          key={side}
          p={[side * 8.28, 2.4, 0]}
          r={[0, side * (Math.PI / 2), 0]}
          w={9}
          h={1.8}
          cols={6}
          glass={C.glass}
        />
      ))}
      {[-6.7, -4.6, 4.6, 6.7].map((x, i) => (
        <Windows
          key={x}
          p={[x, 1.95, 5.95]}
          w={1.7}
          h={2.3}
          rows={2}
          glass={C.glass}
          lit={i === 1 ? [1] : []}
        />
      ))}
      {[-1, 1].map((side) => (
        <Windows
          key={side}
          p={[side * 5.6, 4.6, -5.95]}
          r={[0, Math.PI, 0]}
          w={4}
          h={1.2}
          cols={4}
          sill={false}
        />
      ))}
      {/* Cuves : bagues, échelles, toits coniques */}
      {[-4.4, 4.4].map((x, i) => (
        <group key={x}>
          <Cylinder
            p={[x, 7.8, -1]}
            s={[3.4, 8, 3.4]}
            color={i ? '#eddaaf' : '#d1e2da'}
            finish={{ rough: 0.55, metal: 0.15 }}
          />
          <Cylinder p={[x, 11.9, -1]} s={[3.65, 0.3, 3.65]} color={C.white} />
          <Cylinder p={[x, 8.4, -1]} s={[3.46, 0.55, 3.46]} color={C.red} />
          <Cylinder p={[x, 5.2, -1]} s={[3.5, 0.25, 3.5]} color={C.concrete} />
          <Cone p={[x, 12.05, -1]} s={[3.5, 1.5, 3.5]} color={C.white} />
          <Beam a={[x, 12, 1.5]} b={[x, 5.1, 1.5]} width={0.4} color={C.red} />
          {/* Échelle */}
          <group position={[x + (i ? -2.4 : 2.4), 0, -1]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]}>
            {[-0.25, 0.25].map((dx) => (
              <Box key={dx} p={[dx, 8.6, 1.05]} s={[0.06, 7, 0.06]} color={C.metal} shadow={false} />
            ))}
            {Array.from({ length: 12 }, (_, k) => (
              <Box
                key={k}
                p={[0, 5.4 + k * 0.55, 1.05]}
                s={[0.5, 0.05, 0.05]}
                color={C.metal}
                shadow={false}
              />
            ))}
          </group>
        </group>
      ))}
      {/* Réseaux et passerelle */}
      <Beam a={[-4.4, 9, 2.6]} b={[4.4, 9, 2.6]} width={0.5} color={C.red} />
      <Box p={[0, 11.95, -1]} s={[2.8, 0.16, 1.2]} color={C.metal} finish={METAL} />
      <Railing a={[-1.4, 12, -0.45]} b={[1.4, 12, -0.45]} posts={3} h={0.8} color={C.red} />
      <Railing a={[-1.4, 12, -1.55]} b={[1.4, 12, -1.55]} posts={3} h={0.8} color={C.red} />
      {[-7.4, 7.4].map((x) => (
        <group key={x}>
          <Cylinder p={[x, 5.3, -4.4]} s={[0.35, 1.4, 0.35]} color={C.metal} finish={METAL} />
          <Cylinder p={[x, 6.05, -4.4]} s={[0.5, 0.18, 0.5]} color={C.red} />
        </group>
      ))}
      {/* Marquise et enseigne */}
      <Box p={[0, 5.6, 4.9]} s={[16.9, 0.3, 3.4]} color={C.white} />
      <Box
        p={[0, 5.42, 6.58]}
        s={[16.9, 0.08, 0.06]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 0.8 }}
        shadow={false}
      />
      <Box p={[0, 3.9, 6.1]} s={[16, 1.6, 0.3]} color={C.white} />
      <Sign text={place('veolia').enseigne} p={[0, 4.05, 6.28]} s={[7, 1.5]} color='#e4212d' bg={C.white} />
      <Sign
        text={place('veolia').enseigne}
        p={[0, 9.4, -4.5]}
        s={[7, 1.5]}
        rotation={[0, Math.PI, 0]}
        color='#e4212d'
        bg={C.white}
      />
      {[-5, 0, 5].map((x) => (
        <SolarPanel key={x} p={[x, 5.7, 4.6]} w={3.4} d={2} />
      ))}
      <WallLamp p={[-2.1, 2.6, 6.02]} />
      <WallLamp p={[2.1, 2.6, 6.02]} />
    </>
  );
}
