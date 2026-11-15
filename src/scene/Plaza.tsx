import { color as C, scenePlaceColor } from '../design/tokens';
import { Box, Cylinder, Sign, material } from './Primitives';
import { buildings } from '../world/config';
import { setState } from '../state';
import { place } from '../content';

/** Décor de la place centrale : sculpture et poteau indicateur. */
/** Sculpture de la place centrale. */
export function Monument() {
  return (
    <group position={[0, 0.8, 0]}>
      <Cylinder p={[0, 0.22, 0]} s={[2.65, 0.44, 2.65]} color={C.cream} />
      <Cylinder p={[0, 0.46, 0]} s={[2.25, 0.06, 2.25]} color={C.water} />
      <Cylinder p={[0, 0.65, 0]} s={[1.05, 0.45, 1.05]} color={C.cream} />
      <group position={[0, 2.75, 0]} rotation={[0.12, 0.42, 0.15]}>
        <mesh castShadow material={material(C.orange, { rough: 0.4 })}>
          <torusGeometry args={[1.9, 0.33, 8, 40, Math.PI * 1.72]} />
        </mesh>
        <mesh
          rotation={[0, Math.PI / 2, 0.2]}
          castShadow
          material={material(C.yellow, { rough: 0.4, metal: 0.2 })}
        >
          <torusGeometry args={[1.35, 0.13, 6, 40, Math.PI * 1.6]} />
        </mesh>
      </group>
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
      <Cylinder p={[0, 2.2, 0]} s={[0.1, 4.4, 0.1]} color={C.ink} />
      <Cylinder p={[0, 4.45, 0]} s={[0.16, 0.1, 0.16]} color={C.ink} />
      {buildings.map((b, i) => {
        const angle = Math.atan2(b.position[0] - POST[0], b.position[1] - POST[1]) - Math.PI / 2;
        const text = place(b.id).titre;
        const bg = scenePlaceColor[b.id];
        const ink = b.id === 'project-2' ? C.ink : C.white;
        return (
          <group key={b.id} position={[0, 4.05 - i * 0.6, 0]} rotation={[0, angle, 0]}>
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
      <Box p={[0, 0.1, 0]} s={[0.6, 0.2, 0.6]} color={C.stone} />
    </group>
  );
}
