import { lazy, Suspense } from 'react';
import { isBusy, setState, useGame } from './state';
import BuildingPresentation from './ui/BuildingPresentation';
import Debug, { debugEnabled } from './ui/Debug';
import Dialog from './ui/Dialog';
import ExploreHud from './ui/ExploreHud';
import Header from './ui/Header';
import HelpDialog from './ui/HelpDialog';
import Hero from './ui/Hero';
import InteriorHUD from './ui/InteriorHUD';
import Map from './ui/Map';
import Joystick from './ui/Joystick';
import PlaceDialog from './ui/PlaceDialog';
import ReadableVersion from './ui/ReadableVersion';
import SceneBoundary from './ui/SceneBoundary';
import StatusLayer from './ui/StatusLayer';

const World = lazy(() => import('./scene/World'));
const readable = new URLSearchParams(window.location.search).has('lecture');

export default function App() {
  const state = useGame();
  if (readable) return <ReadableVersion />;
  const home = state.phase === 'home';
  const busy = isBusy(state);
  return (
    <main className={`app ${home ? 'is-home' : 'is-exploring'} ${busy ? 'is-transitioning' : ''}`}>
      <div className='world' aria-label='Ville 3D interactive'>
        <SceneBoundary>
          <Suspense fallback={null}>
            <World />
          </Suspense>
        </SceneBoundary>
      </div>
      <Header />
      <Hero />
      <ExploreHud />
      <Joystick />
      <BuildingPresentation />
      <InteriorHUD />
      <div id='scene-curtain' aria-hidden='true' />
      <StatusLayer />
      {state.map && (
        <Dialog title='Plan de la ville' close={() => setState({ map: false })} className='map-dialog'>
          <Map />
        </Dialog>
      )}
      <PlaceDialog />
      <HelpDialog />
      {debugEnabled && <Debug />}
    </main>
  );
}
