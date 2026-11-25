import type { Metadata } from "next";
import RecordingApp from "@/components/recording/RecordingApp";

export const metadata: Metadata = {
  title: "Recording - The Box",
  description: "Analyse vidéo : import de séquences, lecture image par image, consignes dessinées et bibliothèque taguée.",
};

/** « ?equipe=…&match=… » : ouvert depuis un match terminé du tableau tactique (bouton « Passez à l'analyse vidéo ») */
export default async function RecordingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const teamId = typeof sp.equipe === "string" ? sp.equipe : undefined;
  const matchId = typeof sp.match === "string" ? sp.match : undefined;
  return <RecordingApp teamId={teamId} matchId={matchId} />;
}
