# offerdesk.com

This repository hosts a Jekyll site for GitHub Pages.

## Site changes

- The homepage is now bilingual: Dutch at `/` and English at `/en/`.
- Google Analytics is enabled with `G-XMLKF7JVEX` in the shared layout.
- The newsletter form is ready for MailerLite; set `mailerlite.action` in `_config.yml` to your MailerLite embedded form URL to activate it. If it is left blank, the form falls back to the previous mailto flow.

## Local development

### Prerequisites
- Ruby 3.3, the same as the GitHub Actions build. Not the Ruby that comes with macOS (2.6): it can't
  install the Bundler version in `Gemfile.lock`. On a Mac: `brew install ruby@3.3`.
- Node.js

### Install and run Jekyll
Put Homebrew's Ruby first on the PATH (add the line to `~/.zshrc` to keep it):
```bash
export PATH="/opt/homebrew/opt/ruby@3.3/bin:/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"
```

Once:
```bash
gem install bundler:2.5.22
bundle install
```

Then:
```bash
bundle exec jekyll serve
# Open http://127.0.0.1:4000
```

Without Ruby on the Mac, Docker works too. It uses Ruby 3.1: on Linux the locked nokogiri has no build for 3.3. The gems are kept in the `offerdesk-site-gems` volume:
```bash
docker run --rm -p 4000:4000 -v "$PWD":/srv -v offerdesk-site-gems:/usr/local/bundle -w /srv ruby:3.1 bash -c "gem install bundler:2.5.22 -N && bundle _2.5.22_ install && bundle _2.5.22_ exec jekyll serve --host 0.0.0.0"
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

## Deploying with GitHub Pages
This repository keeps a single root `_config.yml` and points Jekyll at `docs/` via `source: docs`.

For production, use the GitHub Actions workflow in `.github/workflows/pages.yml` so GitHub Pages builds from the repository root and picks up the root `_config.yml`.

- In repository Settings → Pages, set **Source** to **GitHub Actions**.
- Commit the workflow file and push to your default branch.
- Do not set `destination:` in `_config.yml`; Jekyll will build into `_site/` automatically.
- You don’t need to commit any build output. Just commit the source files.

To preview locally, run Jekyll as under [Install and run Jekyll](#install-and-run-jekyll), then visit:
- `http://127.0.0.1:4000/` for Dutch
- `http://127.0.0.1:4000/en/` for English
