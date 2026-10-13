---
name: leclerc-drive
description: Use when filling a Leclerc Drive basket in the user's Chrome. Habituels par défaut, panier rempli, jamais de paiement.
---

# Leclerc Drive dans le Chrome de l'utilisateur

Outil : Claude in Chrome (session lancée avec `claude --chrome`). On utilise le
navigateur réel de l'utilisateur : sa session Leclerc, son magasin drive, ses
cookies. Un navigateur headless se fait bloquer par l'anti-bot du site.

## Données

- Profil : `~/.claude-courses/profil.json` (voir `profil.example.json` du plugin).
  - `leclerc.magasin` : magasin drive choisi.
  - `habituels` : liste `{nom, quantite, leclerc: {url?, libelle?}, remplacement}`.
- Historique : `~/.claude-courses/paniers/AAAA-MM-JJ-leclerc.json`, écrit à chaque run.

## Déroulé

1. Ouvre https://www.leclercdrive.fr/ dans un nouvel onglet. Si l'utilisateur
   n'est pas connecté ou qu'un CAPTCHA s'affiche : stop, demande-lui de le faire
   (via `reply` si l'ordre vient du canal), ne saisis jamais d'identifiants.
2. Vérifie que le magasin affiché = `leclerc.magasin`. Sinon, signale-le.
3. Liste demandée = `habituels` du profil, puis applique l'ordre reçu
   (« sans le lait », « + 2 pizzas », « double les yaourts »…).
4. Pour chaque ligne :
   - si `leclerc.url` existe, ouvre la fiche produit ; sinon cherche `leclerc.libelle` ou `nom` ;
   - indisponible -> règle `remplacement` (`aucun` | `meme-marque` | `moins-cher`) ;
     note toujours le remplacement ;
   - ajoute la quantité, relève prix unitaire, prix au kilo/litre, promo éventuelle.
   - si tu as trouvé une fiche fiable sans `url` dans le profil, propose de l'ajouter.
5. Ouvre le panier, relève le total affiché par le site (fait foi).
6. Écris l'historique JSON : `{date, enseigne, magasin, lignes:[{nom, libelle_site, url,
   quantite, prix_unitaire, prix_kg, promo, statut}], total_site, introuvables}`.
7. Rends compte : total, lignes remplacées/introuvables, promos vues.

## Interdits

- Ne choisis pas de créneau, ne valide pas la commande, ne paie pas : l'utilisateur
  le fait lui-même. Le plugin s'arrête au panier rempli.
- Ne vide pas un panier existant sans le dire : s'il contient déjà des articles,
  liste-les et demande quoi faire.
- Pas d'achat d'un produit dont le prix dépasse de plus de 30 % le dernier prix de
  l'historique sans le signaler.
