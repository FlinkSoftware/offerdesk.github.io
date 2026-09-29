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


  wireMailtoForm('suggestion-form', 'suggestion-success', (form) => {
    return form.querySelector('[name="bericht"]')?.value || '';
  });
});
