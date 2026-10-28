/**
 * @file process_handball_avatars.js
 * @description Script de post-traitement et de génération des avatars des joueurs de handball.
 * 
 * Pipeline de traitement :
 * 1. Extraction des pixels bruts RGBA depuis les images sources.
 * 2. Inpainting ciblé (suppression d'artefacts de sélection/lasso sur les cheveux).
 * 3. Segmentation du fond (chroma-key bleu et fond neutre) via un parcours en largeur (BFS flood-fill).
 * 4. Défrangeage des bordures (de-fringing) pour éliminer les halos résiduels sur le contour du personnage.
 * 5. Analyse en composantes connexes (CCA) depuis le centre pour supprimer les artefacts flottants isolés.
 * 6. Normalisation et redimensionnement au format 256x256 avec transparence.
 * 7. Génération des variantes maillots des gardiens de but par recoloration basée sur la luminance.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// --- Chemins des images sources et du dossier de destination ---
const imgRed = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793050933221.png';
const imgGreen = 'C:/Users/denis/.gemini/antigravity-ide/brain/079223df-879e-4cad-bca3-b9c9e600d293/.user_uploaded/media_1793050933284.png';
const outputDir = path.join(__dirname, '../public/images/avatars');

// Création récursive du dossier de sortie s'il n'existe pas encore
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Traite une image de joueur : détourage, nettoyage des bordures, filtrage du bruit et export 256x256.
 * 
 * @param {string} inputPath - Chemin absolu du fichier image source.
 * @param {string} outputFile - Nom du fichier de sortie (ex: 'handball_opponent_red.png').
 * @param {boolean} isRedPlayer - Indique s'il s'agit du joueur rouge (nécessite une correction spécifique au niveau des cheveux).
 */
async function processFile(inputPath, outputFile, isRedPlayer) {
  // 1. Décodage de l'image source en mémoire tampon brute (raw buffer)
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const width = info.width, height = info.height, total = width * height, channels = info.channels;
  
  // Création d'un tampon RGBA uniforme (4 canaux) initialisé avec alpha opaque (255)
  const rgba = Buffer.alloc(total * 4);
  for (let i = 0; i < total; i++) {
    rgba[i * 4] = data[i * channels];         // Canal Rouge
    rgba[i * 4 + 1] = data[i * channels + 1]; // Canal Vert
    rgba[i * 4 + 2] = data[i * channels + 2]; // Canal Bleu
    rgba[i * 4 + 3] = 255;                    // Canal Alpha (opaque)
  }

  // 2. Inpainting ciblé pour le joueur rouge :
  // Réparation de la ligne horizontale de sélection (marquee/lasso) située à y=44 dans la chevelure
  // par interpolation des pixels adjacents du haut (y=43) et du bas (y=45).
  if (isRedPlayer) {
    const y = 44;
    for (let x = 0; x < width; x++) {
      const idxAbove = ((y - 1) * width + x) * 4;
      const idxBelow = ((y + 1) * width + x) * 4;
      const rA = rgba[idxAbove], gA = rgba[idxAbove + 1], bA = rgba[idxAbove + 2];
      const rB = rgba[idxBelow], gB = rgba[idxBelow + 1], bB = rgba[idxBelow + 2];
      
      // Vérification que les pixels du dessus et du dessous correspondent bien à la couleur des cheveux (dominance rouge/châtain)
      if (rA > 110 && (rA - bA) > 25 && rB > 110 && (rB - bB) > 25) {
        const curIdx = (y * width + x) * 4;
        rgba[curIdx] = Math.round((rA + rB) / 2);
        rgba[curIdx + 1] = Math.round((gA + gB) / 2);
        rgba[curIdx + 2] = Math.round((bA + bB) / 2);
      }
    }
  }

  /**
   * Détermine si un pixel donné appartient à la couleur de fond (bleu d'incrustation ou damier/gris neutre).
   * 
   * @param {number} r - Composante rouge (0-255).
   * @param {number} g - Composante verte (0-255).
   * @param {number} b - Composante bleue (0-255).
   * @returns {boolean} True si le pixel est identifié comme faisant partie de l'arrière-plan.
   */
  const isBackgroundPixel = (r, g, b) => {
    // Cas 1 : Fond bleu vif d'incrustation (Chroma keying)
    if (b > 150 && (b - r) > 30) return true;
    if (b > 180 && (b - g) > 20) return true;

    // Cas 2 : Teintes neutres / grises (damier de transparence ou fond studio clair)
    const diffRG = Math.abs(r - g);
    const diffGB = Math.abs(g - b);
    const diffRB = Math.abs(r - b);
    const maxDiff = Math.max(diffRG, diffGB, diffRB);
    if (maxDiff <= 11 && r >= 110) {
      return true;
    }
    return false;
  };

  // 3. Détourage par inondation (Breadth-First Search / BFS Flood Fill) :
  // Démarre uniquement depuis les bordures extérieures de l'image afin de préserver
  // les éventuels éléments intérieurs ayant des couleurs similaires au fond.
  const queue = [];
  const visited = new Uint8Array(total);

  // Initialisation de la file avec les pixels des bordures (haut, bas, gauche, droite)
  for (let x = 0; x < width; x++) queue.push(x, 0);
  for (let y = 1; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const pIdx = y * width + x;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;

    const r = rgba[pIdx * 4];
    const g = rgba[pIdx * 4 + 1];
    const b = rgba[pIdx * 4 + 2];

    if (isBackgroundPixel(r, g, b)) {
      rgba[pIdx * 4 + 3] = 0; // Pixel rendu totalement transparent
      // Propagation aux 4 voisins cardinaux
      if (x > 0 && !visited[pIdx - 1]) queue.push(x - 1, y);
      if (x < width - 1 && !visited[pIdx + 1]) queue.push(x + 1, y);
      if (y > 0 && !visited[pIdx - width]) queue.push(x, y - 1);
      if (y < height - 1 && !visited[pIdx + width]) queue.push(x, y + 1);
    }
  }

  // 4. Défrangeage (De-fringing) en 2 passes :
  // Élimine les pixels semi-transparents ou contaminés par le fond bleu/gris situés immédiatement
  // au contact d'un pixel transparent sur le contour du personnage.
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (rgba[idx * 4 + 3] > 0) {
          const tA = rgba[((y - 1) * width + x) * 4 + 3]; // Pixel au-dessus
          const bA = rgba[((y + 1) * width + x) * 4 + 3]; // Pixel en-dessous
          const lA = rgba[(y * width + x - 1) * 4 + 3];     // Pixel à gauche
          const rA = rgba[(y * width + x + 1) * 4 + 3];     // Pixel à droite

          // Si au moins un voisin direct est transparent, nous sommes sur la bordure extérieure
          if (tA === 0 || bA === 0 || lA === 0 || rA === 0) {
            const r = rgba[idx * 4];
            const g = rgba[idx * 4 + 1];
            const b = rgba[idx * 4 + 2];
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            
            // Suppression des teintes grisâtres ou bleuâtres résiduelles
            if ((maxDiff <= 14 && (r - b) < 14 && r >= 105) || (b > 150 && (b - r) > 25)) {
              rgba[idx * 4 + 3] = 0;
            }
          }
        }
      }
    }
  }

  // 5. Analyse en composantes connexes (Connected Component Analysis) :
  // Isole le corps principal du joueur et élimine les petits îlots de pixels isolés/artefacts flottants.
  const compVisited = new Uint8Array(total);
  const compQueue = [];
  
  // Point de départ (graine) positionné au centre du torse du joueur
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height * 0.6);
  compQueue.push(startX, startY);
  compVisited[startY * width + startX] = 1;

  let cHead = 0;
  while (cHead < compQueue.length) {
    const x = compQueue[cHead++];
    const y = compQueue[cHead++];
    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!compVisited[nIdx] && rgba[nIdx * 4 + 3] > 0) {
          compVisited[nIdx] = 1;
          compQueue.push(nx, ny);
        }
      }
    }
  }

  // Tout pixel non rattaché à la composante centrale principale est rendu transparent
  for (let i = 0; i < total; i++) {
    if (!compVisited[i]) {
      rgba[i * 4 + 3] = 0;
    }
  }

  // 6. Redimensionnement haute qualité en 256x256 avec centrage et marge transparente
  const destPath = path.join(outputDir, outputFile);
  const rawPng = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Nettoyage final du canal alpha : suppression du bruit résiduel ultra-faible (alpha < 20)
  const finalBuf = rawPng.data;
  for (let i = 0; i < 256 * 256; i++) {
    if (finalBuf[i * 4 + 3] < 20) {
      finalBuf[i * 4 + 3] = 0;
    }
  }

  // Encodage PNG final et écriture sur le disque
  await sharp(finalBuf, { raw: { width: 256, height: 256, channels: 4 } })
    .png()
    .toFile(destPath);

  console.log('Processed & saved cleanly:', destPath);
}

/**
 * Crée les variantes d'avatars pour les gardiens de but par recoloration ciblée des maillots.
 * Conserve la dynamique lumineuse (ombres et reflets) grâce à un calcul de luminance pondéré (ITU-R BT.601).
 */
async function createGoalkeeperVariants() {
  // --------------------------------------------------------------------------
  // 1. Gardien Équipe A : Transformation du maillot vert en maillot jaune d'or
  // --------------------------------------------------------------------------
  const greenImg = await sharp(path.join(outputDir, 'handball_player_green.png')).raw().toBuffer({ resolveWithObject: true });
  const w = greenImg.info.width, h = greenImg.info.height;
  const dataA = Buffer.from(greenImg.data);

  // On limite la recherche aux coordonnées verticales sous la tête (y >= 168)
  for (let y = 168; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (dataA[idx + 3] === 0) continue; // Ignorer les pixels transparents
      const r = dataA[idx], g = dataA[idx + 1], b = dataA[idx + 2];
      
      // Détection des tons chair pour éviter de teinter les bras ou le cou
      const isSkin = (r > g + 20 && r > b + 15);
      
      // Ciblage des pixels du maillot vert
      if (!isSkin && (g > r - 8 || (g > 30 && b > 30))) {
        // Calcul de la luminance relative normalisée (0.0 à 1.0)
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Application d'une teinte jaune dynamique avec correction gamma par canal
        dataA[idx] = Math.min(255, Math.round(255 * Math.pow(lum, 0.75)));      // Rouge vif
        dataA[idx + 1] = Math.min(255, Math.round(210 * Math.pow(lum, 0.8)));   // Vert chaud
        dataA[idx + 2] = Math.min(255, Math.round(25 * Math.pow(lum, 1.3)));    // Faible bleu pour un jaune pur
      }
    }
  }

  await sharp(dataA, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(outputDir, 'handball_goalkeeper_yellow.png'));
  console.log('Generated handball_goalkeeper_yellow.png');

  // --------------------------------------------------------------------------
  // 2. Gardien Équipe B : Transformation du maillot rouge en maillot bleu électrique
  // --------------------------------------------------------------------------
  const redImg = await sharp(path.join(outputDir, 'handball_opponent_red.png')).raw().toBuffer({ resolveWithObject: true });
  const dataB = Buffer.from(redImg.data);

  for (let y = 172; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (dataB[idx + 3] === 0) continue; // Ignorer les pixels transparents
      const r = dataB[idx], g = dataB[idx + 1], b = dataB[idx + 2];
      
      // Détection du tissu rouge principal et des bordures jaunes/or
      const isRedJersey = (r > 100 && r > g + 40 && r > b + 40);
      const isYellowTrim = (r > 180 && g > 120 && b < 70);
      
      if (isRedJersey || isYellowTrim) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (isYellowTrim) {
          // Remplacement des bandes jaunes par des reflets cyan / bleu clair
          dataB[idx] = Math.min(255, Math.round(70 * Math.pow(lum, 0.8)));
          dataB[idx + 1] = Math.min(255, Math.round(220 * Math.pow(lum, 0.8)));
          dataB[idx + 2] = 255;
        } else {
          // Remplacement du rouge principal par un bleu cobalt profond
          dataB[idx] = Math.min(255, Math.round(20 * Math.pow(lum, 1.2)));
          dataB[idx + 1] = Math.min(255, Math.round(110 * Math.pow(lum, 0.9)));
          dataB[idx + 2] = Math.min(255, Math.round(235 * Math.pow(lum, 0.75)));
        }
      }
    }
  }

  await sharp(dataB, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(outputDir, 'handball_opponent_goalkeeper.png'));
  console.log('Generated handball_opponent_goalkeeper.png');
}

/**
 * Fonction d'orchestration principale :
 * Exécute le traitement des avatars joueurs, génère les alias de compatibilité,
 * et produit les variantes des gardiens de but.
 */
async function run() {
  // Traitement et détourage des joueurs rouge et vert
  await processFile(imgRed, 'handball_opponent_red.png', true);
  await processFile(imgGreen, 'handball_player_green.png', false);
  
  // Duplication sous des noms courts pour assurer la rétro-compatibilité
  fs.copyFileSync(path.join(outputDir, 'handball_opponent_red.png'), path.join(outputDir, 'hand_opponent_red.png'));
  fs.copyFileSync(path.join(outputDir, 'handball_player_green.png'), path.join(outputDir, 'hand_player_green.png'));
  
  // Génération des maillots spécifiques aux gardiens
  await createGoalkeeperVariants();
}

// Lancement du script et capture d'éventuelles erreurs non gérées
run().catch(console.error);

