import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Politique de sécurité du contenu (CSP) : sources autorisées pour les scripts, connexions, cadres…
 * Sans nonce (pages statiques) : 'unsafe-inline' reste nécessaire aux scripts de Next ; la politique
 * limite surtout l'origine des scripts chargés et les serveurs contactés (exfiltration).
 *
 * En mode SIGNALEMENT (Content-Security-Policy-Report-Only) : rien n'est bloqué, le navigateur envoie
 * ce qu'il aurait bloqué à /api/csp-report (journaux Vercel). Passer en blocage avec CSP_ENFORCE=true
 * une fois les rapports vérifiés.
 */
const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []),
    'https://apis.google.com', // connexion Google (Firebase Auth)
    'https://www.google.com', 'https://www.gstatic.com', // reCAPTCHA (App Check)
    'https://www.youtube.com', 'https://player.vimeo.com', // lecteurs vidéo du module Recording
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  // Images : logos en data:, captures en blob:, médias du guide sur n'importe quel site https
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'media-src': ["'self'", 'blob:', 'data:', 'https:'],
  'connect-src': [
    "'self'",
    'https://*.googleapis.com', // Firestore, Auth, App Check, installations
    'https://www.google.com', // reCAPTCHA
    ...(isDev ? ['http://127.0.0.1:*', 'ws://127.0.0.1:*', 'http://localhost:*', 'ws://localhost:*'] : []),
  ],
  'frame-src': [
    "'self'",
    'https://thebox-tactique.firebaseapp.com', // connexion Google (Firebase Auth)
    'https://www.google.com', 'https://recaptcha.google.com', // reCAPTCHA
    'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com',
  ],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'report-uri': ['/api/csp-report'],
  'report-to': ['csp'],
};

const cspValue = Object.entries(CSP_DIRECTIVES)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');
const cspHeader = process.env.CSP_ENFORCE === 'true' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

const nextConfig: NextConfig = {
  // Serveur des tests e2e : dossier de compilation séparé, pour ne pas perturber le `next dev` du développeur
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // Micro autorisé pour l'application elle-même : dictée vocale des notes (TacticsBoard)
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: cspHeader,
            value: cspValue,
          },
          {
            // Destination des rapports CSP (directive report-to)
            key: 'Reporting-Endpoints',
            value: 'csp="/api/csp-report"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
