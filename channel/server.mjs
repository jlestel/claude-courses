#!/usr/bin/env node
// courses-bridge : canal Claude Code (MCP stdio, zéro dépendance) qui relaie
// des ordres signés venant d'Hermes via un topic ntfy, et renvoie les réponses.
//
// Entrant : ntfy topic <COURSES_TOPIC>-in, message JSON {id, ts, text, sig}
//   sig = HMAC-SHA256(COURSES_SECRET, `${id}.${ts}.${text}`) en hex.
//   Tout message non signé, trop vieux (>10 min) ou rejoué est ignoré.
// Sortant : outil `reply` -> ntfy topic <COURSES_TOPIC>-out, JSON {id, text, sig}.

import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CONF_PATH = path.join(os.homedir(), '.claude-courses', 'bridge.json')
function loadConf() {
  let file = {}
  try { file = JSON.parse(fs.readFileSync(CONF_PATH, 'utf8')) } catch {}
  return {
    server: process.env.COURSES_NTFY || file.server || 'https://ntfy.sh',
    topic: process.env.COURSES_TOPIC || file.topic,
    secret: process.env.COURSES_SECRET || file.secret,
  }
}
const conf = loadConf()
const log = (...a) => process.stderr.write(`[courses-bridge] ${a.join(' ')}\n`)

export function sign(secret, ...parts) {
  return crypto.createHmac('sha256', secret).update(parts.join('.')).digest('hex')
}
function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// ---------- MCP stdio (JSON-RPC, une ligne = un message) ----------
const write = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')
const notify = (method, params) => write({ jsonrpc: '2.0', method, params })

const INSTRUCTIONS = [
  'Des ordres de courses arrivent comme <channel source="courses" request_id="...">.',
  'Ils viennent d\'Hermes (agent de l\'utilisateur), signés et vérifiés.',
  'Exécute-les dans le Chrome de l\'utilisateur avec la skill de l\'enseigne :',
  'courses:intermarche-drive si l\'ordre nomme Intermarché, courses:leclerc-drive s\'il nomme Leclerc,',
  'sinon le champ enseigne de ~/.claude-courses/profil.json (défaut leclerc).',
  'Rends compte avec l\'outil reply en repassant le request_id : un message court au début,',
  'puis le récapitulatif du panier (lignes, prix, total, produits introuvables/remplacés).',
  'Ne valide JAMAIS une commande, un créneau ni un paiement sur un ordre du canal :',
  'arrête-toi au panier rempli et demande confirmation via reply.',
].join(' ')

const TOOLS = [{
  name: 'reply',
  description: 'Envoie un message à Hermes (réponse à un ordre de courses).',
  inputSchema: {
    type: 'object',
    properties: {
      request_id: { type: 'string', description: 'request_id du tag <channel>' },
      text: { type: 'string', description: 'Message (markdown simple)' },
    },
    required: ['request_id', 'text'],
  },
}]

async function publish(topicSuffix, body) {
  const res = await fetch(`${conf.server}/${conf.topic}-${topicSuffix}`, {
    method: 'POST', body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`ntfy ${res.status}`)
}

async function handle(msg) {
  const { id, method, params } = msg
  if (method === 'initialize') {
    return write({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion || '2025-06-18',
      capabilities: { experimental: { 'claude/channel': {} }, tools: {} },
      serverInfo: { name: 'courses', version: '0.2.0' },
      instructions: INSTRUCTIONS,
    } })
  }
  if (method === 'notifications/initialized') { startPolling(); return }
  if (method === 'ping') return write({ jsonrpc: '2.0', id, result: {} })
  if (method === 'tools/list') return write({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
  if (method === 'tools/call' && params?.name === 'reply') {
    const { request_id, text } = params.arguments || {}
    try {
      await publish('out', { id: request_id, text, sig: sign(conf.secret, request_id, text) })
      return write({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'envoyé' }] } })
    } catch (e) {
      return write({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: String(e) }] } })
    }
  }
  if (id !== undefined) write({ jsonrpc: '2.0', id, error: { code: -32601, message: `unknown: ${method}` } })
}

let buf = ''
process.stdin.on('data', (chunk) => {
  buf += chunk
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
    if (!line) continue
    try { handle(JSON.parse(line)) } catch (e) { log('bad json', e.message) }
  }
})
process.stdin.on('end', () => process.exit(0))

// ---------- Entrant : poll ntfy ----------
const seen = new Set()
let since = String(Math.floor(Date.now() / 1000))
let polling = false

export function verify(secret, m, now = Date.now()) {
  if (!m || !m.id || !m.ts || typeof m.text !== 'string' || !m.sig) return 'malformed'
  if (Math.abs(now - Number(m.ts) * 1000) > 10 * 60 * 1000) return 'stale'
  if (!safeEq(sign(secret, m.id, m.ts, m.text), m.sig)) return 'bad-signature'
  return null
}

async function pollOnce() {
  const res = await fetch(`${conf.server}/${conf.topic}-in/json?poll=1&since=${since}`)
  if (!res.ok) throw new Error(`ntfy ${res.status}`)
  for (const line of (await res.text()).split('\n')) {
    if (!line.trim()) continue
    const ev = JSON.parse(line)
    if (ev.event !== 'message') continue
    since = ev.id
    let m; try { m = JSON.parse(ev.message) } catch { continue }
    const err = verify(conf.secret, m)
    if (err) { log('rejeté:', err); continue }
    if (seen.has(m.id)) continue
    seen.add(m.id)
    notify('notifications/claude/channel', { content: m.text, meta: { request_id: m.id } })
  }
}

function startPolling() {
  if (polling) return
  polling = true
  if (!conf.topic || !conf.secret) {
    log(`non configuré : lance /courses:setup (attendu dans ${CONF_PATH})`)
    return
  }
  const loop = async () => {
    try { await pollOnce() } catch (e) { log('poll:', e.message) }
    setTimeout(loop, 4000)
  }
  loop()
}
