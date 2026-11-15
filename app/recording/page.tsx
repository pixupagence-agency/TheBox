import type { Metadata } from "next";
import RecordingApp from "@/components/recording/RecordingApp";

export const metadata: Metadata = {
  title: "Recording - The Box",
  description: "Analyse vidéo : import de séquences, lecture image par image, consignes dessinées et bibliothèque taguée.",
};

export default function RecordingPage() {
  return <RecordingApp />;
}
