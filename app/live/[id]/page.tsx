import type { Metadata, Viewport } from "next";
import LiveFollower from "@/components/live/LiveFollower";

export const metadata: Metadata = {
  title: "Match en direct · The Box",
  description: "Score, chrono et faits du match en direct.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default async function LiveMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveFollower id={id} />;
}
