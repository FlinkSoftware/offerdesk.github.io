// The example quote (/voorbeeld-offerte/, /en/example-quote/): the customer's page of OfferDesk, played in this
// browser only. The visitor opens the quote with the code from the email, asks a question (the company answers a
// moment later), accepts it with the terms and conditions, and pays the deposit on an example payment page.
// Nothing leaves the browser. After each step a note says what the business sees of it in OfferDesk.
(function () {
  const root = document.querySelector('[data-example-offer]');
  if (!root) return;

  const T = JSON.parse(root.querySelector('[data-xo-texts]').textContent);
  const locale = root.dataset.lang === 'en' ? 'en-GB' : 'nl-NL';
  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => root.querySelectorAll(selector);

  // The quote: the same lines and totals as the sheet in /voorbeeld/ (rendered by the app's template)
  const TOTAL_EXCL = 7854;
  const TOTAL_INCL = 9503.34;
  const PAGE_WIDTH = 794;
  const PAGE_HEIGHT = 1123;

  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
  const money = (amount) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  const longDate = (date) => date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const time = (date) => date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const moment = (date) => `${longDate(date)} ${root.dataset.lang === 'en' ? 'at' : 'om'} ${time(date)}`;
  const dateTime = (date) => date.toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  /** "Aanbetaling materialen" in the middle of a sentence. */
  const inSentence = (text) => text.charAt(0).toLocaleLowerCase(locale) + text.slice(1);
  const track = (step) => {
    if (typeof window.gtag === 'function') window.gtag('event', 'example_offer', { step });
  };

  // Sent yesterday afternoon; the customer asked about the tiles that evening and got an answer this morning.
  const now = new Date();
  const sent = new Date(now); sent.setDate(now.getDate() - 1); sent.setHours(16, 5, 0, 0);
  const expiry = new Date(sent); expiry.setDate(sent.getDate() + 30);
  const asked = new Date(sent); asked.setHours(19, 42, 0, 0);
  const answered = new Date(now); answered.setHours(Math.min(now.getHours(), 8), 15, 0, 0);
  if (answered <= asked) answered.setTime(asked.getTime() + 25 * 60 * 1000);

  let state;
  function reset() {
    state = {
      stage: 'code',
      status: 'OPEN',
      terms: T.terms.map((term) => ({ ...term, status: 'OPEN' })),
      messages: [
        { id: 1, kind: 'question', text: T.thread.question, at: asked },
        { id: 2, kind: 'answer', author: T.thread.author, text: T.thread.answer, at: answered, replyTo: 1 },
      ],
      steps: new Set(),
      notes: new Set(['start']),
      typing: false,
    };
  }

  // ---------------------------------------------------------------- the steps and the notes for the business

  function step(index) {
    state.steps.add(index);
    $$('[data-xo-step]').forEach((element) => {
      element.classList.toggle('is-done', state.steps.has(Number(element.dataset.xoStep)));
    });
  }

  const toast = $('[data-xo-toast]');
  let toastTimer;
  function note(key) {
    if (state.notes.has(key)) return;
    state.notes.add(key);
    const item = document.createElement('li');
    item.className = 'xo-note';
    item.dataset.xoNote = key;
    item.textContent = T.notes[key];
    $('[data-xo-log]').appendChild(item);
    $('[data-xo-toast-text]').textContent = T.notes[key];
    toast.hidden = false;
    toast.classList.remove('is-in');
    void toast.offsetWidth;
    toast.classList.add('is-in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 12000);
  }
  $('[data-xo-toast-close]').addEventListener('click', () => { toast.hidden = true; });

  // ---------------------------------------------------------------- the access code

  $('[data-xo-code-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const normalize = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const right = normalize($('#xo-code').value) === normalize(T.code);
    $('[data-xo-code-error]').hidden = right;
    if (!right) return;
    state.stage = 'offer';
    render();
    step(0);
    note('opened');
    track('opened');
    $('.xo-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ---------------------------------------------------------------- the quote on its A4 sheet

  const sheet = $('[data-xo-sheet]');
  const frame = $('[data-xo-sheet-frame]');
  let pageHeight = PAGE_HEIGHT;
  function fit() {
    const scale = Math.min(1, sheet.clientWidth / PAGE_WIDTH);
    frame.style.width = `${PAGE_WIDTH}px`;
    frame.style.height = `${pageHeight}px`;
    frame.style.transform = `scale(${scale})`;
    sheet.style.height = `${pageHeight * scale}px`;
  }
  frame.addEventListener('load', () => {
    pageHeight = Math.max(PAGE_HEIGHT, frame.contentDocument?.documentElement.scrollHeight ?? 0);
    fit();
  });
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(sheet);
  fetch(T.sheet_file)
    .then((response) => (response.ok ? response.text() : Promise.reject(response.status)))
    .then((html) => {
      frame.srcdoc = html
        .replace('%%DATE%%', longDate(sent))
        .replace('%%EXPIRY%%', longDate(expiry))
        .replace('</head>', '<style>html { background: #fff; } body { margin: 0 !important; }</style></head>');
    })
    .catch((error) => console.error('The example quote could not be loaded', error));

  // ---------------------------------------------------------------- questions and answers

  const question = $('[data-xo-question]');
  const send = $('[data-xo-send]');
  question.addEventListener('input', () => { send.disabled = !question.value.trim() || state.typing; });
  $('[data-xo-suggestion]').addEventListener('click', () => {
    question.value = T.suggestion;
    send.disabled = state.typing;
    question.focus();
  });
  $('[data-xo-question-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || state.typing) return;
    const id = state.messages.length + 1;
    state.messages.push({ id, kind: 'question', text, at: new Date() });
    const answer = text === T.suggestion ? T.answer_suggestion : T.answer_other;
    question.value = '';
    send.disabled = true;
    state.typing = true;
    $('[data-xo-suggestions]').hidden = true;
    renderMessages();
    step(1);
    note('question');
    track('question');
    setTimeout(() => {
      state.typing = false;
      state.messages.push({ id: id + 1, kind: 'answer', author: T.thread.author, text: answer, at: new Date(), replyTo: id });
      renderMessages();
    }, 2200);
  });

  function bubble(message) {
    const item = document.createElement('div');
    item.className = `xo-message ${message.kind === 'answer' ? 'is-answer' : 'is-question'}`;
    const meta = document.createElement('span');
    meta.className = 'xo-message-meta';
    meta.textContent = `${message.kind === 'answer' ? message.author : T.you} · ${dateTime(message.at)}`;
    const text = document.createElement('p');
    text.textContent = message.text;
    item.append(meta, text);
    return item;
  }

  function renderMessages() {
    const list = $('[data-xo-messages]');
    list.replaceChildren();
    state.messages.filter((message) => message.kind === 'question').forEach((questionMessage) => {
      const thread = document.createElement('li');
      thread.className = 'flex flex-col gap-2';
      thread.append(bubble(questionMessage));
      state.messages.filter((message) => message.replyTo === questionMessage.id).forEach((reply) => thread.append(bubble(reply)));
      list.append(thread);
    });
    if (state.typing) {
      const typing = document.createElement('li');
      typing.className = 'xo-message is-answer xo-typing';
      typing.setAttribute('aria-label', T.thread.author);
      typing.innerHTML = '<span></span><span></span><span></span>';
      list.append(typing);
    }
  }

  // ---------------------------------------------------------------- accepting and declining

  const acceptDialog = $('[data-xo-accept-dialog]');
  const declineDialog = $('[data-xo-decline-dialog]');
  const payDialog = $('[data-xo-pay-dialog]');
  $$('[data-xo-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));

  $('[data-xo-open-accept]').addEventListener('click', () => {
    const first = state.terms[0];
    $('[data-xo-accept-description]').textContent = fill(T.accept_description, {
      number: T.number, total: money(TOTAL_INCL), term: inSentence(first.description), amount: money(first.amount),
    });
    $('[data-xo-name-error]').hidden = true;
    $('[data-xo-terms-error]').hidden = true;
    $('[data-xo-terms-agree]').checked = false;
    acceptDialog.showModal();
  });
  $('[data-xo-terms-agree]').addEventListener('change', () => { $('[data-xo-terms-error]').hidden = true; });
  $('[data-xo-accept-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const named = Boolean($('[data-xo-name]').value.trim());
    const agreed = $('[data-xo-terms-agree]').checked;
    $('[data-xo-name-error]').hidden = named;
    $('[data-xo-terms-error]').hidden = agreed;
    if (!named || !agreed) return;
    acceptDialog.close();
    state.status = 'ACCEPTED';
    state.terms[0].status = 'REQUESTED';
    render();
    step(2);
    note('accepted');
    track('accepted');
    $('[data-xo-terms]').closest('section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('[data-xo-open-decline]').addEventListener('click', () => {
    $('#xo-reason').value = '';
    declineDialog.showModal();
  });
  $('[data-xo-decline-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    declineDialog.close();
    state.status = 'REJECTED';
    render();
    note('declined');
    track('declined');
  });

  // ---------------------------------------------------------------- the deposit, on an example payment page

  function openPayment(index) {
    const term = state.terms[index];
    payDialog.dataset.term = String(index);
    $('[data-xo-pay-amount]').textContent = money(term.amount);
    $('[data-xo-pay-for]').textContent = fill(T.pay_for, { number: T.number, term: inSentence(term.description) });
    $('[data-xo-pay-done]').hidden = true;
    $('[data-xo-pay-actions]').hidden = false;
    const confirm = $('[data-xo-pay-confirm]');
    confirm.disabled = false;
    confirm.textContent = T.pay_confirm;
    payDialog.showModal();
  }
  $('[data-xo-pay-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const confirm = $('[data-xo-pay-confirm]');
    if (confirm.disabled) return;
    confirm.disabled = true;
    confirm.textContent = T.paying;
    setTimeout(() => {
      state.terms[Number(payDialog.dataset.term)].status = 'PAID';
      $('[data-xo-pay-actions]').hidden = true;
      $('[data-xo-pay-done]').hidden = false;
      render();
      step(3);
      track('paid');
      setTimeout(() => {
        payDialog.close();
        note('paid');
        const done = $('[data-xo-done]');
        done.hidden = false;
        $('[data-xo-terms]').closest('section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        // A moment on the paid deposit, then on to what it brings the business
        setTimeout(() => {
          if (!done.hidden) done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 3500);
      }, 1400);
    }, 1300);
  });

  // ---------------------------------------------------------------- drawing the page from the state

  function renderTerms() {
    const list = $('[data-xo-terms]');
    list.replaceChildren();
    state.terms.forEach((term, index) => {
      const item = document.createElement('li');
      item.className = 'xo-term';
      const row = document.createElement('div');
      row.className = 'flex items-start justify-between gap-3';
      const left = document.createElement('div');
      left.className = 'flex min-w-0 flex-col';
      left.innerHTML = '<span class="text-sm font-semibold text-dark-blue"></span><span class="text-xs text-gray-600"></span>';
      left.children[0].textContent = term.description;
      left.children[1].textContent = term.due;
      const right = document.createElement('div');
      right.className = 'flex flex-col items-end gap-1';
      right.innerHTML = '<span class="text-sm font-bold text-dark-blue"></span><span class="xo-pill"></span>';
      right.children[0].textContent = money(term.amount);
      right.children[1].textContent = T.term_status[term.status];
      right.children[1].classList.add(term.status === 'PAID' ? 'is-success' : term.status === 'REQUESTED' ? 'is-warning' : 'is-neutral');
      row.append(left, right);
      item.append(row);
      if (term.status === 'REQUESTED') {
        const pay = document.createElement('button');
        pay.type = 'button';
        pay.className = 'xo-btn xo-btn-primary xo-pulse';
        pay.textContent = fill(T.pay, { amount: money(term.amount) });
        pay.addEventListener('click', () => openPayment(index));
        item.append(pay);
      }
      list.append(item);
    });
  }

  function render() {
    $$('[data-xo-stage]').forEach((element) => { element.hidden = element.dataset.xoStage !== state.stage; });
    $$('[data-xo-restart]').forEach((element) => { element.hidden = state.stage === 'code'; });
    $('[data-xo-sent-on]').textContent = fill(T.sent_on, { date: moment(sent) });
    $('[data-xo-date]').textContent = longDate(sent);
    $('[data-xo-expiry]').textContent = longDate(expiry);
    $('[data-xo-version]').textContent = fill(T.version_value, { date: moment(sent) });
    $('[data-xo-total-excl]').textContent = money(TOTAL_EXCL);
    $('[data-xo-total-incl]').textContent = money(TOTAL_INCL);

    const pill = $('[data-xo-status]');
    pill.textContent = { OPEN: T.status_open, ACCEPTED: T.status_accepted, REJECTED: T.status_rejected }[state.status];
    pill.classList.toggle('is-brand', state.status === 'OPEN');
    pill.classList.toggle('is-success', state.status === 'ACCEPTED');
    pill.classList.toggle('is-neutral', state.status === 'REJECTED');
    $('[data-xo-respond]').hidden = state.status !== 'OPEN';

    const statusNote = $('[data-xo-status-note]');
    const toPay = state.terms.find((term) => term.status === 'REQUESTED');
    statusNote.hidden = state.status === 'OPEN';
    statusNote.className = `xo-alert ${state.status === 'ACCEPTED' ? 'xo-alert-success' : 'xo-alert-info'}`;
    if (state.status === 'ACCEPTED') {
      statusNote.textContent = toPay
        ? fill(T.accepted_pay_next, { term: inSentence(toPay.description), amount: money(toPay.amount) })
        : T.accepted;
    }
    else if (state.status === 'REJECTED') statusNote.textContent = T.rejected;

    renderTerms();
    renderMessages();
  }

  function restart() {
    reset();
    $$('[data-xo-note]').forEach((element) => { if (element.dataset.xoNote !== 'start') element.remove(); });
    $('[data-xo-done]').hidden = true;
    $('[data-xo-suggestions]').hidden = false;
    $('#xo-code').value = T.code;
    $('[data-xo-code-error]').hidden = true;
    question.value = '';
    send.disabled = true;
    toast.hidden = true;
    step(-1);
    render();
    $('.xo-window').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $$('[data-xo-restart]').forEach((button) => button.addEventListener('click', restart));

  reset();
  render();
})();
