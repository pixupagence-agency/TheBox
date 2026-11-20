import type { Metadata, Viewport } from "next";
import ClubMatches from "@/components/live/ClubMatches";

export const metadata: Metadata = {
  title: "Matchs du club · The Box",
  description: "Matchs en direct, à venir et résultats du club.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClubMatches slug={slug} />;
}
