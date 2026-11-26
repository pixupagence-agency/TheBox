import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Configuration ESLint « flat » de Next 16 (remplace l'ancien .eslintrc.json)
export default defineConfig([
  ...nextVitals,
  {
    // Nouvelles règles React Compiler (eslint-plugin-react-hooks 7) : signalées en avertissement le
    // temps de corriger le code existant (TacticsBoard, Convocations, Live…), à repasser en erreur ensuite.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    // Photos de joueurs, logos de club, QR codes et médias du guide : images en mémoire (data:, blob:)
    // ou saisies par le coach, souvent capturées par html-to-image pour les exports. next/image
    // n'optimise pas ces sources et gênerait les captures : <img> est voulu ici.
    files: [
      "components/tactics/**",
      "components/live/**",
      "components/GuideMediaViewer.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "backups/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "public/**",
    "scratch/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
