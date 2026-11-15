// Export PDF du dossier d'un match (A4 paysage) :
//   page 1 : couverture sombre (logo THE BOX, nom du match, compétition / date / coach / équipe)
//   page 2 : notes tactiques
//   page 3 et suivantes : schémas tactiques, un par page
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
  schemas: MatchPdfSchema[];
  fileName: string;
}

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

  // ───────────── Page 2 : notes tactiques ─────────────
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
