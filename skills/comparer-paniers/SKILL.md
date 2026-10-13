---
name: comparer-paniers
description: Use when comparing the same basket across Leclerc and Intermarché. Pas encore actif : chaque enseigne se remplit séparément en v0.2.
---

# Comparer les paniers (v0.3, pas encore actif)

Prévu : remplir le même panier sur Leclerc Drive et Intermarché Drive, puis
comparer ligne à ligne sur le prix au kilo/litre (pas le prix facial, les
formats diffèrent) et sur le total, frais de drive compris.

Sortie attendue : total par enseigne, écart, les 5 lignes qui pèsent le plus
dans l'écart, et un panier « split » si l'écart justifie deux retraits.

En v0.2, réponds que la comparaison n'est pas encore branchée : Leclerc et
Intermarché se remplissent séparément (`/courses:courses leclerc|intermarche`).
