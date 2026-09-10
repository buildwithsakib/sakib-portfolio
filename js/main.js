/* SAKIB portfolio — main interactions */
(() => {
  'use strict';

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ========== LENIS SMOOTH SCROLL ========== */
  let lenis;
  if (!reducedMotion.matches && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ========== GSAP + ScrollTrigger PINNED HORIZONTAL PROJECTS ========== */
  if (!reducedMotion.matches && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // Registering the plugin is required — without this call GSAP silently
    // ignores the `scrollTrigger` option and the pinned horizontal scroll
    // never activates.
    gsap.registerPlugin(ScrollTrigger);

    const track = $('#featured-projects-track');
    if (track) {
      const wrapper = $('#featured-projects-wrapper');
      const getScrollAmount = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        }
      });
    }
  } else {
    // Fallback: allow horizontal scrolling naturally
    const track = $('#featured-projects-track');
    if (track) {
      track.style.overflowX = 'auto';
      track.style.flexWrap = 'nowrap';
    }
  }

  /* ========== REVEAL ANIMATIONS ========== */
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    $$('.reveal').forEach(el => {
      el.classList.add('is-pending');
      observer.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => {
      el.classList.remove('is-pending');
      el.classList.add('is-visible');
    });
  }

  /* ========== NAVBAR SCROLL EFFECT ========== */
  const header = $('#site-header');
  const updateHeader = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  if (header) {
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ========== READING PROGRESS ========== */
  const progress = $('.reading-progress');
  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1, scrolled / total) : 0})`;
  };
  if (progress) {
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ========== COMMAND MENU ========== */
  const menuButton = $('.menu-button');
  const commandMenu = $('#command-menu');
  const commandInput = $('#command-input');

  if (menuButton && commandMenu) {
    const openCommand = () => {
      commandMenu.showModal();
      document.body.classList.add('dialog-open');
      menuButton.setAttribute('aria-expanded', 'true');
      if (commandInput) setTimeout(() => commandInput.focus(), 50);
    };
    const closeCommand = () => {
      commandMenu.close();
      document.body.classList.remove('dialog-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.focus();
    };
    menuButton.addEventListener('click', openCommand);
    const closeBtn = $('[data-close]', commandMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeCommand);
    commandMenu.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
    // Close on backdrop click
    commandMenu.addEventListener('click', (e) => {
      if (e.target === commandMenu) closeCommand();
    });
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const isEditing = e.target.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !isEditing) {
        e.preventDefault();
        if (commandMenu.open) closeCommand();
        else openCommand();
      }
      if (e.key === 'Escape' && commandMenu.open) closeCommand();
    });
    // Simple search filter (optional)
    if (commandInput) {
      commandInput.addEventListener('input', () => {
        const query = commandInput.value.toLowerCase();
        $$('.command-nav a', commandMenu).forEach(link => {
          const text = link.textContent.toLowerCase();
          link.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
    }
  }

  /* ========== CUSTOM CURSOR ========== */
  // Only switch to the custom cursor — and only hide the native one via CSS —
  // once we've confirmed a fine pointer is actually driving it. This keeps a
  // visible cursor for anyone whose device doesn't match, or if this script
  // fails to run for any reason.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    if (dot && ring) {
      document.documentElement.classList.add('has-custom-cursor');

      let mouseX = 0, mouseY = 0;
      let ringX = 0, ringY = 0;
      let isActive = false;

      const onMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      };
      const animate = () => {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        if (isActive) {
          ring.classList.add('active');
        } else {
          ring.classList.remove('active');
        }
        requestAnimationFrame(animate);
      };
      document.addEventListener('mousemove', onMouseMove, { passive: true });
      requestAnimationFrame(animate);

      // Hover targets: project cards, links, buttons, etc.
      const hoverTargets = 'a, button, .project-card, .project-art, .globe-container';
      document.addEventListener('mouseover', (e) => {
        isActive = !!e.target.closest(hoverTargets);
      });
      document.addEventListener('mouseout', (e) => {
        if (!e.target.closest(hoverTargets)) {
          isActive = false;
        }
      });

      // If the pointer leaves the window entirely, dismiss the cursor
      // elements instead of leaving them frozen mid-screen.
      document.addEventListener('mouseleave', () => {
        ring.classList.remove('active');
      });
    }
  }

  /* ========== GLOBE (Canvas) ========== */
  const initGlobe = (containerId, canvasId) => {
    const container = document.getElementById(containerId);
    const canvas = document.getElementById(canvasId);
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
    const dots = [];
    const count = 300;
    for (let i = 0; i < count; i++) {
      const lat = Math.random() * Math.PI - Math.PI / 2;
      const lng = Math.random() * Math.PI * 2;
      dots.push({ lat, lng });
    }
    let rotation = 0;
    let autoRotate = true;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.4;
      // Draw globe background
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#faf5f7';
      ctx.fill();
      ctx.strokeStyle = '#e0cdd5';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Draw dots
      dots.forEach(dot => {
        const x = Math.cos(dot.lat) * Math.sin(dot.lng + rotation);
        const y = Math.sin(dot.lat);
        const z = Math.cos(dot.lat) * Math.cos(dot.lng + rotation);
        if (z > 0) {
          const px = cx + x * radius;
          const py = cy - y * radius;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#b63365';
          ctx.globalAlpha = 0.6;
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    };

    const update = () => {
      if (autoRotate && !dragging) {
        rotation += 0.002;
      }
      if (dragging) {
        rotation += velocity;
        velocity *= 0.95;
      }
      draw();
      requestAnimationFrame(update);
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }, 150);
    });

    container.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      autoRotate = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        velocity = dx * 0.005;
        rotation += velocity;
        lastX = e.clientX;
      }
    });
    window.addEventListener('pointerup', () => {
      dragging = false;
      setTimeout(() => { autoRotate = true; }, 1000);
    });
    update();
  };

  // Initialize globes on pages that have them
  initGlobe('globe-container-home', 'globe-canvas-home');
  initGlobe('globe-container-about', 'globe-canvas-about');

  /* ========== CLOCK ========== */
  const initClock = (clockId, timeId) => {
    const clock = document.getElementById(clockId);
    const timeElement = document.getElementById(timeId);
    if (!clock || !timeElement) return;
    const hourHand = $('.clock-hour', clock);
    const minuteHand = $('.clock-minute', clock);
    const secondHand = $('.clock-second', clock);
    const update = () => {
      const now = new Date();
      const indiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = indiaTime.getHours();
      const minutes = indiaTime.getMinutes();
      const seconds = indiaTime.getSeconds();
      hourHand.style.transform = `rotate(${(hours % 12) * 30 + minutes / 2}deg)`;
      minuteHand.style.transform = `rotate(${minutes * 6 + seconds / 10}deg)`;
      secondHand.style.transform = `rotate(${seconds * 6}deg)`;
      timeElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} IST`;
    };
    update();
    setInterval(() => { if (!document.hidden && !reducedMotion.matches) update(); }, 1000);
  };

  initClock('analog-clock', 'india-time');
  initClock('analog-clock-about', 'india-time-about');

  /* ========== YEAR ========== */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ========== MOUSE PARALLAX (hero glow) ========== */
  if (!reducedMotion.matches && window.matchMedia('(hover: hover)').matches) {
    const glow = $('.hero-glow');
    if (glow) {
      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }, { passive: true });
    }
  }
})();
