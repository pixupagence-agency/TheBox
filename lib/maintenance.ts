// Mode maintenance de l'application, activé par le super admin depuis la console admin.
// Stocké dans app_config/maintenance (lecture publique, écriture réservée au super admin par les règles Firestore).
// Pendant la maintenance, les visiteurs et les coachs voient un écran d'attente ; les administrateurs
// gardent l'accès complet. Les routes serveur (webhook Stripe…) continuent de fonctionner.

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isSuperAdminEmail } from "@/lib/security";

export interface MaintenanceState {
  enabled: boolean;
  /** Message affiché aux utilisateurs (vide : message par défaut) */
  message: string;
  updatedAt: string | null;
}

export const DEFAULT_MAINTENANCE_MESSAGE =
  "The Box est en cours de maintenance pour améliorer votre expérience. Merci de revenir dans quelques instants.";
export const MAINTENANCE_MESSAGE_MAX = 500;
export const MAINTENANCE_OFF: MaintenanceState = { enabled: false, message: "", updatedAt: null };

const maintenanceRef = () => doc(db, "app_config", "maintenance");

/** Suit l'état de maintenance en direct. En cas d'erreur de lecture, l'application reste accessible. */
export function subscribeMaintenance(onChange: (state: MaintenanceState) => void): () => void {
  return onSnapshot(
    maintenanceRef(),
    (snap) => {
      const data = snap.data();
      onChange({
        enabled: data?.enabled === true,
        message: typeof data?.message === "string" ? data.message : "",
        updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
      });
    },
    (err) => {
      console.warn("[Maintenance] Lecture de l'état impossible :", err?.message);
      onChange(MAINTENANCE_OFF);
    }
  );
}

/** Le compte connecté est-il le super admin (adresse confirmée, comme l'exigent les règles Firestore) ? */
export function isCurrentUserSuperAdmin(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified && isSuperAdminEmail(user.email));
}

/** Active ou désactive la maintenance (super admin uniquement, refusé sinon par les règles Firestore). */
export async function setMaintenance(enabled: boolean, message: string): Promise<void> {
  await setDoc(maintenanceRef(), {
    enabled,
    message: message.trim().slice(0, MAINTENANCE_MESSAGE_MAX),
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || null,
  });
}
