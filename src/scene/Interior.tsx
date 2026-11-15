import StaticBatch from './StaticBatch';
import { interiors } from '../design/tokens';
import { buildings } from '../world/config';
import { stationsFor } from '../world/narrative';
import { useGame } from '../state';
import Room from './interiors/Room';
import Exhibit from './interiors/Exhibit';
import Mobilier from './interiors/Mobilier';

export default function Interior() {
  const { interior } = useGame();
  if (!interior) return null;
  const b = buildings.find((b) => b.id === interior)!;
  const mood = interiors[b.id];
  // Une clé par lieu : la salle est reconstruite (et regroupée) à chaque changement d'intérieur.
  return (
    <group key={b.id}>
      <color attach='background' args={[mood.ceiling]} />
      <ambientLight color={mood.ambient} intensity={mood.ambientIntensity * 0.8} />
      <directionalLight position={[0, 12, 10]} intensity={mood.lightIntensity} color={mood.light} />
      {/* Appoint latéral : les deux murs restent clairs quelle que soit la direction du soleil extérieur. */}
      <directionalLight position={[14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <directionalLight position={[-14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <Room id={b.id} mood={mood}>
        <Mobilier id={b.id} />
      </Room>
      <StaticBatch>
        {stationsFor(b.id).map((station) => (
          <Exhibit key={station.id} id={b.id} station={station} mood={mood} />
        ))}
      </StaticBatch>
    </group>
  );
}
