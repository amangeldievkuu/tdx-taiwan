import { type ViteUserConfig, defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

const config: ViteUserConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // TDX may answer 429 with Retry-After up to 30 s; three retries can take ~90 s.
      testTimeout: 150_000,
    },
  }),
);

// mergeConfig concatenates arrays, so replace the test selection instead of merging it.
// The live tests import src/ (via the shared aliases) and do not need a dist/ build.
config.test = {
  ...config.test,
  include: ['tests/integration/**/*.test.ts'],
  exclude: ['node_modules/**'],
  globalSetup: [],
};

export default config;
