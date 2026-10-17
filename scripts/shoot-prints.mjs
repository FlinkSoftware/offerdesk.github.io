// Prints of the local OfferDesk app for the landing page, light and dark. Needs puppeteer-core next to it
// (npm i puppeteer-core) and the local app on http://localhost:8080 with the test account from
// OfferDesk/data/local-test-account.env (TEST3_*). See docs/images/offerdesk/app-*.webp for the results.
// Full-page prints of the local OfferDesk app for the landing page, 1600 CSS px wide at 2x, light and dark.
// Usage: node shoot.mjs  (expects the app on http://localhost:8080 and data/local-test-account.env with TEST3_*)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const APP = 'http://localhost:8080'
const OFFER_ID = 'b5e4bb10-eada-4414-9e5c-11c719971a94'
const SHARE_TOKEN = '51cb0bc7b1db4f49b8ea5547090d13319e23e0aa'
const ACCESS_CODE = 'MD2F-NT5S'
const OUT = path.resolve('out')
fs.mkdirSync(OUT, { recursive: true })

const env = Object.fromEntries(
  fs.readFileSync('/Users/adis/Projects/FlinkSoftware/OfferDesk/data/local-test-account.env', 'utf8')
    .split('\n').filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] }))

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=2'],
})
const page = await browser.newPage()
// 1840 wide: the app's sidebar takes 240, which leaves the content area the 1600 the other prints have
await page.setViewport({ width: 1840, height: 1200, deviceScaleFactor: 2 })
await page.setCookie({ name: 'cookie-consent', value: 'declined', domain: 'localhost', path: '/' })

const sleep = ms => new Promise(r => setTimeout(r, ms))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

// Sign in: the auth-server's form, then the app's dashboard
await page.goto(APP + '/', { waitUntil: 'networkidle0' })
await page.waitForSelector('#username', { timeout: 20000 })
await page.type('#username', env.TEST3_EMAIL)
await page.type('#password', env.TEST3_PASSWORD)
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }), page.click('button[type=submit]')])
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

const base = `${APP}/offers/${OFFER_ID}`
for (const mode of ['light', 'dark']) {
  await setMode(mode)
  // The four screens that already have a light print on the site, for their dark counterparts
  await open(`${APP}/`, 'main'); await shot('dashboard', mode, 'main')
  await open(`${base}`, 'main'); await shot('offerte-marge', mode, 'main')
  await open(`${APP}/products`, 'main'); await shot('producten-leveranciers', mode, 'main')
  await open(`${base}/purchase`, 'main'); await shot('inkooplijst', mode, 'main')
  await open(`${base}/payments`, 'main'); await shot('betalingen', mode, 'main')
  await open(`${base}/files`, 'main'); await shot('bestanden', mode, 'main')
  await open(`${base}/history`, 'main'); await shot('historie', mode, 'main')
  // Activities without the system entries: the question and the answer are what this print is about
  await open(`${base}/activities`, 'main')
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('span,label,p')].find(e => e.childElementCount === 0 && e.textContent.trim() === 'Systeemactiviteiten')
    const sw = label?.parentElement?.querySelector('button[role=switch],input[type=checkbox],button')
    if (sw) sw.click()
  })
  await sleep(600)
  await shot('activiteit', mode, 'main')

  // The three designs: the offer's own design decides what the preview shows
  for (const key of ['CLASSIC', 'MODERN', 'COMPACT']) {
    const offer = JSON.parse((await api('GET', `/offers/${OFFER_ID}`)).body)
    const r = await api('PUT', `/offers/${OFFER_ID}`, { ...offer, pdfTemplate: key })
    if (r.status >= 300) throw new Error('set template ' + key + ': ' + r.body.slice(0, 200))
    await open(`${base}/pdf`, 'iframe')
    await sleep(1500)
    await shot('template-' + key.toLowerCase(), mode, 'iframe')
    await shot('voorbeeld-' + key.toLowerCase(), mode, 'main')
  }

  // The customer's page: access code first, then the offer with the payment block and the question
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
