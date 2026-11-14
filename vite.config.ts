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
        // L'accueil ne charge que React et l'interface ; la scène (Three, R3F, drei) arrive
        // avec le chunk World, chargé à la demande, dans des fichiers séparés mis en cache.
        manualChunks(id) {
          // L'assistant de chargement de Vite doit rester avec ce que l'accueil charge déjà.
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'react';
          if (!id.includes('node_modules')) return;
          if (/node_modules\/three\//.test(id)) return 'three';
          if (/@react-three\/drei|three-stdlib|troika|@babel\/runtime/.test(id)) return 'drei';
          if (/@react-three\/fiber|its-fine|zustand|react-use-measure|suspend-react/.test(id)) return 'r3f';
          if (/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//.test(id)) return 'react';
        },
      },
    },
    // Three.js seul pèse environ 720 ko minifié (190 ko gzip) ; il est isolé et mis en cache.
    chunkSizeWarningLimit: 800,
  },
}));
