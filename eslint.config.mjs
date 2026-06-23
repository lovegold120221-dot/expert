import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy .js files — pre-existing lint warnings are expected (AGENTS.md).
    "components/**",
    // Global skill pack — not app code.
    ".agents/**",
    ".opencode/**",
    // Generated WASM glue code + Electron wrapper.
    "public/mediapipe/**",
    "electron/**",
  ]),
]);

export default eslintConfig;
