---
description: Configurer le profil (enseigne, magasin, habituels) et le pont Hermes
---

1. Crée `~/.claude-courses/` s'il n'existe pas.
2. Si `~/.claude-courses/profil.json` n'existe pas, copie
   `${CLAUDE_PLUGIN_ROOT}/profil.example.json`. Demande-moi mon enseigne par défaut
   (`leclerc` ou `intermarche`, champ `enseigne`) et mon magasin pour chaque enseigne utilisée.
3. Propose de construire mes habituels pour l'enseigne choisie, dans Chrome :
   - Leclerc : leclercdrive.fr, « Mes commandes » / « Mes produits habituels ».
   - Intermarché : https://www.intermarche.com/gestion-de-compte/mes-produits-habituels
     (liens `/produit/<slug>/<EAN>`).
   Relève les produits (nom, libellé exact, URL de fiche, quantité habituelle si
   visible), montre-moi la liste numérotée par rayon, laisse-moi choisir et fixer
   les quantités, puis écris-les dans `habituels` sous la clé de l'enseigne
   (`leclerc: {libelle, url}` ou `intermarche: {libelle, url}`). Si un produit
   existe déjà dans `habituels` (même nom), complète-le au lieu de le dupliquer.
   Ne saisis jamais d'identifiants : si je ne suis pas connecté, demande-moi de le faire.
4. Pont Hermes : si `~/.claude-courses/bridge.json` n'existe pas, lance
   `node ${CLAUDE_PLUGIN_ROOT}/channel/pair.mjs` et affiche-moi sa sortie
   (topic + secret à donner à Hermes, une seule fois).
