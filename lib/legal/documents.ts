// Documents légaux de la plateforme (CGU, CGV, mentions légales, politique de confidentialité, accord de
// sous-traitance). Modifiables par le super admin depuis la console admin ; stockés dans legalDocs/{id}
// (lecture publique, écriture super admin, règles Firestore) avec l'historique des versions publiées
// dans legalDocs/{id}/history/{version}. Tant qu'un document n'a jamais été publié, le texte par défaut
// ci-dessous est affiché.
//
// Mise en forme du texte des sections (volontairement simple, sans HTML) :
//   ligne vide        → nouveau paragraphe
//   « - » en début    → élément de liste
//   **texte**         → gras
//   [À COMPLÉTER : …] → information à renseigner (signalée dans l'éditeur)

export type LegalDocId = "cgu" | "cgv" | "mentions" | "privacy" | "dpa";

export const LEGAL_DOC_IDS: LegalDocId[] = ["mentions", "cgu", "cgv", "privacy", "dpa"];

export interface LegalSection {
  id: string;
  title: string;
  body: string;
}

export interface LegalDocument {
  id: LegalDocId;
  intro: string;
  sections: LegalSection[];
  /** Date de publication (ISO) ; null : texte par défaut jamais publié */
  updatedAt: string | null;
  updatedBy: string | null;
  /** Numéro de version publiée (0 : texte par défaut) */
  version: number;
}

export const LEGAL_LIMITS = {
  sections: 60,
  title: 200,
  intro: 4000,
  body: 20000,
} as const;

export const LEGAL_DOC_META: Record<LegalDocId, { label: string; short: string; title: string; desc: string }> = {
  mentions: {
    label: "Mentions légales",
    short: "Mentions",
    title: "Mentions légales",
    desc: "L'éditeur, l'hébergeur et les informations légales du site.",
  },
  cgu: {
    label: "Conditions d'utilisation",
    short: "CGU",
    title: "Conditions générales d'utilisation",
    desc: "Les règles d'accès et d'utilisation de la plateforme The Box.",
  },
  cgv: {
    label: "Conditions de vente",
    short: "CGV",
    title: "Conditions générales de vente",
    desc: "Les conditions applicables aux abonnements payants.",
  },
  privacy: {
    label: "Confidentialité",
    short: "Confidentialité",
    title: "Politique de confidentialité",
    desc: "Les données collectées, leur utilisation et vos droits.",
  },
  dpa: {
    label: "Sous-traitance des données",
    short: "DPA",
    title: "Accord de sous-traitance des données",
    desc: "Les engagements de PixUp pour les données des joueurs saisies par les clubs (article 28 du RGPD).",
  },
};

/** Repère des informations à renseigner dans les modèles */
export const PLACEHOLDER_RE = /\[À COMPLÉTER[^\]]*\]/g;

export function countPlaceholders(doc: Pick<LegalDocument, "intro" | "sections">): number {
  const all = [doc.intro, ...doc.sections.flatMap((s) => [s.title, s.body])].join("\n");
  return all.match(PLACEHOLDER_RE)?.length ?? 0;
}

let sectionSeq = 0;
/** Identifiant de section (clé d'affichage et d'édition) */
export const newSectionId = () => `s${Date.now().toString(36)}${(sectionSeq++).toString(36)}`;

const s = (title: string, body: string): LegalSection => ({ id: newSectionId(), title, body: body.trim() });

const SUPPORT = "support@thebox-tactique.com";

// ---------------------------------------------------------------------------------------------
// Textes par défaut
// ---------------------------------------------------------------------------------------------

const defaults = (): Record<LegalDocId, { intro: string; sections: LegalSection[] }> => ({
  mentions: {
    intro:
      "Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), les informations suivantes sont portées à la connaissance des utilisateurs de la plateforme « The Box - Zone de décision tactique ».",
    sections: [
      s("Éditeur du site", `
Le site et l'application **The Box** sont édités par la société **PixUp**.

- Forme juridique : [À COMPLÉTER : forme juridique (SAS, SARL, entreprise individuelle…)]
- Capital social : [À COMPLÉTER : montant du capital social]
- Siège social : [À COMPLÉTER : adresse du siège]
- Immatriculation : [À COMPLÉTER : RCS ville et numéro, ou SIRET]
- N° de TVA intracommunautaire : [À COMPLÉTER : numéro de TVA]
- Adresse e-mail : ${SUPPORT}
- Téléphone : [À COMPLÉTER : numéro de téléphone]`),
      s("Directeur de la publication", `
Le directeur de la publication est [À COMPLÉTER : nom et prénom], en qualité de [À COMPLÉTER : fonction] de la société PixUp.`),
      s("Hébergement", `
**Application web :** Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).

**Données et authentification :** Google Firebase, service fourni par Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande. La base de données de la plateforme est hébergée dans l'Union européenne.`),
      s("Propriété intellectuelle", `
L'ensemble des éléments de la plateforme (interface, visuels, terrains vectoriels, moteurs d'animation, logos, code source et marque « The Box ») est la propriété exclusive de PixUp ou fait l'objet d'une autorisation d'utilisation. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable de PixUp est interdite.

Les contenus créés par les utilisateurs (schémas, compositions, notes) restent leur propriété, dans les conditions prévues par les conditions générales d'utilisation.`),
      s("Données personnelles", `
Les traitements de données personnelles réalisés sur la plateforme sont décrits dans la **Politique de confidentialité**. Pour les données des joueurs saisies par les clubs et les coachs, les engagements de PixUp figurent dans l'**Accord de sous-traitance des données**.

Pour exercer vos droits ou pour toute question : ${SUPPORT}.`),
      s("Cookies et stockage local", `
La plateforme n'utilise **aucun cookie publicitaire** ni outil de mesure d'audience tiers. Elle enregistre dans le navigateur (stockage local) uniquement les éléments nécessaires à son fonctionnement : session de connexion, préférences d'affichage, brouillons et contenus que vous choisissez de garder sur votre appareil. Ces éléments sont exemptés de consentement car strictement nécessaires au service.

Un contrôle anti-abus (Google reCAPTCHA, via Firebase App Check) vérifie que les requêtes proviennent bien de l'application.`),
      s("Droit applicable", `
Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français sont compétents.`),
    ],
  },

  cgu: {
    intro:
      "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme web « The Box - Zone de décision tactique », éditée par la société PixUp.",
    sections: [
      s("Éditeur de la plateforme", `
La plateforme **The Box** est éditée, exploitée et gérée par la société **PixUp**, ci-après « l'éditeur ». PixUp est responsable du fonctionnement du service ainsi que du traitement des données personnelles des utilisateurs.`),
      s("Objet et présentation du service", `
La plateforme **The Box** est un service SaaS d'animation tactique, de gestion d'effectifs et de préparation de séances sportives destiné aux entraîneurs, éducateurs et clubs sportifs. L'accès au service implique l'acceptation pleine et entière des présentes CGU par l'utilisateur.`),
      s("Accès au service et création de compte", `
L'accès aux fonctionnalités avancées nécessite la création d'un compte utilisateur sécurisé. L'utilisateur s'engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants de connexion. Toute action effectuée depuis son compte est présumée être réalisée par l'utilisateur titulaire.`),
      s("Formules d'accès et données enregistrées", `
Chaque nouveau compte bénéficie d'une période d'essai gratuite de 14 jours, accordée une seule fois par compte et par adresse e-mail. À la fin de l'essai ou d'un abonnement PRO / PRO+, le compte passe en **Formule Gratuite** : les fonctionnalités réservées aux formules payantes sont désactivées et les contenus enregistrés (équipes, effectifs, matchs, notes et schémas) sont **masqués mais conservés**. Ils sont de nouveau accessibles dès la souscription d'une formule PRO ou PRO+. Aucune suppression automatique n'est appliquée à ces contenus.`),
      s("Propriété intellectuelle", `
L'ensemble de l'application (interface, visuels, moteurs d'animation, terrains vectoriels, codes sources et marques « The Box ») est la propriété exclusive de PixUp. L'utilisateur conserve la propriété intellectuelle de ses contenus créés (schémas tactiques, compositions et notes personnelles), mais concède à la plateforme une licence technique nécessaire au stockage et à la restitution du service.`),
      s("Protection des données personnelles (RGPD)", `
Conformément au Règlement Général sur la Protection des Données (RGPD), PixUp, en tant que responsable du traitement des données des coachs, s'engage à protéger la vie privée des entraîneurs et de leurs effectifs. Les données collectées (identité et adresse e-mail du coach, club, effectifs, matchs, notes et schémas) sont uniquement utilisées pour l'exécution du service et ne sont en aucun cas vendues ou cédées à des tiers. Le détail figure dans la **Politique de confidentialité**.

**Données des joueurs :** les informations sur les joueurs (noms, numéros, postes, photos, statistiques de match) sont saisies par le coach pour son club. Pour ces données, le club ou le coach est responsable du traitement et PixUp agit en qualité de sous-traitant (article 28 du RGPD), dans les conditions de l'**Accord de sous-traitance des données** : elles ne sont utilisées que pour fournir le service au coach. Il appartient au club ou au coach d'informer les joueurs et de recueillir, le cas échéant, l'accord de leurs représentants légaux pour les joueurs mineurs.

**Mode Live (pages publiques) :** lorsqu'un coach publie le live d'un match, une page publique est créée (QR du match, page du club). Elle affiche le nom du club et des équipes, la date, le lieu, le score, le chronomètre et les faits de match. Les joueurs y apparaissent uniquement sous la forme **prénom + initiale du nom** (ex. « Lucas M. »), sans photo. Ces pages ne sont accessibles qu'aux personnes disposant du lien ou du QR code et ne sont pas répertoriées. Avant la première publication, le coach atteste avoir obtenu l'accord des joueurs ou, pour les mineurs, de leurs parents. Un live reste consultable jusqu'à sa suppression par le coach ; il est effacé avec les autres données lors de la suppression du compte.

**Prestataires techniques :** hébergement de l'application (Vercel), stockage des données et authentification (Google Firebase, base de données hébergée dans l'Union européenne), paiement des abonnements (Stripe). Ces prestataires n'agissent que sur instruction de PixUp.

**Durée de conservation :** les données du compte sont conservées tant que le compte existe, y compris en Formule Gratuite, et jusqu'à la demande de suppression de l'utilisateur.

**Vos droits :** vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données, exerçable depuis votre espace (Paramètres > Profil) ou via **${SUPPORT}**. Vous pouvez également introduire une réclamation auprès de la CNIL.`),
      s("Suppression du compte", `
L'utilisateur peut supprimer définitivement son compte à tout moment depuis **Paramètres > Profil > « Supprimer mon compte »**, ou sur simple demande au support. La suppression efface de manière irréversible le compte, les identifiants de connexion et l'ensemble des contenus enregistrés. Si un abonnement est en cours, la suppression prend effet à la fin de la période déjà payée : l'utilisateur conserve l'accès à l'application jusqu'à cette date et peut annuler sa demande d'ici là depuis le même espace (voir CGV). Sans abonnement en cours, la suppression est immédiate.

Sont seules conservées après la suppression : les factures et données de paiement détenues par le prestataire de paiement, pendant la durée imposée par les obligations comptables (10 ans), ainsi qu'une empreinte chiffrée et non réversible de l'adresse e-mail des anciens abonnés, utilisée uniquement pour éviter l'attribution d'une nouvelle période d'essai gratuite.

PixUp peut également, sur décision motivée (demande de l'utilisateur, compte inactif ou manquement aux présentes CGU), supprimer les contenus enregistrés d'un compte.`),
      s("Disponibilité et responsabilité", `
The Box met en œuvre tous les moyens raisonnables pour assurer un accès continu et fluide au service 24h/24 et 7j/7. Néanmoins, l'accès peut être temporairement interrompu pour des raisons de maintenance technique ou de mise à jour des terrains. PixUp ne saurait être tenue responsable des pertes indirectes liées à une interruption momentanée du réseau internet.`),
      s("Modification des CGU", `
PixUp se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions réglementaires et techniques. Les utilisateurs seront informés de toute modification majeure lors de leur connexion.`),
    ],
  },

  cgv: {
    intro:
      "Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les souscriptions d'abonnements payants sur la plateforme The Box, éditée et commercialisée par la société PixUp.",
    sections: [
      s("Éditeur de la plateforme", `
La plateforme **The Box** est éditée, exploitée et gérée par la société **PixUp**, ci-après « l'éditeur ». Les abonnements payants sont conclus entre l'utilisateur et PixUp, qui en assure la vente, l'encaissement et la facturation.`),
      s("Offres et tarifications", `
The Box propose trois formules d'accès :

- **Formule Gratuite :** Accès de base au tableau tactique 2D, gestion d'effectif et exports PNG (0.00 €/mois).
- **Formule PRO :** Accès multi-équipes, sauvegarde illimitée des schémas, préparation de l'équipe adverse et causeries vocales (9.90 €/mois TTC).
- **Formule PRO+ :** Toutes les fonctionnalités PRO + activation du mode Live Match en direct avec chronomètre et statistiques (14.90 €/mois TTC).`),
      s("Période d'essai gratuite", `
Tout nouveau compte bénéficie automatiquement d'une période d'essai gratuite de 14 jours à toutes les fonctionnalités de la formule PRO+ (y compris le Mode Live Match), sans carte bancaire. L'essai est accordé **une seule fois par compte et par adresse e-mail** : il n'est plus proposé à un utilisateur ayant déjà souscrit un abonnement payant, y compris après une résiliation. À l'issue des 14 jours, l'utilisateur repasse automatiquement en Formule Gratuite sans aucuns frais prélevés si aucun abonnement payant n'a été activé.`),
      s("Modalités de paiement", `
Les paiements s'effectuent de manière mensuelle et récurrente par Carte Bancaire via une infrastructure de paiement hautement sécurisée et chiffrée. L'abonnement est prélevé à la date anniversaire de la souscription.`),
      s("Sans engagement & résiliation", `
Tous nos abonnements payants sont strictement **sans engagement de durée**. Vous pouvez mettre fin à votre renouvellement automatique à tout moment en un clic dans votre espace utilisateur. La résiliation prend effet à la fin de la période mensuelle en cours. Le compte repasse alors en Formule Gratuite : les contenus enregistrés (équipes, effectifs, matchs, notes et schémas) sont masqués mais conservés, et redeviennent accessibles en cas de nouvel abonnement. La résiliation n'ouvre pas droit à une nouvelle période d'essai gratuite.`),
      s("Suppression du compte", `
La suppression du compte par l'utilisateur (voir CGU) met fin à l'abonnement en cours **à l'échéance de la période déjà payée** : l'abonnement n'est pas renouvelé, l'utilisateur conserve l'accès à l'application et à sa formule jusqu'à cette date, puis le compte est supprimé. Aucun nouveau prélèvement n'est effectué et la période en cours n'est pas remboursée, sous réserve du droit de rétractation ci-dessous. Jusqu'à l'échéance, l'utilisateur peut annuler sa demande de suppression : l'abonnement reprend alors normalement. Les factures restent disponibles sur demande auprès du support pendant la durée légale de conservation.`),
      s("Droit de rétractation", `
Conformément aux dispositions de l'article L.221-18 du Code de la Consommation, vous disposez d'un délai de rétractation de 14 jours à compter de la souscription initiale pour annuler votre contrat et en demander le remboursement intégral en contactant ${SUPPORT}.`),
      s("Support client et facturation", `
Pour toute question concernant vos factures ou votre abonnement, notre service client est disponible par courrier électronique à l'adresse **${SUPPORT}**.`),
    ],
  },

  privacy: {
    intro:
      "La présente politique explique quelles données personnelles PixUp collecte sur la plateforme The Box, pourquoi, combien de temps elles sont conservées et comment exercer vos droits, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.",
    sections: [
      s("Responsable du traitement", `
Le responsable du traitement des données des utilisateurs (coachs, éducateurs, administrateurs de club) est la société **PixUp**, éditrice de The Box (coordonnées dans les **Mentions légales**). Contact pour toute question relative à vos données : **${SUPPORT}**.

Pour les données des **joueurs** saisies par un coach ou un club, c'est le club ou le coach qui est responsable du traitement ; PixUp agit alors comme sous-traitant, dans les conditions de l'**Accord de sous-traitance des données**.`),
      s("Données collectées", `
- **Compte :** nom, prénom, adresse e-mail, club, sport, langue, photo de profil le cas échéant. Le mot de passe est géré par Google Firebase Authentication et n'est jamais accessible en clair ; la connexion avec Google transmet votre nom et votre adresse e-mail.
- **Contenus :** équipes, effectifs, matchs, compositions, schémas tactiques, notes et faits de match que vous enregistrez.
- **Abonnement :** formule souscrite, dates et statut de l'abonnement. Les paiements sont traités par Stripe : PixUp ne reçoit ni ne conserve jamais vos numéros de carte bancaire.
- **Échanges :** messages envoyés au support ou via le formulaire de contact.
- **Données techniques :** journaux de connexion et d'erreurs (adresse IP, navigateur, date), contrôles anti-abus.

Certains contenus restent **uniquement sur votre appareil** et ne sont pas envoyés à PixUp : vidéos et séquences du module Recording, brouillons du module Training, préférences d'affichage. La dictée vocale des notes utilise la reconnaissance vocale de votre navigateur : l'audio est traité par l'éditeur du navigateur, pas par PixUp.`),
      s("Finalités et bases légales", `
- **Fournir le service** (compte, sauvegarde et synchronisation des contenus, mode Live, envoi des e-mails liés au compte) : exécution du contrat (CGU).
- **Gérer les abonnements, la facturation et le droit à l'essai gratuit** : exécution du contrat et obligations légales comptables.
- **Assurer la sécurité** de la plateforme (prévention des abus, détection des erreurs, sauvegardes) : intérêt légitime de PixUp.
- **Répondre à vos demandes** adressées au support : intérêt légitime ou exécution du contrat.
- **Vous informer** des nouveautés de The Box : uniquement avec votre accord, retirable à tout moment.

Vos données ne sont **ni vendues, ni louées, ni utilisées à des fins publicitaires**.`),
      s("Destinataires et prestataires", `
Les données sont accessibles uniquement aux personnes habilitées de PixUp et aux prestataires techniques qui agissent sur ses instructions :

- **Vercel Inc.** (États-Unis) : hébergement de l'application web ;
- **Google Firebase** (Google Ireland Limited) : base de données hébergée dans l'Union européenne, authentification, contrôle anti-abus (reCAPTCHA) ;
- **Stripe Payments Europe Ltd** (Irlande) : paiement des abonnements ;
- [À COMPLÉTER : prestataire d'envoi des e-mails (nom et pays)] : envoi des e-mails du service.

Les pages publiques du mode Live sont visibles par les personnes disposant du lien ou du QR code, avec des informations réduites sur les joueurs (prénom et initiale du nom).`),
      s("Transferts hors de l'Union européenne", `
Certains prestataires (notamment Vercel, Google et Stripe) peuvent traiter des données aux États-Unis. Ces transferts sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) auquel ces sociétés adhèrent et, à défaut, par les clauses contractuelles types de la Commission européenne.`),
      s("Durées de conservation", `
- **Compte et contenus :** tant que le compte existe, y compris en Formule Gratuite, puis suppression définitive à la suppression du compte.
- **Sauvegardes de sécurité chiffrées :** au plus 8 semaines ; les données supprimées disparaissent des sauvegardes à l'issue de ce délai.
- **Factures et données de paiement :** 10 ans (obligations comptables), chez le prestataire de paiement.
- **Empreinte de l'adresse e-mail des anciens abonnés** (chiffrée, non réversible) : conservée pour éviter l'attribution d'un nouvel essai gratuit.
- **Journaux techniques :** durée limitée, au plus 12 mois.
- **Messages au support :** le temps du traitement de la demande, puis au plus 3 ans.`),
      s("Sécurité", `
PixUp met en œuvre des mesures techniques et organisationnelles adaptées : connexions chiffrées (HTTPS), règles d'accès strictes à la base de données (chaque coach n'accède qu'à ses propres données), contrôle anti-abus, sauvegardes chiffrées, accès d'administration limités.`),
      s("Vos droits", `
Vous disposez d'un droit d'**accès**, de **rectification**, d'**effacement**, de **limitation**, d'**opposition** et de **portabilité** de vos données, ainsi que du droit de définir des directives relatives à leur sort après votre décès.

Vous pouvez modifier vos informations et supprimer votre compte depuis **Paramètres > Profil**, ou écrire à **${SUPPORT}**. Une réponse vous est apportée dans un délai d'un mois.

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la **CNIL** (www.cnil.fr).`),
      s("Mineurs", `
Les comptes The Box sont destinés aux entraîneurs, éducateurs et responsables de club majeurs. Les données de joueurs mineurs ne sont saisies que par leur club ou leur coach, sous sa responsabilité (voir l'Accord de sous-traitance des données).`),
      s("Modification de la politique", `
Cette politique peut être mise à jour pour tenir compte des évolutions du service ou de la réglementation. La date de dernière mise à jour figure en haut du document ; en cas de changement important, les utilisateurs en sont informés dans l'application.`),
    ],
  },

  dpa: {
    intro:
      "Le présent accord, conclu en application de l'article 28 du RGPD, fait partie intégrante des Conditions Générales d'Utilisation. Il s'applique aux données personnelles des joueurs et des membres du club que le coach ou le club (le « Client ») enregistre sur The Box, et que PixUp (le « Sous-traitant ») traite pour son compte.",
    sections: [
      s("Objet et parties", `
Le **Client** (le club, ou le coach agissant pour son club) est responsable du traitement des données de ses joueurs et membres : il détermine pourquoi et comment ces données sont utilisées.

**PixUp**, éditeur de The Box, agit en qualité de **sous-traitant** : il traite ces données uniquement pour fournir le service au Client, selon ses instructions documentées, qui sont constituées par les CGU, le présent accord et l'utilisation que le Client fait des fonctionnalités de la plateforme.`),
      s("Description du traitement", `
- **Finalité :** organisation sportive de l'équipe (effectifs, compositions, convocations, matchs, statistiques, mode Live).
- **Personnes concernées :** joueurs (y compris mineurs), membres du staff, le cas échéant parents ou représentants légaux.
- **Données :** nom, prénom, numéro, poste, photo, catégorie, présence et réponses aux convocations, faits et statistiques de match, notes du coach.
- **Opérations :** enregistrement, conservation, consultation, affichage, publication restreinte (mode Live : prénom et initiale du nom uniquement), effacement.
- **Durée :** pendant toute la durée d'utilisation du service par le Client.`),
      s("Obligations de PixUp", `
PixUp s'engage à :

- traiter les données **uniquement pour fournir le service** et sur instruction du Client, et à l'informer si une instruction lui paraît contraire à la réglementation ;
- ne jamais vendre, céder ou exploiter ces données pour son propre compte, notamment à des fins publicitaires ;
- garantir la **confidentialité** des données : seules les personnes habilitées de PixUp, soumises à une obligation de confidentialité, peuvent y accéder, et uniquement lorsque c'est nécessaire (support, sécurité) ;
- mettre en œuvre les **mesures de sécurité** prévues à l'article 32 du RGPD : chiffrement des communications, cloisonnement des données de chaque compte par des règles d'accès, contrôle anti-abus, sauvegardes chiffrées, accès d'administration restreints ;
- **aider le Client** à répondre aux demandes d'exercice de droits des personnes concernées (accès, rectification, effacement…), notamment grâce aux fonctions de modification et de suppression de l'application ;
- **notifier au Client toute violation de données** le concernant dans les meilleurs délais, et au plus tard 48 heures après en avoir pris connaissance, avec les informations utiles à sa propre notification à la CNIL ;
- aider le Client, dans la mesure du raisonnable, à réaliser une analyse d'impact lorsque celle-ci est requise ;
- mettre à disposition du Client les informations nécessaires pour démontrer le respect du présent accord et permettre des audits, sur demande motivée et avec un préavis raisonnable.`),
      s("Sous-traitants ultérieurs", `
Le Client autorise PixUp à recourir aux sous-traitants ultérieurs suivants pour l'exécution du service :

- **Google Firebase** (Google Ireland Limited) : base de données hébergée dans l'Union européenne et authentification ;
- **Vercel Inc.** (États-Unis) : hébergement de l'application web ;
- [À COMPLÉTER : prestataire d'envoi des e-mails (nom et pays)] : envoi des e-mails du service.

PixUp impose à ces prestataires des obligations de protection des données équivalentes à celles du présent accord et informe le Client de tout changement envisagé (mise à jour de ce document), le Client pouvant s'y opposer en cessant d'utiliser le service. Les transferts éventuels hors de l'Union européenne sont encadrés par le Data Privacy Framework ou les clauses contractuelles types de la Commission européenne.`),
      s("Obligations du Client", `
Le Client s'engage à :

- disposer d'une base légale pour traiter les données de ses joueurs et membres, et les **informer** de l'utilisation de The Box ;
- recueillir l'**accord des représentants légaux** des joueurs mineurs lorsque c'est nécessaire, notamment avant toute publication d'un match en mode Live ;
- ne saisir que les données **nécessaires** à l'organisation sportive et les tenir à jour ;
- ne pas enregistrer de **données sensibles**, en particulier d'informations médicales détaillées : l'application ne prévoit qu'un statut sportif simple (ex. « blessé », « absent ») ;
- préserver la confidentialité de ses identifiants et des liens de partage qu'il diffuse.`),
      s("Sort des données en fin de service", `
Lorsque le Client supprime une donnée, une équipe ou son compte, les données correspondantes sont effacées de la base de production. Elles disparaissent des sauvegardes de sécurité chiffrées au plus tard **8 semaines** après. PixUp ne conserve aucune copie au-delà, sauf obligation légale. Avant la suppression, le Client peut récupérer ses données sur demande à **${SUPPORT}**.`),
      s("Durée et modification", `
Le présent accord s'applique pendant toute la durée d'utilisation du service par le Client et prend fin avec la suppression de son compte, sous réserve des obligations de suppression ci-dessus. PixUp peut le mettre à jour pour tenir compte de l'évolution du service ou de la réglementation ; la date de dernière mise à jour figure en haut du document.`),
    ],
  },
});

/** Texte par défaut d'un document (nouveaux identifiants de section à chaque appel) */
export function defaultLegalDocument(id: LegalDocId): LegalDocument {
  const d = defaults()[id];
  return { id, intro: d.intro, sections: d.sections, updatedAt: null, updatedBy: null, version: 0 };
}

/**
 * Contenu publié lu en base, vérifié champ par champ : un document illisible ou vide est remplacé par
 * le texte par défaut (les pages légales ne doivent jamais s'afficher vides).
 */
export function readLegalDocument(id: LegalDocId, data: unknown): LegalDocument {
  if (!data || typeof data !== "object") return defaultLegalDocument(id);
  const d = data as Record<string, unknown>;
  const sections = Array.isArray(d.sections)
    ? d.sections
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
        .map((x) => ({
          id: typeof x.id === "string" && x.id ? x.id : newSectionId(),
          title: typeof x.title === "string" ? x.title : "",
          body: typeof x.body === "string" ? x.body : "",
        }))
        .filter((x) => x.title.trim() || x.body.trim())
    : [];
  if (!sections.length) return defaultLegalDocument(id);
  return {
    id,
    intro: typeof d.intro === "string" ? d.intro : "",
    sections,
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null,
    updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : null,
    version: typeof d.version === "number" ? d.version : 0,
  };
}

/** Problèmes empêchant la publication (vide, trop long) */
export function validateLegalDocument(doc: Pick<LegalDocument, "intro" | "sections">): string | null {
  if (!doc.sections.length) return "Le document doit contenir au moins une section.";
  if (doc.sections.length > LEGAL_LIMITS.sections) return `${LEGAL_LIMITS.sections} sections au maximum.`;
  if (doc.intro.length > LEGAL_LIMITS.intro) return `L'introduction dépasse ${LEGAL_LIMITS.intro} caractères.`;
  for (const [i, sec] of doc.sections.entries()) {
    if (!sec.title.trim()) return `La section ${i + 1} n'a pas de titre.`;
    if (!sec.body.trim()) return `La section « ${sec.title} » est vide.`;
    if (sec.title.length > LEGAL_LIMITS.title) return `Le titre de la section ${i + 1} est trop long.`;
    if (sec.body.length > LEGAL_LIMITS.body) return `La section « ${sec.title} » dépasse ${LEGAL_LIMITS.body} caractères.`;
  }
  return null;
}
