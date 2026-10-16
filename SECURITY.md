# Politique de Sécurité - The Box

## Outils de Sécurité Automatisés Actifs (100% Gratuits)

Ce projet bénéficie d'une chaîne de sécurité automatisée pour protéger le code et les données :

1. **GitHub CodeQL (SAST)**
   - Analyse automatique à chaque `push` et `pull request` sur la branche `main`.
   - Détection des failles OWASP Top 10 (injections, XSS, SSRF, failles de contrôle d'accès).

2. **Dependabot (SCA)**
   - Veille automatique hebdomadaire sur les dépendances `npm`.
   - Ouverture automatique de Pull Requests dès qu'un correctif de sécurité (CVE) est disponible.

3. **Gitleaks (Secret Detection)**
   - Analyse de l'historique et des commits pour empêcher l'exposition accidentelle de clés d'API (Stripe, Firebase, Resend, etc.).

4. **Audit local**
   - Vous pouvez tester vos dépendances à tout moment avec :
     ```bash
     npm run security:check
     ```

## Signalement de Vulnérabilité

Si vous découvrez une faille de sécurité dans cette application, merci de **ne pas créer d'issue publique**.
Veuillez envoyer un rapport privé avec les détails de reproduction afin qu'un correctif puisse être déployé rapidement.
