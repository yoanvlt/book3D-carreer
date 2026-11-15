"""Génère les sons du site (public/sons/*.mp3) par synthèse : aucun enregistrement extérieur.

    python3 scripts/sons.py        (nécessite numpy et ffmpeg)

Les sons sont des créations originales de ce dépôt, placées sous CC0 (voir public/sons/LICENCES.md).
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sons')
rng = np.random.default_rng(7)


def t(seconds):
    return np.arange(int(seconds * RATE)) / RATE


def lowpass(x, cutoff):
    """Filtre passe-bas du premier ordre, appliqué deux fois."""
    a = np.exp(-2 * np.pi * cutoff / RATE)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            y[i] = acc
        x = y
    return x


def envelope(n, attack, release):
    e = np.ones(n)
    a = max(1, int(attack * RATE))
    r = max(1, int(release * RATE))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def chirp(start, end, seconds, harmonics=(1, 0.3)):
    tt = t(seconds)
    freq = np.geomspace(start, end, len(tt))
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    s = sum(a * np.sin(phase * (k + 1)) for k, a in enumerate(harmonics))
    return s * envelope(len(tt), 0.008, seconds * 0.6)


def ambiance(seconds=14.0):
    """Vent doux (bruit filtré, souffle lent) et quelques chants d'oiseaux, en boucle sans couture."""
    n = int(seconds * RATE)
    wind = lowpass(rng.standard_normal(n), 380)
    tt = t(seconds)
    gust = 0.55 + 0.45 * np.sin(2 * np.pi * tt / seconds) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * tt / seconds))
    out = wind / np.max(np.abs(wind)) * gust * 0.32
    for start in (1.2, 1.45, 5.6, 9.1, 9.3, 9.55, 12.2):
        f = rng.uniform(2300, 3600)
        bird = chirp(f, f * rng.uniform(1.15, 1.5), rng.uniform(0.07, 0.13), (1, 0.25, 0.08)) * 0.18
        i = int(start * RATE)
        out[i : i + len(bird)] += bird[: n - i]
    # Raccord de boucle : fondu croisé des 0,5 premières et dernières secondes.
    k = int(0.5 * RATE)
    fade = np.linspace(0, 1, k)
    out[:k] = out[:k] * fade + out[-k:] * (1 - fade)
    return out[:-k]


def pas():
    n = int(0.09 * RATE)
    thump = np.sin(2 * np.pi * 95 * t(0.09)) * envelope(n, 0.002, 0.08) * 0.6
    grit = lowpass(rng.standard_normal(n), 1600) * envelope(n, 0.001, 0.06) * 0.8
    return thump + grit


def clic():
    return chirp(1500, 1250, 0.045, (1, 0.15)) * 0.45


def porte(opening=True):
    seconds = 0.5
    n = int(seconds * RATE)
    noise = rng.standard_normal(n)
    sweep = lowpass(noise, 900) * np.linspace(0.3, 1, n) if opening else lowpass(noise, 700) * np.linspace(1, 0.3, n)
    s = sweep * envelope(n, 0.05, 0.25) * 0.5
    bell = chirp(880 if opening else 660, 880 if opening else 520, 0.35, (1, 0.4, 0.1)) * 0.22
    i = int((0.12 if opening else 0.3) * RATE)
    s[i : i + len(bell)] += bell[: n - i]
    return s


def saut():
    return chirp(330, 620, 0.16, (1, 0.35)) * 0.35


def tampon():
    n = int(0.25 * RATE)
    thump = np.sin(2 * np.pi * 120 * t(0.25)) * envelope(n, 0.002, 0.22) * 0.7
    paper = lowpass(rng.standard_normal(n), 2500) * envelope(n, 0.001, 0.05) * 0.6
    ding = chirp(1046, 1046, 0.25, (1, 0.5, 0.2)) * 0.18
    return thump + paper + ding


def write(name, samples, bitrate='48k'):
    samples = samples / max(1e-9, np.max(np.abs(samples))) * 0.9 if name != 'ambiance' else samples
    pcm = (np.clip(samples, -1, 1) * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(pcm.tobytes())
    target = os.path.join(OUT, f'{name}.mp3')
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', bitrate, target],
        check=True,
    )
    os.unlink(tmp.name)
    print(f'{name}.mp3 : {os.path.getsize(target) // 1024} ko')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    write('ambiance', ambiance(), '40k')
    write('pas', pas())
    write('clic', clic())
    write('porte-ouvre', porte(True))
    write('porte-ferme', porte(False))
    write('saut', saut())
    write('tampon', tampon())
