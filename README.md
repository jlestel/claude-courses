# claude-courses

Plugin Claude Code pour faire ses courses en drive **dans son propre Chrome**
(Claude in Chrome), avec ses produits habituels par défaut, pilotable à distance
depuis un agent (Hermes) via un *channel* Claude Code.

- v0.1 : **Leclerc Drive**, s'arrête au panier rempli (jamais de paiement).
- v0.2 : **Intermarché Drive** (skill `intermarche-drive`, habituels importés depuis
  « Mes produits habituels »), enseigne par défaut dans le profil.
- v0.3 : comparaison des paniers (prix au kilo, total, panier split).

## Pourquoi le navigateur de l'utilisateur

Les sites drive bloquent les navigateurs headless (anti-bot) et n'ont pas d'API
publique. Le Chrome de l'utilisateur a déjà la session, le magasin et les cookies.

## Installation

```bash
# dans Claude Code
/plugin marketplace add jlestel/claude-courses
/plugin install courses@jlestel
/courses:setup          # profil + habituels + pont Hermes
```

Lancement avec navigateur + canal (le canal n'est pas sur l'allowlist Anthropic,
d'où le flag de dev, à confirmer au démarrage) :

```bash
claude --chrome --dangerously-load-development-channels plugin:courses@jlestel
```

Utilisation locale : `/courses:courses sans le lait, +2 pizzas` (enseigne par défaut
du profil) ou `/courses:courses intermarche sans le lait`.

Développement local du plugin : `claude --chrome --plugin-dir ~/claude-courses`.

## Pilotage depuis Hermes

```
Hermes --(ntfy topic-in, HMAC)--> channel/server.mjs --<channel>--> Claude Code --Chrome--> leclercdrive.fr / intermarche.com
Hermes <--(ntfy topic-out, HMAC)-- outil reply <-------------------------'
```

- Le topic est aléatoire et chaque message est signé (HMAC-SHA256, secret partagé,
  anti-rejeu 10 min) : un message non signé n'atteint jamais Claude.
- Côté Hermes : `python3 hermes/courses_send.py "courses habituelles sans le lait"`.
- Le contenu du message transite par ntfy.sh en clair (pas les identifiants) ;
  auto-héberger ntfy via `server` dans `bridge.json` si besoin.

## Limites connues

- La session Claude Code doit rester ouverte (terminal/tmux) pour recevoir les ordres.
- Channels = *research preview* : le protocole peut bouger.
- Login, CAPTCHA, créneau et paiement restent manuels.
