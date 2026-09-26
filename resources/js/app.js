// Typewriter effect for span#types
(function(){
  function setupTypewriter(){
    const el = document.getElementById('types');
    if (!el) return;
    if (typeof window.Typewriter !== 'function') {
      el.textContent = 'installateurs';
      return;
    }
    const types = [
      'vloerenbedrijven',
      'CV-installateurs',
      'zonnepaneelinstallateurs',
      'elektriciens',
      'loodgieters',
      'schilders',
      'onderhoudsbedrijven',
      'servicebedrijven'
    ];
    const tw = new window.Typewriter(el, {
      loop: true,
      autoStart: true,
      delay: 55,
      deleteSpeed: 35,
      cursor: '|'
    });
    types.forEach((label) => {
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

document.addEventListener('DOMContentLoaded', () => {
  function wireMailtoForm(formId, successId, buildBody) {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const body = buildBody(form);
      window.location.href = 'mailto:info@offerdesk.com?subject=' +
        encodeURIComponent('OfferDesk website') +
        '&body=' + encodeURIComponent(body);
      if (success) {
        success.classList.remove('hidden');
      }
      form.reset();
    });
  }

  wireMailtoForm('newsletter-form', 'newsletter-success', (form) => {
    const email = form.querySelector('[name="email"]')?.value || '';
    return 'Houd mij op de hoogte.\nE-mail: ' + email;
  });

  wireMailtoForm('suggestion-form', 'suggestion-success', (form) => {
    const message = form.querySelector('[name="bericht"]')?.value || '';
    return message;
  });
});
