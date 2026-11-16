/**
 * Page de chargement (index.html) : progression par étapes réelles, puis fondu quand la première
 * image de la ville est rendue. Chaque étape pose une marque de performance (`careerverse:<étape>`),
 * relevée par scripts/mesure-chargement.mjs.
 */
const STEPS = {
  code: [0.08, 'Code'],
  polices: [0.14, 'Polices'],
  modeles: [0.3, 'Modèles'],
  monde: [0.55, 'Monde'],
  lumiere: [0.9, 'Lumière précalculée'],
  image: [1, 'Première image'],
} as const;
export type LoadingStep = keyof typeof STEPS;

let current = 0;
/**
 * Captures (`?debug=1&chargement=<étape>`) : la page de chargement est figée à cette étape (même
 * affichage qu'en vrai) et ne se retire pas.
 */
const frozen = (() => {
  const q = new URLSearchParams(window.location.search);
  const step = q.get('chargement');
  return q.has('debug') && step && step in STEPS ? (step as LoadingStep) : null;
})();
/**
 * Avance le chargement : `fraction` de l'étape (0 à 1). Met à jour le pourcentage, l'état des
 * étapes et les traits de l'île dessinés (allumés au-delà de leur seuil).
 */
export function loadingStep(step: LoadingStep, fraction = 1) {
  if (frozen && step !== frozen) {
    if (current === 0) show(frozen, 0.5);
    return;
  }
  show(step, fraction);
}

function show(step: LoadingStep, fraction: number) {
  const keys = Object.keys(STEPS) as LoadingStep[];
  const index = keys.indexOf(step);
  const start = index > 0 ? STEPS[keys[index - 1]][0] : 0;
  const value = start + (STEPS[step][0] - start) * Math.max(0, Math.min(1, fraction));
  if (value < current) return;
  current = value;
  if (fraction >= 1) performance.mark(`careerverse:${step}`);
  const percent = document.getElementById('loader-percent');
  if (percent) percent.textContent = String(Math.round(value * 100));
  document.querySelectorAll<HTMLElement>('#loader-steps li').forEach((li) => {
    const i = keys.indexOf(li.dataset.step as LoadingStep);
    const done = i < index || (i === index && fraction >= 1);
    li.classList.toggle('done', done);
    li.classList.toggle('active', !done && i === (fraction >= 1 ? index + 1 : index));
  });
  document.querySelectorAll<SVGElement>('#loader .trait').forEach((path) => {
    if (Number(path.dataset.at) <= value + 1e-6) path.classList.add('on');
  });
}

/** Affichage minimal de la page (évite le flash), mesuré depuis le début de la navigation. */
const MINIMUM = 600;

/** Dévoilement de l'accueil : fondu de la page de chargement, puis retrait du DOM. */
export function loadingDone() {
  if (frozen) return;
  const loader = document.getElementById('loader');
  if (!loader || loader.classList.contains('loader-done')) return;
  performance.mark('careerverse:pret');
  loadingStep('image');
  const reveal = () => {
    loader.classList.add('loader-done');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    setTimeout(() => loader.remove(), 1500);
  };
  const wait = MINIMUM - performance.now();
  if (wait > 0) setTimeout(reveal, wait);
  else reveal();
}
