import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/book3D-carreer/',
  plugins: [react()],
  base: '/book3D-carreer/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom', '@react-three/fiber']
        }
      }
    }
  }
});
