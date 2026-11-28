/**
 * Grille tarifaire TheBox FC (validée le 27/11/2026).
 * Mensuel en euros TTC ; annuel = 10 mois payés (2 mois offerts).
 * Training et Recording sont des options d'une formule PRO ou PRO+ ; le Pack Staff réunit PRO+ et les deux options.
 */
export type PriceKey = "free" | "pro" | "plus" | "pack" | "training" | "recording";
export type Billing = "month" | "year";

export const MONTHLY_PRICES: Record<PriceKey, number> = {
  free: 0,
  pro: 9.9,
  plus: 14.9,
  pack: 29.9,
  training: 7.9,
  recording: 9.9,
};

export const YEARLY_PRICES: Record<PriceKey, number> = {
  free: 0,
  pro: 99,
  plus: 149,
  pack: 299,
  training: 79,
  recording: 99,
};

export const TRIAL_DAYS = 14;

export function priceTable(billing: Billing) {
  return billing === "year" ? YEARLY_PRICES : MONTHLY_PRICES;
}

/** 9.9 -> « 9,90 € » */
export function formatEuro(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

/** 99 -> « 99 € », 2.8 -> « 2,80 € » */
export function formatEuroShort(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? `${r} €` : formatEuro(r);
}

/** Économie du Pack Staff par rapport à PRO+ avec les deux options, sur la période choisie */
export function packSaving(billing: Billing): number {
  const p = priceTable(billing);
  return Math.round((p.plus + p.training + p.recording - p.pack) * 100) / 100;
}

export interface OfferTotal {
  total: number;
  packApplied: boolean;
  label: string;
  hint: string;
}

/** Total du calculateur : base PRO ou PRO+, options Training et Recording, Pack Staff appliqué dès qu'il revient moins cher */
export function computeOffer(base: "pro" | "plus", training: boolean, recording: boolean, billing: Billing): OfferTotal {
  const p = priceTable(billing);
  const per = billing === "year" ? " par an" : " par mois";
  const total = p[base] + (training ? p.training : 0) + (recording ? p.recording : 0);
  const parts = [base === "plus" ? "PRO+" : "PRO"];
  if (training) parts.push("Training");
  if (recording) parts.push("Recording");

  if (base === "plus" && training && recording && total > p.pack) {
    return {
      total: p.pack,
      packApplied: true,
      label: "Pack Staff · " + parts.join(" + "),
      hint: `Pack Staff appliqué : ${formatEuroShort(total - p.pack)} économisés${per}.`,
    };
  }

  let hint = "";
  if (base === "plus" && training !== recording) {
    hint = `Ajoutez l'autre module : le Pack Staff revient à ${formatEuroShort(p.pack)}${per}.`;
  } else if (base === "pro" && training && recording) {
    hint = `Pour ${formatEuroShort(p.pack - total)} de plus${per}, le Pack Staff ajoute le module Live.`;
  }
  return { total: Math.round(total * 100) / 100, packApplied: false, label: parts.join(" + "), hint };
}
