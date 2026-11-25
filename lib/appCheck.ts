/**
 * Vérification App Check des routes /api publiques (appelées sans compte : Live, contact, support,
 * mot de passe oublié). Le navigateur envoie son jeton dans l'en-tête X-Firebase-AppCheck
 * (lib/firebase.ts > appCheckHeaders).
 *
 * Deux modes :
 *  - surveillance (par défaut) : un jeton absent ou invalide est journalisé, la requête passe ;
 *  - blocage (APPCHECK_ENFORCE=true) : la requête est refusée (401).
 * Rien n'est journalisé tant que la clé reCAPTCHA n'est pas configurée (NEXT_PUBLIC_RECAPTCHA_SITE_KEY) :
 * les navigateurs n'envoient alors aucun jeton.
 *
 * Réservé au serveur.
 */
import { NextResponse } from "next/server";
import { getApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAdminFirestore } from "@/lib/firebase-admin";

const enforced = () => process.env.APPCHECK_ENFORCE === "true";
const configured = () => Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

async function tokenIsValid(token: string): Promise<boolean> {
  // getAdminFirestore initialise l'application Admin (identifiants du compte de service)
  if (!getAdminFirestore()) return false;
  try {
    await getAppCheck(getApp()).verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Renvoie une réponse 401 si la requête doit être refusée, sinon null.
 * @param route nom court de la route, pour les journaux
 */
export async function requireAppCheck(req: Request, route: string): Promise<NextResponse | null> {
  if (!configured() && !enforced()) return null;
  const token = req.headers.get("x-firebase-appcheck") || "";
  const valid = token ? await tokenIsValid(token) : false;
  if (valid) return null;
  if (enforced()) {
    return NextResponse.json({ ok: false, error: "Requête non vérifiée. Rechargez la page et réessayez." }, { status: 401 });
  }
  console.warn(`[App Check] ${route} : jeton ${token ? "invalide" : "absent"} (mode surveillance, requête acceptée)`);
  return null;
}
