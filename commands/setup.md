---
description: Configurer le profil (magasin, habituels) et le pont Hermes
---

1. Crée `~/.claude-courses/` s'il n'existe pas.
2. Si `~/.claude-courses/profil.json` n'existe pas, copie
   `${CLAUDE_PLUGIN_ROOT}/profil.example.json` et demande-moi mon magasin Leclerc Drive.
3. Propose de construire mes habituels : ouvre leclercdrive.fr dans Chrome, va dans
   « Mes commandes » / « Mes produits habituels », relève les produits les plus
   commandés (nom, libellé exact, URL de fiche, quantité habituelle) et
   écris-les dans `habituels` après m'avoir montré la liste.
4. Pont Hermes : si `~/.claude-courses/bridge.json` n'existe pas, lance
   `node ${CLAUDE_PLUGIN_ROOT}/channel/pair.mjs` et affiche-moi sa sortie
   (topic + secret à donner à Hermes, une seule fois).
