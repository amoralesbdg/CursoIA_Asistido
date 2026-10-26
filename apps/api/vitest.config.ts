import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test/setup-env.ts'],
    include: ['src/**/*.test.ts'],
  },
});
