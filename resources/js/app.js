// Typewriter effect for span#types
(function(){
  function setupTypewriter(){
    const el = document.getElementById('types');
    if (!el) return;
    // If library not present, fallback to a static label.
    if (typeof window.Typewriter !== 'function') {
      el.textContent = 'kleine bedrijven';
      return;
    }
    const types = [
      'lokale bakkers',
      'zzp’ers',
      'webshops',
      'horeca',
      'coaches & trainers',
      'installateurs',
      'makelaars',
      'boekhoudkantoren',
      'creatieve studios',
      'sportclubs'
    ];
    const tw = new window.Typewriter(el, {
      loop: true,
      autoStart: true,
      delay: 55,
      deleteSpeed: 35,
      cursor: '|'
    });
    types.forEach((label, idx) => {
      tw.typeString(label)
        .pauseFor(1200)
        .deleteAll();
    });
    // Start is automatic via autoStart; but in some versions we need .start()
    if (typeof tw.start === 'function') tw.start();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTypewriter);
  } else {
    setupTypewriter();
  }
})();

// Banner sluiten en keuze onthouden
document.addEventListener('DOMContentLoaded', () => {
    // Pak de bannercontainer (de brede "Promo banner"-balk bovenin)
    const banner = document.querySelector('header > div.relative.isolate.flex.items-center');

    if (!banner) return;

    // Als eerder gesloten, verberg direct
    if (localStorage.getItem('promoBannerDismissed') === '1') {
        banner.style.display = 'none';
        return;
    }

    // Vind de sluitknop binnen de banner (rechts)
    const closeBtn = banner.querySelector('button');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.style.display = 'none';
            localStorage.setItem('promoBannerDismissed', '1');
        });
    }
});

