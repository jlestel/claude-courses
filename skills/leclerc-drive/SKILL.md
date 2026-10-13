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

## Repères du site

- L'accueil leclercdrive.fr ne montre pas le magasin : « Mon drive <ville> » puis
  « Commencer mes courses » mène au site du magasin
  (`https://fdN-courses.leclercdrive.fr/magasin-<id>-<id>-<Ville>.aspx`, à garder dans `leclerc.site`).
- Produits habituels : `<site magasin>/produits-habituels.aspx`. Les produits ne sont pas
  des liens dans le DOM : ils sont dans un JSON d'un `<script>` (`iIdProduit`,
  `sLibelleLigne1/2`, `sPrixUnitaire`, `sUrlPageProduit`).
- Commandes : `https://fdN-espace-client.leclercdrive.fr/drive/magasin-<id>-<id>-<Ville>/mes-commandes.aspx`
  (filtre par année `?AnneeSelectionnee=AAAA`).
- « Accéder à Mon compte » (`aiguillage.aspx`) peut rester blanc : passer par le site du magasin.
- Fiche produit : `<site magasin>/fiche-produits-<iIdProduit>-<slug>.aspx` ; le slug est libre
  (n'importe quel texte), seul l'id compte.
- Recherche : `<site magasin>/recherche.aspx?TexteRecherche=<texte>` ; résultats dans le même
  JSON embarqué que les habituels. Si la recherche ne trouve rien, le site renvoie les
  habituels : vérifier que les libellés correspondent.
- Ajout au panier sur une fiche : `click()` JS sur l'élément visible `#sLibellePictoAjouterProduit`
  (les autres liens « Ajout produit au panier » ne réagissent pas au clic JS). Quantité :
  `#js_bloc_plus_un_moins_un a[href="#plus"]` visible, un clic par unité, ~1,5 s entre deux.
  Le bloc affiche alors `- n +`.
- Rupture : popup « Stock - Produit bientôt disponible » et rien n'est ajouté. Le stock dépend
  de la date de retrait (bandeau « Un ou plusieurs produits… ne sont pas disponibles pour un
  retrait à cette date ») : signaler qu'un créneau plus tardif peut lever des ruptures.
- Fiche sans `h1` ni bouton : produit déréférencé, à traiter comme introuvable.
- Contrôle final : liste du panier latéral `#ulWCRS319_Produits` (une ligne par produit) et
  « Total à payer » du panneau.

## Déroulé

1. Ouvre https://www.leclercdrive.fr/ dans un nouvel onglet. Si l'utilisateur
   n'est pas connecté ou qu'un CAPTCHA s'affiche : stop, demande-lui de le faire
   (via `reply` si l'ordre vient du canal), ne saisis jamais d'identifiants.
2. Vérifie que le magasin affiché = `leclerc.magasin`. Sinon, signale-le.
3. Liste demandée = `habituels` du profil, puis applique l'ordre reçu
   (« sans le lait », « + 2 pizzas », « double les yaourts »…).
   Saute les lignes dont `saison` ne correspond pas au mois courant (`ete` = juin-septembre,
   `hiver` = décembre-février…) sauf si l'ordre les demande ; liste-les dans le récap.
   `poids_kg` donne le poids habituel d'un produit en vrac.
   Dans `leclerc` : `quantite` (si présente) remplace la quantité générale pour cette enseigne
   (formats différents) ; `correspondance` = `identique` | `equivalent` | `proche` | `absent`.
   `absent` -> ne cherche pas, note-le introuvable. `remplacement: "a-confirmer"` -> ajoute
   le produit mais signale-le dans le récap comme équivalent à valider.
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
