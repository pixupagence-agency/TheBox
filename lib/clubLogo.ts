// Logo du club : redimensionné dans le navigateur en PNG (transparence conservée)
// pour rester léger dans le profil (Firestore limite le champ à 300 000 caractères).

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 280_000;

export const CLUB_LOGO_ACCEPT = ACCEPTED.join(",");

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });

/** Convertit le fichier choisi en data URL PNG carrée-max (320 px, puis plus petite si trop lourde). */
export async function prepareClubLogo(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Format non pris en charge : PNG, JPG, WebP ou SVG.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Image trop lourde (5 Mo maximum).");

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const srcW = img.naturalWidth || 512;
    const srcH = img.naturalHeight || 512;
    for (const max of [320, 256, 192, 128]) {
      const scale = Math.min(1, max / Math.max(srcW, srcH));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(srcW * scale));
      canvas.height = Math.max(1, Math.round(srcH * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas non supporté");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }
    throw new Error("Logo trop détaillé : essayez une image plus simple.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
