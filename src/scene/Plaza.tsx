import { color as C, scenePlaceColor } from '../design/tokens';
import { Ball, Box, Cone, Cylinder, FINISH, Rod, Sign, Torus } from './Primitives';
import { Fine } from './StaticBatch';
import { buildings } from '../world/config';
import { setState } from '../state';
import { place } from '../content';

/** Décor de la place centrale : sculpture et poteau indicateur. */
/** Fontaine-sculpture de la place : bassin mouluré, vasque sur colonne, anneaux de bronze et d'acier. */
export function Monument() {
  return (
    <group position={[0, 0.8, 0]}>
      <Cylinder p={[0, 0.06, 0]} s={[3.1, 0.12, 3.1]} color={C.stoneDark} finish={FINISH.stone} />
      <Cylinder p={[0, 0.3, 0]} s={[2.75, 0.5, 2.75]} color={C.cream} finish={FINISH.stone} />
      <Torus
        p={[0, 0.56, 0]}
        r={[Math.PI / 2, 0, 0]}
        radius={2.68}
        tube={0.13}
        segments={48}
        color={C.cream}
        finish={FINISH.stone}
      />
      <Cylinder p={[0, 0.47, 0]} s={[2.5, 0.04, 2.5]} color={C.water} finish={FINISH.glass} shadow={false} />
      {/* Colonne et vasque */}
      <Cylinder p={[0, 0.75, 0]} s={[0.7, 0.5, 0.7]} color={C.cream} finish={FINISH.stone} />
      <Rod p={[0, 1.2, 0]} s={[0.32, 0.9, 0.32]} color={C.cream} finish={FINISH.stone} />
      <Cone p={[0, 1.55, 0]} s={[1.1, 0.3, 1.1]} r={[Math.PI, 0, 0]} color={C.cream} finish={FINISH.stone} />
      <Cylinder p={[0, 1.74, 0]} s={[1.15, 0.1, 1.15]} color={C.cream} finish={FINISH.stone} />
      <Cylinder p={[0, 1.8, 0]} s={[1.0, 0.03, 1.0]} color={C.water} finish={FINISH.glass} shadow={false} />
      {/* Sculpture : trois anneaux entrelacés sur une tige */}
      <Rod p={[0, 2.3, 0]} s={[0.07, 1.0, 0.07]} color={C.ink} finish={FINISH.steel} />
      <group position={[0, 3.05, 0]} rotation={[0.12, 0.42, 0.15]}>
        <Torus
          radius={1.6}
          tube={0.2}
          arc={Math.PI * 1.72}
          segments={64}
          color={C.orange}
          finish={{ rough: 0.35, metal: 0.25 }}
        />
        <Torus
          r={[0, Math.PI / 2, 0.2]}
          radius={1.15}
          tube={0.09}
          arc={Math.PI * 1.6}
          segments={56}
          color={C.yellow}
          finish={{ rough: 0.3, metal: 0.5 }}
        />
        <Torus
          r={[Math.PI / 2, 0.3, 0]}
          radius={0.8}
          tube={0.05}
          segments={40}
          color={C.white}
          finish={FINISH.steel}
        />
      </group>
      <Fine>
        <Box
          p={[0, 0.32, 2.77]}
          s={[0.7, 0.3, 0.04]}
          color='#9a7440'
          finish={{ rough: 0.4, metal: 0.6 }}
          shadow={false}
        />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <Ball
              key={i}
              p={[Math.sin(a) * 1.12, 1.82, Math.cos(a) * 1.12]}
              s={[0.06, 0.04, 0.06]}
              color={C.cream}
              shadow={false}
            />
          );
        })}
      </Fine>
    </group>
  );
}
/**
 * Poteau indicateur de la place : une lame par lieu, orientée vers lui, dans la police de l'interface.
 * Un clic ouvre le plan.
 */
const POST: [number, number] = [-8, 5];
export function Wayfinding() {
  return (
    <group
      position={[POST[0], 0.7, POST[1]]}
      userData={{ dynamic: true }}
      onClick={(e) => {
        e.stopPropagation();
        setState({ map: true });
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <Rod p={[0, 2.25, 0]} s={[0.09, 4.3, 0.09]} color={C.ink} finish={FINISH.steel} />
      <Cylinder p={[0, 0.45, 0]} s={[0.14, 0.5, 0.14]} color={C.ink} />
      <Cylinder p={[0, 4.45, 0]} s={[0.14, 0.1, 0.14]} color={C.ink} />
      <Ball p={[0, 4.6, 0]} s={[0.12, 0.14, 0.12]} color={C.yellow} finish={{ rough: 0.3, metal: 0.5 }} />
      {buildings.map((b, i) => {
        const angle = Math.atan2(b.position[0] - POST[0], b.position[1] - POST[1]) - Math.PI / 2;
        const text = place(b.id).titre;
        const bg = scenePlaceColor[b.id];
        const ink = b.id === 'project-2' ? C.ink : C.white;
        return (
          <group key={b.id} position={[0, 4.05 - i * 0.6, 0]} rotation={[0, angle, 0]}>
            <Cylinder p={[0, 0, 0]} s={[0.12, 0.14, 0.12]} color={C.ink} />
            <Box p={[2.85, 0, 0]} s={[0.12, 0.42, 0.05]} r={[0, 0, 0]} color={bg} />
            <Sign text={`${text}  →`} p={[1.45, 0, 0.035]} s={[2.7, 0.5]} color={ink} bg={bg} />
            <Sign
              text={`←  ${text}`}
              p={[1.45, 0, -0.035]}
              s={[2.7, 0.5]}
              rotation={[0, Math.PI, 0]}
              color={ink}
              bg={bg}
            />
          </group>
        );
      })}
      <Box p={[0, 0.1, 0]} s={[0.7, 0.2, 0.7]} color={C.stone} finish={FINISH.stone} />
      <Box p={[0, 0.24, 0]} s={[0.5, 0.08, 0.5]} color={C.stoneDark} />
    </group>
  );
}
