/**
 * Page de chargement (index.html) : progression par étapes réelles, puis fondu quand la première
 * image de la ville est rendue. Chaque étape pose une marque de performance (`careerverse:<étape>`),
 * relevée par scripts/mesure-chargement.mjs.
 */
const STEPS = {
  code: [0.12, 'Chargement du code'],
  polices: [0.2, 'Chargement des polices'],
  scene: [0.3, 'Préparation de la scène'],
  geometrie: [0.85, 'Construction de la ville'],
  shaders: [0.95, 'Préparation des matières'],
  image: [1, 'Première image'],
} as const;
export type LoadingStep = keyof typeof STEPS;

let current = 0;
/** Avance la barre : `fraction` de l'étape (0 à 1) pour la construction, qui se fait par tranches. */
export function loadingStep(step: LoadingStep, fraction = 1) {
  const keys = Object.keys(STEPS) as LoadingStep[];
  const index = keys.indexOf(step);
  const start = index > 0 ? STEPS[keys[index - 1]][0] : 0;
  const value = start + (STEPS[step][0] - start) * fraction;
  if (value < current) return;
  current = value;
  if (fraction >= 1) performance.mark(`careerverse:${step}`);
  const fill = document.getElementById('loader-fill');
  if (fill) fill.style.transform = `scaleX(${Math.max(0.04, value)})`;
  const label = document.getElementById('loader-step');
  if (label) label.textContent = STEPS[step][1];
}

/** Fondu de l'écran de chargement, puis retrait du DOM. */
export function loadingDone() {
  const loader = document.getElementById('loader');
  if (!loader || loader.classList.contains('loader-done')) return;
  performance.mark('careerverse:pret');
  loader.classList.add('loader-done');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  setTimeout(() => loader.remove(), 1500);
}
