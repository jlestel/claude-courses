---
description: Remplir le panier drive (Leclerc ou Intermarché) avec les produits habituels (+ ajustements)
argument-hint: "[leclerc|intermarche] [ajustements, ex. sans lait, +2 pizzas]"
---

Enseigne : si `$ARGUMENTS` commence par `leclerc` ou `intermarche` (ou nomme
l'enseigne), utilise-la ; sinon prends `enseigne` dans `~/.claude-courses/profil.json`
(défaut `leclerc`).

- Leclerc -> skill `courses:leclerc-drive`
- Intermarché -> skill `courses:intermarche-drive`

Remplis mon panier avec mes produits habituels pour cette enseigne, en appliquant
ces ajustements : $ARGUMENTS
