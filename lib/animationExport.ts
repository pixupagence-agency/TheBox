// Calcule le déroulé d'une animation exportée (GIF, vidéo) : le terrain anime les joueurs par transition CSS,
// un export doit donc produire lui-même les positions intermédiaires entre deux étapes.

const START_HOLD_MS = 500;
const MIN_END_HOLD_MS = 800;

const GIF_FRAME_MS = 50;
const GIF_MAX_FRAMES = 64; // Environ 3,5 Mo envoyés au serveur : en dessous de la limite de 4,5 Mo par requête de Vercel

export const clampStepDuration = (speed?: number): number => Math.max(300, Math.min(2500, speed || 1000));

const getEndHoldMs = (stepMs: number): number => Math.max(MIN_END_HOLD_MS, stepMs);

// Même allure que la transition "ease-in-out" des joueurs sur le terrain
const easeInOut = (t: number): number => t * t * (3 - 2 * t);

const getFrameTokens = (frame: any): any[] => (Array.isArray(frame) ? frame : frame?.players || []);

// Position 1.25 = 25 % du trajet entre la 2e et la 3e étape
export const interpolateFrameTokens = (keyframes: any[], position: number): any[] => {
  const fromIdx = Math.max(0, Math.min(keyframes.length - 1, Math.floor(position)));
  const fromTokens = getFrameTokens(keyframes[fromIdx]);
  const t = position - fromIdx;
  if (t <= 0 || fromIdx >= keyframes.length - 1) return fromTokens;

  const toById = new Map(getFrameTokens(keyframes[fromIdx + 1]).map((token: any) => [token.id, token]));
  const eased = easeInOut(t);
  return fromTokens.map((token: any) => {
    const target = toById.get(token.id);
    if (!target) return token;
    return {
      ...token,
      x: token.x + (target.x - token.x) * eased,
      y: token.y + (target.y - token.y) * eased,
    };
  });
};

export const getAnimationDuration = (stepCount: number, stepMs: number): number =>
  START_HOLD_MS + Math.max(0, stepCount - 1) * stepMs + getEndHoldMs(stepMs);

// Position dans l'animation après `elapsedMs` : pause, déplacements successifs, pause finale
export const getPositionAtTime = (elapsedMs: number, stepCount: number, stepMs: number): number => {
  const lastStep = Math.max(0, stepCount - 1);
  return Math.max(0, Math.min(lastStep, (elapsedMs - START_HOLD_MS) / stepMs));
};

// Images du GIF : une seule image par pause (avec un délai long), une cadence régulière pendant les déplacements
export const buildGifTimeline = (stepCount: number, stepMs: number): { positions: number[]; delays: number[] } => {
  const lastStep = Math.max(0, stepCount - 1);
  if (lastStep === 0) return { positions: [0], delays: [getEndHoldMs(stepMs)] };

  const moveMs = lastStep * stepMs;
  const frameMs = Math.max(GIF_FRAME_MS, Math.ceil(moveMs / (GIF_MAX_FRAMES - 2) / 10) * 10);
  const framesPerStep = Math.max(2, Math.round(stepMs / frameMs));
  const delay = Math.round(stepMs / framesPerStep / 10) * 10; // le format GIF compte en centièmes de seconde

  const positions: number[] = [0];
  const delays: number[] = [START_HOLD_MS];
  for (let step = 0; step < lastStep; step++) {
    for (let i = 1; i <= framesPerStep; i++) {
      positions.push(step + i / framesPerStep);
      delays.push(delay);
    }
  }
  delays[delays.length - 1] = getEndHoldMs(stepMs);
  return { positions, delays };
};
