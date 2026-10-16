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
    // Copy buttons: the text to the clipboard, and a moment of "copied" on the button
    document.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(button.dataset.copy); } catch (error) { return; }
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
