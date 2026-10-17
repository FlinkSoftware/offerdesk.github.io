// Typewriter effect for span#types
(function(){
  function setupTypewriter(){
    const el = document.getElementById('types');
    if (!el) return;
    const parsedTypes = (el.dataset.types || '')
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean);
    const fallbackTypes = ['vloerenbedrijven','CV-installateurs','zonnepaneelinstallateurs','elektriciens','loodgieters','schilders','onderhoudsbedrijven','servicebedrijven'];
    const labels = parsedTypes.length ? parsedTypes : fallbackTypes;
    if (typeof window.Typewriter !== 'function') {
      el.textContent = labels[0] || 'installateurs';
      return;
    }
    const tw = new window.Typewriter(el, {
      loop: true,
      autoStart: true,
      delay: 55,
      deleteSpeed: 35,
      cursor: '|'
    });
    labels.forEach((label) => {
      tw.typeString(label)
        .pauseFor(1200)
        .deleteAll();
    });
    if (typeof tw.start === 'function') tw.start();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTypewriter);
  } else {
    setupTypewriter();
  }
})();

// Hero: one example offer per trade. Without JavaScript the first shows; here a random one on every load, and
// every 10 seconds the next trade. It holds while the pointer or focus is on the examples or the tab is in the
// background, stops for good once a visitor picks a trade, and never runs for people who prefer reduced motion.
(function(){
  const INTERVAL = 10000;
  function setupHeroMocks(){
    const tabs = Array.from(document.querySelectorAll('[data-hero-tab]'));
    const mocks = Array.from(document.querySelectorAll('[data-hero-mock]'));
    if (mocks.length < 2) return;
    let current = 0;
    function show(index){
      current = Number(index);
      mocks.forEach((mock) => { mock.hidden = mock.dataset.heroMock !== String(current); });
      tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.heroTab === String(current))));
    }
    show(Math.floor(Math.random() * mocks.length));

    const area = document.querySelector('.hero-mocks');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let picked = false;
    let held = false;
    let timer = null;
    tabs.forEach((tab) => tab.addEventListener('click', () => { picked = true; clearInterval(timer); show(tab.dataset.heroTab); }));
    if (reduced || !area) return;
    area.addEventListener('pointerenter', () => { held = true; });
    area.addEventListener('pointerleave', () => { held = false; });
    area.addEventListener('focusin', () => { held = true; });
    area.addEventListener('focusout', () => { held = false; });
    timer = setInterval(() => {
      if (picked || held || document.hidden) return;
      show((current + 1) % mocks.length);
    }, INTERVAL);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeroMocks);
  } else {
    setupHeroMocks();
  }
})();

// Navigation: on the home page the link of the section you are reading lights up as you scroll. A link
// covers the sections up to the next link's, so the "Klantpagina" belongs to Features and the FAQ to Prices.
// Other pages (the blog) get their current link from the template. A tap in the mobile menu closes it.
(function(){
  const GROUPS = [
    ['home', ['hero-section', 'process-section']],
    ['features', ['feature-section', 'customer-view-section', 'newsletter-section']],
    ['about', ['about-section', 'suitable-for-section']],
    ['pricing', ['pricing-section', 'integrations-section', 'faq-section']],
  ];

  function setupNavigation(){
    const links = Array.from(document.querySelectorAll('[data-nav]'));
    const menu = document.getElementById('mobile-menu');
    links.forEach((link) => link.addEventListener('click', () => {
      if (menu && menu.open) menu.close();
    }));

    const sections = [];
    GROUPS.forEach(([key, ids]) => ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) sections.push({ key, element });
    }));
    if (!sections.some((section) => section.key !== 'home')) return;

    let current = null;
    function mark(key){
      if (key === current) return;
      current = key;
      links.forEach((link) => {
        if (link.dataset.nav === key) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    // The section whose top passed a line a third down the screen; at the very bottom, the last one
    function update(){
      const line = window.innerHeight / 3;
      let key = sections[0].key;
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= line) key = section.key;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        key = sections[sections.length - 1].key;
      }
      mark(key);
    }

    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
  } else {
    setupNavigation();
  }
})();

// Mobile menu: a native <dialog>. Buttons with command/commandfor open and close it; browsers that know
// those attributes do it themselves, the others get this click handler. A tap beside the panel closes it.
(function(){
  function setupDialogs(){
    const nativeCommands = 'command' in HTMLButtonElement.prototype;
    document.querySelectorAll('button[commandfor]').forEach((button) => {
      if (nativeCommands) return;
      button.addEventListener('click', () => {
        const dialog = document.getElementById(button.getAttribute('commandfor'));
        if (!dialog) return;
        if (button.getAttribute('command') === 'show-modal') dialog.showModal();
        else if (button.getAttribute('command') === 'close') dialog.close();
      });
    });
    // A dialog without its own backdrop element closes on a click outside its box (the click lands on the dialog itself)
    document.querySelectorAll('dialog:not(:has([data-dialog-backdrop]))').forEach((dialog) => {
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    });
    // Lightbox: a screenshot in the features section opens full size in the one #lightbox dialog, with its
    // alt text as the caption. The image is cleared on close, so the next one does not flash the previous.
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      const image = lightbox.querySelector('[data-lightbox-image]');
      const caption = lightbox.querySelector('[data-lightbox-caption]');
      document.querySelectorAll('[data-lightbox-src]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const dark = document.documentElement.classList.contains('dark') && trigger.dataset.lightboxSrcDark;
          image.src = dark || trigger.dataset.lightboxSrc;
          // The switch under the image, for a screen that has both prints
          const modes = lightbox.querySelector('[data-lightbox-modes]');
          if (modes) {
            modes.hidden = !trigger.dataset.lightboxSrcDark;
            lightbox.dataset.srcLight = trigger.dataset.lightboxSrc;
            lightbox.dataset.srcDark = trigger.dataset.lightboxSrcDark || '';
            modes.querySelectorAll('[data-lightbox-mode]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.lightboxMode === 'dark') === Boolean(dark))));
          }
          image.alt = trigger.dataset.lightboxAlt || '';
          caption.textContent = trigger.dataset.lightboxAlt || '';
          lightbox.showModal();
        });
      });
      lightbox.addEventListener('close', () => { image.removeAttribute('src'); image.alt = ''; });
      lightbox.querySelectorAll('[data-lightbox-mode]').forEach((button) => button.addEventListener('click', () => {
        const dark = button.dataset.lightboxMode === 'dark';
        image.src = dark ? lightbox.dataset.srcDark : lightbox.dataset.srcLight;
        lightbox.querySelectorAll('[data-lightbox-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      }));
    }
    // A mailto link does nothing without a mail app, and a page cannot ask whether there is one. When a mail app opens,
    // this window loses focus; if it still has it after a moment, say so and point at copying or Gmail.
    document.querySelectorAll('[data-mail-app]').forEach((link) => {
      const hint = link.closest('dialog')?.querySelector('[data-no-mail-app]');
      if (!hint) return;
      link.addEventListener('click', () => {
        let left = false;
        const onBlur = () => { left = true; };
        window.addEventListener('blur', onBlur, { once: true });
        setTimeout(() => {
          window.removeEventListener('blur', onBlur);
          if (!left && document.hasFocus()) hint.hidden = false;
        }, 1500);
      });
    });
    // Copy buttons: the text to the clipboard, and a moment of "copied" on the button
    document.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(button.dataset.copy); } catch (error) { return; }
        // An icon button shows its "copied" label next to the icon; a text button swaps its text
        const note = button.querySelector('.share-copied');
        if (note) {
          note.hidden = false;
          setTimeout(() => { note.hidden = true; }, 2000);
          return;
        }
        const label = button.textContent;
        button.textContent = button.dataset.copied || label;
        setTimeout(() => { button.textContent = label; }, 2000);
      });
    });
    document.querySelectorAll('[data-dialog-backdrop]').forEach((backdrop) => {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) backdrop.closest('dialog')?.close();
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDialogs);
  } else {
    setupDialogs();
  }
})();

// Share: on phones (and browsers with a share sheet) one "Share…" button opens the device's own sheet, with all
// the apps the visitor has; the network buttons stay for everyone else.
(function(){
  function setupShare(){
    if (typeof navigator.share !== 'function') return;
    document.querySelectorAll('[data-share-native]').forEach((button) => {
      const box = button.closest('[data-share-url]');
      if (!box) return;
      button.hidden = false;
      button.addEventListener('click', () => {
        navigator.share({ title: document.title, text: box.dataset.shareText, url: box.dataset.shareUrl + '?utm_source=native&utm_medium=share' })
          .catch(() => {});
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupShare);
  } else {
    setupShare();
  }
})();

// Share band: "Ken je een ondernemer die …" types a phrase, crosses it out, and types the next; the last one stays
// (with a wink), and after a while it starts over. Runs only while the band is on screen; with reduced motion the
// last phrase stays as the page shows it.
(function(){
  const TYPE = 45, DELETE = 22, READ = 1100, STRUCK = 900, END = 5000;
  function setupStrikeTyping(){
    const el = document.querySelector('[data-strike-phrases]');
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let phrases;
    try { phrases = JSON.parse(el.dataset.strikePhrases); } catch (error) { return; }
    if (!Array.isArray(phrases) || phrases.length < 2) return;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let visible = false;
    const shown = () => new Promise((resolve) => {
      if (visible && !document.hidden) return resolve();
      const check = setInterval(() => { if (visible && !document.hidden) { clearInterval(check); resolve(); } }, 300);
    });
    new IntersectionObserver((entries) => { visible = entries.some((entry) => entry.isIntersecting); }).observe(el);

    async function type(text){
      el.classList.add('is-typing');
      const chars = Array.from(text);
      for (let i = 1; i <= chars.length; i++) { el.textContent = chars.slice(0, i).join(''); await wait(TYPE); }
      el.classList.remove('is-typing');
    }
    async function erase(){
      el.classList.add('is-typing');
      el.classList.remove('is-struck');
      const chars = Array.from(el.textContent);
      for (let i = chars.length - 1; i >= 0; i--) { el.textContent = chars.slice(0, i).join(''); await wait(DELETE); }
    }
    async function run(){
      el.textContent = '';
      for (;;) {
        for (let i = 0; i < phrases.length; i++) {
          await shown();
          await type(phrases[i]);
          const last = i === phrases.length - 1;
          await wait(last ? END : READ);
          if (!last) { el.classList.add('is-struck'); await wait(STRUCK); }
          await erase();
        }
      }
    }
    run();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupStrikeTyping);
  } else {
    setupStrikeTyping();
  }
})();

// Referrals and where visitors come from. A referral code (?ref=K7M2Q) is kept for 30 days; the first source
// (utm_source, else the site that linked here) is kept for good, first touch wins. Both go along on every sign-up
// link, so the new company knows who sent it (half price for its first month) and how it found OfferDesk.
(function(){
  const REF = 'od-ref', SOURCE = 'od-source', REF_DAYS = 30;
  function read(key){
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && (!value.until || value.until > Date.now()) ? value : null;
    } catch (error) { return null; }
  }
  function write(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* private mode */ } }
  function setupReferral(){
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') || '').trim().toUpperCase();
    if (/^[A-Z0-9]{4,16}$/.test(ref)) write(REF, { value: ref, until: Date.now() + REF_DAYS * 864e5 });
    if (!read(SOURCE)) {
      let source = params.get('utm_source');
      if (!source && document.referrer) {
        try {
          const host = new URL(document.referrer).hostname.replace(/^www\./, '');
          if (host && host !== window.location.hostname) source = host;
        } catch (error) { /* no usable referrer */ }
      }
      if (source) write(SOURCE, { value: source.trim().toLowerCase().slice(0, 64) });
    }
    const referral = read(REF);
    const first = read(SOURCE);
    document.querySelectorAll('a[href^="https://app.offerdesk.nl/sign-up"]').forEach((link) => {
      const url = new URL(link.href);
      if (referral) url.searchParams.set('ref', referral.value);
      if (first) url.searchParams.set('source', first.value);
      link.href = url.toString();
    });
    if (referral) document.querySelectorAll('[data-referral-banner]').forEach((banner) => { banner.hidden = false; });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupReferral);
  } else {
    setupReferral();
  }
})();

// Light or dark: the toggle in the navigation flips the class on <html> and remembers the choice in localStorage
// ("theme"); the layout's head applies that choice before the first paint. Without a choice the page follows the
// system setting, and keeps following it when that changes.
(function(){
  function setupTheme(){
    const root = document.documentElement;
    const toggles = document.querySelectorAll('.theme-toggle');
    if (!toggles.length) return;
    const label = () => {
      const dark = root.classList.contains('dark');
      toggles.forEach((button) => {
        const text = dark ? button.dataset.labelLight : button.dataset.labelDark;
        button.setAttribute('aria-label', text);
        button.setAttribute('title', text);
        button.setAttribute('aria-pressed', String(dark));
        const visible = button.querySelector('[data-theme-label]');
        if (visible) visible.textContent = text;
      });
    };
    // The screenshots on the page follow the mode: each img[data-src-dark] swaps between its two sources
    const syncImages = () => {
      const dark = root.classList.contains('dark');
      document.querySelectorAll('img[data-src-dark]').forEach((img) => {
        if (!img.dataset.srcLight) { img.dataset.srcLight = img.getAttribute('src'); img.dataset.srcsetLight = img.getAttribute('srcset') || ''; }
        const wanted = dark ? img.dataset.srcDark : img.dataset.srcLight;
        const wantedSet = dark ? (img.dataset.srcsetDark || '') : img.dataset.srcsetLight;
        if (img.getAttribute('src') !== wanted) {
          if (wantedSet) img.setAttribute('srcset', wantedSet); else img.removeAttribute('srcset');
          img.setAttribute('src', wanted);
        }
      });
    };
    syncImages();
    toggles.forEach((button) => button.addEventListener('click', () => {
      const dark = root.classList.toggle('dark');
      syncImages();
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (error) { /* private mode: the choice lasts this page */ }
      label();
    }));
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    system.addEventListener('change', (event) => {
      let choice = null;
      try { choice = localStorage.getItem('theme'); } catch (error) { /* then follow the system */ }
      if (choice) return;
      root.classList.toggle('dark', event.matches);
      syncImages();
      label();
    });
    label();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupTheme);
  else setupTheme();
})();
