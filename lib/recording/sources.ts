// Module Recording : reconnaissance des liens vidéo (YouTube, Vimeo, Veo).
import type { VideoSource } from "./types";

export type LinkParseResult =
  | { ok: true; source: Extract<VideoSource, { kind: "youtube" | "vimeo" }>; thumbnail?: string }
  | { ok: false; reason: string };

export function parseVideoLink(raw: string): LinkParseResult {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Collez un lien YouTube ou Vimeo." };
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return { ok: false, reason: "Ce lien n'est pas valide." };
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    let id = "";
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v") || "";
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m ? m[1] : "";
    }
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return { ok: false, reason: "Impossible de trouver la vidéo dans ce lien YouTube." };
    return {
      ok: true,
      source: { kind: "youtube", ref: id, url: `https://www.youtube.com/watch?v=${id}` },
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:\/video)?\/(\d{5,12})(?:\/([0-9a-f]{6,}))?/);
    if (!m) return { ok: false, reason: "Impossible de trouver la vidéo dans ce lien Vimeo." };
    // Les vidéos non répertoriées ont un code de confidentialité (h=…) à conserver
    const hash = m[2] || url.searchParams.get("h") || "";
    const ref = hash ? `${m[1]}:${hash}` : m[1];
    return { ok: true, source: { kind: "vimeo", ref, url: `https://vimeo.com/${m[1]}${hash ? `/${hash}` : ""}` } };
  }

  if (host.endsWith("veo.co") || host.endsWith("veo.com")) {
    return {
      ok: false,
      reason: "Les vidéos Veo ne peuvent pas être lues ici : téléchargez le clip depuis Veo (Télécharger), puis importez le fichier.",
    };
  }

  return { ok: false, reason: "Lien non reconnu : YouTube et Vimeo sont acceptés (ou importez un fichier vidéo)." };
}

export const formatTime = (t: number, withFrames = false, fps = 25) => {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const base = `${m}:${String(s).padStart(2, "0")}`;
  if (!withFrames) return base;
  const f = Math.floor((t % 1) * fps);
  return `${base}.${String(f).padStart(2, "0")}`;
};
