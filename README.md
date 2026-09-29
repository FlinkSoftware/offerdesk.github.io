# offerdesk.com

This repository hosts a Jekyll site for GitHub Pages.

## Site changes

- The homepage is now bilingual: Dutch at `/` and English at `/en/`.
- Google Analytics is enabled with `G-XMLKF7JVEX` in the shared layout.
- The newsletter form is ready for MailerLite; set `mailerlite.action` in `_config.yml` to your MailerLite embedded form URL to activate it. If it is left blank, the form falls back to the previous mailto flow.

## Local development

### Prerequisites
- Ruby and Bundler installed
- Node.js

### Install and run Jekyll
```bash
bundle install
bundle exec jekyll serve
# Open http://127.0.0.1:4000
```

### CSS (Tailwind via Tailwind CLI v4)
The site links to `/css/app.css`. Build it from the Tailwind source at `resources/css/app.css`:

One-time build:
```bash
npm run css:build
```

While developing (watch):
```bash
npm run css:watch
```

### JavaScript (minify to /docs/js/app.js)
The layout includes `/js/app.js`. Build the minified JS from `resources/js/app.js`:

One-time build:
```bash
npm run js:build
```

While developing (watch):
```bash
npm run js:watch
```

All at once:
```bash
npm run build  # builds CSS and JS
npm run watch  # watches CSS and JS in parallel
```

## Deploying with GitHub Pages (project site using /docs)
This repository uses the /docs directory as the source for the Jekyll site. GitHub Pages will build the site from /docs automatically.

- In repository Settings → Pages, set Source to “Deploy from a branch”, choose your default branch and folder `/docs`.
- Do not set `destination:` in `_config.yml` (we removed it) to avoid generating `docs/docs`.
- You don’t need to commit any build output. Just commit your source files under `/docs`.

If you want to preview locally, run:
```bash
bundle install
bundle exec jekyll serve --source docs
# Open http://127.0.0.1:4000/
```

Then visit:
- `http://127.0.0.1:4000/` for Dutch
- `http://127.0.0.1:4000/en/` for English
