/**
 * Visite guidée (déplacée de state.ts en V8). Ré-exportée par state.ts.
 */
import { buildings } from './world/config';
import { discover, endPresentation, getState, presentation, setState } from './state';

/**
 * Visite guidée depuis l'accueil : les six lieux s'enchaînent, chacun avec sa présentation complète
 * (quatre vues) et sa fiche. Durée totale : 6 × (8 + 0,8) s ≈ 53 s. On la quitte à tout moment ;
 * un clic ou Espace passe au lieu suivant.
 */
export const TOUR = { perPlace: 8, order: buildings.map((b) => b.id) };
export function tourStep() {
  const id = TOUR.order[getState().tour ?? 0];
  discover(id, true);
  presentation.full = true;
  presentation.duration = TOUR.perPlace;
}
export function startTour() {
  const state = getState();
  if (state.phase !== 'home' || state.tour !== null) return;
  setState({ tour: 0, map: false, help: false, detail: null, reading: null });
  tourStep();
}
export function stopTour() {
  if (getState().tour === null) return;
  setState({ tour: null });
  endPresentation();
}
