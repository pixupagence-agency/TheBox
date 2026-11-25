// Tableau tactique : photos des joueurs (compression, détourage automatique du fond).

// Suppression automatique du fond (détourage automatique par flood-fill depuis les bords)
export const autoRemoveBackgroundFromCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);

  // Échantillons de couleur de fond sur les coins et le bord supérieur
  const sampleCoords = [
    [0, 0], [1, 0], [2, 0],
    [width - 1, 0], [width - 2, 0], [width - 3, 0],
    [0, 1], [width - 1, 1],
    [0, 2], [width - 1, 2],
    [Math.floor(width / 2), 0]
  ];

  type ColorSample = { r: number; g: number; b: number; a: number };
  const samples: ColorSample[] = [];

  for (const [sx, sy] of sampleCoords) {
    const sIdx = (sy * width + sx) * 4;
    const sa = data[sIdx + 3];
    if (sa > 20) {
      samples.push({ r: data[sIdx], g: data[sIdx + 1], b: data[sIdx + 2], a: sa });
    }
  }

  // Si tous les points de la bordure supérieure sont déjà transparents, l'image est déjà détourée
  if (samples.length === 0) return;

  const avgR = samples.reduce((acc, s) => acc + s.r, 0) / samples.length;
  const avgG = samples.reduce((acc, s) => acc + s.g, 0) / samples.length;
  const avgB = samples.reduce((acc, s) => acc + s.b, 0) / samples.length;
  const isCornerNeutral = Math.abs(avgR - avgG) < 25 && Math.abs(avgG - avgB) < 25;

  const isBgPixel = (r: number, g: number, b: number, a: number): boolean => {
    if (a < 25) return true; // Déjà transparent

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const isNeutral = (maxC - minC) < 35;

    // 1. Fond blanc, gris clair ou studio neutre
    if (isNeutral && minC > 130) return true;

    // 2. Si le fond du coin est neutre et que ce pixel est également neutre
    if (isCornerNeutral && isNeutral && Math.abs(maxC - Math.max(avgR, avgG, avgB)) < 60) {
      return true;
    }

    // 3. Proximité avec l'un des échantillons de bordure (distance Manhattan)
    for (const s of samples) {
      const diff = Math.abs(r - s.r) + Math.abs(g - s.g) + Math.abs(b - s.b);
      if (diff < 58) return true;
    }

    return false;
  };

  // File BFS débutant sur les bords extérieurs
  const queueX: number[] = [];
  const queueY: number[] = [];

  // Ligne supérieure complète
  for (let x = 0; x < width; x++) {
    queueX.push(x);
    queueY.push(0);
  }

  // Bords gauche et droit jusqu'à 80% de la hauteur
  const maxSideY = Math.floor(height * 0.8);
  for (let y = 1; y < maxSideY; y++) {
    queueX.push(0);
    queueY.push(y);
    queueX.push(width - 1);
    queueY.push(y);
  }

  let qHead = 0;
  while (qHead < queueX.length) {
    const px = queueX[qHead];
    const py = queueY[qHead];
    qHead++;

    const pIdx = py * width + px;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;

    const dIdx = pIdx * 4;
    const r = data[dIdx];
    const g = data[dIdx + 1];
    const b = data[dIdx + 2];
    const a = data[dIdx + 3];

    if (isBgPixel(r, g, b, a)) {
      // Rendre transparent
      data[dIdx + 3] = 0;

      // Étendre aux 4 voisins
      if (px > 0 && !visited[pIdx - 1]) {
        queueX.push(px - 1);
        queueY.push(py);
      }
      if (px < width - 1 && !visited[pIdx + 1]) {
        queueX.push(px + 1);
        queueY.push(py);
      }
      if (py > 0 && !visited[pIdx - width]) {
        queueX.push(px);
        queueY.push(py - 1);
      }
      if (py < height - 1 && !visited[pIdx + width]) {
        queueX.push(px);
        queueY.push(py + 1);
      }
    }
  }

  // Nettoyage des halos périphériques sur les contours
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pIdx = y * width + x;
      const dIdx = pIdx * 4;
      if (data[dIdx + 3] > 0) {
        const topAlpha = data[((y - 1) * width + x) * 4 + 3];
        const botAlpha = data[((y + 1) * width + x) * 4 + 3];
        const leftAlpha = data[(y * width + x - 1) * 4 + 3];
        const rightAlpha = data[(y * width + x + 1) * 4 + 3];

        if (topAlpha === 0 || botAlpha === 0 || leftAlpha === 0 || rightAlpha === 0) {
          const r = data[dIdx];
          const g = data[dIdx + 1];
          const b = data[dIdx + 2];
          const minC = Math.min(r, g, b);
          const maxC = Math.max(r, g, b);
          if ((maxC - minC) < 32 && minC > 135) {
            data[dIdx + 3] = 0;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

// Traitement automatique d'une data URL pour supprimer le fond de base
export const autoRemoveBackgroundFromDataUrl = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!src || src.startsWith("data:image/svg")) return resolve(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(src);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      autoRemoveBackgroundFromCanvas(canvas);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

export const compressImage = (file: File, maxWidth = 180, maxHeight = 180, _quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve("");
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(src);
          return;
        }

        // Nettoyer complètement le canvas pour garantir la transparence
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // SUPPRESSION AUTOMATIQUE DU FOND DE BASE :
        autoRemoveBackgroundFromCanvas(canvas);

        // Export systématique en PNG avec transparence intégrale
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};
