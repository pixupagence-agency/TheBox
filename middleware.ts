import { NextRequest, NextResponse } from "next/server";

// Domaines qui affichent la page « en construction » à la place de l'application.
// L'application reste complète sur les autres adresses (thebox-tactic.vercel.app pour les tests, localhost).
// Pour ouvrir le site au public : vider cette liste et redéployer.
const UNDER_CONSTRUCTION_HOSTS = ["thebox-tactic.com", "www.thebox-tactic.com"];

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  if (!UNDER_CONSTRUCTION_HOSTS.includes(host)) return NextResponse.next();
  if (req.nextUrl.pathname === "/construction") return NextResponse.next();
  // L'adresse reste celle demandée, seul le contenu change
  return NextResponse.rewrite(new URL("/construction", req.url));
}

export const config = {
  // Les routes /api restent actives (webhook Stripe), ainsi que les fichiers statiques (logo, images, styles)
  matcher: ["/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
