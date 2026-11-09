import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_FRAMES = 150;
const DEFAULT_DELAY_MS = 100;

export async function POST(req: NextRequest) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`gif_${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSeconds || 60) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.frames) || body.frames.length === 0) {
      return NextResponse.json({ error: "Liste d'étapes (frames) requise pour le GIF." }, { status: 400 });
    }

    if (body.frames.length > MAX_FRAMES) {
      return NextResponse.json({ error: "Trop d'images pour un seul GIF." }, { status: 400 });
    }

    const frames: string[] = body.frames;
    const requestedDelays: unknown[] = Array.isArray(body.delays) ? body.delays : [];
    const targetWidth = typeof body.width === "number" && body.width >= 320 && body.width <= 1280 ? Math.round(body.width) : 720;

    // Convert each base64 dataUrl into a resized PNG buffer
    const buffers: Buffer[] = [];
    let frameWidth = 0;
    let frameHeight = 0;

    const delays: number[] = [];

    for (const [frameIdx, frameData] of frames.entries()) {
      if (typeof frameData !== "string" || !frameData.startsWith("data:image/")) {
        continue;
      }
      const commaIdx = frameData.indexOf(",");
      if (commaIdx === -1) continue;

      const rawBuffer = Buffer.from(frameData.slice(commaIdx + 1), "base64");
      // All frames must share the exact size of the first one to be joined into an animation
      const resized = await sharp(rawBuffer)
        .resize(
          frameWidth && frameHeight
            ? { width: frameWidth, height: frameHeight, fit: "contain", background: { r: 9, g: 13, b: 20, alpha: 1 } }
            : { width: targetWidth, withoutEnlargement: true }
        )
        .png()
        .toBuffer();

      if (!frameHeight) {
        const meta = await sharp(resized).metadata();
        frameWidth = meta.width || 0;
        frameHeight = meta.height || 0;
      }
      buffers.push(resized);
      const requestedDelay = requestedDelays[frameIdx];
      delays.push(typeof requestedDelay === "number" && requestedDelay >= 20 && requestedDelay <= 5000 ? requestedDelay : DEFAULT_DELAY_MS);
    }

    if (buffers.length === 0 || frameHeight === 0) {
      return NextResponse.json({ error: "Impossible de traiter les étapes de l'animation." }, { status: 400 });
    }

    // Join the frames into a multi-page animated GIF
    // sharp ne peut assembler qu'à partir de 2 images : une animation à une seule étape reste une image simple
    const gifBuffer = await (buffers.length > 1 ? sharp(buffers, { join: { animated: true } }) : sharp(buffers[0]))
      .gif({
        delay: delays,
        loop: 0, // Infinite loop
        // Ne réécrit que les pixels qui changent vraiment : évite le scintillement du terrain et allège le fichier
        interFrameMaxError: 8,
        effort: 1, // Encodage 4 fois plus rapide pour un fichier à peine plus lourd
      })
      .toBuffer();

    const gifDataUrl = `data:image/gif;base64,${gifBuffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      gifUrl: gifDataUrl,
      size: gifBuffer.length,
      framesCount: buffers.length,
    });
  } catch (error) {
    console.error("Erreur lors de la génération du GIF tactique:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la création du GIF animé." }, { status: 500 });
  }
}
