// Export PDF du dossier d'un match (A4 paysage) :
//   page 1 : couverture sombre (logo THE BOX, nom du match, compétition / date / coach / équipe)
//   page 2 : groupe de joueurs et rôles attribués pour la rencontre
//   puis   : notes tactiques
//   puis   : schémas tactiques, un par page
// jsPDF est chargé à la demande pour ne pas alourdir le tableau tactique.

import type { jsPDF as JsPDF } from "jspdf";

export interface MatchPdfSchema {
  name: string;
  date?: string;
  description?: string;
  isAnimation?: boolean;
  steps?: number;
  /** Image du schéma (data URL JPEG ou PNG) */
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface MatchPdfPlayer {
  number?: number;
  name: string;
  /** Poste (DC, MC, AC…) */
  position?: string;
  /** Disponibilité : normal, excellent, tired, injured, suspended */
  status?: string;
  /** Codes des rôles tenus pour la rencontre (C, PK, CF, CK-G, MUR…) */
  roles: string[];
}

export interface MatchPdfRole {
  label: string;
  badge?: string;
  /** Joueur désigné (« N°10 · Dupont »), absent si le rôle n'est pas attribué */
  player?: string;
}

export interface MatchPdfSquad {
  teamName: string;
  starters: MatchPdfPlayer[];
  substitutes: MatchPdfPlayer[];
  roles: MatchPdfRole[];
  /** Mur sur coup franc (football) : joueurs dans l'ordre du mur ; absent s'il n'y a pas de mur */
  wall?: { places: number; players: string[] };
}

export interface MatchPdfData {
  /** Titre du match (« Équipe A vs Équipe B »), ou titre de repli sans match */
  matchTitle: string;
  competition?: string;
  dateTime?: string;
  clubName?: string;
  /** Logo du club (data URL PNG / JPEG), affiché sur la couverture */
  clubLogo?: string;
  sport: string;
  coachName?: string;
  notes?: string;
  /** Groupe de joueurs et rôles de la rencontre (page 2) */
  squad?: MatchPdfSquad;
  schemas: MatchPdfSchema[];
  fileName: string;
}

const STATUS_LABELS: Record<string, string> = {
  normal: "Disponible",
  excellent: "En forme",
  tired: "Fatigué",
  injured: "Blessé",
  suspended: "Suspendu",
  red_card: "Exclu",
};
const STATUS_COLORS: Record<string, RGB> = {
  excellent: [0, 150, 100],
  tired: [180, 120, 0],
  injured: [200, 40, 60],
  suspended: [200, 40, 60],
  red_card: [200, 40, 60],
};

type RGB = [number, number, number];

const BRAND = "The Box - Zone de Décision Tactique";
const GREEN: RGB = [0, 229, 153];
const GREEN_DARK: RGB = [0, 150, 100];
const DARK: RGB = [15, 23, 42];
const MUTED: RGB = [100, 116, 139];
const LINE: RGB = [226, 232, 240];
const COVER_BG: RGB = [9, 13, 20];
const COVER_PANEL: RGB = [17, 24, 39];
const COVER_LINE: RGB = [31, 41, 61];
const COVER_TEXT: RGB = [248, 250, 252];
const COVER_MUTED: RGB = [148, 163, 184];

// Les polices standard du PDF ne couvrent pas les émojis ni certains symboles : on les retire
const pdfSafe = (text: string) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿŒœ€]/g, "")
    .replace(/ +([.,])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

/** Emblème THE BOX (repris de public/logo.svg, viewBox 100 × 100), dessiné en vectoriel */
function drawEmblem(doc: JsPDF, x: number, y: number, size: number, color: RGB) {
  const k = size / 100;
  const P = (px: number, py: number): [number, number] => [x + px * k, y + py * k];
  doc.setDrawColor(...color);
  doc.setLineCap("square");
  doc.setLineJoin("miter");
  doc.setLineWidth(6.5 * k);
  doc.circle(x + 50 * k, y + 50 * k, 44 * k, "S");
  doc.line(...P(19, 19), ...P(81, 81));
  doc.line(...P(81, 19), ...P(19, 81));
  doc.setLineWidth(6 * k);
  const chevrons: [number, number][][] = [
    [[32, 21], [50, 39], [68, 21]],
    [[32, 79], [50, 61], [68, 79]],
    [[21, 32], [39, 50], [21, 68]],
    [[79, 32], [61, 50], [79, 68]],
  ];
  for (const [a, b, c] of chevrons) {
    const [ax, ay] = P(...a);
    const [bx, by] = P(...b);
    const [cx, cy] = P(...c);
    doc.lines([[bx - ax, by - ay], [cx - bx, cy - by]], ax, ay, [1, 1], "S", false);
  }
  doc.setLineCap("butt");
}

/** Texte centré avec espacement des lettres (jsPDF ne compte pas charSpace dans align: "center") */
function centeredSpaced(doc: JsPDF, text: string, cx: number, y: number, charSpace: number) {
  const width = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
  doc.text(text, cx - width / 2, y, { charSpace });
}

export async function exportMatchPdf(data: MatchPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  const contentTop = 25; // sous le bandeau des pages claires
  const bottom = pageH - 13.5;
  let y = contentTop;

  const newLightPage = () => {
    doc.addPage();
    y = contentTop;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > bottom) newLightPage();
  };

  const writeParagraph = (text: string, size: number, color: RGB, lineGap = 1.45) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lineH = size * 0.3528 * lineGap;
    const lines: string[] = doc.splitTextToSize(pdfSafe(text).replace(/ {2,}/g, " "), contentW);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y + lineH * 0.75);
      y += lineH;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...DARK);
    doc.text(pdfSafe(title), margin, y + 6);
    doc.setDrawColor(...GREEN_DARK);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 9, margin + 20, y + 9);
    y += 15;
  };

  // ───────────── Page 1 : couverture sombre ─────────────
  doc.setFillColor(...COVER_BG);
  doc.rect(0, 0, pageW, pageH, "F");

  // Logo en haut à gauche : emblème + « the box » + signature
  const logoSize = 16;
  drawEmblem(doc, margin, margin, logoSize, GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COVER_TEXT);
  doc.text("the box", margin + logoSize + 4.5, margin + 8.5);
  doc.setFontSize(7);
  doc.setTextColor(...COVER_MUTED);
  doc.text("ZONE DE DÉCISION TACTIQUE", margin + logoSize + 4.5, margin + 13.5, { charSpace: 0.6 });

  // Centre : logo du club, libellé, nom du match, fiche d'informations
  const centerX = pageW / 2;
  if (data.clubLogo) {
    try {
      const props = doc.getImageProperties(data.clubLogo);
      const box = 26;
      const ratio = props.width / props.height;
      const lw = ratio >= 1 ? box : box * ratio;
      const lh = ratio >= 1 ? box / ratio : box;
      const format = data.clubLogo.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(data.clubLogo, format, centerX - lw / 2, 38 + (box - lh) / 2, lw, lh, undefined, "FAST");
    } catch (e) {
      console.warn("Logo du club illisible pour le PDF", e);
    }
  }
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  const kicker = pdfSafe(`DOSSIER TACTIQUE  -  ${data.sport.toUpperCase()}`);
  centeredSpaced(doc, kicker, centerX, 72, 1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...COVER_TEXT);
  const titleLines: string[] = doc.splitTextToSize(pdfSafe(data.matchTitle.toUpperCase()), contentW - 30);
  let titleY = 88;
  for (const line of titleLines.slice(0, 3)) {
    doc.text(line, centerX, titleY, { align: "center" });
    titleY += 13;
  }
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1);
  doc.line(centerX - 14, titleY - 4, centerX + 14, titleY - 4);

  const infos = [
    { label: "COMPÉTITION", value: data.competition },
    { label: "DATE & HEURE", value: data.dateTime },
    { label: "COACH", value: data.coachName },
    { label: "ÉQUIPE", value: data.clubName },
  ]
    .map((i) => ({ label: i.label, value: i.value ? pdfSafe(i.value) : "" }))
    .filter((i) => i.value);
  if (infos.length) {
    const boxW = Math.min(contentW - 20, infos.length * 62);
    const boxX = centerX - boxW / 2;
    const boxY = titleY + 8;
    const boxH = 26;
    doc.setFillColor(...COVER_PANEL);
    doc.setDrawColor(...COVER_LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "FD");
    const colW = boxW / infos.length;
    infos.forEach((info, i) => {
      const cx = boxX + colW * i + colW / 2;
      if (i > 0) doc.line(boxX + colW * i, boxY + 5, boxX + colW * i, boxY + boxH - 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...COVER_MUTED);
      centeredSpaced(doc, info.label, cx, boxY + 10, 0.5);
      doc.setFontSize(11.5);
      doc.setTextColor(...COVER_TEXT);
      const value: string[] = doc.splitTextToSize(info.value, colW - 8);
      doc.text(value[0] + (value.length > 1 ? "..." : ""), cx, boxY + 18, { align: "center" });
    });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COVER_MUTED);
  doc.text(pdfSafe(`Généré le ${new Date().toLocaleDateString("fr-FR")}`), centerX, pageH - 12, { align: "center" });

  // ───────────── Page 2 : groupe de joueurs et rôles de la rencontre ─────────────
  if (data.squad) {
    const squad = data.squad;
    newLightPage();
    sectionTitle(`Groupe & rôles  -  ${squad.teamName}`);
    const top = y;
    const gap = 8;
    const tableW = Math.round(contentW * 0.6);
    const sideX = margin + tableW + gap;
    const sideW = contentW - tableW - gap;

    // Texte tronqué à une largeur (une seule ligne)
    const fit = (text: string, width: number) => {
      const safe = pdfSafe(text);
      if (doc.getTextWidth(safe) <= width) return safe;
      let out = safe;
      while (out.length > 1 && doc.getTextWidth(`${out}...`) > width) out = out.slice(0, -1);
      return `${out.trimEnd()}...`;
    };

    // Tableau du groupe (colonne gauche, se poursuit sur la page suivante si besoin)
    const cols = [
      { key: "num", label: "N°", w: 12 },
      { key: "name", label: "JOUEUR", w: tableW * 0.4 },
      { key: "pos", label: "POSTE", w: 18 },
      { key: "roles", label: "RÔLES", w: 0 },
      { key: "status", label: "DISPONIBILITÉ", w: 27 },
    ];
    cols[3].w = tableW - cols.reduce((s, c) => s + c.w, 0);
    // Hauteur de ligne ajustée pour garder tout le groupe sur une page tant que c'est lisible (5 à 6,6 mm)
    const groups = squad.substitutes.length ? 2 : 1;
    const rowsNeeded = squad.starters.length + squad.substitutes.length + groups; // + en-têtes de tableau
    const fixedH = groups * 8.5 + (groups - 1) * 3 + 2;
    const rowH = Math.max(5, Math.min(6.6, (bottom - y - fixedH) / Math.max(1, rowsNeeded)));
    const tableHeader = () => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, tableW, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      let x = margin + 2;
      cols.forEach((c) => {
        doc.text(pdfSafe(c.label), x, y + rowH / 2 + 1.1, { charSpace: 0.3 });
        x += c.w;
      });
      y += rowH;
    };
    const groupTitle = (label: string, count: number) => {
      if (y + rowH * 3 > bottom) { newLightPage(); }
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GREEN_DARK);
      doc.text(pdfSafe(`${label} (${count})`), margin, y + 4);
      y += 6.5;
      tableHeader();
    };
    const playerRow = (p: MatchPdfPlayer, index: number) => {
      if (y + rowH > bottom) {
        newLightPage();
        tableHeader();
      }
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, tableW, rowH, "F");
      }
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + tableW, y + rowH);
      let x = margin + 2;
      const baseY = y + rowH / 2 + 1.3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.text(p.number !== undefined ? String(p.number) : "-", x, baseY);
      x += cols[0].w;
      doc.text(fit(p.name || "Sans nom", cols[1].w - 3), x, baseY);
      x += cols[1].w;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(fit((p.position || "-").toUpperCase(), cols[2].w - 3), x, baseY);
      x += cols[2].w;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...GREEN_DARK);
      doc.text(p.roles.length ? fit(p.roles.join("  "), cols[3].w - 3) : "", x, baseY);
      x += cols[3].w;
      const status = p.status || "normal";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...(STATUS_COLORS[status] || MUTED));
      doc.text(fit(STATUS_LABELS[status] || STATUS_LABELS.normal, cols[4].w - 2), x, baseY);
      y += rowH;
    };

    if (squad.starters.length + squad.substitutes.length === 0) {
      writeParagraph("Aucun joueur dans le groupe.", 11, MUTED);
    } else {
      groupTitle("Titulaires", squad.starters.length);
      squad.starters.forEach(playerRow);
      if (squad.substitutes.length) {
        y += 3;
        groupTitle("Remplaçants", squad.substitutes.length);
        squad.substitutes.forEach(playerRow);
      }
    }
    const tableEndPage = doc.getNumberOfPages();
    const tableEndY = y;

    // Rôles de la rencontre (colonne droite de la première page du groupe)
    const firstSquadPage = 2;
    doc.setPage(firstSquadPage);
    let sy = top + 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN_DARK);
    doc.text("Rôles de la rencontre", sideX, sy + 4);
    sy += 7.5;
    const roleH = 10.5;
    squad.roles.forEach((r) => {
      doc.setFillColor(...(r.player ? ([240, 253, 248] as RGB) : ([248, 250, 252] as RGB)));
      doc.setDrawColor(...(r.player ? ([167, 243, 208] as RGB) : LINE));
      doc.setLineWidth(0.25);
      doc.roundedRect(sideX, sy, sideW, roleH - 1.5, 1.6, 1.6, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      const badge = r.badge ? pdfSafe(r.badge.toUpperCase()) : "";
      doc.setFontSize(7);
      const badgeW = badge ? doc.getTextWidth(badge) + 4 : 0;
      doc.setFontSize(8.5);
      doc.text(fit(r.label, sideW - badgeW - 6), sideX + 2.5, sy + 3.9);
      if (badge) {
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        doc.text(badge, sideX + sideW - 2.5, sy + 3.9, { align: "right" });
      }
      doc.setFont("helvetica", r.player ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(...(r.player ? GREEN_DARK : MUTED));
      doc.text(fit(r.player || "Non attribué", sideW - 5), sideX + 2.5, sy + 7.6);
      sy += roleH;
    });

    if (squad.wall) {
      sy += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GREEN_DARK);
      doc.text(pdfSafe(`Mur sur coup franc (${squad.wall.places} places)`), sideX, sy + 4);
      sy += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const wallPlayers = squad.wall.players.length ? squad.wall.players : [];
      if (!wallPlayers.length) {
        doc.setTextColor(...MUTED);
        doc.text("Aucun joueur placé dans le mur.", sideX, sy + 3.5);
      } else {
        doc.setTextColor(...DARK);
        wallPlayers.forEach((name, i) => {
          if (sy + 5 > bottom) return;
          doc.text(fit(`${i + 1}.  ${name}`, sideW), sideX, sy + 3.5);
          sy += 5;
        });
      }
    }

    // Reprise après le tableau du groupe
    doc.setPage(tableEndPage);
    y = tableEndY;
  }

  // ───────────── Notes tactiques ─────────────
  newLightPage();
  sectionTitle("Notes tactiques");
  const notes = data.notes ? pdfSafe(data.notes) : "";
  writeParagraph(notes || "Aucune note tactique pour ce match.", 11, notes ? DARK : MUTED);

  // ───────────── Page 3 et suivantes : schémas, un par page, image la plus grande possible ─────────────
  if (data.schemas.length === 0) {
    newLightPage();
    sectionTitle("Schémas tactiques");
    writeParagraph("Aucun schéma enregistré pour ce match.", 11, MUTED);
  }

  const total = data.schemas.length;
  data.schemas.forEach((schema, index) => {
    newLightPage();
    y = contentTop - 2;
    const hasImage = Boolean(schema.image && schema.imageWidth && schema.imageHeight);

    // Place réservée à la description sous l'image (lignes réelles)
    const description = schema.description ? pdfSafe(schema.description).replace(/ {2,}/g, " ") : "";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const descLines: string[] = description ? doc.splitTextToSize(description, contentW) : [];
    const descH = Math.min(descLines.length, 3) * 10 * 0.3528 * 1.45 + (descLines.length ? 3 : 0);

    const maxImgH = bottom - (y + 8) - descH;
    let imgW = contentW;
    let imgH = hasImage ? (contentW * schema.imageHeight!) / schema.imageWidth! : 0;
    if (imgH > maxImgH) {
      imgW = (imgW * maxImgH) / imgH;
      imgH = maxImgH;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...DARK);
    doc.text(pdfSafe(`Schéma ${index + 1} / ${total}  -  ${schema.name || "Sans nom"}`), margin, y + 4.5);

    const meta = [
      schema.isAnimation ? `Animation${schema.steps ? ` - ${schema.steps} étapes` : ""}` : "",
      schema.date || "",
    ].filter(Boolean).join("   |   ");
    if (meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(pdfSafe(meta), pageW - margin, y + 4.5, { align: "right" });
    }
    y += 8;

    if (hasImage) {
      const format = schema.image!.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(schema.image!, format, margin + (contentW - imgW) / 2, y, imgW, imgH, undefined, "FAST");
      y += imgH + 3;
    }

    if (description) {
      writeParagraph(description, 10, DARK);
    }
  });

  // Bandeau et pied de page des pages claires (pas sur la couverture)
  const pageCount = doc.getNumberOfPages();
  const generated = `Généré le ${new Date().toLocaleDateString("fr-FR")}`;
  for (let p = 2; p <= pageCount; p++) {
    doc.setPage(p);
    drawEmblem(doc, margin, 8, 7, GREEN_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GREEN_DARK);
    doc.text(pdfSafe(BRAND), margin + 9.5, 13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    const shortTitle: string[] = doc.splitTextToSize(pdfSafe(data.matchTitle), contentW / 2);
    doc.text(shortTitle[0], pageW - margin, 13, { align: "right" });
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, 18, pageW - margin, 18);

    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    doc.setFontSize(8);
    doc.text(pdfSafe(`${BRAND}  -  ${generated}`), margin, pageH - 6.5);
    doc.text(`Page ${p} / ${pageCount}`, pageW - margin, pageH - 6.5, { align: "right" });
  }

  doc.save(data.fileName);
}
