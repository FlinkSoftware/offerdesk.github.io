// The inline crops of the landing page, light and dark, from the same test offer as the full prints. Needs
// puppeteer-core next to it (npm i puppeteer-core) and the local app on http://localhost:8080 with the test
// account from OfferDesk/data/local-test-account.env (TEST3_*). Results: docs/images/offerdesk/crop-*.webp.
// The inline crops of the landing page, light and dark, from the same test offer as the full prints: each one
// is an element screenshot (a card, a table, a column) at 2x, found by the heading it carries.
// Usage: node crops.mjs  (the local app on http://localhost:8080, account from data/local-test-account.env)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const APP = 'http://localhost:8080'
const OFFER_ID = 'b5e4bb10-eada-4414-9e5c-11c719971a94'
const SHARE_TOKEN = '51cb0bc7b1db4f49b8ea5547090d13319e23e0aa'
const ACCESS_CODE = 'MD2F-NT5S'
const OUT = path.resolve('crops')
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
await page.setViewport({ width: 1840, height: 1400, deviceScaleFactor: 2 })
await page.setCookie({ name: 'cookie-consent', value: 'declined', domain: 'localhost', path: '/' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

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
log('signed in')

async function setMode(mode) { await page.evaluate(m => localStorage.setItem('nuxt-color-mode', m), mode) }

async function open(url, ready = 'main') {
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForSelector(ready, { timeout: 30000 })
  await page.evaluate(async () => { await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r }))) })
  await sleep(900)
}

/**
 * The box of the card that carries a heading: the element whose own text is the heading, then up to the first
 * ancestor with rounded corners and a background of its own. `pick` chooses another box from that element.
 */
async function boxOf(heading, pick = 'card') {
  return page.evaluate((heading, pick) => {
    const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div,th')]
    const el = all.find(e => e.childElementCount === 0 && e.textContent.trim() === heading)
      || all.find(e => e.textContent.trim().startsWith(heading) && e.childElementCount <= 1)
    if (!el) return null
    const rect = n => { const r = n.getBoundingClientRect(); return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height } }
    if (pick === 'table') { const t = el.closest('main')?.querySelector('table'); return t ? rect(t) : null }
    let node = el
    for (let i = 0; i < 8 && node; i++) {
      const s = getComputedStyle(node)
      const rounded = parseFloat(s.borderTopLeftRadius) >= 8
      const own = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.borderTopWidth !== '0px'
      if (rounded && own && node !== el) {
        if (pick === 'column') { node = node.parentElement; while (node && node.children.length < 2) node = node.parentElement }
        return rect(node)
      }
      node = node.parentElement
    }
    return null
  }, heading, pick)
}

async function shot(name, mode, box) {
  if (!box) { log('MISSING', name, mode); return }
  const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.round(box.width), height: Math.round(box.height) }
  const need = clip.y + clip.height + 40
  const current = page.viewport().height
  if (need > current) { await page.setViewport({ width: 1840, height: Math.round(Math.min(need, 5000)), deviceScaleFactor: 2 }); await sleep(500) }
  await page.screenshot({ path: path.join(OUT, `crop-${name}-${mode}.png`), clip })
  log('crop', name, mode, clip.width + 'x' + clip.height)
  if (need > current) await page.setViewport({ width: 1840, height: 1400, deviceScaleFactor: 2 })
}

const base = `${APP}/offers/${OFFER_ID}`
for (const mode of ['light', 'dark']) {
  await setMode(mode)

  await open(base)
  await shot('regels', mode, await boxOf('Regels'))
  await shot('winst', mode, await boxOf('Wat je overhoudt'))

  await open(`${APP}/products`)
  await shot('producten', mode, await boxOf('Producten', 'table') || await page.evaluate(() => { const t = document.querySelector('main table'); const r = t?.getBoundingClientRect(); return r ? { x: r.left, y: r.top + scrollY, width: r.width, height: r.height } : null }))

  await open(`${base}/purchase`)
  await shot('inkoop', mode, await page.evaluate(() => {
    // The purchase tab: from the first card below the tab bar to the bottom of the content
    const main = document.querySelector('main'); const tabs = main.querySelector('[role=tablist], nav'); const top = tabs ? tabs.getBoundingClientRect().bottom + scrollY + 16 : main.getBoundingClientRect().top + scrollY
    let bottom = 0; main.querySelectorAll('*').forEach(n => { const r = n.getBoundingClientRect(); if (r.width > 0 && r.height > 0) bottom = Math.max(bottom, r.bottom + scrollY) })
    const r = main.getBoundingClientRect(); return { x: r.left + 24, y: top, width: r.width - 48, height: bottom - top + 8 }
  }))

  await open(`${base}/payments`)
  await shot('betalingen', mode, await boxOf('Betalen in delen'))

  await open(`${base}/files`)
  // Only the photo cards: the grid has room for four, and its empty column made the crop too wide on the site
  await shot('bestanden', mode, await page.evaluate(() => {
    // each photo's card: the largest ancestor that holds no other photo
    const rs = [...document.querySelectorAll('main img')].map(c => { while (c.parentElement.querySelectorAll('img').length === 1) c = c.parentElement; return c.getBoundingClientRect() })
    if (!rs.length) return null
    const left = Math.min(...rs.map(r => r.left)), top = Math.min(...rs.map(r => r.top)), right = Math.max(...rs.map(r => r.right)), bottom = Math.max(...rs.map(r => r.bottom))
    return { x: left - 16, y: top + scrollY - 16, width: right - left + 32, height: bottom - top + 32 }
  }))

  await open(`${base}/history`)
  await shot('historie', mode, await page.evaluate(() => {
    const main = document.querySelector('main'); const list = main.querySelector('ol, ul'); const r = list?.getBoundingClientRect()
    return r ? { x: r.left, y: r.top + scrollY, width: r.width, height: r.height } : null
  }))

  // The three designs: the top of the A4 sheet, as the crops on the site show it
  for (const key of ['CLASSIC', 'MODERN', 'COMPACT']) {
    const offer = await page.evaluate(async (id) => { const u = JSON.parse(sessionStorage.getItem('oidc.user:http://localhost:8080:offerdesk-web')); const h = { Authorization: 'Bearer ' + u.access_token, 'X-Tenant-Id': 'ecb15327-719b-49b9-bc67-8150c54d6fff', 'Content-Type': 'application/json' }; const o = await (await fetch('/api/v1/offers/' + id, { headers: h })).json(); return o }, OFFER_ID)
    await page.evaluate(async (o, key) => { const u = JSON.parse(sessionStorage.getItem('oidc.user:http://localhost:8080:offerdesk-web')); const h = { Authorization: 'Bearer ' + u.access_token, 'X-Tenant-Id': 'ecb15327-719b-49b9-bc67-8150c54d6fff', 'Content-Type': 'application/json' }; await fetch('/api/v1/offers/' + o.offerId, { method: 'PUT', headers: h, body: JSON.stringify({ ...o, pdfTemplate: key }) }) }, offer, key)
    await open(`${base}/pdf`, 'iframe')
    await sleep(1500)
    const box = await page.evaluate(() => { const r = document.querySelector('iframe').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: 640 } })
    await shot('template-' + key.toLowerCase(), mode, box)
  }

  // The customer's page: the payment card, the questions card and the whole right column
  await page.goto(`${APP}/offerte/${SHARE_TOKEN}`, { waitUntil: 'networkidle0' })
  await sleep(800)
  const codeInput = await page.$('input')
  if (codeInput) { await codeInput.type(ACCESS_CODE); await page.keyboard.press('Enter'); await sleep(2500) }
  await sleep(800)
  await shot('klant-betaling', mode, await boxOf('Betaling'))
  await shot('vraag', mode, await boxOf('Vragen'))
  await shot('klant-voor', mode, await boxOf('Betaling', 'column'))
}

await browser.close()
log('done:', fs.readdirSync(OUT).length, 'files')
