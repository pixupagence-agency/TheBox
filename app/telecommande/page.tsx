import type { Metadata, Viewport } from "next";
import RemoteCodeEntry from "@/components/live/RemoteCodeEntry";

export const metadata: Metadata = {
  title: "Télécommande du live · The Box",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#05080B" };

export default function TelecommandePage() {
  return <RemoteCodeEntry />;
}
