import { loadingDone } from '../loading';
import { Component, type ReactNode } from 'react';
import { showPanel } from '../state';

/** Remplace la scène 3D par un message si WebGL ne démarre pas. */
export default class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    // La 3D n'a pas démarré : la page de chargement laisse place au message et à la version texte.
    loadingDone();
    return (
      <div className='webgl-fallback'>
        <strong>La 3D n’a pas pu démarrer sur ce navigateur.</strong>
        <p>Les six lieux restent accessibles depuis le plan et dans la version texte.</p>
        <div className='dialog-actions'>
          <button className='button-secondary' onClick={() => showPanel('map')}>
            Ouvrir le plan
          </button>
          <a className='button-primary' href='?lecture'>
            Version texte
          </a>
        </div>
      </div>
    );
  }
}
