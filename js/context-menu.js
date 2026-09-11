/* =========================================================
   Custom right-click context menu (global, one instance).
   - Replaces the default browser right-click UI on desktop.
   - Skipped automatically on touch-only devices.
   - Skipped inside form fields / contenteditable so native
     paste/copy stays available.
   - Positioned to stay fully inside the viewport.
   - Closes on: outside click, Escape, scroll, resize, blur,
     tab hidden, or after running an action.
   - NO anti-inspect tricks. NO fake source protection.
   ========================================================= */
(function () {
  'use strict';

  /* ---- desktop-only ---- */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  /* ---- config (existing portfolio values) ---- */
  var RESUME_URL   = 'assets/resume/sakib-shaikh-resume.pdf';
  var RESUME_NAME  = 'Sakib-Shaikh-Resume.pdf';
  var GITHUB_URL   = 'https://github.com/buildwithsakib';
  var LINKEDIN_URL = 'https://www.linkedin.com/in/sakibturuk';
  var EMAIL        = 'sakib.in7@gmail.com';

  /* ---- inline SVGs (matches existing site's icon style) ---- */
  var ICONS = {
    download:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
        '<polyline points="7 10 12 15 17 10"/>' +
        '<line x1="12" y1="15" x2="12" y2="3"/>' +
      '</svg>',
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>' +
      '</svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>' +
      '</svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="2" y="4" width="20" height="16" rx="2"/>' +
        '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' +
      '</svg>',
    up:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<line x1="12" y1="19" x2="12" y2="5"/>' +
        '<polyline points="5 12 12 5 19 12"/>' +
      '</svg>',
    back:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<line x1="19" y1="12" x2="5" y2="12"/>' +
        '<polyline points="12 19 5 12 12 5"/>' +
      '</svg>',
    refresh:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="23 4 23 10 17 10"/>' +
        '<polyline points="1 20 1 14 7 14"/>' +
        '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>' +
      '</svg>'
  };

  var menu = null;
  var isOpen = false;

  /* ---------- markup ---------- */
  function buildMenu() {
    if (document.getElementById('ctx-menu')) return;

    var html =
      '<div class="ctx-section">' +
        '<div class="ctx-label">Connect</div>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="resume" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.download + '</span>' +
          '<span class="ctx-text">Download Resume</span>' +
          '<span class="ctx-badge">PDF</span>' +
        '</button>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="github" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.github + '</span>' +
          '<span class="ctx-text">GitHub</span>' +
        '</button>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="linkedin" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.linkedin + '</span>' +
          '<span class="ctx-text">LinkedIn</span>' +
        '</button>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="email" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.mail + '</span>' +
          '<span class="ctx-text">Send Email</span>' +
        '</button>' +
      '</div>' +

      '<div class="ctx-sep" aria-hidden="true"></div>' +

      '<div class="ctx-section">' +
        '<div class="ctx-label">Page</div>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="top" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.up + '</span>' +
          '<span class="ctx-text">Scroll to Top</span>' +
          '<span class="ctx-shortcut">Home</span>' +
        '</button>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="back" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.back + '</span>' +
          '<span class="ctx-text">Go Back</span>' +
          '<span class="ctx-shortcut">Alt + ←</span>' +
        '</button>' +
        '<button type="button" class="ctx-item" role="menuitem" data-action="refresh" tabindex="-1">' +
          '<span class="ctx-icon" aria-hidden="true">' + ICONS.refresh + '</span>' +
          '<span class="ctx-text">Refresh</span>' +
          '<span class="ctx-shortcut">F5</span>' +
        '</button>' +
      '</div>';

    var el = document.createElement('div');
    el.id = 'ctx-menu';
    el.className = 'ctx-menu';
    el.setAttribute('role', 'menu');
    el.setAttribute('aria-label', 'Custom context menu');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = html;
    document.body.appendChild(el);
  }

  /* ---------- positioning ---------- */
  function position(x, y) {
    var PAD = 10;
    var mw = menu.offsetWidth;
    var mh = menu.offsetHeight;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var left = x;
    var top = y;
    var originX = 'left';
    var originY = 'top';

    /* horizontal flip */
    if (left + mw + PAD > vw) {
      left = x - mw;
      originX = 'right';
    }
    if (left < PAD) left = PAD;
    if (left + mw + PAD > vw) left = vw - mw - PAD;

    /* vertical flip */
    if (top + mh + PAD > vh) {
      top = y - mh;
      originY = 'bottom';
    }
    if (top < PAD) top = PAD;
    if (top + mh + PAD > vh) top = vh - mh - PAD;

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.transformOrigin = originX + ' ' + originY;
  }

  /* ---------- open / close ---------- */
  function openMenu(x, y) {
    if (!menu) return;

    if (!isOpen) {
      /* temporary off-screen so the entrance animation starts from
         the correct place without a visible flash */
      menu.style.left = '-9999px';
      menu.style.top = '-9999px';
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
    }

    position(x, y);
    isOpen = true;
  }

  function closeMenu() {
    if (!menu || !isOpen) return;
    isOpen = false;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    if (document.activeElement && menu.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  /* ---------- actions ---------- */
  function runAction(action) {
    switch (action) {
      case 'resume': {
        var a = document.createElement('a');
        a.href = RESUME_URL;
        a.download = RESUME_NAME;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        break;
      }
      case 'github':
        window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
        break;
      case 'linkedin':
        window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
        break;
      case 'email':
        window.location.href = 'mailto:' + EMAIL;
        break;
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'back':
        if (window.history.length > 1) window.history.back();
        break;
      case 'refresh':
        window.location.reload();
        break;
    }
  }

  /* ---------- event handlers ---------- */
  function onContextMenu(e) {
    /* Let the native menu work inside form fields / editable content,
       so paste and copy stay available. Users can still rely on
       Ctrl+V / Ctrl+C outside those fields. */
    var t = e.target;
    if (t && t.closest) {
      if (t.closest('input, textarea, [contenteditable="true"], [contenteditable=""], [data-native-context]')) return;
    }
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }

  function onMouseDown(e) {
    if (!isOpen) return;
    if (e.button !== 0) return;              /* only left-click closes */
    if (menu.contains(e.target)) return;     /* clicks on the menu itself are handled by onMenuClick */
    closeMenu();
  }

  function onMenuClick(e) {
    var item = e.target.closest('.ctx-item');
    if (!item) return;
    var action = item.dataset.action;
    closeMenu();
    if (action) runAction(action);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (!isOpen) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var items = menu.querySelectorAll('.ctx-item');
      if (!items.length) return;
      var list = Array.prototype.slice.call(items);
      var idx = list.indexOf(document.activeElement);
      var next;
      if (idx === -1) {
        next = e.key === 'ArrowDown' ? 0 : list.length - 1;
      } else if (e.key === 'ArrowDown') {
        next = idx < list.length - 1 ? idx + 1 : 0;
      } else {
        next = idx > 0 ? idx - 1 : list.length - 1;
      }
      list[next].focus();
    }
  }

  /* ---------- init ---------- */
  function init() {
    buildMenu();
    menu = document.getElementById('ctx-menu');
    if (!menu) return;

    /* Build once, listen once. No duplicates on repeat loads. */
    document.addEventListener('contextmenu', onContextMenu);
    menu.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    menu.addEventListener('click', onMenuClick);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    window.addEventListener('scroll', function () {
      if (isOpen) closeMenu();
    }, { passive: true, capture: true });

    window.addEventListener('resize', function () {
      if (isOpen) closeMenu();
    }, { passive: true });

    window.addEventListener('blur', function () {
      if (isOpen) closeMenu();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && isOpen) closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();