---
name: intermarche-drive
description: Use when filling an Intermarché Drive basket in the user's Chrome. Habituels par défaut, panier rempli, jamais de paiement.
---

# Intermarché Drive dans le Chrome de l'utilisateur

Outil : Claude in Chrome (session lancée avec `claude --chrome`). On utilise le
navigateur réel de l'utilisateur : sa session Intermarché, son magasin, ses
cookies. Un navigateur headless se fait bloquer par l'anti-bot du site.

## Données

- Profil : `~/.claude-courses/profil.json` (voir `profil.example.json` du plugin).
  - `intermarche.magasin` : magasin drive choisi.
  - `habituels` : liste `{nom, quantite, intermarche: {url?, libelle?}, remplacement}`.
    Une ligne sans clé `intermarche` est cherchée par son `nom`.
- Historique : `~/.claude-courses/paniers/AAAA-MM-JJ-intermarche.json`, écrit à chaque run.

## Repères du site

- Accueil : https://www.intermarche.com/
- Produits habituels du compte : https://www.intermarche.com/gestion-de-compte/mes-produits-habituels
  (liens de fiche `/produit/<slug>/<EAN>` : l'EAN en fin d'URL identifie le produit).
- Fiche produit : `https://www.intermarche.com/produit/<slug>/<EAN>`.
- Les produits « en vrac » (fruits, légumes, pain cuit sur place) ont un prix
  estimé à la pièce : signale-le dans le récapitulatif.

## Déroulé

1. Ouvre https://www.intermarche.com/ dans un nouvel onglet. Si l'utilisateur
   n'est pas connecté ou qu'un CAPTCHA s'affiche : stop, demande-lui de le faire
   (via `reply` si l'ordre vient du canal), ne saisis jamais d'identifiants.
2. Vérifie que le magasin affiché = `intermarche.magasin` et que le mode est
   drive/retrait. Sinon, signale-le sans le changer toi-même.
3. Si le panier contient déjà des articles, liste-les et demande quoi faire.
4. Liste demandée = `habituels` du profil, puis applique l'ordre reçu
   (« sans le lait », « + 2 pizzas », « double les yaourts »…).
   Saute les lignes dont `saison` ne correspond pas au mois courant (`ete` = juin-septembre,
   `hiver` = décembre-février…) sauf si l'ordre les demande ; liste-les dans le récap.
   `poids_kg` donne le poids habituel d'un produit en vrac.
   Dans `intermarche` : `quantite` (si présente) remplace la quantité générale pour cette enseigne
   (formats différents) ; `correspondance` = `identique` | `equivalent` | `proche` | `absent`.
   `absent` -> ne cherche pas, note-le introuvable. `remplacement: "a-confirmer"` -> ajoute
   le produit mais signale-le dans le récap comme équivalent à valider.
5. Pour chaque ligne :
   - si `intermarche.url` existe, ouvre la fiche ; sinon cherche `intermarche.libelle` ou `nom` ;
   - indisponible -> règle `remplacement` (`aucun` | `meme-marque` | `moins-cher`) ;
     note toujours le remplacement ;
   - ajoute la quantité, relève prix unitaire, prix au kilo/litre, promo éventuelle
     (« 2+1 offert », « -50 % sur le 2ème », avantage carte…). Ne change pas la
     quantité pour déclencher une promo : signale-la.
   - si tu as trouvé une fiche fiable sans `url` dans le profil, propose de l'ajouter.
6. Ouvre le panier, relève le total affiché par le site (fait foi) et les
   avantages carte annoncés.
7. Écris l'historique JSON : `{date, enseigne: "intermarche", magasin, lignes:[{nom,
   libelle_site, url, quantite, prix_unitaire, prix_kg, promo, statut}], total_site, introuvables}`.
8. Rends compte : total, lignes remplacées/introuvables, promos vues.

## Interdits

- Ne choisis pas de créneau, ne valide pas la commande, ne paie pas : l'utilisateur
  le fait lui-même. Le plugin s'arrête au panier rempli.
- Ne vide pas un panier existant sans le dire.
- Pas d'achat d'un produit dont le prix dépasse de plus de 30 % le dernier prix de
  l'historique sans le signaler.
