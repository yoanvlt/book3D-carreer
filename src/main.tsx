import './theme';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/instrument-serif';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './theme.css';

const fonts = [
  '600 16px "Bricolage Grotesque Variable"',
  '16px "Instrument Serif"',
  '600 16px "JetBrains Mono Variable"',
  '16px "DM Sans Variable"',
];
// Les panneaux 3D sont dessinés sur canvas : les polices doivent être prêtes avant le premier rendu.
Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => null))).finally(() =>
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
