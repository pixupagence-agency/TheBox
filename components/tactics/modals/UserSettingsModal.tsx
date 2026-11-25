"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { CLUB_LOGO_ACCEPT, prepareClubLogo } from "@/lib/clubLogo";
import { auth } from "@/lib/firebase";
import { type Language } from "@/lib/i18n";
import { Award, Check, CheckCircle, CreditCard, Globe, Lock, Save, Settings, Shield, Target, Upload, User, X, type Box, type Cloud, type Move, type Pause, type Play, type Video } from "lucide-react";

export interface UserSettingsModalProps {
  activePlan: string;
  blockedSports: string[];
  clubLogoError: string | null;
  currentLang: Language;
  deleteAccountConfirm: string;
  deleteAccountError: string | null;
  editClub: string;
  editClubLogo: string;
  editEmail: string;
  editFirstName: string;
  editLanguage: Language;
  editLastName: string;
  editRole: string;
  editShowLogoOnPitch: boolean;
  editSport: string;
  handleCancelAccountDeletion: () => Promise<void>;
  handleDeleteOwnAccount: () => Promise<void>;
  handleSaveUserConfig: (e: React.FormEvent<Element>) => void;
  isDeleteAccountOpen: boolean;
  isDeletingAccount: boolean;
  isModernSleek: boolean;
  isUserAdmin: boolean;
  isUserConfigModalOpen: boolean;
  scheduledDeletionAt: string | null;
  setActivePlan: (plan: string) => void;
  setClubLogoError: React.Dispatch<React.SetStateAction<string | null>>;
  setDeleteAccountConfirm: React.Dispatch<React.SetStateAction<string>>;
  setDeleteAccountError: React.Dispatch<React.SetStateAction<string | null>>;
  setEditClub: React.Dispatch<React.SetStateAction<string>>;
  setEditClubLogo: React.Dispatch<React.SetStateAction<string>>;
  setEditEmail: React.Dispatch<React.SetStateAction<string>>;
  setEditFirstName: React.Dispatch<React.SetStateAction<string>>;
  setEditLanguage: React.Dispatch<React.SetStateAction<Language>>;
  setEditLastName: React.Dispatch<React.SetStateAction<string>>;
  setEditRole: React.Dispatch<React.SetStateAction<string>>;
  setEditShowLogoOnPitch: React.Dispatch<React.SetStateAction<boolean>>;
  setEditSport: React.Dispatch<React.SetStateAction<string>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeleteAccountOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserConfigSection: React.Dispatch<React.SetStateAction<"profile" | "preferences" | "sport" | "billing">>;
  t: { readonly appTitle: "The Box - Zone de décision tactique"; readonly appDescription: "Application professionnelle de coaching et tableau blanc tactique."; readonly userMenu: { readonly profileTitle: "Profil & Options du compte"; readonly profileAriaLabel: "Menu profil utilisateur"; readonly adminBadge: "ADMIN"; readonly platformAdmin: "👑 Admin Plateforme"; readonly adminConsole: "Console Admin Plateforme"; readonly activeBadge: "ACTIF"; readonly freePlan: "Formule Gratuite"; readonly proPlan: "Formule PRO"; readonly proPlusPlan: "Formule PRO+"; readonly unsubscribe: "Se désabonner"; readonly unsubscribeConfirmTitle: "Résilier"; readonly unsubscribeTooltip: "Se désabonner de l'application et repasser en version gratuite"; readonly demoTrialTime: "Temps Démo / Essai (14j)"; readonly tutorial: "Tutoriel & Guide de démarrage"; readonly userGuide: "Guide d'Utilisation"; readonly faq: "Foire Aux Questions (FAQ)"; readonly contactSupport: "Contacter le Support (Email)"; readonly displayTheme: "Thème d'Affichage"; readonly lightDesign: "Design Clair"; readonly darkDesign: "Design Sombre"; readonly switchToDark: "Passer au thème Sombre"; readonly switchToLight: "Passer au thème Clair"; readonly themeActive: "Actif"; readonly themeClassic: "Classique"; readonly languageSection: "Langue de l'application"; readonly langFr: "Français"; readonly langEn: "English"; readonly profileConfig: "Configuration Profil & Sport"; readonly logout: "Déconnexion"; readonly logoutTooltip: "Déconnexion (Retour à la landing page)"; }; readonly userModal: { readonly title: "CONFIGURATION DE L'UTILISATEUR"; readonly subtitle: "Ajustez votre profil coach, votre langue et votre abonnement."; readonly close: "Fermer"; readonly firstName: "Prénom *"; readonly lastName: "Nom *"; readonly email: "Adresse Email de Connexion *"; readonly primaryAccount: "📧 Compte Principal"; readonly club: "Club / Équipe"; readonly clubPlaceholder: "ex: Olympique Lyonnais"; readonly role: "Fonction au sein du club"; readonly roles: { readonly principal: "Coach Principal"; readonly adjoint: "Entraîneur Adjoint"; readonly analyst: "Analyste Vidéo / Tactique"; readonly fitness: "Préparateur Physique"; readonly techDirector: "Responsable Technique"; }; readonly languageTitle: "Langue de l'Interface"; readonly languageSubtitle: "(Choisissez le français ou l'anglais pour l'ensemble de l'application)"; readonly languageFrDesc: "Interface complète en français"; readonly languageEnDesc: "Full interface in English"; readonly themeTitle: "Thème & Apparence de l'Interface"; readonly themeSubtitle: "(Mode Sombre ou Clair & Épuré)"; readonly lightActive: "Mode Clair & Épuré (Actif)"; readonly darkActive: "Mode Sombre Classique (Actif)"; readonly lightDesc: "Interface lumineuse et aérée avec fort contraste"; readonly darkDesc: "Contraste historique sombre d'origine"; readonly sportTitle: "Discipline Sportive"; readonly sportAdminNote: "(Vue Administrateur - Tous les sports)"; readonly sportUserNote: "(Disciplines Sportives Autorisées)"; readonly sportBlocked: "🔒 (BLOQUÉ POUR USAGERS)"; readonly billingTitle: "Gestion de l'Abonnement & Facturation"; readonly securePayment: "PAIEMENT SÉCURISÉ ⚡"; readonly currentPlan: "Formule actuelle :"; readonly adminLicense: "👑 Licence Admin Illimitée"; readonly billingNote: "Portail sécurisé • Modification et facturation en ligne sans engagement."; readonly changePlan: "Changer d'Abonnement"; readonly freeDemo: "Démo Gratuit"; readonly proPlanCard: "Formule PRO"; readonly proPlusPlanCard: "Formule PRO+"; readonly cancel: "Annuler"; readonly save: "Enregistrer la Configuration"; readonly saving: "Enregistrement..."; readonly validationName: "Veuillez remplir votre prénom et votre nom."; readonly validationEmail: "Veuillez saisir une adresse email de connexion valide."; readonly sportBlockedAlert: (sport: string) => string; readonly successToast: "✅ Profil et préférences mis à jour avec succès !"; }; readonly tactics: { readonly adminBadgeTooltip: "Compte Administrateur The Box : Accès total sans restriction de temps ni de fonction"; readonly freeBadgeTooltip: "Formule Gratuite active. Cliquez pour passer à la formule PRO."; readonly trialBadgeTooltip: "Période d'essai PRO (14 Jours) active"; readonly tutorialTooltip: "Ouvrir le guide interactif et tutoriel du coach"; readonly cloudSyncTooltip: "Persistance & synchronisation Cloud actives via Firebase Firestore"; readonly pwaInstallTooltip: "Installer l'application The Box"; readonly myClub: "Mon Équipe"; readonly myOpponent: "Mon Adversaire"; readonly expandPanel: (team: string) => string; readonly collapsePanel: (team: string) => string; readonly unfoldPanel: (team: string) => string; readonly regroupPlayers: "Regrouper les joueurs dans leur camp"; readonly manageRoster: "Gérer l'effectif, les noms, numéros de maillot et postes"; readonly manageSetPieces: "Désigner le Capitaine, Penaltys, Corners et Coups Francs"; readonly addOpponentPlayer: "Ajouter un joueur dans l'équipe adverse"; readonly toolsSection: "OUTILS"; readonly strokeSection: "TRAIT"; readonly exportSection: "EXPORT"; readonly tools: { readonly select: "Sélecteur"; readonly selectBtn: "Sélect"; readonly move: "Déplacer"; readonly moveBtn: "Déplacer"; readonly line: "Ligne"; readonly dashedLine: "Pointillé"; readonly solidLine: "Ligne"; readonly lineTooltipDashedActive: "Ligne Pointillée active (cliquez pour basculer en Ligne Pleine)"; readonly lineTooltipSolidActive: "Ligne Pleine active (cliquez pour basculer en Ligne Pointillée)"; readonly lineTooltipDefault: "Tracer une Ligne Tactique (Pleine ou Pointillée)"; readonly arrow: "Flèche de Course"; readonly arrowBtn: "Flèche"; readonly passArrow: "Flèche de Passe"; readonly runArrow: "Flèche de Course"; readonly dribbleArrow: "Flèche de Conduite"; readonly draw: "Dessin Libre"; readonly drawBtn: "Pinceau"; readonly freehand: "Dessin Libre"; readonly clearDrawings: "Effacer tous les dessins"; readonly clearBtn: "Effacer"; readonly zoneBtn: "Zone"; readonly zoneTooltip: "Tracer une zone rectangulaire sur le terrain"; readonly exportHdBtn: "Export HD"; readonly settingsBtn: "Paramètres"; readonly helpBtn: "Aide"; readonly strokeOptions: "Couleur et épaisseur de tracé"; readonly exportPng: "Exporter l'image PNG HD"; readonly exportPdf: "Exporter PDF de match"; readonly cardView3D: "Vue Carte 3D (Squad Export)"; readonly fullPitch: "Terrain complet"; readonly halfPitch: "Demi-terrain"; readonly resetPitch: "Réinitialiser les positions"; readonly undo: "Annuler la dernière action"; readonly redo: "Rétablir l'action"; readonly saveTactic: "Sauvegarder le schéma"; readonly savedTactics: "Bibliothèque de schémas"; readonly animationPlay: "Lire l'animation"; readonly animationPause: "Mettre en pause"; readonly animationRecord: "Créer une étape clé"; readonly animationSpeed: "Vitesse d'animation"; readonly clearBoard: "Vider le terrain"; readonly proBadgeActive: (plan: string) => string; readonly proBadgeAdmin: "Compte Admin PRO Active"; readonly subscribePro: "Souscrire au Plan PRO"; }; readonly pitchModes: { readonly fullPitch: "Terrain complet"; readonly halfPitch: "Demi-terrain"; readonly animationVideoActive: "Masquer le créateur d'animation"; readonly animationVideoInactive: "Activer le créateur d'animation (Vidéo)"; readonly animationLiveDisabled: "L'animation n'est pas disponible en mode Live Match"; readonly aspectDesktop: "Ratio Écran Large (Paysage)"; readonly aspectMobile: "Ratio Écran Étroit (Portrait)"; readonly ballShow: "Afficher le ballon"; readonly ballHide: "Masquer le ballon"; readonly opponentsShow: "Afficher les adversaires"; readonly opponentsHide: "Masquer les adversaires"; readonly namesShow: "Afficher les noms des joueurs"; readonly namesHide: "Masquer les noms des joueurs (garder uniquement les numéros)"; readonly panelsUnfold: "Déplier les panneaux d'équipes (Mon Équipe & Adverse)"; readonly panelsCollapse: "Réduire les panneaux d'équipes pour agrandir le terrain"; readonly pitchZoom: "Échelle du terrain"; readonly playerZoom: "Taille des joueurs"; readonly zoomIn: "Agrandir l'échelle du terrain"; readonly zoomOut: "Réduire l'échelle du terrain"; readonly playerZoomIn: "Agrandir la taille des joueurs"; readonly playerZoomOut: "Réduire la taille des joueurs"; readonly fullscreenEnter: "Plein écran"; readonly fullscreenExit: "Quitter plein écran"; readonly simulatePhase: "Simuler Phase"; readonly simulatePhaseTooltip: "Lire les étapes de la phase de jeu, ou ouvrir l'éditeur d'animation pour en créer"; readonly strokeThin: "Fin"; readonly strokeMedium: "Moyen"; readonly strokeThick: "Épais"; readonly repPastille: "Pastille"; readonly repBuste: "Buste"; readonly repTete: "Tête du joueur"; readonly repTitle: "Représentation des joueurs : Pastille, Buste ou Tête"; }; readonly playerCard: { readonly close: "Fermer la fiche joueur"; readonly nameLabel: "NOM :"; readonly namePlaceholder: "Nom du joueur"; readonly numberLabel: "N° :"; readonly numberTooltip: "Numéro unique (seuls les numéros disponibles sont proposés)"; readonly roleLabel: "POSTE :"; readonly rolePlaceholder: "Poste"; readonly photoLabel: "PHOTO :"; readonly myClubBadge: "MON EQUIPE"; readonly myOpponentBadge: "MON ADVERSAIRE"; readonly benchSubModalBtn: "Fiche banc"; readonly benchSubModalTooltip: "Ouvrir la modale complète avec les cartes et photos de tous les remplaçants"; readonly subOutBtn: "Sortie"; readonly subOutTooltip: "Sortie normale du joueur (sans remplacement)"; readonly injuryBtn: "Blessure"; readonly injuryTooltip: "Sortie sur blessure"; readonly liveActionsHeader: "ACTIONS LIVE :"; readonly addGoalBtn: "+1 BUT"; readonly addGoalTooltip: "Ajouter un but à ce joueur"; readonly addAssistBtn: "+1 PASSE D."; readonly addAssistTooltip: "Ajouter une passe décisive à ce joueur"; readonly yellowCardBtn: "CARTON J."; readonly yellowCardTooltip: "Attribuer un carton jaune"; readonly redCardBtn: "ROUGE"; readonly redCardTooltip: "Expulsion (Carton Rouge)"; readonly tokenHoverLive: (name: string) => string; readonly tokenHoverSub: (name: string) => string; readonly tokenHoverDrag: "Glisser pour déplacer"; readonly globalStatsHeader: "STATS GLOBALES :"; readonly goalsLabel: "Buts :"; readonly assistsLabel: "Passes D. :"; readonly yellowsLabel: "Jaune :"; readonly redsLabel: "Rouge :"; readonly fitnessLabel: "Forme :"; readonly formExcellent: "⭐ Excellente"; readonly formFit: "✅ En forme"; readonly replacementHeader: "REMPLACEMENT :"; readonly noSubsAvailable: "Aucun remplaçant disponible sur le banc"; readonly selectSubTooltip: "Sélectionner un remplaçant sur le banc pour effectuer le remplacement"; readonly selectSubPlaceholder: "🔄 Sélectionner un remplaçant sur le banc..."; readonly alreadyOnPitch: " [Déjà sur le terrain]"; readonly injuredTag: " [Blessé 🏥]"; readonly tiredTag: " [Fatigué ⚠️]"; }; readonly liveToolbox: { readonly player: "JOUEUR"; readonly goalBtn: "buteur (b)"; readonly goalTooltip: "Ajouter un but à ce joueur (Raccourci clavier : B)"; readonly assistBtn: "passeur (p)"; readonly assistTooltip: "Ajouter une passe décisive à ce joueur (Raccourci clavier : P)"; readonly yellowBtn: "carton jaune (CJ)"; readonly yellowTooltip: "Donner un carton jaune (CJ) - 2ème = exclusion (Raccourci clavier : J)"; readonly redBtn: "carton rouge (CR)"; readonly redTooltip: "Carton rouge (CR) - Expulsion immédiate (Raccourci clavier : R)"; readonly injuryBtn: "blessure (B)"; readonly injuryTooltip: "Blessure (B) - Sortie sur blessure et proposition de remplacement"; readonly substituteBtn: "Remplacer"; readonly substituteTooltip: "Effectuer un remplacement pour ce joueur"; readonly closeTooltip: "Fermer les options joueur"; }; readonly subModal: { readonly title: "Effectuer un Remplacement"; readonly subtitleOpponent: "Sélectionnez un remplaçant sur le banc adverse pour entrer à la place de ce joueur"; readonly subtitleHome: "Sélectionnez un remplaçant sur le banc pour entrer à la place de ce joueur"; readonly close: "Fermer"; readonly starter: "TITULAIRE"; readonly playerLeaving: "🚪 Joueur sortant du terrain"; readonly simpleExit: "🚪 Sortie simple"; readonly simpleExitTooltip: "Faire sortir sans remplacement"; readonly injuryExit: "🏥 Blessure"; readonly injuryExitTooltip: "Sortie sur blessure"; readonly benchSubstitutes: (count: number) => string; readonly confirmHint: "Cliquez sur « Faire entrer » pour valider"; readonly noSubsOpponent: "Aucun remplaçant présent sur le banc adverse."; readonly noSubsHome: "Aucun remplaçant présent sur la feuille de match."; readonly onPitch: "Sur le terrain"; readonly injured: "🏥 Blessé"; readonly sentOff: "🟥 Expulsé"; readonly topForm: "⭐ Excellente forme"; readonly tired: "⚠️ Fatigué"; readonly available: "✅ Disponible"; readonly inGame: "En jeu"; readonly unavailable: "Indisponible"; readonly bringOn: "Faire entrer"; readonly openFullCard: "Ouvrir la fiche complète du joueur"; }; readonly teamPanel: { readonly inTheirHalf: "Dans leur camp"; readonly clear: "Effacer"; readonly roster: "Effectif"; readonly tacticalRoles: "Rôles Tactiques"; readonly rosterTooltipClub: "Gérer l'effectif, les noms, numéros de maillot et postes de Mon Équipe"; readonly rosterTooltipOpponent: "Gérer l'effectif, les noms, numéros de maillot et postes de l'équipe adverse"; readonly rolesTooltipClub: "Désigner le Capitaine, Penaltys, Corners et Coups Francs de Mon Équipe"; readonly rolesTooltipOpponent: "Désigner Capitaine, Penaltys, Corners et Coups Francs de l'équipe adverse"; readonly lockedProRoster: "🔒 La gestion de l'effectif adverse est réservée aux formules PRO & PRO+."; readonly lockedProRoles: "🔒 La configuration des rôles adverses est réservée aux formules PRO & PRO+."; readonly formationLabel: "SCHÉMA :"; readonly expandClub: "Agrandir le panneau Mon Équipe"; readonly collapseClub: "Réduire le panneau Mon Équipe"; readonly expandOpponent: "Agrandir le panneau Mon Adversaire"; readonly collapseOpponent: "Réduire le panneau Mon Adversaire"; readonly unfoldBtn: "Déplier"; readonly foldBtn: "Réduire"; readonly addOpponentBtn: "+ Adv"; readonly addOpponentTooltip: "Ajouter un joueur dans l'équipe adverse"; readonly regroupClubTooltip: "Regrouper les joueurs dans leur camp"; readonly regroupOpponentTooltip: "Regrouper les joueurs adverses dans leur camp"; }; readonly drawingOverlay: { readonly selectedStroke: "TRACÉ SÉLECTIONNÉ"; readonly deleteStroke: "Supprimer tracé"; readonly deleteStrokeTooltip: "Supprimer ce tracé sélectionné"; readonly undo: "Annuler"; readonly undoTooltip: "Annuler le dernier tracé (Ctrl+Z)"; readonly clearAll: "Tout effacer"; readonly clearAllTooltip: "Effacer tous les tracés sur le terrain"; readonly closeMenu: "Fermer le menu"; }; readonly pitchBadges: { readonly cornerFlag: "Drapeau de corner"; readonly yellowCard: "Carton Jaune 🟨"; readonly scorer: (goals: number) => string; readonly assist: (assists: number) => string; readonly fitnessTitle: (status: string) => string; readonly fitnessFit: "En forme ⚡"; readonly fitnessTired: "Fatigué 🥱"; readonly fitnessInjured: "Blessé 🩹"; readonly fitnessSuspended: "Suspendu 🟥"; readonly captain: "Capitaine d'Équipe 👑"; readonly cornerTaker: "Tireur de Corner 🚩"; readonly freeKickTaker: "Tireur de Coup Franc ⚡"; readonly penaltyTaker: "Tireur de Penalty ⚽ (11m)"; }; readonly animation: { readonly prevStep: "Étape Précédente"; readonly nextStep: "Étape Suivante"; readonly pause: "Mettre en Pause"; readonly play: "Lancer la Lecture animée"; readonly stepNumber: (idx: number) => string; readonly deleteStepTooltip: (idx: number) => string; readonly stepDeletedToast: (idx: number) => string; readonly saveAnimation: "Enregistrer l'animation (Disquette)"; readonly newStep: "Ajouter une nouvelle étape"; readonly deleteCurrentStep: "Supprimer l'étape actuelle"; readonly resetAnimation: "Réinitialiser toute l'animation"; readonly atLeastOneStepToast: "⚠️ Vous devez conserver au moins 1 étape dans l'animation."; readonly resetAnimationToast: "🔄 Séquences d'animation réinitialisées."; }; readonly sidebar: { readonly resizeTooltip: "Glisser avec la souris pour ajuster la largeur (Double-clic pour réinitialiser)"; readonly openSidebarBtn: "SCHÉMAS & MATCHS"; readonly notesTitle: "NOTES & CAUSERIE"; readonly quickNotePlaceholder: "Ajouter une consigne tactique rapide…"; readonly openSidebarTooltip: "Ouvrir le panneau droit (Schémas, Matchs & Notes)"; readonly closeSidebarTooltip: "Fermer le panneau"; readonly switchTeamTooltip: "Changer d'équipe ou gérer vos équipes (PRO)"; }; }; readonly sports: { readonly football: "⚽ Football"; readonly basketball: "🏀 Basketball"; readonly rugby: "🏉 Rugby"; readonly handball: "🤾 Handball"; }; readonly landing: { readonly brandTagline: "zone de décision tactique"; readonly faqHelp: "FAQ & Aide"; readonly contact: "Contact"; readonly login: "Se Connecter"; readonly register: "Créer un Compte"; readonly langSwitchAria: "Changer la langue"; readonly hero: { readonly badge: "THE BOX • ZONE DE DÉCISION TACTIQUE"; readonly titlePrefix: "Pensez, Modélisez & Transmettez vos "; readonly titleHighlight: "Schémas Tactiques"; readonly subtitle: "Le tableau blanc tactique 2D de référence pour les entraîneurs. Préparez vos matchs et modélisez vos combinaisons sur terrain officiel avec précision."; readonly ctaBoard: "Accéder au Tableau Tactique"; readonly ctaRegister: "Créer un Compte Coach"; readonly highlightAnimations: "Animations & Schémas Tactiques"; readonly highlightAnalysis: "Analyse & Causerie Intégrées"; readonly highlightExport: "Export Fiches HD & Playbook"; }; readonly sports: { readonly tag: "FOOTBALL À 5, 8 ET 11"; readonly title: (count: number) => string; readonly subtitle: "Accédez instantanément aux règles de jeu, dimensions de terrain et compositions tactiques homologuées."; readonly footballLabel: "Football"; readonly footballPlayers: "11 Joueurs"; readonly footballFormations: "4-4-2, 4-3-3, 4-2-3-1"; readonly basketballLabel: "Basketball"; readonly basketballPlayers: "5 Joueurs"; readonly basketballFormations: "2-3, 1-2-2, 5-Out"; readonly rugbyLabel: "Rugby"; readonly rugbyPlayers: "15 Joueurs"; readonly rugbyFormations: "Standard, Pack Ruck"; readonly handballLabel: "Handball"; readonly handballPlayers: "7 Joueurs"; readonly handballFormations: "6-0, 5-1, 3-2-1"; }; readonly useCases: { readonly tag: "L'APPLICATION EN CONDITIONS RÉELLES"; readonly titleLine1: "Pensé pour le Terrain,"; readonly titleHighlight: "du Bureau au Coup de Sifflet Final"; readonly subtitle: "Une expérience fluide conçue pour chaque moment clé : préparez vos stratégies à froid, fédérez vos joueurs dans le vestiaire et réagissez en direct sur le banc de touche."; readonly tryFeature: "Tester cette fonctionnalité"; readonly case1Tag: "AU BUREAU & À LA MAISON"; readonly case1Title: "Analyse & Modélisation Stratégique"; readonly case1Desc: "Préparez vos séances et vos matchs en toute sérénité. Concevez vos combinaisons tactiques, étudiez l'adversaire et synchronisez vos schémas entre grand écran et tablette tactile."; readonly case1Highlights: readonly ["Tracés vectoriels précis & phases de jeu animées", "Modélisation complète du bloc adverse & pressing", "Attribution des tireurs de coups arrêtés & effectif"]; readonly case2Tag: "DANS LE VESTIAIRE"; readonly case2Title: "Causerie Tactique & Cohésion d'Équipe"; readonly case2Desc: "Projetez vos plans de jeu sur grand écran ou TV dans le vestiaire. Offrez à vos joueurs une lecture claire et dynamique des consignes pour une adhésion totale avant le coup d'envoi."; readonly case2Highlights: readonly ["Affichage immersif grand format pour tout le groupe", "Ajustements tactiques percutants à la mi-temps", "Notes de causerie & consignes individuelles claires"]; readonly case3Tag: "SUR LE BANC DE TOUCHE"; readonly case3Title: "Coaching en Direct & Mode Live Match"; readonly case3Desc: "Emportez votre tablette au bord de la pelouse le jour de match. Ajustez votre dispositif en temps réel, réalisez vos changements tactiques et enregistrez chaque fait marquant."; readonly case3Highlights: readonly ["Mode Live Match & chronomètre officiel de rencontre", "Remplacements et réorganisations instantanées", "Statistiques en direct : buts, cartons, tirs & passes"]; }; readonly features: { readonly tag: "POUR LES STAFFS EXIGEANTS"; readonly title: "Conçu pour l'Excellence Tactique"; readonly subtitle: "De la préparation stratégique à la causerie d'avant-match, the box centralise vos décisions tactiques."; readonly items: readonly [{ readonly tag: "TABLEAU BLANC MULTI-OUTILS"; readonly title: "Tableau Blanc Tactique 2D Haute Précision"; readonly desc: "Tracés vectoriels précis : flèches de passe, courses en pointillés, blocs défensifs, zones de pressing et formes géométriques pour modéliser toutes vos phases de jeu."; }, { readonly tag: "EXCLUSIVITÉ FORMULE PRO+"; readonly title: "Mode Live Match & Stats en Direct (PRO+)"; readonly desc: "Chronomètre officiel en bord de terrain : enregistrez en direct les buts, passes décisives, cartons jaunes/rouges, blessures et remplacements tactiques instantanés."; }, { readonly tag: "MULTI-ÉQUIPES & CALENDRIER"; readonly title: "Multi-Équipes & Schémas Isolés"; readonly desc: "Gérez plusieurs catégories (Seniors A, Réserve, U19). Chaque match planifié conserve ses propres schémas tactiques dédiés et son historique sans confusion."; }, { readonly tag: "EFFECTIF & COUPS ARRÊTÉS"; readonly title: "Effectif, Photos & Coups Arrêtés"; readonly desc: "Personnalisation complète de l'effectif, photos des joueurs, états de forme et attribution précise des tireurs de corners, penaltys, coups francs et capitaine."; }, { readonly tag: "CAUSERIE & ANALYSE DU BLOC"; readonly title: "Causerie Tactique & Bloc Adverse"; readonly desc: "Modélisez le dispositif adverse pour construire vos plans de jeu anti-pressing, préparez vos consignes clés et motivez vos joueurs avec une préparation claire."; }, { readonly tag: "EXPORTS HD & PARTAGE DIRECT"; readonly title: "Exportation Haute Définition & Partage Staff"; readonly desc: "Sauvegardez vos compositions et exportez vos schémas tactiques en image Haute Définition (PNG HD) avec partage instantané par messagerie ou email vers votre staff."; }]; }; readonly pricing: { readonly tag: "GRILLE TARIFAIRE & OFFRES"; readonly title: "Des Tarifs Clairs & Sans Engagement"; readonly subtitle: "Du coach indépendant au staff professionnel, découvrez la formule adaptée à vos objectifs."; readonly perMonth: "/ mois"; readonly recommendedBadge: "⭐ RECOMMANDÉ"; readonly freeTag: "DÉCOUVERTE & ESSAI"; readonly freeTitle: "Version Gratuite"; readonly freeDesc: "Idéal pour découvrir le tableau tactique et préparer ses séances."; readonly freePrice: "0€"; readonly freeCta: "Créer un Compte Gratuit"; readonly freeFeatures: readonly ["Tableau blanc tactique 2D & tracés vectoriels", "Personnalisation complète de l'effectif", "Gestion des rôles des joueurs", "Export en PNG du terrain", "Visibilité du terrain complet ou à moitié, en portrait ou paysage"]; readonly proTag: "INDIVIDUEL PRO"; readonly proTitle: "Formule PRO"; readonly proDesc: "Pour l'entraîneur qui veut gérer ses équipes, matchs, schémas et causeries vocales."; readonly proPrice: "9.90€"; readonly proCtaTrial: "Essai 14 Jours Offert • Créer un Compte"; readonly proCtaSubscribe: "S'abonner à la Formule PRO (9.90€ / mois)"; readonly proRedirecting: "Redirection..."; readonly proFeatures: readonly ["Toutes les fonctionnalités Gratuite", "Gestion multi-équipes pour un seul utilisateur", "Enregistrements des schémas tactiques liés au match sélectionné", "Partage des schémas tactiques (WhatsApp & Mail)", "Enregistrements vocales et saisies de notes activés", "Gestion des matchs", "Gestion de l'équipe adverse"]; readonly proPlusTag: "🔥 PERFORMANCE & LIVE MATCH"; readonly proPlusTitle: "Formule PRO+"; readonly proPlusDesc: "Pour le suivi en direct le jour de match avec le mode live interactif."; readonly proPlusPrice: "14.90€"; readonly proPlusCtaTrial: "Essai 14 Jours Offert • Créer un Compte"; readonly proPlusCtaSubscribe: "S'abonner à la Formule PRO+ (14.90€ / mois)"; readonly proPlusFeatures: readonly ["Toutes les fonctionnalités PRO", "Activation du mode live match possible"]; }; readonly contactSection: { readonly tag: "Formulaire de Contact"; readonly title1: "Une question ou un projet ?"; readonly titleHighlight: "Échangez avec l'équipe The Box"; readonly subtitle: "Vous souhaitez équiper votre club, planifier une démonstration privée ou obtenir des informations techniques ? Remplissez ce formulaire et recevez une réponse directement par email."; readonly whyTitle: "Pourquoi nous contacter ?"; readonly whySubtitle: "Une écoute attentive pour vos besoins sportifs"; readonly guaranteeTitle: "Réponse rapide garantie"; readonly guaranteeDesc: "Notre équipe pédagogique et technique s'engage à vous répondre sous 24h ouvrées."; readonly clubTitle: "Solutions Clubs & Académies"; readonly clubDesc: "Tarifs groupés, multi-licences et accompagnement pour harmoniser le projet de jeu de toutes vos équipes."; readonly demoTitle: "Démonstration personnalisée"; readonly demoDesc: "Découvrez en visio toutes les fonctionnalités avancées (Live Match, causerie, exports HD) avec nos experts."; readonly channelAdmin: "Email de contact direct (Admin)"; readonly channelSecure: "Canal officiel & sécurisé"; readonly channelDirectBox: "Formulaire Direct The Box"; readonly directSending: "Envoi direct :"; readonly teamTheBox: "Équipe The Box"; readonly badgeAdmin: "Admin"; readonly badgeSecure: "Sécurisé"; readonly fieldFullName: "Votre Nom complet *"; readonly placeholderFullName: "ex: Pep Guardiola"; readonly fieldEmail: "Votre Adresse Email *"; readonly placeholderEmail: "coach@club.com"; readonly fieldPhone: "Téléphone (optionnel)"; readonly placeholderPhone: "ex: +33 6 12 34 56 78"; readonly fieldClub: "Club ou Structure (optionnel)"; readonly placeholderClub: "ex: Olympique Lyonnais, Académie..."; readonly fieldSport: "Discipline principale"; readonly fieldReason: "Motif de contact *"; readonly fieldSubject: "Sujet de votre message (optionnel)"; readonly placeholderSubject: "ex: Devis pour 5 licences d'entraîneurs"; readonly fieldMessage: "Votre message détaillé *"; readonly placeholderMessage: "Bonjour, j'aimerais en savoir plus sur..."; readonly submitting: "Transmission en cours..."; readonly submitBtn: "Envoyer mon message"; readonly secureTransmission: "Transmission directe et sécurisée • Réponse garantie sous 24h."; readonly successTitle: "Message envoyé avec succès !"; readonly successDesc: "Merci pour votre prise de contact. Notre équipe a bien reçu votre demande et vous répondra à l'adresse indiquée dans les plus brefs délais."; readonly sendAnother: "Envoyer un autre message"; readonly errorsEmail: "Veuillez renseigner votre adresse email."; readonly errorsMessage: "Veuillez renseigner votre message."; readonly errorsGeneric: "Une erreur est survenue lors de l'envoi."; readonly errorsFallback: "Impossible d'envoyer votre message pour le moment. Veuillez réessayer."; readonly reasons: { readonly info: "Renseignements généraux"; readonly club: "Offre Club / Multi-équipes"; readonly demo: "Demande de démonstration"; readonly partnership: "Partenariat / Presse"; readonly other: "Autre demande"; }; readonly sportsOptions: { readonly football: "Football ⚽"; readonly basketball: "Basketball 🏀"; readonly rugby: "Rugby 🏉"; readonly handball: "Handball 🤾"; readonly multisport: "Multi-sports 🏆"; }; }; readonly footer: { readonly brandTagline: "zone de décision tactique"; readonly faqHelp: "FAQ & Aide"; readonly cgu: "CGU"; readonly cgv: "CGV"; readonly contactUs: "Nous Contacter"; readonly contactSupport: "Contact Support"; readonly copyright: (year: number) => string; }; }; } | { readonly appTitle: "The Box - Tactical Decision Zone"; readonly appDescription: "Professional coaching and tactical whiteboard application."; readonly userMenu: { readonly profileTitle: "Profile & Account Options"; readonly profileAriaLabel: "User profile menu"; readonly adminBadge: "ADMIN"; readonly platformAdmin: "👑 Platform Admin"; readonly adminConsole: "Platform Admin Console"; readonly activeBadge: "ACTIVE"; readonly freePlan: "Free Plan"; readonly proPlan: "PRO Plan"; readonly proPlusPlan: "PRO+ Plan"; readonly unsubscribe: "Unsubscribe"; readonly unsubscribeConfirmTitle: "Cancel Subscription"; readonly unsubscribeTooltip: "Unsubscribe from application and revert to free tier"; readonly demoTrialTime: "Demo / Trial Period (14d)"; readonly tutorial: "Tutorial & Quickstart Guide"; readonly userGuide: "User Guide"; readonly faq: "Frequently Asked Questions (FAQ)"; readonly contactSupport: "Contact Support (Email)"; readonly displayTheme: "Display Theme"; readonly lightDesign: "Light Design"; readonly darkDesign: "Dark Design"; readonly switchToDark: "Switch to Dark theme"; readonly switchToLight: "Switch to Light theme"; readonly themeActive: "Active"; readonly themeClassic: "Classic"; readonly languageSection: "Application Language"; readonly langFr: "Français"; readonly langEn: "English"; readonly profileConfig: "Profile & Sport Settings"; readonly logout: "Sign Out"; readonly logoutTooltip: "Sign Out (Return to landing page)"; }; readonly userModal: { readonly title: "USER SETTINGS"; readonly subtitle: "Customize your coach profile, language and subscription."; readonly close: "Close"; readonly firstName: "First Name *"; readonly lastName: "Last Name *"; readonly email: "Login Email Address *"; readonly primaryAccount: "📧 Primary Account"; readonly club: "Club / Team"; readonly clubPlaceholder: "e.g. Manchester City"; readonly role: "Role within the club"; readonly roles: { readonly principal: "Head Coach"; readonly adjoint: "Assistant Coach"; readonly analyst: "Tactical / Video Analyst"; readonly fitness: "Fitness Coach"; readonly techDirector: "Technical Director"; }; readonly languageTitle: "Interface Language"; readonly languageSubtitle: "(Choose French or English for the entire application)"; readonly languageFrDesc: "Interface complète en français"; readonly languageEnDesc: "Full interface in English"; readonly themeTitle: "Interface Theme & Appearance"; readonly themeSubtitle: "(Dark Mode or Clean Light Mode)"; readonly lightActive: "Clean Light Mode (Active)"; readonly darkActive: "Classic Dark Mode (Active)"; readonly lightDesc: "Bright, modern and spacious high-contrast interface"; readonly darkDesc: "Original classic dark contrast"; readonly sportTitle: "Sport Discipline"; readonly sportAdminNote: "(Admin View - All Sports)"; readonly sportUserNote: "(Authorized Sports Disciplines)"; readonly sportBlocked: "🔒 (BLOCKED FOR USERS)"; readonly billingTitle: "Subscription & Billing Management"; readonly securePayment: "SECURE PAYMENT ⚡"; readonly currentPlan: "Current plan:"; readonly adminLicense: "👑 Unlimited Admin License"; readonly billingNote: "Secure portal • Online changes and billing with no long-term commitment."; readonly changePlan: "Change Subscription"; readonly freeDemo: "Free Demo"; readonly proPlanCard: "PRO Plan"; readonly proPlusPlanCard: "PRO+ Plan"; readonly cancel: "Cancel"; readonly save: "Save Settings"; readonly saving: "Saving..."; readonly validationName: "Please enter your first and last name."; readonly validationEmail: "Please enter a valid login email address."; readonly sportBlockedAlert: (sport: string) => string; readonly successToast: "✅ Profile and preferences successfully updated!"; }; readonly tactics: { readonly adminBadgeTooltip: "The Box Admin Account: Full unrestricted access across all features"; readonly freeBadgeTooltip: "Free plan active. Click to upgrade to PRO."; readonly trialBadgeTooltip: "PRO trial period (14 Days) active"; readonly tutorialTooltip: "Open interactive coach tutorial and guide"; readonly cloudSyncTooltip: "Cloud persistence & synchronization active via Firebase Firestore"; readonly pwaInstallTooltip: "Install The Box app"; readonly myClub: "My Team"; readonly myOpponent: "Opponent"; readonly expandPanel: (team: string) => string; readonly collapsePanel: (team: string) => string; readonly unfoldPanel: (team: string) => string; readonly regroupPlayers: "Regroup players in their half"; readonly manageRoster: "Manage roster, names, jersey numbers and positions"; readonly manageSetPieces: "Assign Captain, Penalties, Corners and Free Kicks"; readonly addOpponentPlayer: "Add a player to opponent team"; readonly toolsSection: "TOOLS"; readonly strokeSection: "STROKE"; readonly exportSection: "EXPORT"; readonly tools: { readonly select: "Selector"; readonly selectBtn: "Select"; readonly move: "Move"; readonly moveBtn: "Move"; readonly line: "Line"; readonly dashedLine: "Dashed"; readonly solidLine: "Line"; readonly lineTooltipDashedActive: "Dashed line active (click to switch to solid)"; readonly lineTooltipSolidActive: "Solid line active (click to switch to dashed)"; readonly lineTooltipDefault: "Draw a Tactical Line (Solid or Dashed)"; readonly arrow: "Running Arrow"; readonly arrowBtn: "Arrow"; readonly passArrow: "Pass Arrow"; readonly runArrow: "Run Arrow"; readonly dribbleArrow: "Dribble Arrow"; readonly draw: "Freehand Draw"; readonly drawBtn: "Brush"; readonly freehand: "Freehand Draw"; readonly clearDrawings: "Clear all drawings"; readonly clearBtn: "Clear"; readonly zoneBtn: "Zone"; readonly zoneTooltip: "Draw a rectangular zone on the pitch"; readonly exportHdBtn: "HD Export"; readonly settingsBtn: "Settings"; readonly helpBtn: "Help"; readonly strokeOptions: "Line color and stroke width"; readonly exportPng: "Export HD PNG image"; readonly exportPdf: "Export match PDF"; readonly cardView3D: "3D Card View (Squad Export)"; readonly fullPitch: "Full Pitch"; readonly halfPitch: "Half Pitch"; readonly resetPitch: "Reset positions"; readonly undo: "Undo last action"; readonly redo: "Redo action"; readonly saveTactic: "Save tactic"; readonly savedTactics: "Tactics library"; readonly animationPlay: "Play animation"; readonly animationPause: "Pause"; readonly animationRecord: "Create keyframe"; readonly animationSpeed: "Animation speed"; readonly clearBoard: "Clear pitch"; readonly proBadgeActive: (plan: string) => string; readonly proBadgeAdmin: "PRO Admin Account Active"; readonly subscribePro: "Subscribe to PRO Plan"; }; readonly pitchModes: { readonly fullPitch: "Full Pitch"; readonly halfPitch: "Half Pitch"; readonly animationVideoActive: "Hide animation creator"; readonly animationVideoInactive: "Enable animation creator (Video)"; readonly animationLiveDisabled: "Animation is not available in Live Match mode"; readonly aspectDesktop: "Widescreen Ratio (Landscape)"; readonly aspectMobile: "Narrow Ratio (Portrait)"; readonly ballShow: "Show ball"; readonly ballHide: "Hide ball"; readonly opponentsShow: "Show opponents"; readonly opponentsHide: "Hide opponents"; readonly namesShow: "Show player names"; readonly namesHide: "Hide player names (numbers only)"; readonly panelsUnfold: "Unfold team panels (My Team & Opponent)"; readonly panelsCollapse: "Collapse team panels to enlarge pitch"; readonly pitchZoom: "Pitch scale"; readonly playerZoom: "Player size"; readonly zoomIn: "Zoom in pitch"; readonly zoomOut: "Zoom out pitch"; readonly playerZoomIn: "Enlarge player size"; readonly playerZoomOut: "Reduce player size"; readonly fullscreenEnter: "Fullscreen"; readonly fullscreenExit: "Exit fullscreen"; readonly simulatePhase: "Simulate Phase"; readonly simulatePhaseTooltip: "Play the steps of this phase, or open the animation editor to create them"; readonly strokeThin: "Thin"; readonly strokeMedium: "Medium"; readonly strokeThick: "Thick"; readonly repPastille: "Dot / Chip"; readonly repBuste: "Jersey / Torso"; readonly repTete: "Player Head"; readonly repTitle: "Player representation: Dot, Jersey or Head"; }; readonly playerCard: { readonly close: "Close player card"; readonly nameLabel: "NAME:"; readonly namePlaceholder: "Player name"; readonly numberLabel: "NO:"; readonly numberTooltip: "Unique number (only available numbers are shown)"; readonly roleLabel: "ROLE:"; readonly rolePlaceholder: "Position"; readonly photoLabel: "PHOTO:"; readonly myClubBadge: "MY TEAM"; readonly myOpponentBadge: "OPPONENT"; readonly benchSubModalBtn: "Bench card"; readonly benchSubModalTooltip: "Open full modal with cards and photos of all substitutes"; readonly subOutBtn: "Sub out"; readonly subOutTooltip: "Normal player exit (no substitution)"; readonly injuryBtn: "Injury"; readonly injuryTooltip: "Exit on injury"; readonly liveActionsHeader: "LIVE ACTIONS:"; readonly addGoalBtn: "+1 GOAL"; readonly addGoalTooltip: "Add a goal for this player"; readonly addAssistBtn: "+1 ASSIST"; readonly addAssistTooltip: "Add an assist for this player"; readonly yellowCardBtn: "YELLOW CARD"; readonly yellowCardTooltip: "Issue a yellow card"; readonly redCardBtn: "RED CARD"; readonly redCardTooltip: "Expulsion (Red Card)"; readonly tokenHoverLive: (name: string) => string; readonly tokenHoverSub: (name: string) => string; readonly tokenHoverDrag: "Drag to move"; readonly globalStatsHeader: "GLOBAL STATS:"; readonly goalsLabel: "Goals:"; readonly assistsLabel: "Assists:"; readonly yellowsLabel: "Yellow:"; readonly redsLabel: "Red:"; readonly fitnessLabel: "Form:"; readonly formExcellent: "⭐ Excellent"; readonly formFit: "✅ Fit"; readonly replacementHeader: "SUBSTITUTION:"; readonly noSubsAvailable: "No substitutes available on the bench"; readonly selectSubTooltip: "Select a substitute on the bench to make the change"; readonly selectSubPlaceholder: "🔄 Select a substitute on the bench..."; readonly alreadyOnPitch: " [Already on pitch]"; readonly injuredTag: " [Injured 🏥]"; readonly tiredTag: " [Tired ⚠️]"; }; readonly liveToolbox: { readonly player: "PLAYER"; readonly goalBtn: "scorer (g)"; readonly goalTooltip: "Add a goal for this player (Keyboard: G)"; readonly assistBtn: "assister (a)"; readonly assistTooltip: "Add an assist for this player (Keyboard: A)"; readonly yellowBtn: "yellow card (YC)"; readonly yellowTooltip: "Give a yellow card (YC) - 2nd = red card (Keyboard: Y)"; readonly redBtn: "red card (RC)"; readonly redTooltip: "Red card (RC) - Immediate expulsion (Keyboard: R)"; readonly injuryBtn: "injury (I)"; readonly injuryTooltip: "Injury (I) - Sub out on injury and offer substitution"; readonly substituteBtn: "Substitute"; readonly substituteTooltip: "Make a substitution for this player"; readonly closeTooltip: "Close player options"; }; readonly subModal: { readonly title: "Make a Substitution"; readonly subtitleOpponent: "Select an opponent bench substitute to replace this player"; readonly subtitleHome: "Select a bench substitute to replace this player"; readonly close: "Close"; readonly starter: "STARTER"; readonly playerLeaving: "🚪 Player leaving the pitch"; readonly simpleExit: "🚪 Sub out"; readonly simpleExitTooltip: "Take off without replacement"; readonly injuryExit: "🏥 Injury"; readonly injuryExitTooltip: "Exit on injury"; readonly benchSubstitutes: (count: number) => string; readonly confirmHint: "Click \"Bring on\" to confirm"; readonly noSubsOpponent: "No substitutes on opponent bench."; readonly noSubsHome: "No substitutes on match sheet."; readonly onPitch: "On pitch"; readonly injured: "🏥 Injured"; readonly sentOff: "🟥 Sent off"; readonly topForm: "⭐ In top form"; readonly tired: "⚠️ Tired"; readonly available: "✅ Available"; readonly inGame: "In play"; readonly unavailable: "Unavailable"; readonly bringOn: "Bring on"; readonly openFullCard: "Open full player profile"; }; readonly teamPanel: { readonly inTheirHalf: "In their half"; readonly clear: "Clear"; readonly roster: "Squad"; readonly tacticalRoles: "Tactical Roles"; readonly rosterTooltipClub: "Manage roster, names, jersey numbers and positions for My Team"; readonly rosterTooltipOpponent: "Manage roster, names, jersey numbers and positions for Opponent"; readonly rolesTooltipClub: "Assign Captain, Penalties, Corners and Free Kicks for My Team"; readonly rolesTooltipOpponent: "Assign Captain, Penalties, Corners and Free Kicks for Opponent"; readonly lockedProRoster: "🔒 Opponent squad management is restricted to PRO & PRO+ plans."; readonly lockedProRoles: "🔒 Opponent tactical roles configuration is restricted to PRO & PRO+ plans."; readonly formationLabel: "FORMATION:"; readonly expandClub: "Expand My Team panel"; readonly collapseClub: "Collapse My Team panel"; readonly expandOpponent: "Expand Opponent panel"; readonly collapseOpponent: "Collapse Opponent panel"; readonly unfoldBtn: "Expand"; readonly foldBtn: "Collapse"; readonly addOpponentBtn: "+ Opp"; readonly addOpponentTooltip: "Add a player to opponent team"; readonly regroupClubTooltip: "Regroup players in their half"; readonly regroupOpponentTooltip: "Regroup opponent players in their half"; }; readonly drawingOverlay: { readonly selectedStroke: "SELECTED STROKE"; readonly deleteStroke: "Delete stroke"; readonly deleteStrokeTooltip: "Delete this selected stroke"; readonly undo: "Undo"; readonly undoTooltip: "Undo last stroke (Ctrl+Z)"; readonly clearAll: "Clear all"; readonly clearAllTooltip: "Clear all drawings on the pitch"; readonly closeMenu: "Close menu"; }; readonly pitchBadges: { readonly cornerFlag: "Corner flag"; readonly yellowCard: "Yellow Card 🟨"; readonly scorer: (goals: number) => string; readonly assist: (assists: number) => string; readonly fitnessTitle: (status: string) => string; readonly fitnessFit: "Fit ⚡"; readonly fitnessTired: "Tired 🥱"; readonly fitnessInjured: "Injured 🩹"; readonly fitnessSuspended: "Suspended 🟥"; readonly captain: "Team Captain 👑"; readonly cornerTaker: "Corner Taker 🚩"; readonly freeKickTaker: "Free Kick Taker ⚡"; readonly penaltyTaker: "Penalty Taker ⚽ (11m)"; }; readonly animation: { readonly prevStep: "Previous Step"; readonly nextStep: "Next Step"; readonly pause: "Pause"; readonly play: "Play animation"; readonly stepNumber: (idx: number) => string; readonly deleteStepTooltip: (idx: number) => string; readonly stepDeletedToast: (idx: number) => string; readonly saveAnimation: "Save animation (Disk)"; readonly newStep: "Add a new step"; readonly deleteCurrentStep: "Delete current step"; readonly resetAnimation: "Reset entire animation"; readonly atLeastOneStepToast: "⚠️ You must keep at least 1 step in the animation."; readonly resetAnimationToast: "🔄 Animation sequences reset."; }; readonly sidebar: { readonly resizeTooltip: "Drag to adjust panel width (Double-click to reset)"; readonly openSidebarBtn: "TACTICS & MATCHES"; readonly notesTitle: "NOTES & TEAM TALK"; readonly quickNotePlaceholder: "Add a quick tactical instruction…"; readonly openSidebarTooltip: "Open right panel (Tactics, Matches & Notes)"; readonly closeSidebarTooltip: "Close panel"; readonly switchTeamTooltip: "Switch team or manage teams (PRO)"; }; }; readonly sports: { readonly football: "⚽ Football (Soccer)"; readonly basketball: "🏀 Basketball"; readonly rugby: "🏉 Rugby"; readonly handball: "🤾 Handball"; }; readonly landing: { readonly brandTagline: "tactical decision zone"; readonly faqHelp: "FAQ & Help"; readonly contact: "Contact"; readonly login: "Sign In"; readonly register: "Create Account"; readonly langSwitchAria: "Switch language"; readonly hero: { readonly badge: "THE BOX • TACTICAL DECISION ZONE"; readonly titlePrefix: "Design, Model & Share your "; readonly titleHighlight: "Tactical Strategies"; readonly subtitle: "The leading 2D tactical whiteboard for coaches. Prepare your matches and design your set plays on official pitches with pinpoint precision."; readonly ctaBoard: "Access Tactical Board"; readonly ctaRegister: "Create Coach Account"; readonly highlightAnimations: "Tactical Animations & Plays"; readonly highlightAnalysis: "Built-in Analysis & Team Talks"; readonly highlightExport: "HD Playbook & Board Export"; }; readonly sports: { readonly tag: "5, 8 & 11-A-SIDE FOOTBALL"; readonly title: (count: number) => string; readonly subtitle: "Instant access to official rules, pitch dimensions and certified tactical formations."; readonly footballLabel: "Football (Soccer)"; readonly footballPlayers: "11 Players"; readonly footballFormations: "4-4-2, 4-3-3, 4-2-3-1"; readonly basketballLabel: "Basketball"; readonly basketballPlayers: "5 Players"; readonly basketballFormations: "2-3, 1-2-2, 5-Out"; readonly rugbyLabel: "Rugby"; readonly rugbyPlayers: "15 Players"; readonly rugbyFormations: "Standard, Pack Ruck"; readonly handballLabel: "Handball"; readonly handballPlayers: "7 Players"; readonly handballFormations: "6-0, 5-1, 3-2-1"; }; readonly useCases: { readonly tag: "THE APP IN REAL-WORLD CONDITIONS"; readonly titleLine1: "Built for the Field,"; readonly titleHighlight: "from the Office to the Final Whistle"; readonly subtitle: "A seamless experience designed for every crucial moment: prepare your strategies in advance, unite your squad in the locker room, and react live from the bench."; readonly tryFeature: "Try this feature"; readonly case1Tag: "AT THE OFFICE & AT HOME"; readonly case1Title: "Strategic Analysis & Modeling"; readonly case1Desc: "Prepare your training sessions and matches with confidence. Design tactical set pieces, analyze opponents, and sync playbooks across desktop and tablet."; readonly case1Highlights: readonly ["Precise vector drawings & animated play phases", "Comprehensive opponent shape & pressing modeling", "Set-piece taker assignments & squad management"]; readonly case2Tag: "IN THE LOCKER ROOM"; readonly case2Title: "Tactical Team Talk & Team Spirit"; readonly case2Desc: "Cast game plans onto large screens or TV in the locker room. Provide clear, dynamic instructions to ensure total team focus before kickoff."; readonly case2Highlights: readonly ["Immersive large-screen display for the entire squad", "Sharp tactical adjustments at half-time", "Team talk notes & clear individual instructions"]; readonly case3Tag: "ON THE SIDELINE BENCH"; readonly case3Title: "Live Coaching & Live Match Mode"; readonly case3Desc: "Take your tablet to the pitch on matchday. Adjust formations in real-time, execute tactical substitutions, and track key events on the fly."; readonly case3Highlights: readonly ["Live Match mode & official match timer", "Instant tactical subs and formation reorganizations", "Live statistics: goals, cards, shots & assists"]; }; readonly features: { readonly tag: "FOR DEMANDING COACHING STAFFS"; readonly title: "Engineered for Tactical Excellence"; readonly subtitle: "From tactical prep to pre-match speeches, the box unifies all your coaching decisions."; readonly items: readonly [{ readonly tag: "MULTI-TOOL WHITEBOARD"; readonly title: "High-Precision 2D Tactical Whiteboard"; readonly desc: "Precision vector tools: passing arrows, dotted runs, defensive blocks, pressing zones, and geometric shapes for every phase."; }, { readonly tag: "PRO+ EXCLUSIVE"; readonly title: "Live Match Mode & Live Stats (PRO+)"; readonly desc: "Pitchside official timer: record live goals, assists, yellow/red cards, injuries, and instant tactical substitutions."; }, { readonly tag: "MULTI-TEAM & SCHEDULE"; readonly title: "Multi-Team & Isolated Playbooks"; readonly desc: "Manage multiple squads (First Team, Reserves, U19). Every scheduled match retains its dedicated tactics and match history."; }, { readonly tag: "ROSTER & SET PIECES"; readonly title: "Roster, Photos & Set Pieces"; readonly desc: "Full squad customization, player photos, fitness tracking, and designated takers for corners, penalties, free-kicks, and captain."; }, { readonly tag: "TEAM TALK & OPPONENT ANALYSIS"; readonly title: "Tactical Talk & Opponent Setup"; readonly desc: "Model opponent formations to build counter-pressing schemes, prepare key directives, and energize your players with clarity."; }, { readonly tag: "HD EXPORT & DIRECT SHARE"; readonly title: "High-Definition Export & Staff Sharing"; readonly desc: "Save lineups and export tactical boards in high-definition PNG with instant sharing via messaging or email to your staff."; }]; }; readonly pricing: { readonly tag: "PRICING & PLANS"; readonly title: "Clear Pricing & No Commitment"; readonly subtitle: "From solo coaches to professional staffs, find the right plan for your ambitions."; readonly perMonth: "/ month"; readonly recommendedBadge: "⭐ RECOMMENDED"; readonly freeTag: "DISCOVERY & TRIAL"; readonly freeTitle: "Free Version"; readonly freeDesc: "Ideal for discovering the tactical board and planning training sessions."; readonly freePrice: "€0"; readonly freeCta: "Create Free Account"; readonly freeFeatures: readonly ["2D tactical whiteboard & vector drawing tools", "Complete squad roster customization", "Player roles and position management", "High-resolution PNG pitch export", "Full or half pitch view in portrait or landscape"]; readonly proTag: "INDIVIDUAL PRO"; readonly proTitle: "PRO Plan"; readonly proDesc: "For the coach who wants to manage multiple squads, matches, tactics, and audio notes."; readonly proPrice: "€9.90"; readonly proCtaTrial: "14-Day Free Trial • Create Account"; readonly proCtaSubscribe: "Subscribe to PRO Plan (€9.90 / month)"; readonly proRedirecting: "Redirecting..."; readonly proFeatures: readonly ["All Free features included", "Multi-team management for a single coach", "Save tactical schemes linked to selected matches", "Share tactical plans via WhatsApp & Email", "Voice recordings and tactical notes enabled", "Match schedule and game management", "Opponent team scouting and setup"]; readonly proPlusTag: "🔥 PERFORMANCE & LIVE MATCH"; readonly proPlusTitle: "PRO+ Plan"; readonly proPlusDesc: "For live matchday tracking with interactive live match mode."; readonly proPlusPrice: "€14.90"; readonly proPlusCtaTrial: "14-Day Free Trial • Create Account"; readonly proPlusCtaSubscribe: "Subscribe to PRO+ Plan (€14.90 / month)"; readonly proPlusFeatures: readonly ["All PRO features included", "Interactive Live Match mode unlocked"]; }; readonly contactSection: { readonly tag: "Contact Form"; readonly title1: "A question or a project?"; readonly titleHighlight: "Connect with The Box team"; readonly subtitle: "Looking to equip your club, schedule a private demonstration or get technical information? Fill out this form and receive a direct reply by email."; readonly whyTitle: "Why contact us?"; readonly whySubtitle: "Attentive support for all your sporting needs"; readonly guaranteeTitle: "Fast reply guaranteed"; readonly guaranteeDesc: "Our coaching and technical support team commits to answering within 24 business hours."; readonly clubTitle: "Clubs & Academies Solutions"; readonly clubDesc: "Group pricing, multi-license packages, and tailored onboarding to unify your club's playing philosophy."; readonly demoTitle: "Personalized Demonstration"; readonly demoDesc: "Discover all advanced features (Live Match, team talks, HD exports) in a 1-on-1 video call with our specialists."; readonly channelAdmin: "Direct contact email (Admin)"; readonly channelSecure: "Official & secure channel"; readonly channelDirectBox: "Direct The Box Form"; readonly directSending: "Direct sending to:"; readonly teamTheBox: "The Box Team"; readonly badgeAdmin: "Admin"; readonly badgeSecure: "Secure"; readonly fieldFullName: "Your Full Name *"; readonly placeholderFullName: "e.g. Pep Guardiola"; readonly fieldEmail: "Your Email Address *"; readonly placeholderEmail: "coach@club.com"; readonly fieldPhone: "Phone (optional)"; readonly placeholderPhone: "e.g. +1 555 123 4567"; readonly fieldClub: "Club or Organization (optional)"; readonly placeholderClub: "e.g. Manchester City, Academy..."; readonly fieldSport: "Primary Sport"; readonly fieldReason: "Reason for contact *"; readonly fieldSubject: "Message Subject (optional)"; readonly placeholderSubject: "e.g. Quote for 5 coaching licenses"; readonly fieldMessage: "Your detailed message *"; readonly placeholderMessage: "Hello, I would like to know more about..."; readonly submitting: "Sending in progress..."; readonly submitBtn: "Send My Message"; readonly secureTransmission: "Direct and secure transmission • Guaranteed response within 24h."; readonly successTitle: "Message successfully sent!"; readonly successDesc: "Thank you for getting in touch. Our team has received your inquiry and will reply to the provided email address as soon as possible."; readonly sendAnother: "Send another message"; readonly errorsEmail: "Please enter your email address."; readonly errorsMessage: "Please enter your message."; readonly errorsGeneric: "An error occurred while sending."; readonly errorsFallback: "Unable to send your message at this time. Please try again."; readonly reasons: { readonly info: "General Information"; readonly club: "Club / Multi-team Offer"; readonly demo: "Demo Request"; readonly partnership: "Partnership / Press"; readonly other: "Other Inquiry"; }; readonly sportsOptions: { readonly football: "Football (Soccer) ⚽"; readonly basketball: "Basketball 🏀"; readonly rugby: "Rugby 🏉"; readonly handball: "Handball 🤾"; readonly multisport: "Multi-sports 🏆"; }; }; readonly footer: { readonly brandTagline: "tactical decision zone"; readonly faqHelp: "FAQ & Help"; readonly cgu: "Terms of Use"; readonly cgv: "Terms of Sale"; readonly contactUs: "Contact Us"; readonly contactSupport: "Support Contact"; readonly copyright: (year: number) => string; }; }; };
  toggleModernSleek: () => void;
  userConfigSection: "profile" | "preferences" | "sport" | "billing";
}

export default function UserSettingsModal({
  activePlan,
  blockedSports,
  clubLogoError,
  currentLang,
  deleteAccountConfirm,
  deleteAccountError,
  editClub,
  editClubLogo,
  editEmail,
  editFirstName,
  editLanguage,
  editLastName,
  editRole,
  editShowLogoOnPitch,
  editSport,
  handleCancelAccountDeletion,
  handleDeleteOwnAccount,
  handleSaveUserConfig,
  isDeleteAccountOpen,
  isDeletingAccount,
  isModernSleek,
  isUserAdmin,
  isUserConfigModalOpen,
  scheduledDeletionAt,
  setActivePlan,
  setClubLogoError,
  setDeleteAccountConfirm,
  setDeleteAccountError,
  setEditClub,
  setEditClubLogo,
  setEditEmail,
  setEditFirstName,
  setEditLanguage,
  setEditLastName,
  setEditRole,
  setEditShowLogoOnPitch,
  setEditSport,
  setIsCheckoutOpen,
  setIsDeleteAccountOpen,
  setIsUserConfigModalOpen,
  setUserConfigSection,
  t,
  toggleModernSleek,
  userConfigSection,
}: UserSettingsModalProps) {
  return (
    <>
        {/* MODAL : CONFIGURATION DE L'UTILISATEUR (même gabarit que la console admin) */}
        {/* ========================================================= */}
        {isUserConfigModalOpen && (() => {
          const en = currentLang === "en";
          const th = isModernSleek
            ? {
              panel: "bg-white text-slate-900 border-slate-200",
              sidebar: "bg-slate-50 border-slate-200",
              border: "border-slate-200",
              card: "bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
              cardMuted: "bg-slate-50 border-slate-200",
              text: "text-slate-900",
              sub: "text-slate-500",
              faint: "text-slate-400",
              input: "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
              navActive: "bg-white text-slate-900 border-slate-200 shadow-sm",
              navIdle: "text-slate-500 border-transparent hover:text-slate-900 hover:bg-white/70",
              ghostBtn: "bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
              primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20",
              chip: "bg-slate-100 text-slate-600 border-slate-200",
              gold: "text-amber-600",
              goldChip: "bg-amber-50 text-amber-700 border-amber-200",
              goldTile: "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200 text-amber-600",
              accent: "text-emerald-600",
              accentChip: "bg-emerald-50 text-emerald-700 border-emerald-200",
              selected: "bg-white border-emerald-500 ring-2 ring-emerald-500/15",
              selectable: "bg-white border-slate-200 hover:border-slate-300",
              segment: "bg-slate-100 border-slate-200",
              segmentActive: "bg-white text-slate-900 shadow-sm",
              segmentIdle: "text-slate-500 hover:text-slate-800",
              option: "",
            }
            : {
              panel: "bg-[#0a0d13] text-white border-white/[0.08]",
              sidebar: "bg-[#07090e] border-white/[0.06]",
              border: "border-white/[0.06]",
              card: "bg-white/[0.025] border-white/[0.07]",
              cardMuted: "bg-white/[0.02] border-white/[0.06]",
              text: "text-white",
              sub: "text-slate-400",
              faint: "text-slate-500",
              input: "bg-white/[0.03] border-white/10 text-white placeholder-slate-500 focus:border-[#00E599]/50 focus:ring-2 focus:ring-[#00E599]/10",
              navActive: "bg-white/[0.06] text-white border-white/10",
              navIdle: "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.03]",
              ghostBtn: "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200",
              primaryBtn: "bg-[#00E599] hover:bg-[#33edad] text-[#04120c] shadow-lg shadow-[#00E599]/10",
              chip: "bg-white/[0.05] text-slate-300 border-white/10",
              gold: "text-[#e9c349]",
              goldChip: "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/30",
              goldTile: "bg-gradient-to-br from-[#d4af37]/25 to-[#d4af37]/5 border-[#d4af37]/30 text-[#e9c349]",
              accent: "text-[#00E599]",
              accentChip: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/25",
              selected: "bg-[#00E599]/[0.06] border-[#00E599]/60 ring-2 ring-[#00E599]/10",
              selectable: "bg-white/[0.025] border-white/[0.08] hover:border-white/20",
              segment: "bg-white/[0.03] border-white/[0.07]",
              segmentActive: "bg-white/[0.09] text-white",
              segmentIdle: "text-slate-400 hover:text-slate-200",
              option: "[&>option]:bg-[#0f141d]",
            };

          const inputBase = `w-full rounded-xl px-3 py-2.5 text-xs font-semibold border outline-none transition ${th.input}`;
          const labelBase = `block text-[10px] font-black uppercase tracking-[0.14em] mb-1.5 ${th.sub}`;
          const cleanLabel = (s: string) => s.replace(/\s*\*$/, "");

          const sections: { id: "profile" | "preferences" | "sport" | "billing"; label: string; desc: string; icon: React.ElementType }[] = [
            { id: "profile", label: en ? "Profile" : "Profil", desc: en ? "Your identity and role within the club." : "Votre identité et votre fonction au sein du club.", icon: User },
            { id: "preferences", label: en ? "Preferences" : "Préférences", desc: en ? "Interface language and display theme." : "Langue de l'interface et thème d'affichage.", icon: Settings },
            { id: "sport", label: en ? "Sport" : "Sport", desc: isUserAdmin ? (en ? "Admin view: every sport is available." : "Vue administrateur : tous les sports sont disponibles.") : (en ? "Choose the discipline you coach." : "Choisissez la discipline que vous entraînez."), icon: Target },
            { id: "billing", label: en ? "Subscription" : "Abonnement", desc: t.userModal.billingNote, icon: CreditCard },
          ];
          const current = sections.find((s) => s.id === userConfigSection) || sections[0];

          const initials = `${editFirstName.charAt(0)}${editLastName.charAt(0)}`.toUpperCase() || "CO";
          const isProPlus = activePlan === "pro_plus" || activePlan === "annuel" || activePlan === "club";
          const isPro = activePlan === "pro" || activePlan === "mensuel";
          const planName = isUserAdmin ? (en ? "Admin licence" : "Licence admin") : isProPlus ? "PRO+" : isPro ? "PRO" : (en ? "Free" : "Gratuit");

          const sportOptions = [
            { id: "football", label: t.sports.football },
            { id: "basketball", label: t.sports.basketball },
            { id: "rugby", label: t.sports.rugby },
            { id: "handball", label: t.sports.handball },
          ].filter((sport) => isUserAdmin || !blockedSports.includes(sport.id));

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-6 z-50 animate-fade-in backdrop-blur-md">
              <form
                onSubmit={handleSaveUserConfig}
                className={`w-full max-w-4xl h-[94vh] sm:h-[min(720px,90vh)] rounded-[28px] border shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden relative ${th.panel}`}
              >
                {!isModernSleek && (
                  <div className="absolute -top-40 left-32 w-[460px] h-[300px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
                )}

                {/* ================= SIDEBAR ================= */}
                <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
                  <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                        <Settings className="h-5 w-5" />
                      </div>
                      <div className="leading-tight">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>The Box</p>
                        <p className={`text-sm font-black ${th.text}`}>{en ? "Settings" : "Paramètres"}</p>
                      </div>
                    </div>
                  </div>

                  <nav className="px-3 space-y-1">
                    <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>{en ? "Account" : "Compte"}</p>
                    {sections.map((s) => {
                      const Icon = s.icon;
                      const isActive = current.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setUserConfigSection(s.id)}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? th.navActive : th.navIdle}`}
                        >
                          {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}`} />}
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? th.accent : ""}`} />
                          <span className="flex-1 text-left">{s.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-auto p-3">
                    <div className={`p-3 rounded-2xl border ${th.card}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${isUserAdmin
                          ? "bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] ring-2 ring-[#d4af37]/30"
                          : isModernSleek ? "bg-emerald-600 text-white" : "bg-[#00E599] text-[#04120c]"
                          }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${th.text}`}>{editFirstName} {editLastName}</p>
                          <p className={`text-[10px] font-mono truncate ${th.sub}`}>{editEmail}</p>
                        </div>
                      </div>
                      <div className={`mt-2.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${isUserAdmin || isProPlus ? th.goldChip : isPro ? th.accentChip : th.chip}`}>
                        {isUserAdmin ? <Award className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />} {planName}
                      </div>
                    </div>
                  </div>
                </aside>

                {/* ================= MAIN ================= */}
                <div className="flex-1 min-w-0 flex flex-col relative z-10">
                  {/* Header */}
                  <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.accent}`}>{en ? "Settings" : "Paramètres"}</p>
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>{current.label}</h2>
                        <p className={`text-xs mt-1 ${th.sub}`}>{current.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUserConfigModalOpen(false)}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`}
                        title={t.userModal.close}
                        aria-label={t.userModal.close}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Onglets mobiles */}
                    <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border overflow-x-auto ${th.segment}`}>
                      {sections.map((s) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setUserConfigSection(s.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${current.id === s.id ? th.segmentActive : th.segmentIdle}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </header>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-4 scrollbar-thin">

                    {/* ---------- PROFIL ---------- */}
                    {current.id === "profile" && (
                      <>
                        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${th.card}`}>
                          <div className={`w-14 h-14 rounded-2xl text-lg font-black flex items-center justify-center shrink-0 ${isUserAdmin
                            ? "bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] shadow-lg shadow-[#d4af37]/20"
                            : isModernSleek ? "bg-emerald-600 text-white" : "bg-[#00E599] text-[#04120c]"
                            }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-base font-black truncate ${th.text}`}>{editFirstName} {editLastName}</p>
                            <p className={`text-xs truncate ${th.sub}`}>{editClub || (en ? "No club yet" : "Aucun club renseigné")} · {editRole}</p>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border space-y-4 ${th.card}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>{cleanLabel(t.userModal.firstName)} <span className={th.accent}>*</span></label>
                              <input type="text" required value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className={inputBase} />
                            </div>
                            <div>
                              <label className={labelBase}>{cleanLabel(t.userModal.lastName)} <span className={th.accent}>*</span></label>
                              <input type="text" required value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className={inputBase} />
                            </div>
                          </div>

                          <div>
                            <label className={`${labelBase} flex items-center justify-between`}>
                              <span>{cleanLabel(t.userModal.email)} <span className={th.accent}>*</span></span>
                              <span className={`normal-case tracking-normal text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${th.accentChip}`}>{en ? "Primary account" : "Compte principal"}</span>
                            </label>
                            <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="ex: coach@monclub.fr" className={inputBase} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>{t.userModal.club}</label>
                              <input type="text" value={editClub} onChange={(e) => setEditClub(e.target.value)} placeholder={t.userModal.clubPlaceholder} className={inputBase} />
                            </div>
                            <div>
                              <label className={labelBase}>{t.userModal.role}</label>
                              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={`${inputBase} cursor-pointer ${th.option}`}>
                                <option value="Coach Principal">{t.userModal.roles.principal}</option>
                                <option value="Entraîneur Adjoint">{t.userModal.roles.adjoint}</option>
                                <option value="Analyste Vidéo / Tactique">{t.userModal.roles.analyst}</option>
                                <option value="Préparateur Physique">{t.userModal.roles.fitness}</option>
                                <option value="Responsable Technique">{t.userModal.roles.techDirector}</option>
                              </select>
                            </div>
                          </div>

                          {/* Logo du club : carte du match, rond central, exports image et PDF */}
                          <div>
                            <label className={labelBase}>{en ? "Club logo" : "Logo du club"}</label>
                            <div className={`p-3 rounded-2xl border flex items-center gap-3 flex-wrap ${th.selectable}`}>
                              <div className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 ${th.chip}`}>
                                {editClubLogo ? (
                                  <img src={editClubLogo} alt={en ? "Club logo" : "Logo du club"} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <Shield className={`w-6 h-6 ${th.faint}`} aria-hidden="true" />
                                )}
                              </div>
                              <div className="flex-1 min-w-[180px] space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${th.ghostBtn}`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    {editClubLogo ? (en ? "Replace" : "Remplacer") : (en ? "Add a logo" : "Ajouter un logo")}
                                    <input
                                      type="file"
                                      accept={CLUB_LOGO_ACCEPT}
                                      className="sr-only"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = "";
                                        if (!file) return;
                                        try {
                                          setClubLogoError(null);
                                          setEditClubLogo(await prepareClubLogo(file));
                                        } catch (err) {
                                          setClubLogoError(err instanceof Error ? err.message : "Logo invalide.");
                                        }
                                      }}
                                    />
                                  </label>
                                  {editClubLogo && (
                                    <button type="button" onClick={() => setEditClubLogo("")} className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}>
                                      {en ? "Remove" : "Retirer"}
                                    </button>
                                  )}
                                </div>
                                <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${editClubLogo ? "" : "opacity-50"}`}>
                                  <input
                                    type="checkbox"
                                    checked={editShowLogoOnPitch}
                                    disabled={!editClubLogo}
                                    onChange={(e) => setEditShowLogoOnPitch(e.target.checked)}
                                    className="w-4 h-4 accent-[#00E599] cursor-pointer"
                                  />
                                  {en ? "Show in the pitch centre circle" : "Afficher dans le rond central du terrain"}
                                </label>
                                <p className={`text-[11px] ${clubLogoError ? "text-rose-400 font-semibold" : th.faint}`}>
                                  {clubLogoError || (en ? "PNG, JPG, WebP or SVG. Used on the match card, the pitch and image / PDF exports." : "PNG, JPG, WebP ou SVG. Utilisé sur la carte du match, le terrain et les exports image / PDF.")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Zone de danger : suppression définitive du compte (droit à l'effacement) */}
                        {!isUserAdmin && auth.currentUser && (
                          <div className={`mt-6 rounded-2xl border p-4 ${isModernSleek ? "border-rose-200 bg-rose-50/60" : "border-rose-500/25 bg-rose-500/[0.04]"}`}>
                            <p className={`text-xs font-black ${isModernSleek ? "text-rose-700" : "text-rose-300"}`}>
                              {en ? "Delete my account" : "Supprimer mon compte"}
                            </p>
                            {scheduledDeletionAt ? (
                              <>
                                <p className={`mt-1 text-[11px] leading-relaxed ${th.sub}`}>
                                  {(() => {
                                    const date = new Date(scheduledDeletionAt).toLocaleDateString(en ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
                                    return en
                                      ? `Deletion scheduled on ${date}, at the end of your paid period. Your subscription will not renew and you keep full access until then. On that date, your account, teams, players, matches, notes and diagrams will be permanently deleted.`
                                      : `Suppression programmée le ${date}, à la fin de votre période payée. Votre abonnement ne sera pas renouvelé et vous gardez l'accès complet d'ici là. À cette date, votre compte, vos équipes, joueurs, matchs, notes et schémas seront supprimés définitivement.`;
                                  })()}
                                </p>
                                {deleteAccountError && <p className="mt-2 text-[11px] font-semibold text-rose-400">{deleteAccountError}</p>}
                                <button
                                  type="button"
                                  onClick={() => void handleCancelAccountDeletion()}
                                  disabled={isDeletingAccount}
                                  className={`mt-3 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-40 ${th.ghostBtn}`}
                                >
                                  {isDeletingAccount ? "…" : en ? "Cancel the deletion" : "Annuler la suppression"}
                                </button>
                              </>
                            ) : (
                            <>
                            <p className={`mt-1 text-[11px] leading-relaxed ${th.sub}`}>
                              {en
                                ? "Permanently deletes your account, teams, players, matches, notes and diagrams. With a running subscription, it will not renew: you keep access until the end of the period already paid, then your account is deleted. Without a subscription, deletion is immediate. This cannot be undone."
                                : "Supprime définitivement votre compte, vos équipes, joueurs, matchs, notes et schémas. Avec un abonnement en cours, celui-ci n'est pas renouvelé : vous gardez l'accès jusqu'à la fin de la période déjà payée, puis le compte est supprimé. Sans abonnement, la suppression est immédiate. Cette action est irréversible."}
                            </p>
                            {!isDeleteAccountOpen ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDeleteAccountOpen(true);
                                  setDeleteAccountConfirm("");
                                  setDeleteAccountError(null);
                                }}
                                className={`mt-3 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isModernSleek ? "border-rose-300 text-rose-700 hover:bg-rose-100" : "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"}`}
                              >
                                {en ? "Delete my account…" : "Supprimer mon compte…"}
                              </button>
                            ) : (
                              <div className="mt-3 space-y-2">
                                <label className={labelBase} htmlFor="delete-account-confirm">
                                  {en ? "Type SUPPRIMER to confirm" : "Tapez SUPPRIMER pour confirmer"}
                                </label>
                                <input
                                  id="delete-account-confirm"
                                  type="text"
                                  autoComplete="off"
                                  value={deleteAccountConfirm}
                                  onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                                  onKeyDown={(e) => {
                                    // Entrée ne doit pas soumettre le formulaire du profil
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      void handleDeleteOwnAccount();
                                    }
                                  }}
                                  placeholder="SUPPRIMER"
                                  className={inputBase}
                                  disabled={isDeletingAccount}
                                />
                                {deleteAccountError && <p className="text-[11px] font-semibold text-rose-400">{deleteAccountError}</p>}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteOwnAccount()}
                                    disabled={deleteAccountConfirm.trim().toUpperCase() !== "SUPPRIMER" || isDeletingAccount}
                                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {isDeletingAccount
                                      ? (en ? "Deleting…" : "Suppression…")
                                      : (en ? "Permanently delete" : "Supprimer définitivement")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsDeleteAccountOpen(false)}
                                    disabled={isDeletingAccount}
                                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                                  >
                                    {en ? "Cancel" : "Annuler"}
                                  </button>
                                </div>
                              </div>
                            )}
                            </>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ---------- PRÉFÉRENCES ---------- */}
                    {current.id === "preferences" && (
                      <>
                        <div className={`p-5 rounded-2xl border ${th.card}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className={`h-4 w-4 ${th.accent}`} />
                            <p className={`text-sm font-black ${th.text}`}>{t.userModal.languageTitle}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {([
                              { id: "fr", flag: "🇫🇷", name: "Français", desc: t.userModal.languageFrDesc },
                              { id: "en", flag: "🇬🇧", name: "English", desc: t.userModal.languageEnDesc },
                            ] as const).map((lang) => {
                              const isSel = editLanguage === lang.id;
                              return (
                                <button
                                  key={lang.id}
                                  type="button"
                                  onClick={() => setEditLanguage(lang.id)}
                                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${isSel ? th.selected : th.selectable}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl leading-none">{lang.flag}</span>
                                    <div>
                                      <p className={`text-xs font-black ${th.text}`}>{lang.name}</p>
                                      <p className={`text-[10px] ${th.sub}`}>{lang.desc}</p>
                                    </div>
                                  </div>
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? (isModernSleek ? "bg-emerald-600 border-emerald-600 text-white" : "bg-[#00E599] border-[#00E599] text-[#04120c]") : th.border}`}>
                                    {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border ${th.card}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${th.cardMuted}`}>
                                {isModernSleek ? "☀️" : "🌙"}
                              </div>
                              <div>
                                <p className={`text-sm font-black ${th.text}`}>{en ? "Light theme" : "Thème clair"}</p>
                                <p className={`text-[11px] ${th.sub}`}>{isModernSleek ? t.userModal.lightDesc : t.userModal.darkDesc}</p>
                              </div>
                            </div>
                            {/* Interrupteur thème (appliqué immédiatement) */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isModernSleek}
                              aria-label={en ? "Light theme" : "Thème clair"}
                              onClick={toggleModernSleek}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition cursor-pointer ${isModernSleek ? "bg-emerald-500 border-emerald-500" : "bg-white/10 border-white/10"}`}
                            >
                              <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${isModernSleek ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ---------- SPORT ---------- */}
                    {current.id === "sport" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sportOptions.map((sport) => {
                          const isSel = editSport === sport.id;
                          const isBlocked = blockedSports.includes(sport.id);
                          return (
                            <button
                              key={sport.id}
                              type="button"
                              onClick={() => setEditSport(sport.id)}
                              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${isSel ? th.selected : th.selectable}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${th.cardMuted}`}>
                                  {getSportBallInfo(sport.id).emoji}
                                </div>
                                <div>
                                  <p className={`text-sm font-black ${th.text}`}>{sport.label}</p>
                                  {isBlocked ? (
                                    <p className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isModernSleek ? "text-rose-600" : "text-rose-300"}`}>
                                      <Lock className="h-3 w-3" /> {en ? "Locked for users" : "Verrouillé pour les coachs"}
                                    </p>
                                  ) : (
                                    <p className={`text-[10px] font-bold mt-0.5 ${th.sub}`}>{en ? "Available" : "Disponible"}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? (isModernSleek ? "bg-emerald-600 border-emerald-600 text-white" : "bg-[#00E599] border-[#00E599] text-[#04120c]") : th.border}`}>
                                {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ---------- ABONNEMENT ---------- */}
                    {current.id === "billing" && (
                      <>
                        <div className={`relative p-5 rounded-2xl border overflow-hidden ${isModernSleek
                          ? "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200"
                          : "bg-gradient-to-br from-[#d4af37]/[0.10] via-white/[0.02] to-transparent border-[#d4af37]/25"
                          }`}>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${th.goldTile}`}>
                                {isUserAdmin ? <Award className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${th.gold}`}>{en ? "Current plan" : "Formule actuelle"}</p>
                                <p className={`text-lg font-black tracking-tight ${th.text}`}>{planName}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserConfigModalOpen(false);
                                setIsCheckoutOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-br from-[#e9c349] to-[#c9a032] hover:brightness-105 text-[#1a1300] shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
                            >
                              {t.userModal.changePlan}
                            </button>
                          </div>
                          <p className={`text-[11px] mt-3 flex items-center gap-1.5 ${th.sub}`}>
                            <Lock className="h-3 w-3" /> {en ? "Secure payment via Stripe • No commitment" : "Paiement sécurisé via Stripe • Sans engagement"}
                          </p>
                        </div>

                        <div>
                          <p className={labelBase}>{en ? "Plans" : "Formules"}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                              { id: "gratuit", name: t.userModal.freeDemo, price: "0 €", active: !isPro && !isProPlus, msg: "Formule Gratuit sélectionnée." },
                              { id: "pro", name: t.userModal.proPlanCard, price: "9,90 €", active: isPro, msg: "Formule PRO (9.90 €/mois) sélectionnée !" },
                              { id: "pro_plus", name: t.userModal.proPlusPlanCard, price: "14,90 €", active: isProPlus, msg: "Formule PRO+ (14.90 €/mois) sélectionnée !", premium: true },
                            ].map((plan) => (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  setActivePlan(plan.id);
                                  alert(plan.msg);
                                }}
                                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${plan.active ? th.selected : th.selectable}`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${plan.premium ? th.gold : plan.id === "pro" ? th.accent : th.sub}`}>{plan.name}</p>
                                  {plan.active && <CheckCircle className={`h-4 w-4 ${th.accent}`} />}
                                </div>
                                <p className={`text-xl font-black tracking-tight mt-1 tabular-nums ${th.text}`}>
                                  {plan.price}
                                  {plan.id !== "gratuit" && <span className={`text-[11px] font-bold ${th.sub}`}>{en ? " /mo" : " /mois"}</span>}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer actions */}
                  <footer className={`px-5 sm:px-8 py-4 border-t flex items-center justify-end gap-2 ${th.border}`}>
                    <button
                      type="button"
                      onClick={() => setIsUserConfigModalOpen(false)}
                      className={`h-10 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                    >
                      {t.userModal.cancel}
                    </button>
                    <button
                      type="submit"
                      className={`h-10 px-5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${th.primaryBtn}`}
                    >
                      <Save className="h-4 w-4" />
                      {en ? "Save" : "Enregistrer"}
                    </button>
                  </footer>
                </div>
              </form>
            </div>
          );
        })()}

    </>
  );
}
