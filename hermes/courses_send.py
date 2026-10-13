#!/usr/bin/env python3
"""Côté Hermes : envoie un ordre signé au Claude Code de l'utilisateur et attend la réponse.

Usage : courses_send.py "fais les courses habituelles sans le lait" [--wait 900]
Config : ~/.claude-courses/bridge.json (même contenu que sur le poste) ou
COURSES_TOPIC / COURSES_SECRET / COURSES_NTFY.
"""
import argparse, hashlib, hmac, json, os, sys, time, uuid, urllib.request
from pathlib import Path

def conf():
    f = Path(os.environ.get("COURSES_BRIDGE", Path.home() / ".claude-courses" / "bridge.json"))
    c = json.loads(f.read_text()) if f.exists() else {}
    return {
        "server": os.environ.get("COURSES_NTFY", c.get("server", "https://ntfy.sh")),
        "topic": os.environ.get("COURSES_TOPIC", c.get("topic")),
        "secret": os.environ.get("COURSES_SECRET", c.get("secret")),
    }

def sign(secret, *parts):
    return hmac.new(secret.encode(), ".".join(parts).encode(), hashlib.sha256).hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("text")
    ap.add_argument("--wait", type=int, default=900, help="secondes d'attente des réponses (0 = ne pas attendre)")
    ap.add_argument("--until", default="", help="s'arrêter dès qu'une réponse contient ce texte")
    a = ap.parse_args()
    c = conf()
    if not c["topic"] or not c["secret"]:
        sys.exit("bridge non configuré (topic/secret)")
    rid, ts = uuid.uuid4().hex[:12], str(int(time.time()))
    msg = {"id": rid, "ts": ts, "text": a.text, "sig": sign(c["secret"], rid, ts, a.text)}
    since = ts
    urllib.request.urlopen(urllib.request.Request(f"{c['server']}/{c['topic']}-in", data=json.dumps(msg).encode()), timeout=15)
    print(json.dumps({"sent": rid}), flush=True)
    deadline = time.time() + a.wait
    while time.time() < deadline:
        url = f"{c['server']}/{c['topic']}-out/json?poll=1&since={since}"
        for line in urllib.request.urlopen(url, timeout=30).read().decode().splitlines():
            ev = json.loads(line)
            if ev.get("event") != "message":
                continue
            since = ev["id"]
            try:
                r = json.loads(ev["message"])
            except ValueError:
                continue
            if r.get("id") != rid or not hmac.compare_digest(r.get("sig", ""), sign(c["secret"], rid, r.get("text", ""))):
                continue
            print(json.dumps({"reply": r["text"]}, ensure_ascii=False), flush=True)
            if a.until and a.until in r["text"]:
                return
        time.sleep(4)

if __name__ == "__main__":
    main()
