/* =========================================================
   SAKIB portfolio — main interactions (v2)
   Removed: Lenis, dead globe init, dead command-menu code,
            dead clock IDs, unused setInterval.
   Unified: menu modal, theme, clock, cursor, reveal, header,
            reading progress, hero glow.
   All rAF work pauses when the tab is hidden.
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- MENU MODAL ---------- */
  function initMenu() {
    const toggle = document.getElementById('menu-toggle');
    const modal  = document.getElementById('menu-modal');
    const card   = document.getElementById('menu-card');
    if (!toggle || !modal || !card) return;

    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      modal.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('dialog-open');
      const focusable = card.querySelector('input, button, a[href]');
      if (focusable) setTimeout(() => focusable.focus(), 50);
    }
    function close() {
      modal.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('dialog-open');
      if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.contains('active') ? close() : open();
    });

    modal.addEventListener('click', (e) => {
      if (!card.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    /* Close when navigating away. */
    modal.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

    /* Simple search filter inside the menu. */
    const input = card.querySelector('.search-bar input');
    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        modal.querySelectorAll('.menu-item').forEach((item) => {
          const text = item.textContent.toLowerCase();
          item.style.display = (!q || text.includes(q)) ? '' : 'none';
        });
      });
    }
  }

  /* ---------- THEME ---------- */
  function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const apply = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#fcfbfc');
    };
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme');
        apply(current === 'dark' ? 'light' : 'dark');
      });
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => { if (!localStorage.getItem('theme')) apply(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- CLOCK ---------- */
  function initClock() {
    const hourHand   = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const timeEl     = document.getElementById('clock-time');
    if (!hourHand || !minuteHand) return;

    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    let rafId = 0;

    const frame = () => {
      rafId = 0;
      if (document.hidden) return;
      const now = new Date();
      const ms = now.getMilliseconds();
      const sec = now.getSeconds() + ms / 1000;
      const min = now.getMinutes() + sec / 60;
      const hr  = (now.getHours() % 12) + min / 60;

      hourHand.style.transform   = `translateX(-50%) rotate(${hr * 30}deg)`;
      minuteHand.style.transform = `translateX(-50%) rotate(${min * 6}deg)`;
      if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${sec * 6}deg)`;
      if (timeEl) timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

      rafId = requestAnimationFrame(frame);
    };
    const wake = () => { if (!rafId && !document.hidden) rafId = requestAnimationFrame(frame); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } } else wake(); });
    wake();
  }

  /* ---------- REVEAL ---------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('is-pending');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => { el.classList.add('is-pending'); io.observe(el); });
  }

  /* ---------- HEADER + READING PROGRESS (rAF-throttled) ---------- */
  function initScrollEffects() {
    const header = document.getElementById('site-header');
    const progress = document.querySelector('.reading-progress');
    if (!header && !progress) return;

    let ticking = false;
    let lastY = -1;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (progress) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`;
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------- CUSTOM CURSOR ---------- */
  function initCursor() {
    if (reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.documentElement.classList.add('has-custom-cursor');

    let mx = 0, my = 0, rx = 0, ry = 0;
    let hovering = false;
    let rafId = 0;
    let running = false;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!running) { running = true; rafId = requestAnimationFrame(tick); }
    };
    const tick = () => {
      rafId = 0;
      if (document.hidden) { running = false; return; }
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      ring.classList.toggle('active', hovering);
      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove', onMove, { passive: true });

    const HOVER = 'a, button, .project-card, .project-art, .globe-container, .skill-chip, .topic-pill';
    document.addEventListener('mouseover', (e) => { hovering = !!e.target.closest(HOVER); });
    document.addEventListener('mouseout',  (e) => { if (!e.target.closest(HOVER)) hovering = false; });
    document.addEventListener('mouseleave', () => { hovering = false; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); rafId = 0; running = false; }
    });
  }

  /* ---------- HERO GLOW PARALLAX (rAF-throttled) ---------- */
  function initHeroGlow() {
    if (reduced) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    const glow = document.querySelector('.hero-glow');
    if (!glow) return;
    let ticking = false, px = 0, py = 0;
    const apply = () => {
      ticking = false;
      glow.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    };
    document.addEventListener('mousemove', (e) => {
      px = (e.clientX / window.innerWidth - 0.5) * 20;
      py = (e.clientY / window.innerHeight - 0.5) * 20;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* ---------- TIME-BASED GREETING (projects page) ---------- */
  function initGreeting() {
    const el = document.getElementById('greeting-text');
    if (!el) return;
    const h = new Date().getHours();
    let g = 'Working late? Welcome';
    if (h >= 5 && h < 12) g = 'Good morning — welcome back';
    else if (h >= 12 && h < 17) g = 'Good afternoon — welcome back';
    else if (h >= 17 && h < 21) g = 'Good evening — welcome back';
    el.textContent = g;
  }

  /* ---------- HORIZONTAL PROJECTS (index only) ---------- */
  function initHorizontalProjects() {
    const track = document.getElementById('featured-projects-track');
    if (!track) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || reduced) {
      /* Fallback: natural horizontal overflow. */
      track.style.overflowX = 'auto';
      track.style.flexWrap = 'nowrap';
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const wrapper = document.getElementById('featured-projects-wrapper');
    if (!wrapper) return;

    const getAmount = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -getAmount(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: () => '+=' + getAmount(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        fastScrollEnd: true
      }
    });
  }

  /* ---------- PAGE INTRO (cleanup will-change after animation) ---------- */
  function initPageIntro() {
    const items = $$('.page-intro-item');
    if (!items.length) return;
    const cleanup = () => items.forEach((el) => el.classList.add('is-done'));
    if (reduced) { cleanup(); return; }
    /* Longest animation is 750ms + up to 5 * 90ms ≈ 1.2s. */
    setTimeout(cleanup, 1400);
  }

  /* ---------- BOOT ---------- */
  function boot() {
    initMenu();
    initTheme();
    initClock();
    initReveal();
    initScrollEffects();
    initCursor();
    initHeroGlow();
    initGreeting();
    initHorizontalProjects();
    initPageIntro();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
