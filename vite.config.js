import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// User/org pages (twin-pathways.github.io) are served from the domain root.
export default defineConfig({
  plugins: [react()],
});
