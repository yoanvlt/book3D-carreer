import StaticBatch from './StaticBatch';
import { interiors } from '../design/tokens';
import { buildings, type BuildingId } from '../world/config';
import { stationsFor } from '../world/narrative';
import { useGame } from '../state';
import type { InteriorMood } from '../design/tokens';
import Room from './interiors/Room';
import Exhibit from './interiors/Exhibit';
import ProfileInterior from './interiors/Profile';
import InnovationInterior from './interiors/Innovation';
import MechanismInterior from './interiors/Mechanism';
import DiscoveryInterior from './interiors/Discovery';
import GalleryInterior from './interiors/Gallery';
import VeoliaInterior from './interiors/Veolia';

/** Un fichier par intérieur, dans src/scene/interiors/. */
const THEMES: Record<BuildingId, (props: { mood: InteriorMood }) => React.JSX.Element> = {
  profile: ProfileInterior,
  'project-1': InnovationInterior,
  'project-2': MechanismInterior,
  'project-3': DiscoveryInterior,
  missions: GalleryInterior,
  veolia: VeoliaInterior,
};

export default function Interior() {
  const { interior } = useGame();
  if (!interior) return null;
  const b = buildings.find((b) => b.id === interior)!;
  const mood = interiors[b.id];
  const Theme = THEMES[b.id];
  return (
    <>
      <color attach='background' args={[mood.ceiling]} />
      <ambientLight color={mood.ambient} intensity={mood.ambientIntensity * 0.8} />
      <directionalLight position={[0, 12, 10]} intensity={mood.lightIntensity} color={mood.light} />
      {/* Appoint latéral : les deux murs restent clairs quelle que soit la direction du soleil extérieur. */}
      <directionalLight position={[14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <directionalLight position={[-14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <Room id={b.id} mood={mood}>
        <Theme mood={mood} />
      </Room>
      <StaticBatch>
        {stationsFor(b.id).map((station) => (
          <Exhibit key={station.id} id={b.id} station={station} mood={mood} />
        ))}
      </StaticBatch>
    </>
  );
}
