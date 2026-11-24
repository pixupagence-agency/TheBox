import type { Metadata, Viewport } from "next";
import ConvocationsApp from "@/components/convocations/ConvocationsApp";

export const metadata: Metadata = {
  title: "Convocations · The Box",
  description: "Convocations aux matchs et aux entraînements, réponses des joueurs et feuille de présence.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default function ConvocationsPage() {
  return <ConvocationsApp />;
}
