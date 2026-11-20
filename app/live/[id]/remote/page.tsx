import type { Metadata, Viewport } from "next";
import LiveRemote from "@/components/live/LiveRemote";

export const metadata: Metadata = {
  title: "Télécommande du live · The Box",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default async function LiveRemotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveRemote id={id} />;
}
