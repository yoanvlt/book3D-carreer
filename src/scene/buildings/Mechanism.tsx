import { Beam, Box, Cylinder, GLASS, Sign, Vault, material } from '../Primitives';
import { Bevel, WallLamp, Windows } from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

/** Projet 2 : manufacture voûtée, roue mécanique et cheminées. */
export default function Mechanism() {
  return (
    <>
      <Bevel p={[0, 2.8, -0.2]} s={[16, 5.6, 11.5]} color='#f0a92e' radius={0.2} />
      {/* Soubassement en brique et fenêtres d'atelier */}
      <Box p={[0, 0.55, 5.58]} s={[16, 1.1, 0.12]} color={C.brick} />
      {[-5.6, 5.6].map((x) => (
        <Windows
          key={x}
          p={[x, 3.1, 5.6]}
          w={3.6}
          h={2.6}
          cols={4}
          rows={3}
          frame={C.ink}
          glass='#8fd0e6'
          lit={x < 0 ? [5] : [2, 9]}
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Windows
            p={[side * 8.03, 3, -2.5]}
            r={[0, side * (Math.PI / 2), 0]}
            w={4.4}
            h={2.4}
            cols={4}
            rows={2}
            frame={C.ink}
            glass='#8fd0e6'
          />
          {/* Porte de chargement */}
          <group position={[side * 8.04, 0, 2.6]} rotation={[0, side * (Math.PI / 2), 0]}>
            <Box p={[0, 1.7, 0.02]} s={[3, 3.4, 0.08]} color={C.concrete} />
            {Array.from({ length: 8 }, (_, i) => (
              <Box
                key={i}
                p={[0, 0.3 + i * 0.4, 0.08]}
                s={[2.9, 0.06, 0.04]}
                color={C.metal}
                shadow={false}
              />
            ))}
            <Box p={[0, 3.55, 0.25]} s={[3.4, 0.25, 0.5]} color={C.ink} />
          </group>
        </group>
      ))}
      {/* Voûte, nervures et verrière faîtière */}
      <Vault p={[0, 5.6, 0]} s={[7.8, 7.8, 11.5]} color='#f7c64a' />
      {[-5.5, -2.8, 0, 2.8, 5.5].map((z) => (
        <mesh key={z} position={[0, 5.6, z]} castShadow material={material(C.white)}>
          <torusGeometry args={[7.9, 0.17, 6, 36, Math.PI]} />
        </mesh>
      ))}
      <Box p={[0, 13.42, 0]} s={[1.6, 0.18, 11]} color='#8fd0e6' finish={GLASS} />
      {/* Roue */}
      <Cylinder p={[0, 7.1, 5.85]} s={[3.5, 0.4, 3.5]} r={[Math.PI / 2, 0, 0]} color={C.ink} />
      <Cylinder
        p={[0, 7.1, 6.08]}
        s={[2.7, 0.2, 2.7]}
        r={[Math.PI / 2, 0, 0]}
        color='#8fd0e6'
        finish={GLASS}
      />
      <Cylinder p={[0, 7.1, 6.22]} s={[0.5, 0.2, 0.5]} r={[Math.PI / 2, 0, 0]} color={C.orange} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <group key={i}>
            <Box
              p={[Math.sin(a) * 3.45, 7.1 + Math.cos(a) * 3.45, 6.1]}
              s={[0.7, 1, 0.5]}
              r={[0, 0, -a]}
              color={C.white}
            />
            {i % 2 === 0 && (
              <Beam
                a={[0, 7.1, 6.18]}
                b={[Math.sin(a) * 2.6, 7.1 + Math.cos(a) * 2.6, 6.18]}
                width={0.1}
                color={C.ink}
              />
            )}
          </group>
        );
      })}
      {[-6.5, 6.5].map((x) => (
        <group key={x}>
          <Box p={[x, 4, 6]} s={[0.45, 8, 0.5]} color={C.ink} />
          {/* Cheminées baguées */}
          <Cylinder p={[x, 9, -3]} s={[0.65, 4, 0.65]} color={C.orange} />
          <Cylinder p={[x, 10.2, -3]} s={[0.72, 0.3, 0.72]} color={C.white} />
          <Cylinder p={[x, 11.1, -3]} s={[0.8, 0.22, 0.8]} color={C.ink} />
        </group>
      ))}
      <Sign text={place('project-2').enseigne} p={[0, 4.4, 6.3]} s={[5.6, 0.9]} color={C.ink} bg={C.white} />
      <WallLamp p={[-2.6, 2.7, 5.62]} />
      <WallLamp p={[2.6, 2.7, 5.62]} />
      {/* Caisses devant l'atelier */}
      <Box p={[6.6, 0.45, 7.3]} s={[0.9, 0.9, 0.9]} color={C.wood} />
      <Box p={[7.3, 0.35, 6.6]} s={[0.7, 0.7, 0.7]} r={[0, 0.4, 0]} color={C.woodDark} />
    </>
  );
}
