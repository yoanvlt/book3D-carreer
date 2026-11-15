import { color as C } from '../design/tokens';
import { Box } from './Primitives';
import StaticBatch from './StaticBatch';
import { benches, bikeRacks, bins, bollards, fences, lamps, streetPlates } from '../world/landscape';
import { buildings } from '../world/config';

import { Trees, Hedges, GroundCover } from './Vegetation';
import { Bench, BikeRack, Bin, Bollard, Fence, Lamp, Pergola } from './Furniture';
import { Monument, Wayfinding } from './Plaza';

/** Décor extérieur : végétation, mobilier, place et murs de soutènement des bâtiments en hauteur. */
function Terraces() {
  return (
    <>
      {buildings
        .filter((b) => b.elevation > 2)
        .map((b) => (
          <group
            key={b.id}
            position={[b.position[0], b.elevation, b.position[1]]}
            rotation={[0, b.rotation, 0]}
          >
            <Box p={[0, -0.75, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4, 1.5, 0.7]} color={C.stoneDark} />
            <Box p={[0, 0.05, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4.3, 0.16, 0.9]} color={C.cream} />
            <Box p={[-b.size[0] / 2 - 1.7, -0.6, -1]} s={[0.65, 1.2, b.size[1] - 1]} color={C.stoneDark} />
          </group>
        ))}
    </>
  );
}
/** Nombre de tranches du décor, montées une par image pendant le chargement (voir World.tsx). */
export const ENVIRONMENT_STAGES = 4;
export default function Environment({ stage = ENVIRONMENT_STAGES }: { stage?: number }) {
  return (
    <>
      {stage >= 1 && <Trees />}
      {stage >= 2 && <Hedges />}
      {stage >= 2 && <GroundCover />}
      {stage >= 3 && <Wayfinding />}
      {stage >= 4 && (
        <StaticBatch>
          <Monument />
          <Terraces />
          <Pergola />
          {benches.map((b, i) => (
            <Bench key={i} {...b} />
          ))}
          {lamps.map((p, i) => (
            <Lamp key={i} p={p} plate={streetPlates[i]} />
          ))}
          {bins.map((b, i) => (
            <Bin key={i} {...b} />
          ))}
          {bollards.map((p, i) => (
            <Bollard key={i} p={p} />
          ))}
          {bikeRacks.map((r, i) => (
            <BikeRack key={i} {...r} />
          ))}
          {fences.map(([a, b], i) => (
            <Fence key={i} a={a} b={b} />
          ))}
        </StaticBatch>
      )}
    </>
  );
}
