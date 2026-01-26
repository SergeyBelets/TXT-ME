import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: [
          'src/main.jsx',
          'src/test/**',
          'src/**/*.test.{js,jsx}',
          'src/**/*.spec.{js,jsx}',
        ],
      },
    },
  })
);
