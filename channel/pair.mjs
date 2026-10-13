#!/usr/bin/env node
// Génère le topic + secret partagés entre ce poste et Hermes.
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = path.join(os.homedir(), '.claude-courses')
const file = path.join(dir, 'bridge.json')
fs.mkdirSync(dir, { recursive: true })
if (fs.existsSync(file) && !process.argv.includes('--force')) {
  console.error(`${file} existe déjà (--force pour régénérer)`)
  process.exit(1)
}
const conf = {
  server: 'https://ntfy.sh',
  topic: 'courses-' + crypto.randomBytes(12).toString('hex'),
  secret: crypto.randomBytes(32).toString('hex'),
}
fs.writeFileSync(file, JSON.stringify(conf, null, 2), { mode: 0o600 })
console.log('Pont créé :', file)
console.log('À donner à Hermes (canal privé) :')
console.log(JSON.stringify(conf))
