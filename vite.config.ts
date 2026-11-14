import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { loadContent } from './src/content/parse';

const VIRTUAL = 'virtual:careerverse-content';

/**
 * Lit src/content/ au build, le valide (zod) et l'expose au site sous forme de JSON.
 * Une erreur de contenu arrête le build avec le fichier et la ligne en cause.
 * Les brouillons ne sont visibles qu'en développement, ou avec CAREERVERSE_BROUILLONS=1.
 * CAREERVERSE_CONTENU=<dossier> remplace src/content/ (contrôles visuels avec un contenu d'essai).
 */
function content(drafts: boolean): Plugin {
  const root = resolve(process.env.CAREERVERSE_CONTENU ?? 'src/content');
  const publicDir = resolve('public');
  return {
    name: 'careerverse-content',
    resolveId: (id) => (id === VIRTUAL ? '\0' + VIRTUAL : null),
    load(id) {
      if (id !== '\0' + VIRTUAL) return null;
      this.addWatchFile(root);
      const data = loadContent(root, { drafts, publicDir });
      return `export default ${JSON.stringify(data)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(root) || !file.endsWith('.md')) return;
      const module = server.moduleGraph.getModuleById('\0' + VIRTUAL);
      if (module) server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), content(command === 'serve' || process.env.CAREERVERSE_BROUILLONS === '1')],
  base: '/book3D-carreer/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom', '@react-three/fiber'],
        },
      },
    },
  },
}));
