import '@fontsource-variable/bricolage-grotesque';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cssVariables } from './design/tokens';
import './styles/index.css';

const tokens = document.createElement('style');
tokens.textContent = cssVariables();
document.head.prepend(tokens);

// Les panneaux 3D sont dessinés sur canvas : la police doit être prête avant le premier rendu.
Promise.all(
  ['700 16px "Bricolage Grotesque Variable"', '500 16px "Bricolage Grotesque Variable"'].map((font) =>
    document.fonts.load(font).catch(() => null),
  ),
).finally(() =>
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
