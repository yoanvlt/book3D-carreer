/**
 * Son du site (Web Audio). Coupé par défaut ; le choix est mémorisé dans le navigateur.
 * Rien n'est téléchargé tant que le son n'a pas été activé.
 */
import { useSyncExternalStore } from 'react';

export type SoundName = 'pas' | 'clic' | 'porte-ouvre' | 'porte-ferme' | 'saut' | 'tampon';
const KEY = 'careerverse.son';
const listeners = new Set<() => void>();
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();
let context: AudioContext | null = null;
let master: GainNode | null = null;
let ambience: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function load(name: string) {
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = fetch(`${import.meta.env.BASE_URL}sons/${name}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((data) => context!.decodeAudioData(data))
      .catch(() => null);
    buffers.set(name, buffer);
  }
  return buffer;
}

async function startAmbience() {
  if (!context || !master || ambience) return;
  const buffer = await load('ambiance');
  if (!buffer || !enabled || ambience) return;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 1.5);
  source.connect(gain).connect(master);
  source.start();
  ambience = { source, gain };
}
function stopAmbience() {
  if (!ambience || !context) return;
  const { source, gain } = ambience;
  gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
  source.stop(context.currentTime + 0.45);
  ambience = null;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* navigation privée : le choix vaut pour la session */
  }
  if (on) {
    // Appelé depuis un clic : le navigateur autorise alors la création du contexte audio.
    context ??= new AudioContext();
    if (!master) {
      master = context.createGain();
      master.gain.value = 0.8;
      master.connect(context.destination);
    }
    void context.resume();
    void startAmbience();
    for (const name of ['pas', 'clic', 'porte-ouvre', 'porte-ferme', 'saut', 'tampon']) void load(name);
  } else stopAmbience();
  listeners.forEach((fn) => fn());
}

/** Joue un son court ; sans effet si le son est coupé. */
export function play(name: SoundName, { rate = 1, volume = 1 } = {}) {
  if (!enabled || !context || !master || context.state !== 'running') return;
  void load(name).then((buffer) => {
    if (!buffer || !context || !master) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    source.connect(gain).connect(master);
    source.start();
  });
}

/** Le son reprend après un rechargement si le visiteur l'avait activé, au premier geste. */
if (typeof window !== 'undefined') {
  const resume = () => {
    if (enabled && !context) setSound(true);
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) void context.suspend();
    else if (enabled) void context.resume();
  });
  // Clic d'interface sur tous les boutons.
  document.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('button,[role="button"],a'))
      play('clic', { volume: 0.6 });
  });
}

export function useSound() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => enabled,
  );
}
