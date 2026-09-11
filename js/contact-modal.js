/* =========================================================
   Reach Out modal — shared by every page.
   Screen 1: intro + composer + email + socials.
   Screen 2: contact form (Name / Email / Topic / Message +
             consent). Submits via FormSubmit AJAX.

   ONE-TIME SETUP REQUIRED:
   1. Visit https://formsubmit.co/ and enter sakib.in7@gmail.com
      (or just open the site and submit the form once).
   2. FormSubmit will email you an activation link. Click it once.
   3. After that, every submission is forwarded to that inbox.
   ========================================================= */
(function () {
  'use strict';

  var ENDPOINT = 'https://formsubmit.co/ajax/sakib.in7@gmail.com';
  var EMAIL = 'sakib.in7@gmail.com';
  var SOCIALS = [
    { name: 'GitHub',    href: 'https://github.com/buildwithsakib',                  icon: 'github' },
    { name: 'LinkedIn',  href: 'https://www.linkedin.com/in/sakibturuk',             icon: 'linkedin' },
    { name: 'Instagram', href: 'https://www.instagram.com/sakibturuk',               icon: 'instagram' }
  ];

  var ICONS = {
    github:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
    mail:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>',
    back:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    arrow:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    close:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };

  var modal, card, screens, state;

  function buildModal() {
    if (document.getElementById('reach-modal')) return;
    var wrap = document.createElement('div');
    wrap.className = 'menu-modal';
    wrap.id = 'reach-modal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Reach out');
    wrap.innerHTML =
      '<div class="menu-card reach-card" id="reach-card">' +

        /* Screen 1 — Reach out */
        '<div class="reach-screen active" data-screen="1">' +
          '<div class="reach-top">' +
            '<button type="button" class="reach-back" data-close-reach aria-label="Close">' + ICONS.close + '</button>' +
            '<p class="reach-eyebrow">Reach out</p>' +
          '</div>' +
          '<h2 class="reach-title">Let\'s talk.</h2>' +
          '<p class="reach-sub">I read every one.</p>' +
          '<div class="reach-composer">' +
            '<label for="reach-compose">Send Sakib a message</label>' +
            '<textarea id="reach-compose" placeholder="Hey Sakib, I have a project idea..."></textarea>' +
          '</div>' +
          '<button type="button" class="reach-continue" data-continue>' +
            'Continue ' + ICONS.arrow +
          '</button>' +
          '<div class="reach-divider">or</div>' +
          '<div class="reach-links" id="reach-links"></div>' +
        '</div>' +

        /* Screen 2 — Contact form */
        '<div class="reach-screen" data-screen="2">' +
          '<div class="reach-top">' +
            '<button type="button" class="reach-back" data-back-reach aria-label="Back">' + ICONS.back + '</button>' +
            '<p class="reach-eyebrow">Contact</p>' +
          '</div>' +
          '<h2 class="reach-title">Tell me about it.</h2>' +
          '<p class="reach-sub">Name, email, topic and a short message.</p>' +
          '<div class="form-success" data-reach-success>✓ Message sent — I\'ll get back to you soon.</div>' +
          '<div class="form-error-box" data-reach-error>Something went wrong. Try again, or email me directly.</div>' +
          '<form class="reach-form" novalidate data-reach-form>' +
            '<div class="form-row">' +
              '<div class="form-group" data-group="name">' +
                '<label for="rf-name">Name</label>' +
                '<input type="text" id="rf-name" name="name" placeholder="Jane Doe" autocomplete="name" maxlength="80">' +
                '<p class="error-message">Please enter at least 2 characters.</p>' +
              '</div>' +
              '<div class="form-group" data-group="email">' +
                '<label for="rf-email">Email</label>' +
                '<input type="email" id="rf-email" name="email" placeholder="jane@example.com" autocomplete="email" maxlength="120">' +
                '<p class="error-message">Please enter a valid email.</p>' +
              '</div>' +
            '</div>' +
            '<div class="form-group" data-group="topic">' +
              '<label>Topic</label>' +
              '<div class="topic-pills" data-topic-group>' +
                '<button type="button" class="topic-pill" data-value="Project / Website">Project / Website</button>' +
                '<button type="button" class="topic-pill" data-value="Freelance">Freelance</button>' +
                '<button type="button" class="topic-pill" data-value="Collaboration">Collaboration</button>' +
                '<button type="button" class="topic-pill" data-value="Job Opportunity">Job Opportunity</button>' +
                '<button type="button" class="topic-pill" data-value="General Message">General Message</button>' +
              '</div>' +
              '<p class="error-message">Please pick a topic.</p>' +
            '</div>' +
            '<div class="form-group" data-group="message">' +
              '<label for="rf-message">Message</label>' +
              '<textarea id="rf-message" name="message" placeholder="Tell me about your project, idea, or just say hi..." maxlength="2000"></textarea>' +
              '<p class="error-message">Please write at least 10 characters.</p>' +
            '</div>' +
            '<div class="checkbox-row">' +
              '<input type="checkbox" id="rf-agree" name="agree">' +
              '<label for="rf-agree">I agree that my submitted data is collected and stored to respond to my inquiry.</label>' +
            '</div>' +
            '<button type="submit" class="btn-submit" data-submit>' +
              '<span data-submit-label>Send Message</span>' + ICONS.arrow +
            '</button>' +
            /* honeypot — hidden from humans, attractive to bots */
            '<div class="reach-hp" aria-hidden="true">' +
              '<label>Leave this field empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>' +
            '</div>' +
            '<input type="hidden" name="_subject" value="New message from portfolio">' +
            '<input type="hidden" name="_template" value="table">' +
            '<input type="hidden" name="_captcha" value="false">' +
          '</form>' +
          '<p class="reach-note">Goes straight to ' + EMAIL + '</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    /* Social links list (screen 1) */
    var linksEl = wrap.querySelector('#reach-links');
    var html = '<a class="reach-link" href="mailto:' + EMAIL + '">' + ICONS.mail +
               '<span>Email me</span><span class="reach-link-meta">' + EMAIL + '</span></a>';
    for (var i = 0; i < SOCIALS.length; i++) {
      var s = SOCIALS[i];
      html += '<a class="reach-link" href="' + s.href + '" target="_blank" rel="noopener">' +
              ICONS[s.icon] + '<span>' + s.name + '</span>' +
              '<span class="reach-link-meta">↗</span></a>';
    }
    linksEl.innerHTML = html;
  }

  function setScreen(n) {
    screens.forEach(function (el) {
      el.classList.toggle('active', Number(el.dataset.screen) === n);
    });
    card.scrollTop = 0;
  }

  function resetForm() {
    var form = card.querySelector('[data-reach-form]');
    if (!form) return;
    form.reset();
    card.querySelectorAll('.topic-pill').forEach(function (p) { p.classList.remove('selected'); });
    card.querySelectorAll('.form-group.has-error').forEach(function (g) { g.classList.remove('has-error'); });
    card.querySelector('[data-reach-success]').classList.remove('visible');
    card.querySelector('[data-reach-error]').classList.remove('visible');
  }

  function open() {
    resetForm();
    setScreen(1);
    modal.classList.add('active');
    document.body.classList.add('dialog-open');
    document.body.dataset.scrollY = String(window.scrollY);
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + window.scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    var trigger = document.activeElement;
    state.returnFocus = trigger && trigger.focus ? trigger : null;
    setTimeout(function () {
      var first = card.querySelector('.reach-screen.active textarea, .reach-screen.active input, .reach-screen.active button');
      if (first) first.focus();
    }, 60);
  }

  function close() {
    modal.classList.remove('active');
    document.body.classList.remove('dialog-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    var y = Number(document.body.dataset.scrollY || 0);
    window.scrollTo(0, y);
    if (state.returnFocus && state.returnFocus.focus) {
      try { state.returnFocus.focus({ preventScroll: true }); } catch (e) { state.returnFocus.focus(); }
    }
  }

  /* ---- validation ---- */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function setError(name, on) {
    var g = card.querySelector('[data-group="' + name + '"]');
    if (!g) return;
    g.classList.toggle('has-error', !!on);
  }

  function bind() {
    card.addEventListener('click', function (e) {
      var t = e.target.closest('[data-continue],[data-back-reach],[data-close-reach]');
      if (!t) return;
      if (t.hasAttribute('data-continue')) { setScreen(2); return; }
      if (t.hasAttribute('data-back-reach')) { setScreen(1); return; }
      if (t.hasAttribute('data-close-reach')) { close(); }
    });

    modal.addEventListener('click', function (e) {
      if (!card.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    /* topic pills */
    card.querySelectorAll('.topic-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        card.querySelectorAll('.topic-pill').forEach(function (p) { p.classList.remove('selected'); });
        pill.classList.add('selected');
        setError('topic', false);
      });
    });

    /* live-clear errors */
    ['name', 'email', 'message'].forEach(function (n) {
      var el = card.querySelector('[data-group="' + n + '"] input, [data-group="' + n + '"] textarea');
      if (el) el.addEventListener('input', function () { setError(n, false); });
    });

    /* submit */
    var form = card.querySelector('[data-reach-form]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var honeypot = form.querySelector('input[name="_honey"]');
      if (honeypot && honeypot.value) return; /* silent bot drop */

      var nameEl = form.querySelector('#rf-name');
      var emailEl = form.querySelector('#rf-email');
      var msgEl = form.querySelector('#rf-message');
      var agreeEl = form.querySelector('#rf-agree');
      var topicEl = card.querySelector('.topic-pill.selected');

      var name = nameEl.value.trim();
      var email = emailEl.value.trim();
      var message = msgEl.value.trim();
      var topic = topicEl ? topicEl.dataset.value : '';

      var ok = true;
      if (name.length < 2) { setError('name', true); ok = false; } else setError('name', false);
      if (!isEmail(email)) { setError('email', true); ok = false; } else setError('email', false);
      if (!topic) { setError('topic', true); ok = false; } else setError('topic', false);
      if (message.length < 10) { setError('message', true); ok = false; } else setError('message', false);
      if (!agreeEl.checked) { ok = false; agreeEl.focus(); }
      if (!ok) return;

      var success = card.querySelector('[data-reach-success]');
      var errBox = card.querySelector('[data-reach-error]');
      success.classList.remove('visible');
      errBox.classList.remove('visible');

      var btn = card.querySelector('[data-submit]');
      var label = card.querySelector('[data-submit-label]');
      var original = label.textContent;
      btn.disabled = true;
      label.textContent = 'Sending…';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          topic: topic,
          message: message,
          _subject: 'New portfolio message from ' + name,
          _template: 'table',
          _captcha: 'false'
        })
      })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function () {
        success.classList.add('visible');
        setTimeout(function () { success.classList.remove('visible'); }, 6000);
        form.reset();
        card.querySelectorAll('.topic-pill').forEach(function (p) { p.classList.remove('selected'); });
      })
      .catch(function () {
        errBox.classList.add('visible');
      })
      .finally(function () {
        btn.disabled = false;
        label.textContent = original;
      });
    });
  }

  function attachTriggers() {
    document.querySelectorAll('.reach-out-btn').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        /* Close the menu modal first if it's open. */
        var menu = document.getElementById('menu-modal');
        if (menu && menu.classList.contains('active')) {
          menu.classList.remove('active');
          document.body.style.overflow = '';
        }
        open();
      });
    });
  }

  function init() {
    buildModal();
    modal = document.getElementById('reach-modal');
    card = document.getElementById('reach-card');
    screens = card.querySelectorAll('.reach-screen');
    state = { returnFocus: null };
    bind();
    attachTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
