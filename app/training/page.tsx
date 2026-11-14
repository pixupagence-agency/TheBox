import type { Metadata } from "next";
import TrainingApp from "@/components/training/TrainingApp";

export const metadata: Metadata = {
  title: "Training - The Box",
  description: "Ateliers d'entraînement, fiches d'exercices et séances de la semaine.",
};

export default function TrainingPage() {
  return <TrainingApp />;
}
