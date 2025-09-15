// Minimal disclosure toggling for FAQ
(function(){
  function setup() {
    const buttons = document.querySelectorAll('button[command="--toggle"][commandfor]');
    buttons.forEach(btn => {
      const targetId = btn.getAttribute('commandfor');
      const target = document.getElementById(targetId);
      if (!target) return;

      const isHidden = target.hasAttribute('hidden');
      btn.setAttribute('aria-expanded', String(!isHidden));
      btn.addEventListener('click', () => {
        const currentlyHidden = target.hasAttribute('hidden');
        if (currentlyHidden) {
          target.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          target.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

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
