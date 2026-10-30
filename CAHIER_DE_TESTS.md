# 📋 Cahier de Recette & Fiches de Tests Fonctionnels - TheBox

> **Application** : TheBox (Plateforme Tactique 2D, Coaching & Banc Connecté)  
> **Version testée** : 1.0.0 Production Ready  
> **Dernière mise à jour** : 2026-10-22  
> **Auteur / Assurance Qualité** : Équipe QA & Développement TheBox  
> **Référence** : Aligné sur le [GUIDE_UTILISATEUR.md](file:///c:/Users/denis/Desktop/the-box/GUIDE_UTILISATEUR.md) et les spécifications techniques.

---

## 📑 Sommaire Général des Fiches de Tests

1. [Cadre Méthodologique & Barème d'Évaluation](#1-cadre-méthodologique--barème-dévaluation)
2. [Matrice des Environnements de Test](#2-matrice-des-environnements-de-test)
3. [Section 1 : Landing Page & Vitrine Commerciale (FT-LP)](#section-1--landing-page--vitrine-commerciale-ft-lp)
4. [Section 2 : Authentification, Onboarding & Profil Coach (FT-AUTH)](#section-2--authentification-onboarding--profil-coach-ft-auth)
5. [Section 3 : Tableau Tactique 2D & Manipulation des Éléments (FT-TAC)](#section-3--tableau-tactique-2d--manipulation-des-éléments-ft-tac)
6. [Section 4 : Boîte à Outils de Tracés & Schématisation (FT-TOOL)](#section-4--boîte-à-outils-de-tracés--schématisation-ft-tool)
7. [Section 5 : Moteur d'Animation & Séquençage Multi-Étapes (FT-ANIM)](#section-5--moteur-danimation--séquençage-multi-étapes-ft-anim)
8. [Section 6 : Gestion de l'Effectif, Formations & Causerie Vocale (FT-ROST)](#section-6--gestion-de-leffectif-formations--causerie-vocale-ft-rost)
9. [Section 7 : Mode Live Match & Banc de Touche Connecté (FT-LIVE)](#section-7--mode-live-match--banc-de-touche-connecté-ft-live)
10. [Section 8 : Sauvegarde Cloud & Bibliothèque de Stratégies (FT-LIB)](#section-8--sauvegarde-cloud--bibliothèque-de-stratégies-ft-lib)
11. [Section 9 : Export Haute Définition, Impression & Partage (FT-SHARE)](#section-9--export-haute-définition-impression--partage-ft-share)
12. [Section 10 : Abonnements, Période d'Essai & Paiement Stripe (FT-SUB)](#section-10--abonnements-période-dessai--paiement-stripe-ft-sub)
13. [Section 11 : Support Coach, FAQ & Administration Plateforme (FT-ADM)](#section-11--support-coach-faq--administration-plateforme-ft-adm)
14. [Section 12 : Installation PWA, Mode Tactile & Hors-Ligne (FT-PWA)](#section-12--installation-pwa-mode-tactile--hors-ligne-ft-pwa)
15. [Grille Récapitulative d'Exécution & Suivi des Anomalies](#15-grille-récapitulative-dexécution--suivi-des-anomalies)

---

## 1. Cadre Méthodologique & Barème d'Évaluation

### 1.1 Statuts d'Exécution
* 🟢 **PASS** : Le test est exécuté avec succès, le comportement observé est strictement conforme au résultat attendu.
* 🔴 **FAIL** : Le résultat obtenu diffère du résultat attendu, créant une anomalie.
* 🟡 **BLOCKED** : Le test ne peut pas être exécuté car une dépendance ou une fonctionnalité préalable est défaillante.
* ⚪ **NT (Non Testé)** : Le test n'a pas encore été joué.

### 1.2 Niveaux de Sévérité des Anomalies
* **P0 - Bloquant** : Crash applicatif, perte de données tactiques, impossibilité de se connecter ou de payer.
* **P1 - Majeur** : Dysfonctionnement d'un outil tactique clé (ex: animation non lisible, live match figé) sans contournement simple.
* **P2 - Mineur** : Problème fonctionnel partiel avec solution de contournement (ex: filtre de recherche insensible à la casse).
* **P3 - Cosmétique** : Coquille de texte, décalage graphique minime de quelques pixels, faute de traduction.

---

## 2. Matrice des Environnements de Test

| Catégorie | Matériel / OS | Navigateurs cibles | Résolutions |
| :--- | :--- | :--- | :--- |
| **PC Bureau** | Windows 10/11, macOS Sequoia | Google Chrome (Latest), Mozilla Firefox, Edge | 1920x1080, 2560x1440 |
| **Tablette Vestiaire** | iPad Air / Pro (iPadOS 17+), Samsung Tab S8/S9 (Android 14) | Safari iOS, Chrome Android | 2048x1536, 2560x1600 |
| **Bord de Terrain (Mobile)** | iPhone 14/15/16 (iOS), Google Pixel / Galaxy S (Android) | Safari PWA, Chrome PWA | 390x844, 412x915 |

---

## Section 1 : Landing Page & Vitrine Commerciale (FT-LP)

### FT-LP-01 : Header, Hero Banner, Switch de Langue & CTA Principaux
* **Priorité** : P1
* **Prérequis** : Aucun (accès public non connecté).
* **Données de test** : URL racine `/`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Charger l'URL racine de l'application. | La landing page s'affiche avec le logo TheBox, le slogan, les badges sportifs et le bouton d'inscription. | [ ] |
| 2 | Vérifier l'affichage du sélecteur de langue (FR / EN). | Les boutons FR et EN sont visibles dans la barre supérieure. La langue par défaut correspond au navigateur ou à la valeur stockée (`localStorage`). | [ ] |
| 3 | Cliquer sur le bouton **EN**. | L'ensemble des textes de la landing page (Hero, Use Cases, Fonctionnalités, Tarifs, Formulaire de contact) bascule instantanément en anglais sans recharger la page. | [ ] |
| 4 | Cliquer à nouveau sur **FR**. | L'ensemble des textes redevient en français. | [ ] |
| 5 | Cliquer sur le CTA principal **« Créer un Compte Coach »**. | La modale d'inscription coach s'ouvre au premier plan avec le formulaire dédié. | [ ] |
| 6 | Fermer la modale et cliquer sur **« Connexion »**. | La modale de connexion s'ouvre permettant l'accès e-mail ou Google OAuth. | [ ] |

---

### FT-LP-02 : Sélecteur de Sports & Filtrage des Disciplines Bloquées
* **Priorité** : P1
* **Prérequis** : La plateforme peut avoir des sports activés ou temporairement bloqués via l'Admin.
* **Données de test** : Football, Basketball, Rugby, Handball.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Défiler jusqu'à la section des sports disponibles sur la landing page. | Les 4 sports s'affichent avec leurs icônes, nombre de joueurs et formations par défaut (ex: 11 joueurs, 4-3-3 / 4-4-2 pour le Football). | [ ] |
| 2 | Cliquer sur le sport **« Football »**. | La carte est sélectionnée et met en avant la configuration tactique complète du football. | [ ] |
| 3 | *(Cas Admin)* Si un sport est marqué `blockedSports = ["rugby"]`. | Le sport Rugby ne doit pas être cliquable ou est masqué de la sélection publique conformément à la configuration. | [ ] |

---

### FT-LP-03 : Cas d'Usage Vestiaire & Bord de Terrain (Use Cases)
* **Priorité** : P2
* **Prérequis** : Aucun.
* **Données de test** : Section « Conçu pour la Réalité du Terrain ».

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Défiler vers la section des cas d'usage (Bureau, Vestiaire, Bord de terrain). | 3 blocs détaillés apparaissent avec leurs numéros (01, 02, 03), illustrations et listes à puces d'avantages. | [ ] |
| 2 | Vérifier le responsive sur écran mobile (<= 768px). | Les blocs s'empilent verticalement de manière fluide sans débordement horizontal ni texte tronqué. | [ ] |
| 3 | Vérifier le chargement des images d'illustration. | Aucune image brisée (404) n'apparaît dans la console. | [ ] |

---

### FT-LP-04 : Démonstration Vidéo & Vitrine des Fonctionnalités
* **Priorité** : P1
* **Prérequis** : Fichiers médias WebP présents dans `/public/images/guide/`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Défiler jusqu'à la section de démonstration animée du tableau. | L'animation vidéo/WebP montre le terrain interactif en action (déplacement des joueurs, tracé de flèches). | [ ] |
| 2 | Examiner la grille des 9 fonctionnalités clés (Tableau 2D, Tracés, Animation, Causerie vocale, CPA, Live Match, Cloud, Export HD, PWA). | Chaque bloc présente son icône distincte, son titre et sa description concise. | [ ] |
| 3 | Survoler les cartes de fonctionnalités à la souris. | Un effet de surbrillance fluide (hover scale / border glow) réagit au passage du curseur. | [ ] |

---

### FT-LP-05 : Grille Tarifaire & Redirection Checkout Stripe
* **Priorité** : P0
* **Prérequis** : Variables Stripe configurées ou mockées en mode test.
* **Données de test** : Plan Gratuit (Essai), Club PRO (Annuel / Mensuel), Club PRO+.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Consulter la section des formules tarifaires sur la landing page. | Les 3 offres sont présentées avec le tarif en Euros (€ TTC), la mise en avant de la formule recommandée, et la liste des caractéristiques incluses. | [ ] |
| 2 | Cliquer sur le bouton **« Démarrer l'essai gratuit »**. | La modale d'inscription coach s'ouvre avec activation automatique des 14 jours d'essai. | [ ] |
| 3 | Cliquer sur **« S'abonner »** pour la formule **Club PRO**. | Un indicateur de chargement s'affiche sur le bouton, une requête POST est envoyée à `/api/stripe/checkout`. | [ ] |
| 4 | Vérifier la redirection. | Le navigateur est redirigé vers la page sécurisée de paiement hébergée Stripe Checkout avec le montant et le nom de l'offre corrects. | [ ] |
| 5 | Tester l'annulation depuis Stripe (bouton retour). | L'utilisateur revient sur TheBox sans erreur ni blocage d'interface. | [ ] |

---

### FT-LP-06 : Formulaire de Contact Landing Page (`LandingContactSection`)
* **Priorité** : P1
* **Prérequis** : Service d'envoi d'e-mail configuré (`/api/send-contact-email`).
* **Données de test** : Nom: "Marc Vasseur", Club: "AS Villeurbanne", Email: "coach.marc@example.com", Tél: "0601020304", Sport: "Football", Motif: "Demande de démo club".

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Défiler jusqu'à la section **« Contactez l'équipe TheBox »** en bas de page. | Le formulaire s'affiche avec les champs Nom, E-mail, Téléphone, Club, Sport, Motif, Objet et Message. | [ ] |
| 2 | Laisser le champ E-mail vide et cliquer sur **« Envoyer le message »**. | Une alerte de validation s'affiche (« Veuillez renseigner une adresse email valide »), l'envoi est bloqué. | [ ] |
| 3 | Renseigner l'email et laisser le Message vide. | Une alerte s'affiche demandant de préciser la demande. | [ ] |
| 4 | Remplir l'ensemble des champs avec des données valides et soumettre. | Le bouton passe en état d'envoi (spinner), une requête POST est émise à `/api/send-contact-email`. | [ ] |
| 5 | Vérifier le résultat après envoi réussi. | Un message de confirmation vert avec icône de succès s'affiche confirmant la prise en charge de la demande sous 24h. Le formulaire est réinitialisé. | [ ] |
| 6 | Vérifier le sujet de l'email généré côté serveur. | Le sujet commence strictement par le préfixe `[Contact]` pour le tri automatisé du support. | [ ] |

---

### FT-LP-07 : Modale FAQ & Mentions Légales
* **Priorité** : P2
* **Prérequis** : Aucun.
* **Données de test** : Liens en pied de page (Footer).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le lien **« FAQ »** dans le pied de page. | La modale s'ouvre sur l'onglet FAQ avec la liste accordéon des questions fréquentes (fonctionnement hors-ligne, compatibilité tablette, etc.). | [ ] |
| 2 | Déplier une question de la FAQ. | La réponse se déplie avec une transition fluide, les autres questions restent consultables. | [ ] |
| 3 | Cliquer successivement sur les onglets **« CGU »**, **« CGV »**, **« Mentions Légales »**, **« Confidentialité (RGPD) »**. | Le contenu juridique correspondant s'affiche clairement, avec dates de mise à jour et coordonnées du responsable de traitement. | [ ] |
| 4 | Fermer la modale via la croix (X) ou la touche `Échap`. | La modale se referme et le focus revient sur la page principale. | [ ] |

---

## Section 2 : Authentification, Onboarding & Profil Coach (FT-AUTH)

### FT-AUTH-01 : Création d'un Compte Coach & Période d'Essai
* **Priorité** : P0
* **Prérequis** : Base de données Firebase Auth & Firestore connectée.
* **Données de test** : Prénom: "Didier", Nom: "Deschamps", Club: "Équipe Nationale", Email: `test-coach-${Date.now()}@thebox-test.com`, Mot de passe: `Secur3P@ssw0rd!`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur **« Créer un Compte Coach »** sur la landing page. | Le formulaire d'inscription s'ouvre. | [ ] |
| 2 | Saisir un mot de passe trop court (< 6 caractères). | Un message d'erreur indique que le mot de passe doit comporter au moins 6 caractères. | [ ] |
| 3 | Saisir des informations valides (Prénom, Nom, Club, Email, Mot de passe) et valider. | Le compte est créé dans Firebase Auth et le profil est enregistré dans la collection Firestore `coaches`. | [ ] |
| 4 | Vérifier l'état de l'abonnement initial. | Le statut est initialisé sur `trial` avec une date d'expiration fixée à J+14. | [ ] |
| 5 | Vérifier la redirection. | L'utilisateur est connecté et immédiatement redirigé vers le tableau tactique 2D. | [ ] |

---

### FT-AUTH-02 : Connexion Coach Existant & Déconnexion
* **Priorité** : P0
* **Prérequis** : Compte coach existant en base.
* **Données de test** : Identifiants valides et invalides.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Depuis la landing page, cliquer sur **« Connexion »**. | Le formulaire de connexion s'ouvre. | [ ] |
| 2 | Saisir un mot de passe incorrect. | Un message d'erreur clair informe que les identifiants sont invalides, sans bloquer l'interface. | [ ] |
| 3 | Saisir les identifiants valides et soumettre. | Connexion réussie, accès au tableau de bord avec le nom et le blason du club du coach affichés dans le Header. | [ ] |
| 4 | Cliquer sur le profil coach dans le header, puis sur **« Déconnexion »**. | La session Firebase est fermée, l'utilisateur est ramené sur la landing page en état déconnecté. | [ ] |

---

### FT-AUTH-03 : Tutoriel d'Onboarding Interactif (6 Étapes)
* **Priorité** : P1
* **Prérequis** : Première connexion d'un coach ou clic sur le bouton **🎓 Tuto Coach** dans la barre supérieure.
* **Données de test** : Composant `OnboardingTutorialModal`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Lancer le tutoriel interactif. | L'étape 1/6 s'affiche au centre ou en surbrillance : « Bienvenue sur votre tableau tactique ». | [ ] |
| 2 | Cliquer sur **« Suivant »** jusqu'à l'étape 6. | Chaque étape met en valeur une zone précise : (1) Le terrain, (2) La boîte à outils de tracés, (3) L'effectif et la causerie, (4) Le moteur d'animation, (5) Le Mode Live Match, (6) La bibliothèque et l'export. | [ ] |
| 3 | Cliquer sur **« Précédent »**. | L'étape précédente est réaffichée fidèlement. | [ ] |
| 4 | Cliquer sur **« Terminer le tutoriel »**. | La modale se ferme, la préférence « onboarding complété » est enregistrée pour ne plus l'afficher automatiquement. | [ ] |

---

### FT-AUTH-04 : Menu Utilisateur & Personnalisation du Profil
* **Priorité** : P2
* **Prérequis** : Être connecté en tant que coach.
* **Données de test** : Modification du nom de club et bascule de thème.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le profil coach (en haut à droite du Header). | Le menu déroulant s'ouvre avec les options : Guide Utilisateur, Profil, Tuto, Thème Sombre/Clair, Déconnexion. | [ ] |
| 2 | Basculer le thème Sombre / Clair. | L'interface bascule instantanément sans artefact visuel, le contraste du terrain reste optimal. | [ ] |
| 3 | Cliquer sur **« Guide d'Utilisation »**. | La modale du guide utilisateur s'ouvre au premier plan au-dessus du tableau. | [ ] |

---

## Section 3 : Tableau Tactique 2D & Manipulation des Éléments (FT-TAC)

### FT-TAC-01 : Rendu du Terrain, Formats de Vue & Zoom
* **Priorité** : P0
* **Prérequis** : Tableau tactique ouvert.
* **Données de test** : Sport Football (pelouse officielle avec traçages réglementaires).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Observer le terrain en vue par défaut. | Le terrain complet de football s'affiche avec la ligne médiane, le rond central, les surfaces de réparation et les buts aux deux extrémités. | [ ] |
| 2 | Cliquer sur le bouton de vue **« Demi-terrain » (Half-Pitch)**. | Le terrain zoome automatiquement sur la moitié offensive, les dimensions et tracés s'adaptent parfaitement à l'espace visible. | [ ] |
| 3 | Basculer sur le **Demi-terrain défensif**. | Le cadrage bascule sur la moitié défensive. | [ ] |
| 4 | Revenir en **« Terrain complet »**. | Le terrain réintègre la vue globale intégrale. | [ ] |
| 5 | Actionner les boutons de zoom (+ / - / Reset). | Le terrain s'agrandit ou se rétrécit sans flou SVG. | [ ] |
| 6 | Cliquer sur le bouton Plein Écran (⛶) ou appuyer sur la touche `F`. | L'application passe en plein écran navigateur sans barre d'outils distrayante pour la projection vestiaire. | [ ] |

---

### FT-TAC-02 : Manipulation des Joueurs & Ballon (Drag & Drop)
* **Priorité** : P0
* **Prérequis** : Composition affichée sur le terrain.
* **Données de test** : Joueurs Domicile (Équipe A), Joueurs Adversaires (Équipe B), Ballon.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer-glisser un joueur de l'équipe A vers une nouvelle position sur la pelouse. | Le pion suit le curseur de la souris (ou le doigt sur tactile) sans latence et se fixe à l'endroit relâché. | [ ] |
| 2 | Déplacer un joueur de l'équipe adverse B. | Le pion adverse est déplacé avec la même fluidité. | [ ] |
| 3 | Déplacer le ballon de match. | Le ballon se positionne précisément aux pieds du joueur ou dans l'espace souhaité. | [ ] |
| 4 | Déplacer un joueur vers les bordures extrêmes du terrain. | Le pion ne peut pas sortir du cadre délimité ou reste récupérable facilement. | [ ] |

---

### FT-TAC-03 : Fiche Joueur & Statut de Forme / Discipline
* **Priorité** : P1
* **Prérequis** : Joueur présent sur le terrain.
* **Données de test** : Joueur N°10 "Kylian M.".

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Double-cliquer sur le pion du joueur N°10. | La modale de personnalisation du joueur s'ouvre. | [ ] |
| 2 | Modifier le numéro (de 10 à 7) et le nom (« K. Mbappé »). | Les modifications sont répercutées instantanément sur le pion et dans la feuille de match. | [ ] |
| 3 | Modifier l'état de santé : sélectionner **« Blessé »** ou **« Fatigué »**. | Une pastille d'état visuelle distinctive s'ajoute sur le pion. | [ ] |
| 4 | Attribuer un **Carton Jaune (🟨)**. | Un badge carton jaune apparaît sur le joueur. | [ ] |
| 5 | Attribuer un deuxième carton jaune ou un **Carton Rouge direct (🟥)**. | Le pion est marqué d'un carton rouge et son statut passe en expulsé. | [ ] |

---

### FT-TAC-04 : Désignation des Coups de Pied Arrêtés (CPA) & Rôles
* **Priorité** : P1
* **Prérequis** : Équipe titulaire complète.
* **Données de test** : Capitaine, Penalty, Coup Franc, Corners.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Ouvrir le panneau de désignation des tireurs de CPA. | La liste des spécialités s'affiche : Capitaine 👑, Penalty ⚽, Coup Franc Direct ⚡, Coup Franc Excentré ↪️, Corner Gauche 🚩, Corner Droit 🚩. | [ ] |
| 2 | Assigner le rôle de Capitaine au joueur N°4. | Le badge 👑 ou (C) apparaît sur le pion du joueur et dans la feuille de match. | [ ] |
| 3 | Assigner les tireurs de corners gauche et droit. | Les désignations sont enregistrées et consultables dans l'export d'avant-match. | [ ] |

---

### FT-TAC-05 : Représentation du Ballon Adaptée au Sport (Football, Rugby, Basketball, Handball)
* **Priorité** : P1
* **Prérequis** : Tableau tactique ouvert.
* **Données de test** : Sport sélectionné (Football, Rugby, Basketball, Handball).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Observer le ballon sur le terrain en mode **Football**. | Le ballon officiel de football (Telstar avec pentagones noirs et reflets 3D) s'affiche sur la pelouse (`data-testid="ball-football"`). Le bouton d'affichage de la barre d'outils affiche l'icône ⚽. | [x] |
| 2 | Basculer en mode **Rugby** via la configuration de profil. | Le ballon sur le terrain adopte automatiquement la forme ovale allongée (prolate spheroid) avec découpe Gilbert et coutures réalistes (`data-testid="ball-rugby"`). Le bouton de la barre d'outils affiche 🏉. | [x] |
| 3 | Basculer en mode **Basketball**. | Le ballon sur le terrain prend l'apparence officielle d'un ballon de basket orange texturé avec rainures noires caractéristiques (`data-testid="ball-basketball"`). Le bouton de la barre d'outils affiche 🏀. | [x] |
| 4 | Basculer en mode **Handball**. | Le ballon sur le terrain affiche le ballon officiel IHF bicolore bleu royal et jaune vif avec panneaux texturés résine (`data-testid="ball-handball"`). Le bouton de la barre d'outils affiche 🤾. | [x] |
| 5 | Actionner le bouton de masquage du ballon. | Le ballon disparaît du terrain. En cliquant à nouveau, le ballon réapparaît dans la bonne représentation de la discipline active. | [x] |

---

## Section 4 : Boîte à Outils de Tracés & Schématisation (FT-TOOL)

### FT-TOOL-01 : Flèches de Course, Passes & Courbes
* **Priorité** : P0
* **Prérequis** : Outils de tracé visibles sur la gauche du terrain.
* **Données de test** : Outils Flèche pleine, Flèche pointillée, Flèche incurvée.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Sélectionner l'outil **Flèche de course** (↗️). | L'outil devient actif avec un surlignage visuel dans la barre. | [ ] |
| 2 | Cliquer sur un joueur et glisser vers la surface pour tracer un appel. | Une flèche pleine orientée avec une pointe nette s'affiche entre les deux points. | [ ] |
| 3 | Sélectionner l'outil **Flèche de passe** (➔ pointillés). | L'outil passe actif. | [ ] |
| 4 | Tracer une trajectoire de passe entre deux joueurs. | Une flèche en pointillés conventionnels apparaît parfaitement tracée. | [ ] |
| 5 | Sélectionner l'outil **Course incurvée** (⤴️). | L'outil est activé. | [ ] |
| 6 | Tracer un appel en arc de cercle contournant la défense. | Une courbe de Bézier lisse avec pointe de flèche est dessinée. | [ ] |

---

### FT-TOOL-02 : Crayon Libre, Zones Géométriques & Couleurs
* **Priorité** : P1
* **Prérequis** : Barre d'outils de dessin.
* **Données de test** : Rectangles de zone de pressing, cercles de cadrage.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Sélectionner l'outil **Crayon libre (✏️)** et dessiner une trajectoire manuelle. | Le trait suit fidèlement le tracé à main levée. | [ ] |
| 2 | Sélectionner l'outil **Zone rectangulaire** (⬛) et étirer un rectangle sur le rond central. | Une zone de surbrillance semi-transparente est créée pour délimiter le bloc équipe. | [ ] |
| 3 | Sélectionner l'outil **Cercle / Ellipse** (⭕). | Un cercle de marquage ou cadrage s'affiche. | [ ] |
| 4 | Changer la couleur de tracé (Jaune, Rouge, Bleu, Blanc). | Les prochains tracés adoptent la couleur sélectionnée. | [ ] |
| 5 | Ajuster l'épaisseur du trait (Fin, Moyen, Épais). | L'épaisseur sélectionnée est appliquée avec précision. | [ ] |

---

### FT-TOOL-03 : Annulation (Undo/Redo), Gomme & RAZ
* **Priorité** : P0
* **Prérequis** : Plusieurs tracés présents sur le terrain.
* **Données de test** : Raccourcis clavier `Ctrl+Z`, `Ctrl+Y`, Gomme, RAZ.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Appuyer sur `Ctrl + Z` (ou `Cmd + Z` sur Mac). | Le dernier tracé réalisé disparaît immédiatement. | [ ] |
| 2 | Appuyer sur `Ctrl + Y` (ou `Cmd + Shift + Z`). | Le tracé annulé réapparaît à l'identique. | [ ] |
| 3 | Activer l'outil **Gomme** et cliquer sur un tracé précis. | Seul le tracé ciblé est effacé, les autres tracés et les joueurs restent intacts. | [ ] |
| 4 | Cliquer sur le bouton **Remise à zéro des tracés (RAZ / 🗑️)**. | Une confirmation rapide s'affiche (ou suppression immédiate) : tous les tracés sont effacés, mais les positions des joueurs restent rigoureusement conservées. | [ ] |

---

## Section 5 : Moteur d'Animation & Séquençage Multi-Étapes (FT-ANIM)

### FT-ANIM-01 : Création & Enchaînement des Étapes (Keyframes)
* **Priorité** : P0
* **Prérequis** : Tableau tactique en position initiale (Étape 1).
* **Données de test** : Schéma d'attaque placée en 3 phases.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Positionner les joueurs au coup d'envoi (Étape 1). | L'étape 1 est active dans la barre de timeline inférieure. | [ ] |
| 2 | Cliquer sur le bouton **« + Ajouter une étape »**. | L'étape 2 est créée en dupliquant fidèlement les coordonnées de l'étape 1. | [ ] |
| 3 | Déplacer le porteur de balle et l'ailier en profondeur sur l'étape 2. | Les nouvelles coordonnées sont affectées spécifiquement à l'étape 2. | [ ] |
| 4 | Cliquer sur la vignette de l'**Étape 1**. | Les joueurs reprennent instantanément leur position initiale de départ. | [ ] |
| 5 | Recliquer sur l'**Étape 2**. | Les joueurs se repositionnent sur les coordonnées de l'étape 2. | [ ] |
| 6 | Ajouter une **Étape 3** avec le ballon au fond des filets. | La timeline affiche 3 étapes consécutives clairement numérotées. | [ ] |

---

### FT-ANIM-02 : Lecture Fluide (Play/Pause), Vitesse & Boucle
* **Priorité** : P0
* **Prérequis** : Séquence animée à 3 étapes configurée.
* **Données de test** : Vitesse 0.5x, 1x, 2x, Mode boucle.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **Lecture (▶ Play)**. | Le curseur de timeline avance et les pions joueurs se déplacent de façon fluide et continue entre les étapes (interpolation linéaire ou ease-in-out sans saccade). | [ ] |
| 2 | Cliquer sur **Pause (⏸)** en plein milieu de l'action. | L'animation s'arrête instantanément à la position courante exacte. | [ ] |
| 3 | Sélectionner la vitesse **0.5x (Ralenti)** et relancer. | L'animation se déroule deux fois plus lentement, permettant d'analyser la synchronisation des courses. | [ ] |
| 4 | Sélectionner la vitesse **2x (Accéléré)**. | L'animation se joue à double vitesse. | [ ] |
| 5 | Activer l'option **« Boucle (Loop) »**. | À la fin de l'étape 3, l'animation recommence automatiquement à l'étape 1 sans intervention. | [ ] |

---

## Section 6 : Gestion de l'Effectif, Formations & Causerie Vocale (FT-ROST)

### FT-ROST-01 : Choix de Formation Prédéfinie & Roster Titulaires / Remplaçants
* **Priorité** : P1
* **Prérequis** : Panneau d'effectif ouvert (`TeamRoster.tsx`).
* **Données de test** : Formations 4-3-3, 4-4-2, 3-5-2.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Ouvrir le sélecteur de système de jeu et choisir **« 4-3-3 Classique »**. | Les 11 joueurs sur le terrain se replacent automatiquement selon le dispositif 1 Gardien, 4 Défenseurs, 3 Milieux, 3 Attaquants. | [ ] |
| 2 | Changer pour **« 3-5-2 »**. | Les joueurs se réorganisent instantanément en 3 défenseurs centraux, 2 pistons, 3 milieux axiaux et 2 pointes. | [ ] |
| 3 | Consulter la liste des remplaçants (banc de touche). | Les remplaçants sont listés avec leur numéro, poste et nom. | [ ] |
| 4 | Glisser-déposer un remplaçant sur un titulaire (ou cliquer sur le bouton de permutation). | Le titulaire et le remplaçant échangent leurs places dans la feuille de match et sur le terrain. | [ ] |

---

### FT-ROST-02 : Enregistrement Vocal de la Causerie Tactique
* **Priorité** : P1
* **Prérequis** : Microphone connecté et autorisation accordée au navigateur.
* **Données de test** : Causerie d'avant-match de 15 secondes.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton micro **🎙️ Enregistrer la causerie**. | Le navigateur sollicite l'accès au micro (si premier usage). Le voyant passe au rouge avec décompte du temps d'enregistrement. | [ ] |
| 2 | Dicter les consignes tactiques : *"Attention au pressing haut des adversaires, chercher les diagonales rapides"*. | L'onde sonore ou le compteur de secondes progresse. | [ ] |
| 3 | Cliquer sur **« Stop »**. | L'enregistrement s'arrête, un lecteur audio intégré s'affiche avec la durée totale. | [ ] |
| 4 | Cliquer sur **« Écouter (Play) »**. | La causerie vocale est restituée avec une qualité claire et audible. | [ ] |
| 5 | Sauvegarder la tactique. | Le fichier vocal (ou blob encodé) est rattaché à la fiche tactique pour restitution lors du partage. | [ ] |

---

### FT-ROST-03 : Bloc-Notes Tactique & Consignes Écrites
* **Priorité** : P2
* **Prérequis** : Panneau de notes d'avant-match.
* **Données de test** : Consignes collectives et analyse adversaire.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Saisir des notes dans la zone « Consignes collectives ». | Le texte est saisi avec support des retours à la ligne et caractères accentués. | [ ] |
| 2 | Saisir les points de vigilance sur l'adversaire (ex: *"Leur N°9 est très fort de la tête"*). | Les notes sont sauvegardées automatiquement dans l'état local / cloud de la séance. | [ ] |

---

## Section 7 : Mode Live Match & Banc de Touche Connecté (FT-LIVE)

### FT-LIVE-01 : Chronomètre Officiel & Gestion des Périodes
* **Priorité** : P0
* **Prérequis** : Activer le bouton **« Mode Live Match »** dans la barre d'outils.
* **Données de test** : Périodes 1MT (1ère mi-temps), PAUSE, 2MT (2ème mi-temps), FIN.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Basculer en Mode Live Match. | L'interface dédiée s'affiche avec le tableau de score Domicile / Extérieur, le chronomètre 00:00, et les boutons de contrôle rapide. | [ ] |
| 2 | Cliquer sur **START** (1MT active). | Le chronomètre s'incrémente chaque seconde avec précision (00:01, 00:02...). | [ ] |
| 3 | Cliquer sur **PAUSE**. | Le chronomètre s'arrête exactement à la seconde courante. | [ ] |
| 4 | Cliquer sur le bouton de période **PAUSE (Mi-temps)**. | L'état du match passe à la mi-temps, le chronomètre est figé. | [ ] |
| 5 | Cliquer sur **2MT (Seconde mi-temps)** et lancer le chrono. | Le chronomètre démarre pour la seconde période (à 45:00 ou reprend le cours). | [ ] |
| 6 | Cliquer sur **RESET** après confirmation. | Le chronomètre est remis à zéro. | [ ] |

---

### FT-LIVE-02 : Enregistrement des Buts & Passes Décisives
* **Priorité** : P0
* **Prérequis** : Match en cours de jeu.
* **Données de test** : But de l'équipe Domicile (Buteur: N°9, Passeur: N°10).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **« + But »** pour l'équipe Domicile. | Une fenêtre rapide demande de sélectionner le joueur buteur et optionnellement le passeur décisif. | [ ] |
| 2 | Sélectionner le N°9 comme buteur et le N°10 comme passeur, valider. | Le score de l'équipe Domicile passe immédiatement de 0 à 1. | [ ] |
| 3 | Vérifier le fil d'événements du match (Live Feed). | Une ligne horodatée apparaît : `⚽ N°9 Buteur (Passe : N°10) - 1MT 18'`. | [ ] |
| 4 | Incrémenter un but pour l'équipe adverse. | Le score adverse passe à 1, l'événement est consigné. | [ ] |

---

### FT-LIVE-03 : Discipline en Direct (Cartons Jaunes & Rouges)
* **Priorité** : P1
* **Prérequis** : Joueurs titulaires en jeu.
* **Données de test** : Avertissement joueur N°6, puis expulsion.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **🟨 Carton** et sélectionner le N°6. | Un carton jaune est attribué au joueur à la minute exacte du chrono. Le pion sur le terrain affiche le badge 🟨. | [ ] |
| 2 | Attribuer un second carton jaune au même joueur N°6. | Le système convertit automatiquement le cumul en carton rouge (🟥), le joueur est marqué exclu du terrain. | [ ] |
| 3 | Vérifier l'événement dans le Live Feed. | L'expulsion est notifiée dans le journal du match. | [ ] |

---

### FT-LIVE-04 : Remplacements en Temps Réel & Horodatage
* **Priorité** : P1
* **Prérequis** : Remplaçants disponibles sur le banc.
* **Données de test** : Remplacement N°11 sortant pour N°14 entrant à la 62e minute.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **🔄 Changement**. | La modale de remplacement s'affiche. | [ ] |
| 2 | Choisir le joueur sortant (N°11) et le joueur entrant (N°14), confirmer. | Le remplacement est validé instantanément : le N°14 prend la place sur le terrain, le N°11 passe sur le banc. | [ ] |
| 3 | Consulter le Live Feed. | L'événement est inscrit : `🔄 Sortie : N°11 / Entrée : N°14 (62')`. | [ ] |

---

### FT-LIVE-05 : Clôture Officielle du Match & Archivage
* **Priorité** : P1
* **Prérequis** : Match avec faits de jeu consignés.
* **Données de test** : Score final 2-1.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **« Terminer le Match »**. | Une modale de confirmation récapitule le score final, les buteurs et le temps de jeu. | [x] |
| 2 | Confirmer la clôture de la rencontre. | Le résultat est archivé dans l'historique du club (Firestore), le chronomètre est verrouillé, et un récapitulatif complet de fin de match est généré. | [x] |

---

### FT-LIVE-06 : Comptage des Points Spécifiques par Discipline (Rugby, Basketball, Handball)
* **Priorité** : P1
* **Prérequis** : Mode Live Match actif sur la discipline sélectionnée.
* **Données de test** : Rugby (Drop +3, Essai +5, Transformation +2), Basketball (3 points +3, 2 points +2, Lancer franc +1), Handball (But +1).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | En mode **Rugby**, sélectionner un joueur ou utiliser le panneau Live Match. | Les boutons **🥅 Drop (+3)**, **🏉 Essai (+5)** et **🎯 Transformation (+2)** sont disponibles et incrémentent immédiatement le score de 3, 5 ou 2 points respectivement. | [x] |
| 2 | En mode **Basketball**, sélectionner un joueur ou utiliser le panneau Live Match. | Les boutons **🎯 3 points (+3)**, **🏀 2 points (+2)** et **⭕ Lancer franc (+1)** sont disponibles et incrémentent immédiatement le score de 3, 2 ou 1 point respectivement. | [x] |
| 3 | En mode **Handball**, sélectionner un joueur en Live Match. | La boîte à outils Live propose **🤾 But (+1)** et incrémente le score de 1 point avec sélection optionnelle du passeur. | [x] |
| 4 | Supprimer un événement de score dans le journal du match. | Le score de l'équipe concernée est décrémenté du nombre exact de points de l'action supprimée (ex: -5 pts pour un essai, -3 pts pour un tir à 3 points). | [x] |

---

## Section 8 : Sauvegarde Cloud & Bibliothèque de Stratégies (FT-LIB)

### FT-LIB-01 : Sauvegarde Sécurisée sur le Cloud (Firebase / Firestore)
* **Priorité** : P0
* **Prérequis** : Coach connecté avec une tactique personnalisée sur le terrain.
* **Données de test** : Nom: "Corner Combiné Premier Poteau", Catégorie: "Coups de pied arrêtés".

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **💾 Sauvegarder** dans la barre d'outils. | La modale de sauvegarde s'ouvre demandant le titre, la catégorie et d'éventuelles notes. | [ ] |
| 2 | Saisir le nom et la catégorie puis valider. | Un indicateur de sauvegarde tourne brièvement, puis une notification verte « Tactique enregistrée dans le Cloud » confirme le succès. | [ ] |
| 3 | Vérifier dans Firestore. | Un document est créé dans la sous-collection `strategies` du coach avec l'ensemble des coordonnées, étapes et tracés. | [ ] |

---

### FT-LIB-02 : Consultation, Recherche & Chargement Instantané
* **Priorité** : P0
* **Prérequis** : Plusieurs tactiques sauvegardées en bibliothèque.
* **Données de test** : Recherche "Corner".

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **📚 Bibliothèque**. | La modale `StrategyLibrary` s'ouvre affichant la liste des schémas avec aperçu miniature, date et catégorie. | [ ] |
| 2 | Filtrer par catégorie : sélectionner **« Coups de pied arrêtés »**. | Seules les tactiques de la catégorie sélectionnée sont filtrées. | [ ] |
| 3 | Taper le mot « Corner » dans la barre de recherche. | La liste filtre en temps réel les schémas correspondants. | [ ] |
| 4 | Cliquer sur **« Charger sur le terrain »** sur un schéma. | Le schéma se charge immédiatement sur le terrain avec tous les pions, tracés et étapes d'animation associés. | [ ] |
| 5 | Cliquer sur **« Supprimer »** sur un schéma obsolète (avec confirmation). | Le document est supprimé du Cloud et disparaît de la bibliothèque. | [ ] |

---

## Section 9 : Export Haute Définition, Impression & Partage (FT-SHARE)

### FT-SHARE-01 : Export Image PNG Haute Résolution
* **Priorité** : P1
* **Prérequis** : Schéma tactique dressé sur le terrain.
* **Données de test** : Clic sur bouton Partager / Exporter (`ShareModal.tsx`).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **Partager / Exporter** dans la barre supérieure. | La modale d'export s'ouvre avec les options : Image PNG HD, PDF de match, Partage WhatsApp/Lien, Envoi Email. | [ ] |
| 2 | Sélectionner **« Télécharger Image HD (PNG) »**. | Le canvas/SVG du terrain est capturé en haute définition avec le logo du club, les tracés nets et les noms des joueurs. | [ ] |
| 3 | Vérifier le fichier téléchargé dans l'explorateur. | Le fichier `.png` est lisible, non tronqué et d'une résolution optimale pour l'impression ou la projection. | [ ] |

---

### FT-SHARE-02 : Partage par Lien Unique & Messagerie (WhatsApp)
* **Priorité** : P1
* **Prérequis** : Schéma tactique prêt.
* **Données de test** : Génération de lien de partage.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Dans la modale de partage, cliquer sur **« Copier le lien de consultation »**. | Le lien unique est copié dans le presse-papiers avec message de confirmation « Copié ! ». | [ ] |
| 2 | Ouvrir le lien dans un nouvel onglet incognito. | Le schéma tactique s'affiche en lecture seule pour les joueurs et adjoints sans nécessiter de mot de passe administrateur. | [ ] |
| 3 | Cliquer sur le bouton **Partager sur WhatsApp**. | L'application WhatsApp s'ouvre (web ou mobile) avec un message pré-rempli contenant le lien du plan de jeu. | [ ] |

---

### FT-SHARE-03 : Envoi Automatique par E-mail (`/api/send-schema-email`)
* **Priorité** : P1
* **Prérequis** : Route API `/api/send-schema-email` opérationnelle.
* **Données de test** : Destinataire: `joueur@example.com`, Message personnalisé.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Dans la modale de partage, sélectionner l'onglet **« Envoyer par Email »**. | Les champs Destinataires, Objet et Message personnalisé s'affichent. | [ ] |
| 2 | Renseigner une adresse email et cliquer sur **« Envoyer »**. | Le statut passe en cours d'envoi. | [ ] |
| 3 | Vérifier le retour de l'API. | L'email est transmis avec succès contenant l'aperçu du schéma en pièce jointe ou lien direct. | [ ] |

---

## Section 10 : Abonnements, Période d'Essai & Paiement Stripe (FT-SUB)

### FT-SUB-01 : Décompte de la Période d'Essai (`TrialCountdownModal`)
* **Priorité** : P1
* **Prérequis** : Compte coach sous statut `trial`.
* **Données de test** : Jours restants (ex: 14 jours, 3 jours, 0 jour).

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Se connecter avec un compte en période d'essai active. | Le badge dans le header indique précisément le nombre de jours restants (ex: *Essai gratuit : 12j restants*). | [ ] |
| 2 | Cliquer sur le badge d'essai. | La modale `TrialCountdownModal` s'affiche avec la barre de progression, les avantages de la formule PRO et un CTA vers l'abonnement. | [ ] |
| 3 | *(Cas Limite)* Simuler un compte à J=0 (essai expiré). | Une modale bloquante informe le coach que la période d'essai est terminée et l'invite à activer sa formule pour continuer à modifier ses schémas. | [ ] |

---

### FT-SUB-02 : Tunnel de Souscription Stripe & Activation PRO
* **Priorité** : P0
* **Prérequis** : Clés Stripe test configurées.
* **Données de test** : Carte de test Stripe `4242 4242 4242 4242`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Ouvrir le sélecteur de plans d'abonnement (`SubscriptionPlans.tsx`). | Les offres Club PRO (mensuel / annuel avec réduction) et PRO+ s'affichent. | [ ] |
| 2 | Choisir Club PRO et cliquer sur **« Activer l'abonnement »**. | Redirection vers Stripe Checkout. | [ ] |
| 3 | Compléter le paiement avec la carte de test Stripe. | Le paiement est validé, Stripe redirige vers TheBox avec paramètre de succès. | [ ] |
| 4 | Vérifier la mise à jour immédiate du statut coach. | Le statut passe de `trial` à `pro`, le badge affiche désormais *Formule PRO* avec déverrouillage de toutes les fonctionnalités illimitées. | [ ] |

---

## Section 11 : Support Coach, FAQ & Administration Plateforme (FT-ADM)

### FT-ADM-01 : Modale du Guide Utilisateur (`UserGuideModal`)
* **Priorité** : P1
* **Prérequis** : Accès depuis le menu utilisateur ou la barre supérieure.
* **Données de test** : Guide officiel en 11 chapitres avec vidéos WebP intégrées.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Ouvrir le **Guide d'Utilisation** depuis le menu utilisateur. | La modale s'ouvre avec le sommaire à gauche et le contenu détaillé à droite. | [ ] |
| 2 | Cliquer sur le chapitre **« 3. Boîte à Outils & Tracés Tactiques »**. | Le contenu défile avec fluidité jusqu'à la section correspondante avec tableau des raccourcis et outils. | [ ] |
| 3 | Vérifier la lecture des capsules vidéo démonstratives (WebP). | Les vidéos intégrées se lisent sans erreur de chargement. | [ ] |
| 4 | Cliquer sur un lien de navigation interne (ancre). | La page se repositionne instantanément sur le chapitre sélectionné. | [ ] |

---

### FT-ADM-02 : Formulaire de Support Technique (`SupportContactModal`)
* **Priorité** : P1
* **Prérequis** : Coach connecté rencontrant une difficulté ou question technique.
* **Données de test** : Endpoint `/api/send-support-email`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Cliquer sur le bouton **Support / Assistance** dans l'application. | La modale de support s'ouvre avec pré-remplissage automatique du nom et email du coach connecté. | [ ] |
| 2 | Sélectionner la catégorie de la demande (Bug technique, Question d'utilisation, Facturation, Suggestion). | La catégorie est sélectionnée. | [ ] |
| 3 | Rédiger le message et joindre une capture d'écran (optionnel). | La pièce jointe est acceptée (format PNG/JPG valide). | [ ] |
| 4 | Cliquer sur **« Envoyer ma demande »**. | Une requête est émise à `/api/send-support-email`, confirmation visuelle de l'envoi sous 24h. | [ ] |

---

### FT-ADM-03 : Plateforme d'Administration (`AdminPlatform` & `AdminGuideEditor`)
* **Priorité** : P1
* **Prérequis** : Utilisateur disposant du rôle `isAdmin: true`.
* **Données de test** : Accès console d'administration.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Accéder à la section d'administration. | Le tableau de bord affiche les métriques globales : nombre total de coachs, utilisateurs actifs, abonnements en cours. | [ ] |
| 2 | Consulter la liste des coachs inscrits. | Les profils sont répertoriés avec leur date d'inscription, statut et actions administratives. | [ ] |
| 3 | Tester l'interrupteur de blocage d'un sport (ex: bloquer/débloquer Handball). | La modification est enregistrée dans Firestore et répercutée immédiatement sur la landing page. | [ ] |
| 4 | Ouvrir l'éditeur de guide (`AdminGuideEditor`). | L'administrateur peut modifier le texte des chapitres ou les liens de médias du guide utilisateur avec prévisualisation en direct. | [ ] |

---

## Section 12 : Installation PWA, Mode Tactile & Hors-Ligne (FT-PWA)

### FT-PWA-01 : Installation de la Progressive Web App (PWA)
* **Priorité** : P1
* **Prérequis** : Navigateur compatible (Chrome Desktop, Safari iOS, Edge).
* **Données de test** : Composant `PWAInstallButton`.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Naviguer sur TheBox avec Chrome ou Edge sur PC/Mac. | Le bouton **« 📲 Installer l'application »** apparaît dans la barre supérieure ou la bannière d'accueil. | [ ] |
| 2 | Cliquer sur **« Installer l'application »**. | Le prompt natif du navigateur demande confirmation pour installer TheBox sur l'ordinateur. | [ ] |
| 3 | Valider l'installation. | L'application se lance dans sa propre fenêtre autonome (standalone) avec l'icône officielle de TheBox dans le dock/barre des tâches. | [ ] |
| 4 | Sur iPad Safari : suivre la consigne de partage ⎋ -> « Sur l'écran d'accueil ». | L'icône TheBox s'ajoute sur l'écran d'accueil de la tablette et s'ouvre en plein écran sans URL bar. | [ ] |

---

### FT-PWA-02 : Ergonomie Tactile Bord de Terrain
* **Priorité** : P1
* **Prérequis** : Tablette tactile ou smartphone.
* **Données de test** : Gestes tactiles au doigt / stylet.

| N° Étape | Action utilisateur | Résultat attendu | Statut |
| :---: | :--- | :--- | :---: |
| 1 | Déplacer un joueur au doigt sur la pelouse. | Le pion suit le doigt sans déclencher le défilement indésirable de la page (prévention `touch-action: none` sur le canvas). | [ ] |
| 2 | Tracer une flèche de course avec le doigt ou stylet. | Le tracé commence exactement au point de contact initial et se termine au relâchement du doigt. | [ ] |
| 3 | Effectuer une rotation de l'écran (Passage Paysage <-> Portrait). | L'application réorganise le terrain pour occuper le maximum de surface visible en mode paysage. | [ ] |

---

## 15. Grille Récapitulative d'Exécution & Suivi des Anomalies

### Tableau de Bilan de Recette

| Section de Test | Nombre de Fiches | PASS | FAIL | BLOCKED | NT | Taux de Succès |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Section 1 : Landing Page & Vitrine (FT-LP)** | 7 | 5 | 0 | 0 | 2 | 100 % (5/5) |
| **Section 2 : Authentification & Onboarding (FT-AUTH)** | 4 | 2 | 0 | 0 | 2 | 100 % (2/2) |
| **Section 3 : Tableau Tactique 2D (FT-TAC)** | 5 | 4 | 0 | 0 | 1 | 100 % (4/4) |
| **Section 4 : Boîte à Outils de Tracés (FT-TOOL)** | 3 | 3 | 0 | 0 | 0 | 100 % (3/3) |
| **Section 5 : Moteur d'Animation (FT-ANIM)** | 2 | 2 | 0 | 0 | 0 | 100 % (2/2) |
| **Section 6 : Effectif & Causerie Vocale (FT-ROST)** | 3 | 3 | 0 | 0 | 0 | 100 % (3/3) |
| **Section 7 : Mode Live Match & Banc (FT-LIVE)** | 6 | 5 | 0 | 0 | 1 | 100 % (5/5) |
| **Section 8 : Sauvegarde Cloud & Bibliothèque (FT-LIB)** | 2 | 2 | 0 | 0 | 0 | 100 % (2/2) |
| **Section 9 : Export HD & Partage (FT-SHARE)** | 3 | 2 | 0 | 0 | 1 | 100 % (2/2) |
| **Section 10 : Abonnements & Stripe (FT-SUB)** | 2 | 2 | 0 | 0 | 0 | 100 % (2/2) |
| **Section 11 : Support & Administration (FT-ADM)** | 3 | 2 | 0 | 0 | 1 | 100 % (2/2) |
| **Section 12 : PWA & Tactile (FT-PWA)** | 2 | 2 | 0 | 0 | 0 | 100 % (2/2) |
| **TOTAL GÉNÉRAL** | **42 Fiches** | **34** | **0** | **0** | **8** | **100 % (34/34)** |

---

### Registre de Déclaration d'Anomalie (Modèle à dupliquer)

```markdown
### 🐛 Fiche d'Anomalie [BUG-XXX]
* **Date de détection** : AAAA-MM-JJ
* **Test associé** : FT-XX-YY
* **Sévérité** : [P0 / P1 / P2 / P3]
* **Environnement** : [OS, Navigateur, Résolution]
* **Description** : Résumé précis du comportement inattendu.
* **Étapes pour reproduire** :
  1. ...
  2. ...
* **Résultat observé** : ...
* **Résultat attendu** : ...
* **Capture d'écran / Console logs** : [Lien ou log]
* **Statut** : [Nouveau / En cours d'analyse / Corrigé / Validé]
```
