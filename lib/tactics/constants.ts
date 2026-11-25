// Tableau tactique : constantes d'affichage et d'export.

// Groupes de la barre d'outils du terrain, dans l'ordre d'affichage
export const TOOLBAR_GROUP_KEYS = ["view", "display", "drawing", "color", "export", "zoom"] as const;

/** Longueur maximale du mot du coach publié dans le résumé du live */
export const COACH_NOTE_MAX = 600;

/** Couleurs proposées pour les liaisons entre joueurs */
export const LINK_COLORS = ["#facc15", "#ffffff", "#00E599", "#38bdf8", "#f43f5e", "#a855f7"];

/** Largeur des GIF d'animation exportés */
export const GIF_EXPORT_WIDTH = 720;
