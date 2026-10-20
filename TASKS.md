# 📋 Feuille de Route & Spécifications - Copilote Tactique IA (TheBox)

Ce document répertorie l'ensemble des tâches pour concevoir, intégrer et tester le **Copilote Tactique IA** au sein de l'application TheBox.

---

## 📌 Objectifs du Copilote
1. **Aide tactique & sportive** : Conseiller le coach sur le choix de schéma tactique, les animations et les consignes adaptées en fonction de l'adversaire (ex: contrer un 4-3-3 pressing haut, déstabiliser un bloc bas 5-3-2, transitions rapides, etc.).
2. **Aide à l'utilisation de TheBox** : Guider l'utilisateur sur les fonctionnalités de l'application (comment tracer des flèches, sauvegarder un schéma, exporter en haute définition, partager par email, gérer les joueurs/effectifs).
3. **Ergonomie premium** : Un composant rétractable (tiroir latéral ou bulle flottante) intégré directement dans [`components/TacticsBoard.tsx`](file:///c:/Users/denis/Desktop/the-box/components/TacticsBoard.tsx) avec streaming temps réel.

---

## 🛠️ Configuration Préalable
- [ ] **Variable d'environnement** : Ajouter `GEMINI_API_KEY` dans le fichier `.env.local` et documenter dans [`.env.example`](file:///c:/Users/denis/Desktop/the-box/.env.example).
- [ ] **Vérification du SDK** : Confirmer le bon fonctionnement de `@google/genai` avec le modèle `gemini-2.5-flash` ou `gemini-1.5-flash`.

---

## 🚀 Tâches par Phase

### Phase 1 : Cœur IA & Route API Backend
- [ ] **1.1 Création du System Prompt tactique** ([`lib/ai/tacticalPrompt.ts`](file:///c:/Users/denis/Desktop/the-box/lib/ai/tacticalPrompt.ts))
  - Définir l'identité : Entraîneur-adjoint d'élite & expert tactique multisport (priorité Football 11v11, 8v8, 5v5 + polyvalence).
  - Injecter les connaissances de l'application issues du [`GUIDE_UTILISATEUR.md`](file:///c:/Users/denis/Desktop/the-box/GUIDE_UTILISATEUR.md) (outils de dessin, export image/PDF, gestion de l'effectif, bibliothèque de schémas, causerie vocale).
  - Structurer les réponses : Dispositif conseillé, animation avec/sans ballon, points de vigilance, consignes par ligne.
- [ ] **1.2 Création du endpoint d'API** ([`app/api/assistant/route.ts`](file:///c:/Users/denis/Desktop/the-box/app/api/assistant/route.ts))
  - Valider le payload entrant (historique des messages, sport actuel, schéma en cours si disponible).
  - Appeler l'API Gemini avec streaming (`GoogleGenAI` stream generate content).
  - Gérer la sécurité de base (limite de taille de requête, gestion des erreurs de quota et timeout).

### Phase 2 : Interface Utilisateur (UI & UX)
- [ ] **2.1 Création du composant Drawer / Modal** ([`components/TacticalCopilotModal.tsx`](file:///c:/Users/denis/Desktop/the-box/components/TacticalCopilotModal.tsx))
  - Panneau latéral fluide avec `motion` (effet slide-over ou fenêtre flottante rétractable).
  - Thème sombre & verre dépoli (glassmorphism) cohérent avec la charte graphique de TheBox.
  - Gestion du streaming de réponse avec défilement automatique vers le bas.
- [ ] **2.2 Suggestions de questions rapides (Quick Prompts)**
  - Boutons d'amorçage en un clic :
    - *"🛡️ Comment contrer un 4-3-3 pressing tout terrain ?"*
    - *"🎯 Quel schéma privilégier pour jouer en contre-attaque rapide ?"*
    - *"⚽ Comment déstabiliser un bloc bas très regroupé ?"*
    - *"❓ Comment exporter mon schéma actuel en haute résolution ?"*
- [ ] **2.3 Intégration dans le tableau tactique** ([`components/TacticsBoard.tsx`](file:///c:/Users/denis/Desktop/the-box/components/TacticsBoard.tsx))
  - Ajouter un bouton déclencheur moderne avec badge "IA" ou étincelle (`Sparkles`) dans la barre d'outils du tableau.
  - Passer le contexte courant (nom du sport sélectionné, nombre de joueurs sur le terrain) à l'assistant.

### Phase 3 : Interaction Avancée avec le Tableau (Optionnel & Recommandé)
- [ ] **3.1 Recommandation de schémas interactifs**
  - Permettre à l'IA d'indiquer des formations standard pré-existantes dans TheBox (ex: 4-4-2, 4-3-3, 3-5-2).
  - Ajouter un bouton d'action sous la réponse : *"Appliquer cette formation sur mon terrain"*.

### Phase 4 : Tests, Résilience & Finitions
- [ ] **4.1 Gestion des erreurs côté client**
  - Affichage d'un message bienveillant si la clé API est absente ou si le quota est dépassé.
  - Bouton pour régénérer ou effacer l'historique de la conversation.
- [ ] **4.2 Responsive & Mobile**
  - Vérifier l'affichage sur smartphone et tablette (adaptation de la largeur du tiroir).

---

## 💡 Comment lancer l'exécution ?

Pour me demander de réaliser le travail, vous pouvez simplement me donner l'une de ces instructions :
- *"Réalise la Phase 1 de TASKS.md"* (créera la route API et le prompt d'analyse tactique)
- *"Réalise la tâche 1.1"*
- *"Réalise toutes les tâches dans l'ordre"*
