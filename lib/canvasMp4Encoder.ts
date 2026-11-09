// Encode un canvas en MP4, image par image, avec WebCodecs : contrairement à MediaRecorder, qui capture en temps réel
// et laisse l'encodeur sauter des images, chaque image est conservée avec un horodatage exact.

const H264_CODECS = ["avc1.640028", "avc1.4D4028", "avc1.42E028"]; // High, Main, Baseline (niveau 4.0)
const MAX_ENCODE_QUEUE = 8;
const TIMESCALE_PER_FRAME = 1000;

interface EncodeOptions {
  canvas: HTMLCanvasElement;
  frameCount: number;
  fps: number;
  bitrate: number;
  drawFrame: (frameIndex: number) => void;
  onProgress?: (ratio: number) => void;
  isCancelled?: () => boolean;
}

interface EncodedSample {
  data: Uint8Array;
  isKey: boolean;
}

const pickSupportedConfig = async (width: number, height: number, fps: number, bitrate: number) => {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  for (const codec of H264_CODECS) {
    const config: VideoEncoderConfig = { codec, width, height, bitrate, framerate: fps, avc: { format: "avc" } };
    try {
      const { supported } = await VideoEncoder.isConfigSupported(config);
      if (supported) return config;
    } catch {
      // Essaie le profil suivant
    }
  }
  return null;
};

// Renvoie null si le navigateur ne sait pas encoder (ou si l'export est annulé) : l'appelant garde alors la main
export const encodeCanvasToMp4 = async ({
  canvas,
  frameCount,
  fps,
  bitrate,
  drawFrame,
  onProgress,
  isCancelled,
}: EncodeOptions): Promise<Blob | null> => {
  const config = await pickSupportedConfig(canvas.width, canvas.height, fps, bitrate);
  if (!config) return null;

  const samples: EncodedSample[] = [];
  let avcConfig: Uint8Array | null = null;
  let encoderError: Error | null = null;

  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      samples.push({ data, isKey: chunk.type === "key" });
      const description = metadata?.decoderConfig?.description;
      if (description) {
        avcConfig = ArrayBuffer.isView(description)
          ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength).slice()
          : new Uint8Array(description).slice();
      }
    },
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });
  encoder.configure(config);

  try {
    const frameDurationUs = 1_000_000 / fps;
    for (let i = 0; i < frameCount; i++) {
      if (isCancelled?.()) return null;
      if (encoderError) throw encoderError;

      drawFrame(i);
      const frame = new VideoFrame(canvas, { timestamp: Math.round(i * frameDurationUs), duration: Math.round(frameDurationUs) });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      onProgress?.(i / frameCount);
      // Laisse l'encodeur rattraper son retard et l'interface respirer
      do {
        await new Promise((resolve) => setTimeout(resolve));
      } while (encoder.encodeQueueSize > MAX_ENCODE_QUEUE);
    }
    await encoder.flush();
    if (encoderError) throw encoderError;
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }

  if (!avcConfig || samples.length === 0) throw new Error("L'encodeur vidéo n'a produit aucune image");
  return muxMp4(samples, avcConfig, canvas.width, canvas.height, fps);
};

// --- Assemblage du fichier MP4 ---

const u32 = (value: number): Uint8Array => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
};
const u16 = (value: number): Uint8Array => {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value);
  return out;
};
const ascii = (text: string): Uint8Array => Uint8Array.from(text, (c) => c.charCodeAt(0));
const zeros = (length: number): Uint8Array => new Uint8Array(length);

const concat = (parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const box = (type: string, ...payload: Uint8Array[]): Uint8Array => {
  const body = concat(payload);
  return concat([u32(body.length + 8), ascii(type), body]);
};
const fullBox = (type: string, flags: number, ...payload: Uint8Array[]): Uint8Array => box(type, u32(flags), ...payload);

const IDENTITY_MATRIX = concat([0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32));

const muxMp4 = (samples: EncodedSample[], avcConfig: Uint8Array, width: number, height: number, fps: number): Blob => {
  const timescale = fps * TIMESCALE_PER_FRAME;
  const duration = samples.length * TIMESCALE_PER_FRAME;

  const ftyp = box("ftyp", ascii("isom"), u32(512), ascii("isomiso2avc1mp41"));

  const buildMoov = (mdatPayloadOffset: number): Uint8Array => {
    const avc1 = box(
      "avc1",
      zeros(6),
      u16(1), // data reference index
      zeros(16),
      u16(width),
      u16(height),
      u32(0x00480000), // 72 dpi
      u32(0x00480000),
      u32(0),
      u16(1), // une image par échantillon
      zeros(32),
      u16(0x0018), // profondeur de couleur
      u16(0xffff),
      box("avcC", avcConfig)
    );
    const keyIndexes = samples.flatMap((sample, i) => (sample.isKey ? [i + 1] : []));
    const stbl = box(
      "stbl",
      fullBox("stsd", 0, u32(1), avc1),
      fullBox("stts", 0, u32(1), u32(samples.length), u32(TIMESCALE_PER_FRAME)),
      fullBox("stss", 0, u32(keyIndexes.length), ...keyIndexes.map(u32)),
      fullBox("stsc", 0, u32(1), u32(1), u32(samples.length), u32(1)),
      fullBox("stsz", 0, u32(0), u32(samples.length), ...samples.map((sample) => u32(sample.data.length))),
      fullBox("stco", 0, u32(1), u32(mdatPayloadOffset))
    );
    const minf = box(
      "minf",
      fullBox("vmhd", 1, zeros(8)),
      box("dinf", fullBox("dref", 0, u32(1), fullBox("url ", 1))),
      stbl
    );
    const mdia = box(
      "mdia",
      fullBox("mdhd", 0, u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), u16(0)), // langue : indéterminée
      fullBox("hdlr", 0, u32(0), ascii("vide"), zeros(12), ascii("VideoHandler"), zeros(1)),
      minf
    );
    const tkhd = fullBox(
      "tkhd",
      3, // piste active et présente dans le film
      u32(0),
      u32(0),
      u32(1), // identifiant de piste
      u32(0),
      u32(duration),
      zeros(8),
      zeros(8),
      IDENTITY_MATRIX,
      u32(width * 65536),
      u32(height * 65536)
    );
    const mvhd = fullBox(
      "mvhd",
      0,
      u32(0),
      u32(0),
      u32(timescale),
      u32(duration),
      u32(0x00010000), // vitesse normale
      u16(0x0100), // volume
      zeros(10),
      IDENTITY_MATRIX,
      zeros(24),
      u32(2) // prochain identifiant de piste
    );
    return box("moov", mvhd, box("trak", tkhd, mdia));
  };

  // L'index (moov) précède les données : la vidéo peut démarrer avant d'être entièrement téléchargée
  const moovSize = buildMoov(0).length;
  const mdatHeaderSize = 8;
  const moov = buildMoov(ftyp.length + moovSize + mdatHeaderSize);
  const mdatSize = samples.reduce((total, sample) => total + sample.data.length, mdatHeaderSize);
  const mdatHeader = concat([u32(mdatSize), ascii("mdat")]);

  return new Blob([ftyp, moov, mdatHeader, ...samples.map((sample) => sample.data)] as BlobPart[], { type: "video/mp4" });
};
