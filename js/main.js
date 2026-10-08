/* Corridor Freight Co. — site behaviour (no framework) */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const usd = (cents, digits = 0) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  /* ---------- Prices: the single source for every "From $…" label on the site ---------- */
  const PRICES = {
    intermodal: { cents: 145, unit: '/mi' },
    truckload: { cents: 235, unit: '/mi' },
    ltl: { cents: 16500, unit: '' },
    drayage: { cents: 39500, unit: '/move' },
    warehousing: { cents: 1400, unit: '/pallet/mo', short: '/pallet' },
    customs: { cents: 12500, unit: '/entry' },
  };
  const priceText = (key, short) => {
    const p = PRICES[key];
    return usd(p.cents, p.cents < 1000 ? 2 : 0) + (short && p.short ? p.short : p.unit);
  };
  $$('[data-price]').forEach(el => { el.textContent = 'From ' + priceText(el.dataset.price, true); });
  $$('[data-price-num]').forEach(el => { el.textContent = priceText(el.dataset.priceNum); });

  /* ---------- Header: solid after scrolling ---------- */
  const header = $('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const setMenu = open => {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  /* ---------- Images fade in over their blurred placeholder ---------- */
  $$('.fade-img').forEach(img => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ---------- Observer helper (artifact iframes need root: document for rootMargin) ---------- */
  const observe = (els, cb, opts) => {
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(el => cb(el)); return; }
    const handler = (entries, obs) => entries.forEach(en => { if (en.isIntersecting) { obs.unobserve(en.target); cb(en.target); } });
    let io;
    try { io = new IntersectionObserver(handler, { ...opts, root: document }); }
    catch { io = new IntersectionObserver(handler, opts); }
    els.forEach(el => io.observe(el));
  };

  /* ---------- Reveal on scroll ---------- */
  observe($$('.reveal'), el => el.classList.add('is-in'), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  /* ---------- Count-up numbers (runs once) ---------- */
  observe($$('[data-count]'), el => {
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.4 });

  /* ---------- Shipment tracking demo ---------- */
  const tracker = $('[data-tracker]');
  if (tracker) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const at = (d, h, m) => new Date(today.getTime() + d * 864e5 + (h * 60 + m) * 6e4);
    const ago = min => new Date(Date.now() - min * 6e4);
    const fmt = dt => dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const SHIPMENTS = {
      'CRD-48213': {
        mode: 'Rail intermodal · 53-ft container · 40,200 lbs', from: 'Chicago, IL', to: 'Los Angeles, CA',
        status: 'In transit', tone: '', progress: 58, eta: at(3, 14, 0), coordinator: 'Dana Ruiz',
        steps: [
          ['Picked up', 'Elk Grove Village, IL', at(-3, 8, 12), 'done'],
          ['Departed on rail', 'Joliet intermodal ramp, IL', at(-3, 19, 40), 'done'],
          ['Passed Kansas City, MO', 'Running on schedule', at(-1, 6, 5), 'done'],
          ['In transit near Albuquerque, NM', 'Last GPS ping 18 min ago', ago(18), 'now'],
          ['Arrives at rail ramp', 'San Bernardino, CA', at(2, 21, 0), ''],
          ['Out for delivery', 'Los Angeles, CA', at(3, 14, 0), ''],
        ],
      },
      'CRD-77105': {
        mode: 'Full truckload · dry van · 22 pallets', from: 'Dallas, TX', to: 'Atlanta, GA',
        status: 'Delivered', tone: 'done', progress: 100, eta: at(-1, 9, 5), etaLabel: 'Delivered', coordinator: 'Marcus Lee',
        steps: [
          ['Picked up', 'Dallas, TX', at(-2, 6, 30), 'done'],
          ['In transit', 'Shreveport, LA', at(-2, 11, 45), 'done'],
          ['In transit', 'Birmingham, AL', at(-1, 4, 20), 'done'],
          ['Delivered · POD signed by J. Moreno', 'Atlanta, GA', at(-1, 9, 5), 'done'],
        ],
      },
      'CRD-30562': {
        mode: 'Port drayage + transload · 40-ft container', from: 'Long Beach, CA', to: 'Phoenix, AZ',
        status: 'Delay resolved', tone: 'warn', progress: 32, eta: at(1, 11, 0), coordinator: 'Ana Silva',
        note: 'A customs exam added one day. We pre-pulled the container to our yard to avoid demurrage — new ETA tomorrow, 11:00 a.m.',
        steps: [
          ['Vessel discharged', 'Pier T, Port of Long Beach', at(-2, 14, 30), 'done'],
          ['Customs exam cleared', 'Long Beach, CA', at(-1, 16, 10), 'done'],
          ['Pre-pulled to Corridor yard', 'Long Beach hub', at(0, 7, 15), 'done'],
          ['Transloading to 53-ft trailer', 'Long Beach hub · started 40 min ago', ago(40), 'now'],
          ['Departs for Phoenix', 'Long Beach, CA', at(0, 16, 0), ''],
          ['Delivery', 'Phoenix, AZ', at(1, 11, 0), ''],
        ],
      },
    };
    const train = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 21l1.5-4.5M15 21l-1.5-4.5"/></svg>';
    const out = $('[data-track-out]', tracker);
    const input = $('#track-id', tracker);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const show = raw => {
      const id = raw.trim().toUpperCase().replace(/\s+/g, '').replace(/^CRD(?=\d)/, 'CRD-');
      $$('.chip', tracker).forEach(c => c.classList.toggle('is-active', c.dataset.sample === id));
      const s = SHIPMENTS[id];
      if (!s) {
        out.innerHTML = `<p class="tr-error">We couldn’t find <b>${esc(raw || 'that number')}</b>. Check the number on your confirmation email, or try a demo number like <b>CRD-48213</b>.</p>`;
        return;
      }
      out.innerHTML = `
        <div class="tr-head"><div><p class="tr-id">${id}</p><p class="tr-sub">${s.mode}</p></div><span class="pill ${s.tone}">${s.status}</span></div>
        <div class="tr-rail" role="img" aria-label="${s.progress}% of the route complete"><span class="tr-fill"></span><span class="tr-dot" style="left:0"></span><span class="tr-dot end"></span><span class="tr-train">${train}</span></div>
        <div class="tr-ends"><div>From<b>${s.from}</b></div><div>To<b>${s.to}</b></div></div>
        ${s.note ? `<p class="tr-error" style="background:rgb(232 170 70 / .1);border-color:rgb(232 170 70 / .35)">${s.note}</p>` : ''}
        <ol class="tr-steps">${s.steps.map(([t, loc, dt, st]) => `<li class="${st}"><i></i><span><b>${t}</b>${loc}</span><time datetime="${dt.toISOString()}">${st ? '' : 'ETA '}${fmt(dt)}</time></li>`).join('')}</ol>
        <p class="tr-foot"><span>${s.etaLabel || 'ETA'} <b>${fmt(s.eta)}</b></span><span>&middot;</span><span>Coordinator <b>${s.coordinator}</b></span></p>`;
      const fill = $('.tr-fill', out), dot = $('.tr-train', out);
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = s.progress + '%'; dot.style.left = s.progress + '%'; }));
    };
    $('[data-track-form]', tracker).addEventListener('submit', e => { e.preventDefault(); show(input.value); });
    $$('.chip', tracker).forEach(c => c.addEventListener('click', () => { input.value = c.dataset.sample; show(c.dataset.sample); }));
    const qp = new URLSearchParams(location.search).get('track');
    input.value = qp || 'CRD-48213';
    show(input.value);
  }

  /* ---------- Rate estimator ---------- */
  const est = $('[data-estimator]');
  if (est) {
    const RATES = {
      intermodal: { perMile: 145, min: 95000, days: m => [Math.ceil(m / 500) + 2, Math.ceil(m / 500) + 3] },
      truckload: { perMile: 235, min: 65000, days: m => [Math.max(1, Math.ceil(m / 550)), Math.max(1, Math.ceil(m / 550)) + 1], fast: m => [Math.max(1, Math.ceil(m / 900)), Math.max(1, Math.ceil(m / 900)) + 1] },
      ltl: { perPallet: 8500, perPalletMile: 11, min: 16500, days: m => [Math.ceil(m / 450) + 1, Math.ceil(m / 450) + 2] },
    };
    const EXTRAS = { liftgate: 8500, hazmat: 25000, residential: 6500 };
    const EXPEDITE = 0.18;
    const miles = $('#est-miles'), milesR = $('#est-miles-range');
    const pallets = $('#est-pallets'), palletsR = $('#est-pallets-range');
    const palletsRow = $('[data-pallets-row]', est);
    const pct = r => r.style.setProperty('--pct', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    const link = (num, range) => {
      range.addEventListener('input', () => { num.value = range.value; pct(range); calc(); });
      num.addEventListener('input', () => { if (num.value !== '') { range.value = num.value; pct(range); } calc(); });
    };
    const round10 = c => Math.round(c / 1000) * 1000;
    function calc() {
      const mode = est.querySelector('input[name="mode"]:checked').value;
      const R = RATES[mode];
      const m = Math.min(3500, Math.max(50, parseInt(miles.value, 10) || 0));
      const p = Math.min(12, Math.max(1, parseInt(pallets.value, 10) || 1));
      palletsRow.hidden = mode !== 'ltl';
      const line = mode === 'ltl' ? Math.max(R.min, p * R.perPallet + p * m * R.perPalletMile) : Math.max(R.min, m * R.perMile);
      const fast = est.elements.expedited.checked;
      let extras = Object.keys(EXTRAS).reduce((sum, k) => sum + (est.elements[k].checked ? EXTRAS[k] : 0), 0);
      if (fast) extras += Math.round(line * EXPEDITE);
      const total = line + extras;
      const [d1, d2] = (fast && R.fast ? R.fast : R.days)(m);
      $('[data-est-total]', est).textContent = `${usd(round10(total * 0.92))} – ${usd(round10(total * 1.08))}`;
      $('[data-est-line]', est).textContent = usd(line);
      $('[data-est-extras]', est).textContent = usd(extras);
      $('[data-est-transit]', est).textContent = `${d1}–${d2} days`;
      $('[data-est-rate]', est).textContent = mode === 'ltl' ? `${usd(total / p)}/pallet` : `${usd(total / m, 2)}/mi`;
      const note = `Estimator: ${m.toLocaleString('en-US')} mi${mode === 'ltl' ? `, ${p} pallets` : ''}, ${usd(round10(total * 0.92))}–${usd(round10(total * 1.08))}`;
      $('[data-est-cta]', est).href = `contact.html?mode=${mode}&est=${encodeURIComponent(note)}#quote`;
    }
    link(miles, milesR); link(pallets, palletsR);
    est.addEventListener('change', calc);
    est.addEventListener('submit', e => e.preventDefault());
    pct(milesR); pct(palletsR); calc();
  }

  /* ---------- Services sub-nav: highlight the section in view ---------- */
  const subLinks = $$('.subnav a');
  if (subLinks.length && 'IntersectionObserver' in window) {
    const targets = subLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const onSec = entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      subLinks.forEach(a => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('is-active', on);
        if (on && a.parentElement.parentElement.scrollWidth > a.parentElement.parentElement.clientWidth) {
          const ul = a.parentElement.parentElement;
          ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    });
    let io;
    const opts = { rootMargin: '-45% 0px -50% 0px' };
    try { io = new IntersectionObserver(onSec, { ...opts, root: document }); } catch { io = new IntersectionObserver(onSec, opts); }
    targets.forEach(t => io.observe(t));
  }

  /* ---------- Quote form ---------- */
  const qf = $('[data-quote-form]');
  if (qf) {
    const success = $('[data-quote-success]');
    const dateEl = $('#q-date');
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    dateEl.min = iso(new Date());

    // prefill from the mini quote form / estimator / "Quote this mode" links
    const params = new URLSearchParams(location.search);
    if (params.has('from')) qf.elements.from.value = params.get('from');
    if (params.has('to')) qf.elements.to.value = params.get('to');
    if (params.has('mode')) {
      const m = params.get('mode');
      qf.elements.mode.value = [...qf.elements.mode.options].some(o => o.value === m && m) ? m : 'recommend';
    }
    if (params.has('est')) qf.elements.notes.value = params.get('est');

    const MODE_NAMES = { recommend: 'Recommend a mode', intermodal: 'Rail intermodal', truckload: 'Full truckload', ltl: 'LTL / pallets', drayage: 'Port drayage', warehousing: 'Warehousing', customs: 'Customs & cross-border' };
    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your name.',
      company: v => v.trim().length >= 2 || 'Please enter your company.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: v => !v.trim() || /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(v.trim()) || 'Use a 10-digit US number, e.g. (555) 555-0100.',
      mode: v => !!v || 'Choose a mode, or pick “Not sure”.',
      from: v => v.trim().length >= 2 || 'Where does it ship from?',
      to: v => v.trim().length >= 2 || 'Where is it going?',
      date: v => (!!v && v >= dateEl.min) || (v ? 'Pick today or a future date.' : 'When is it ready?'),
      weight: v => !v || (+v > 0 && +v <= 200000) || 'Enter a weight between 1 and 200,000 lbs.',
      units: v => !v || (+v >= 1 && +v <= 60) || 'Enter between 1 and 60.',
    };
    const check = name => {
      const el = qf.elements[name];
      const res = rules[name](el.value);
      const err = $('#q-' + name + '-err');
      const bad = res !== true;
      el.setAttribute('aria-invalid', String(bad));
      if (bad) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
      err.textContent = bad ? res : '';
      return !bad;
    };
    Object.keys(rules).forEach(n => {
      const el = qf.elements[n];
      el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') check(n); });
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(n); });
    });
    qf.addEventListener('submit', e => {
      e.preventDefault();
      const bad = Object.keys(rules).filter(n => !check(n));
      if (bad.length) { qf.elements[bad[0]].focus(); return; }
      const f = qf.elements;
      const ref = 'CRQ-' + String(Math.floor(10000 + Math.random() * 90000));
      const ready = new Date(f.date.value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const load = [f.weight.value && (+f.weight.value).toLocaleString('en-US') + ' lbs', f.units.value && f.units.value + ' units'].filter(Boolean).join(' · ') || 'To confirm';
      const first = f.name.value.trim().split(/\s+/)[0];
      $('[data-ref]', success).textContent = ref;
      $('[data-success-msg]', success).textContent = `Thanks, ${first}. Your coordinator will reach you at ${f.phone.value.trim().replace(/-/g, '‑') || f.email.value.trim()} within two business hours.`;
      const rows = [['Route', `${f.from.value.trim()} → ${f.to.value.trim()}`], ['Mode', MODE_NAMES[f.mode.value]], ['Ready', ready], ['Load', load]];
      const sum = $('[data-summary]', success);
      sum.replaceChildren(...rows.map(([k, v]) => { const d = document.createElement('div'); const s = document.createElement('span'); s.textContent = k; const b = document.createElement('b'); b.textContent = v; d.append(s, b); return d; }));
      qf.hidden = true; success.hidden = false; success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    $('[data-quote-again]').addEventListener('click', () => {
      qf.reset(); dateEl.min = iso(new Date());
      $$('[aria-invalid]', qf).forEach(el => el.removeAttribute('aria-invalid'));
      $$('.err', qf).forEach(el => { el.textContent = ''; });
      success.hidden = true; qf.hidden = false; qf.elements.name.focus();
    });
  }

  /* ---------- Newsletter ---------- */
  $$('[data-newsletter]').forEach(form => {
    const msg = form.parentElement.querySelector('[data-news-msg]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.elements.email;
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      email.setAttribute('aria-invalid', String(!ok));
      msg.classList.toggle('bad', !ok);
      msg.textContent = ok ? 'You’re on the list. The next Lane Report lands the first Monday of the month.' : 'Please enter a valid email address.';
      if (ok) form.reset();
    });
  });

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
