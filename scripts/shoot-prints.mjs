// Prints of the local OfferDesk app for the landing page, light and dark. Needs puppeteer-core next to it
// (npm i puppeteer-core) and the local app on http://localhost:8080 with the test account from
// OfferDesk/data/local-test-account.env (TEST3_*). See docs/images/offerdesk/app-*.webp for the results.
// Full-page prints of the local OfferDesk app for the landing page, 1600 CSS px wide at 2x, light and dark.
// Usage: node shoot.mjs  (expects the app on http://localhost:8080 and data/local-test-account.env with TEST3_*)
// ONLY=opname,opnamelijst node shoot.mjs takes just those prints.
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const APP = 'http://localhost:8080'
const OFFER_ID = 'b5e4bb10-eada-4414-9e5c-11c719971a94'
const SHARE_TOKEN = '51cb0bc7b1db4f49b8ea5547090d13319e23e0aa'
const ACCESS_CODE = 'MD2F-NT5S'
const OUT = path.resolve('out')
const ONLY = process.env.ONLY?.split(',')
const wanted = name => !ONLY || ONLY.includes(name)
fs.mkdirSync(OUT, { recursive: true })

const env = Object.fromEntries(
  fs.readFileSync('/Users/adis/Projects/FlinkSoftware/OfferDesk/data/local-test-account.env', 'utf8')
    .split('\n').filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] }))

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=2', '--lang=nl-NL'],
})
const page = await browser.newPage()
// 1840 wide: the app's sidebar takes 240, which leaves the content area the 1600 the other prints have
await page.setViewport({ width: 1840, height: 1200, deviceScaleFactor: 2 })
await page.setCookie({ name: 'cookie-consent', value: 'declined', domain: 'localhost', path: '/' })
// A page with unsaved changes (a list with a question switched off) asks before it is left: leave without saving
page.on('dialog', dialog => dialog.accept())

const sleep = ms => new Promise(r => setTimeout(r, ms))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

// Sign in: the auth-server's form, then the app's dashboard
// The login page opens on "a code by mail" (its own form comes first), so ask for the password form and
// press that form's button; the app follows Accept-Language, so Dutch is set on the page
await page.setExtraHTTPHeaders({ 'Accept-Language': 'nl-NL,nl;q=0.9' })
await page.goto(APP + '/auth/login?method=password', { waitUntil: 'networkidle0' })
await page.waitForSelector('#username', { timeout: 20000 })
await page.type('#username', env.TEST3_EMAIL)
await page.type('#password', env.TEST3_PASSWORD)
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
  page.evaluate(() => document.querySelector('#password').closest('form').querySelector('button[type=submit]').click())])
await page.waitForSelector('main', { timeout: 30000 })
log('signed in at', page.url())

async function api(method, p, body) {
  return page.evaluate(async (method, p, body) => {
    const u = JSON.parse(sessionStorage.getItem('oidc.user:http://localhost:8080:offerdesk-web'))
    const t = Object.keys(sessionStorage).filter(k => k.startsWith('offerdesk.tenant:')).map(k => sessionStorage.getItem(k)).find(v => /^[0-9a-f-]{36}$/.test(v || '')) || 'ecb15327-719b-49b9-bc67-8150c54d6fff'
    const r = await fetch('/api/v1' + p, { method, headers: { Authorization: 'Bearer ' + u.access_token, 'X-Tenant-Id': t, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    return { status: r.status, body: await r.text() }
  }, method, p, body)
}

async function setMode(mode) {
  await page.evaluate(m => localStorage.setItem('nuxt-color-mode', m), mode)
}

/** Switches a question of the list off in the settings editor, so the print shows one that is off. */
async function switchOff(label) {
  await page.evaluate(l => document.querySelector(`[role=switch][aria-label="${l} gebruiken"]`)?.click(), label)
  await sleep(400)
}

async function setSystemEntries(shown) {
  await page.evaluate(v => localStorage.setItem('offerdesk.activities.system', v), shown)
}

async function open(url, readySelector) {
  await page.goto(url, { waitUntil: 'networkidle0' })
  if (readySelector) await page.waitForSelector(readySelector, { timeout: 30000 })
  // images and the slide-in animations
  await page.evaluate(async () => { await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r }))) })
  await sleep(800)
}

// The content area is a scroll box as tall as the window: give the window the content's height first, then
// clip the shot to the lowest element plus a margin, so a short tab does not come with a screen of white.
async function shot(name, mode, selector) {
  if (!wanted(name)) return
  if (fs.existsSync(path.join(OUT, `${name}-${mode}.png`))) { log('have', name, mode); return }
  if (selector === 'page') {
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 })
    await sleep(600)
    await page.screenshot({ path: path.join(OUT, `${name}-${mode}.png`), fullPage: true })
    log('shot', name, mode, 'full page')
    await page.setViewport({ width: 1840, height: 1200, deviceScaleFactor: 2 })
    return
  }
  const el = await page.$(selector)
  if (!el) throw new Error(`no ${selector} for ${name}`)
  if (selector === 'main') {
    const need = await page.evaluate(() => document.querySelector('main').scrollHeight)
    if (need > 1200) { await page.setViewport({ width: 1840, height: Math.min(need + 40, 4000), deviceScaleFactor: 2 }); await sleep(600) }
    const clip = await page.evaluate(() => {
      const main = document.querySelector('main'); const top = main.getBoundingClientRect().top + window.scrollY
      let bottom = 0
      main.querySelectorAll('*').forEach(n => { const r = n.getBoundingClientRect(); if (r.height > 0 && r.width > 0) bottom = Math.max(bottom, r.bottom + window.scrollY) })
      const r = main.getBoundingClientRect()
      return { x: r.left, y: top, width: r.width, height: Math.min(bottom - top + 32, main.scrollHeight) }
    })
    await page.screenshot({ path: path.join(OUT, `${name}-${mode}.png`), clip })
    log('shot', name, mode, Math.round(clip.width) + 'x' + Math.round(clip.height))
    await page.setViewport({ width: 1840, height: 1200, deviceScaleFactor: 2 })
    return
  }
  await el.screenshot({ path: path.join(OUT, `${name}-${mode}.png`) })
  const box = await el.boundingBox()
  log('shot', name, mode, Math.round(box.width) + 'x' + Math.round(box.height))
}

/**
 * The test offer's intake: the charge point list, filled in as on a visit to Fam. Jansen, with two of the offer's
 * photos at the meter cupboard and the spot of the charger. Only when the offer has no intake yet.
 */
async function ensureIntake() {
  const lists = JSON.parse((await api('GET', `/offers/${OFFER_ID}/checklists`)).body)
  if (lists.some(l => l.kind === 'intake')) return
  const started = await api('POST', `/offers/${OFFER_ID}/checklists`, { kind: 'intake', checklistKey: 'installatie-laadpaal-opname' })
  if (started.status >= 300) throw new Error('start intake: ' + started.body.slice(0, 200))
  const intake = JSON.parse(started.body)
  const answers = {
    auto: 'Tesla Model 3', vermogen: 'kw_11', montage: 'muur', kabel: 'vast', slim_laden: true,
    bouwjaar: 1998, asbest: 'nee', verdieping: 'buiten', parkeren: true,
    aansluiting: 'drie_fase', hoofdzekering: 25, hoofdschakelaar: true, vrije_groep: 'ruimte', aardlek_type: 'a', meterkast_in_orde: true,
    afstand: 14.5, kabelroute: ['binnen', 'kruipruimte'], kruipruimte_ok: true, doorvoeren: 1, nieuwe_aardlek: true,
    drie_fase_aanvragen: false, loadbalancing: true,
  }
  const answered = await api('PATCH', `/offers/${OFFER_ID}/checklists/${intake.id}`, { answers })
  if (answered.status >= 300) throw new Error('answer intake: ' + answered.body.slice(0, 200))
  const photos = await page.evaluate(async (offerId, checklistId) => {
    const u = JSON.parse(sessionStorage.getItem('oidc.user:http://localhost:8080:offerdesk-web'))
    const t = Object.keys(sessionStorage).filter(k => k.startsWith('offerdesk.tenant:')).map(k => sessionStorage.getItem(k)).find(v => /^[0-9a-f-]{36}$/.test(v || '')) || 'ecb15327-719b-49b9-bc67-8150c54d6fff'
    const h = { Authorization: 'Bearer ' + u.access_token, 'X-Tenant-Id': t }
    const files = (await (await fetch(`/api/v1/offers/${offerId}/files`, { headers: h })).json()).files.filter(f => f.image && !f.checklistId)
    const done = []
    for (const [file, fieldKey] of [[files[0], 'meterkast_fotos'], [files[1] ?? files[0], 'plek_fotos']]) {
      if (!file) continue
      const blob = await (await fetch(`/api/v1/offers/${offerId}/files/${file.id}/content`, { headers: h })).blob()
      const form = new FormData(); form.append('file', blob, file.name)
      const r = await fetch(`/api/v1/offers/${offerId}/files?shared=false&checklistId=${checklistId}&fieldKey=${fieldKey}`, { method: 'POST', headers: h, body: form })
      done.push(`${file.name} → ${fieldKey}: ${r.status}`)
    }
    return done
  }, OFFER_ID, intake.id)
  log('intake filled in', photos.join(', '))
}
if (wanted('opname')) await ensureIntake()

const base = `${APP}/offers/${OFFER_ID}`
for (const mode of ['light', 'dark']) {
  await setMode(mode)
  // The four screens that already have a light print on the site, for their dark counterparts
  if (wanted('dashboard')) { await open(`${APP}/`, 'main'); await shot('dashboard', mode, 'main') }
  if (wanted('offerte-marge')) { await open(`${base}`, 'main'); await shot('offerte-marge', mode, 'main') }
  if (wanted('producten-leveranciers')) { await open(`${APP}/products`, 'main'); await shot('producten-leveranciers', mode, 'main') }
  if (wanted('inkooplijst')) { await open(`${base}/purchase`, 'main'); await shot('inkooplijst', mode, 'main') }
  if (wanted('betalingen')) { await open(`${base}/payments`, 'main'); await shot('betalingen', mode, 'main') }
  if (wanted('bestanden')) { await open(`${base}/files`, 'main'); await shot('bestanden', mode, 'main') }
  // The intake: the charge point list as filled in by ensureIntake, and adjusting that list in the settings
  if (wanted('opname')) { await open(`${base}/intake`, 'main'); await shot('opname', mode, 'main') }
  if (wanted('opnamelijst')) {
    await open(`${APP}/settings/checklists/new?base=installatie-laadpaal-opname`, 'main')
    await switchOff('Is loadbalancing nodig?')
    await shot('opnamelijst', mode, 'main')
  }
  // The changes have no tab of their own any more (Historie): they are on Activiteiten, with everything shown.
  // The switch "Ook wat OfferDesk zelf deed" keeps its choice in localStorage, so it is set there, not clicked.
  await setSystemEntries('shown')
  if (wanted('historie')) { await open(`${base}/activities`, 'main'); await shot('historie', mode, 'main') }
  // Activities without OfferDesk's own entries: the question and the answer are what this print is about
  await setSystemEntries('hidden')
  if (wanted('activiteit')) { await open(`${base}/activities`, 'main'); await shot('activiteit', mode, 'main') }

  // The three designs: the offer's own design decides what the preview shows
  for (const key of ['CLASSIC', 'MODERN', 'COMPACT']) {
    if (!wanted('template-' + key.toLowerCase()) && !wanted('voorbeeld-' + key.toLowerCase())) continue
    const offer = JSON.parse((await api('GET', `/offers/${OFFER_ID}`)).body)
    const r = await api('PUT', `/offers/${OFFER_ID}`, { ...offer, pdfTemplate: key })
    if (r.status >= 300) throw new Error('set template ' + key + ': ' + r.body.slice(0, 200))
    await open(`${base}/pdf`, 'iframe')
    await sleep(1500)
    await shot('template-' + key.toLowerCase(), mode, 'iframe')
    await shot('voorbeeld-' + key.toLowerCase(), mode, 'main')
  }

  // The customer's page: access code first, then the offer with the payment block and the question
  if (!wanted('klantpagina')) continue
  await page.goto(`${APP}/offerte/${SHARE_TOKEN}`, { waitUntil: 'networkidle0' })
  await sleep(800)
  const codeInput = await page.$('input')
  if (codeInput) {
    await codeInput.type(ACCESS_CODE)
    await page.keyboard.press('Enter')
    await sleep(2500)
  }
  await page.evaluate(async () => { await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r }))) })
  await sleep(800)
  await shot('klantpagina', mode, 'page')
}

await browser.close()
log('done:', fs.readdirSync(OUT).join(', '))
