import type { Metadata, Viewport } from "next";
import LiveFollower from "@/components/live/LiveFollower";

export const metadata: Metadata = {
  title: "Match en direct · The Box",
  description: "Score, chrono et faits du match en direct.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default async function LiveMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  // « ?depuis=club » : ouvert depuis la liste des matchs du club (le QR du match n'a pas ce paramètre)
  const fromClub = (await searchParams).depuis === "club";
  return <LiveFollower id={id} fromClub={fromClub} />;
}
