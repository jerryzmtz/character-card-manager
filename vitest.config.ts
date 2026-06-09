import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.spec.ts'],
    globals: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@util': new URL('./util', import.meta.url).pathname,
    },
  },
});
