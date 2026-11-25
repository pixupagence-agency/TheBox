"use client";

import { useEffect, useState } from "react";
import { calculateTrialRemaining, type TrialTimeRemaining } from "@/components/TrialCountdownModal";

/** Compte à rebours de l'essai Pro (mis à jour chaque seconde) */
export const LiveTrialCountdownLabel = ({ createdAt, bonusDays, trialEndsAt }: { createdAt?: string; bonusDays: number; trialEndsAt?: string | null }) => {
  const [status, setStatus] = useState<TrialTimeRemaining>(() => calculateTrialRemaining(createdAt, bonusDays, trialEndsAt));

  useEffect(() => {
    const interval = setInterval(() => setStatus(calculateTrialRemaining(createdAt, bonusDays, trialEndsAt)), 1000);
    return () => clearInterval(interval);
  }, [createdAt, bonusDays, trialEndsAt]);

  return (
    <>{`Démo Pro : ${status.days}j ${String(status.hours).padStart(2, '0')}h ${String(status.minutes).padStart(2, '0')}m ${String(status.seconds).padStart(2, '0')}s`}</>
  );
};
