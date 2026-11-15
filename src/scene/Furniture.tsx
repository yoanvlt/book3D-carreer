import { color as C } from '../design/tokens';
import { Box, Cylinder, Beam } from './Primitives';
import { heightAt } from '../world/terrain';

/** Mobilier urbain : bancs, lampadaires, pergola. */
export function Bench({ p, angle }: { p: [number, number]; angle: number }) {
  return (
    <group position={[p[0], heightAt(...p) + 0.08, p[1]]} rotation={[0, angle, 0]}>
      {[-1.1, 1.1].map((x) => (
        <Box key={x} p={[x, 0.35, 0]} s={[0.16, 0.7, 0.7]} color={C.ink} />
      ))}
      {[-0.28, 0, 0.28].map((z) => (
        <Box key={z} p={[0, 0.74, z]} s={[3, 0.13, 0.21]} color={C.wood} />
      ))}
      {[1, 1.3].map((y) => (
        <Box key={y} p={[0, y, -0.36]} s={[3, 0.2, 0.13]} color={C.wood} />
      ))}
      {[-1.2, 1.2].map((x) => (
        <Box key={x} p={[x, 1, -0.4]} s={[0.1, 0.75, 0.1]} color={C.ink} />
      ))}
    </group>
  );
}
export function Lamp({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], heightAt(...p), p[1]]}>
      <Cylinder p={[0, 1.95, 0]} s={[0.075, 3.9, 0.075]} color={C.ink} />
      <Cylinder p={[0, 0.18, 0]} s={[0.2, 0.36, 0.2]} color={C.ink} />
      <Box p={[0.33, 3.9, 0]} s={[0.8, 0.12, 0.22]} color={C.ink} />
      <Box
        p={[0.58, 3.81, 0]}
        s={[0.5, 0.08, 0.25]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.2 }}
      />
    </group>
  );
}
export function Pergola() {
  return (
    <group position={[-43, heightAt(-43, 20), 20]} rotation={[0, -0.3, 0]}>
      {[-2, 2].flatMap((x) =>
        [-1.5, 1.5].map((z) => (
          <Box key={`${x}${z}`} p={[x, 1.7, z]} s={[0.16, 3.4, 0.16]} color={C.cream} />
        )),
      )}
      {[-2, -1, 0, 1, 2].map((x) => (
        <Box key={x} p={[x, 3.5, 0]} s={[0.2, 0.2, 4]} color={C.wood} />
      ))}
      <Beam a={[-2.3, 3.35, -1.5]} b={[2.3, 3.35, -1.5]} width={0.2} color={C.cream} />
      <Beam a={[-2.3, 3.35, 1.5]} b={[2.3, 3.35, 1.5]} width={0.2} color={C.cream} />
    </group>
  );
}
