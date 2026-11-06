import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

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

    const frames: string[] = body.frames;
    const delayMs = typeof body.delay === "number" && body.delay >= 200 && body.delay <= 5000 ? body.delay : 800;
    const targetWidth = typeof body.width === "number" && body.width >= 320 && body.width <= 1280 ? Math.round(body.width) : 720;

    // Convert each base64 dataUrl into a resized PNG buffer
    const buffers: Buffer[] = [];
    let frameHeight = 0;

    for (const frameData of frames) {
      if (typeof frameData !== "string" || !frameData.startsWith("data:image/")) {
        continue;
      }
      const commaIdx = frameData.indexOf(",");
      if (commaIdx === -1) continue;

      const rawBuffer = Buffer.from(frameData.slice(commaIdx + 1), "base64");
      // Resize to standard width to ensure uniform canvas size and reasonable payload size
      const resized = await sharp(rawBuffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .png()
        .toBuffer();

      const meta = await sharp(resized).metadata();
      if (!frameHeight && meta.height) {
        frameHeight = meta.height;
      }
      buffers.push(resized);
    }

    if (buffers.length === 0 || frameHeight === 0) {
      return NextResponse.json({ error: "Impossible de traiter les étapes de l'animation." }, { status: 400 });
    }

    // Build vertical collage of all frames for sharp multi-page animated GIF
    const verticalHeight = frameHeight * buffers.length;
    const compositeInput = buffers.map((buf, idx) => ({
      input: buf,
      top: idx * frameHeight,
      left: 0,
    }));

    const verticalStrip = await sharp({
      create: {
        width: targetWidth,
        height: verticalHeight,
        channels: 4,
        background: { r: 9, g: 13, b: 20, alpha: 1 },
      },
    })
      .composite(compositeInput)
      .png()
      .toBuffer();

    // Sharp animated GIF generation with uniform frame delays
    const delays = buffers.map(() => delayMs);
    const gifBuffer = await sharp(verticalStrip, { pageHeight: frameHeight } as any)
      .gif({
        delay: delays,
        loop: 0, // Infinite loop
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
