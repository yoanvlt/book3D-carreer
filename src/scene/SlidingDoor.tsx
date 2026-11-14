import { color as C } from '../design/tokens';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { getState, passage } from '../state';
import { type BuildingId } from '../world/config';
import { Box } from './Primitives';

/** Both sides of a portal use the same explicit openness, including after a scene swap. */
export default function SlidingDoor({ id }: { id: BuildingId }) {
  const left = useRef<Group>(null!),
    right = useRef<Group>(null!);
  useFrame(() => {
    const open = getState().door === id ? passage.openness : 0;
    left.current.position.x = -open * 1.38;
    right.current.position.x = open * 1.38;
  });
  return (
    <>
      <group ref={left}>
        <Box p={[-0.68, 1.65, 0.07]} s={[1.3, 3.25, 0.1]} color={C.glass} />
        <Box p={[-0.09, 1.6, 0.15]} s={[0.06, 0.5, 0.08]} color={C.cream} />
      </group>
      <group ref={right}>
        <Box p={[0.68, 1.65, 0.07]} s={[1.3, 3.25, 0.1]} color={C.glass} />
        <Box p={[0.09, 1.6, 0.15]} s={[0.06, 0.5, 0.08]} color={C.cream} />
      </group>
    </>
  );
}
