/* =========================================================
   Accurate rotating world globe (v2)
   - Real geographic coastline polygons → rasterised once into
     an equirectangular land mask (offscreen canvas, 720x360).
   - Land check uses the dot's FIXED geographic lon/lat, so as
     the globe spins, new continents rotate into view.
   - Dots bolder, rotation speed increased slightly.
   - Pauses when offscreen / tab hidden.
   - devicePixelRatio capped at 2.
   ========================================================= */
(function () {
  'use strict';

  if (window.__skGlobeInit) return;
  window.__skGlobeInit = true;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Simplified coastline polygons (lon, lat). */
  var LAND = [
    /* North America */
    [[-168,66],[-166,60],[-158,57],[-152,59],[-140,60],[-133,55],[-128,51],[-125,49],
     [-124,42],[-121,36],[-117,32],[-114,29],[-110,24],[-106,22],[-97,16],[-91,15],
     [-87,13],[-83,9],[-79,9],[-82,15],[-87,21],[-91,19],[-94,18],[-97,22],[-97,26],
     [-93,29],[-88,30],[-83,29],[-80,25],[-81,31],[-76,35],[-74,40],[-70,42],[-66,45],
     [-60,47],[-56,51],[-64,58],[-78,62],[-95,68],[-105,69],[-125,70],[-140,70],[-156,71]],
    /* Greenland */
    [[-45,60],[-42,65],[-30,68],[-22,70],[-18,76],[-20,82],[-35,83],[-55,82],[-62,78],
     [-58,70],[-52,65]],
    /* South America */
    [[-81,8],[-77,8],[-72,11],[-62,11],[-52,5],[-50,0],[-44,-2],[-35,-5],[-38,-13],
     [-39,-18],[-48,-25],[-53,-33],[-58,-38],[-62,-40],[-65,-45],[-68,-52],[-70,-55],
     [-74,-52],[-73,-45],[-73,-37],[-71,-30],[-70,-23],[-71,-18],[-76,-14],[-79,-8],
     [-81,-5],[-80,0],[-78,2]],
    /* Africa */
    [[-6,36],[-9,31],[-13,27],[-17,21],[-17,15],[-13,9],[-8,5],[-3,5],[3,6],[9,4],
     [9,-1],[12,-6],[13,-13],[15,-22],[18,-33],[25,-34],[32,-28],[35,-24],[40,-16],
     [40,-10],[42,-2],[51,12],[43,12],[39,15],[35,24],[32,31],[25,32],[20,32],[10,34],
     [3,37]],
    /* Eurasia */
    [[-6,36],[0,38],[3,42],[8,44],[12,44],[15,38],[18,40],[16,41],[19,40],[23,38],
     [27,37],[35,36],[36,36],[36,31],[34,31],[34,28],[38,22],[43,13],[52,15],[58,22],
     [57,25],[48,30],[55,25],[65,25],[70,22],[73,15],[77,8],[80,16],[88,21],[90,22],
     [94,16],[98,8],[100,5],[103,1],[105,10],[108,15],[110,21],[120,25],[122,32],
     [126,35],[128,38],[130,42],[135,44],[140,45],[143,48],[155,50],[160,55],[163,58],
     [170,60],[180,60],[180,66],[170,68],[160,70],[150,72],[140,73],[130,73],[120,74],
     [110,76],[100,77],[90,76],[80,74],[70,73],[60,70],[50,69],[40,68],[30,70],
     [22,70],[15,68],[10,64],[5,62],[5,58],[8,54],[4,52],[-2,48],[-9,43],[-10,36]],
    /* Britain + Ireland */
    [[-6,50],[-1,50],[0,53],[-1,55],[-3,58],[-5,58],[-6,55],[-5,53],[-6,50]],
    [[-10,52],[-6,52],[-6,55],[-10,54]],
    /* Iceland */
    [[-24,64],[-14,64],[-14,67],[-24,67]],
    /* Japan */
    [[130,32],[136,34],[140,36],[142,40],[145,43],[142,45],[140,42],[138,37],[135,34],[131,31]],
    /* Australia */
    [[113,-22],[114,-27],[115,-34],[118,-35],[123,-34],[129,-32],[135,-35],[138,-35],
     [141,-38],[146,-39],[150,-37],[153,-32],[153,-27],[146,-19],[142,-11],[136,-12],
     [131,-12],[126,-14],[122,-17],[114,-21]],
    /* Tasmania */
    [[145,-41],[148,-41],[148,-43],[145,-43]],
    /* New Zealand */
    [[172,-34],[175,-37],[178,-38],[177,-41],[174,-41],[171,-44],[167,-46],[166,-45],
     [170,-42],[172,-38]],
    /* Madagascar */
    [[44,-12],[50,-15],[50,-25],[45,-25],[43,-20],[43,-14]],
    /* Antarctica */
    [[-180,-68],[180,-68],[180,-90],[-180,-90]]
  ];

  /* ---- Build the land mask once ---- */
  var MASK = null, MASK_W = 720, MASK_H = 360;
  function buildMask() {
    var c = document.createElement('canvas');
    c.width = MASK_W; c.height = MASK_H;
    var g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath();
    for (var p = 0; p < LAND.length; p++) {
      var poly = LAND[p];
      for (var i = 0; i < poly.length; i++) {
        var lon = poly[i][0], lat = poly[i][1];
        var x = (lon + 180) / 360 * MASK_W;
        var y = (90 - lat) / 180 * MASK_H;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
    }
    g.fill('nonzero');
    var data = g.getImageData(0, 0, MASK_W, MASK_H).data;
    var m = new Uint8Array(MASK_W * MASK_H);
    for (var k = 0; k < MASK_W * MASK_H; k++) {
      m[k] = data[k * 4 + 3] > 128 ? 1 : 0;
    }
    MASK = m;
  }
  buildMask();

  /* lon in any range; internally wrapped to -180..180 */
  function isLand(lon, lat) {
    var u = (lon + 180) / 360;
    u = u - Math.floor(u);                 /* wrap to 0..1 */
    var v = (90 - lat) / 180;
    var x = (u * MASK_W) | 0;
    var y = (v * MASK_H) | 0;
    if (x < 0) x = 0; else if (x >= MASK_W) x = MASK_W - 1;
    if (y < 0) y = 0; else if (y >= MASK_H) y = MASK_H - 1;
    return MASK[y * MASK_W + x] === 1;
  }

  /* ---- Per-globe instance ---- */
  function createGlobe(canvas) {
    var container = canvas.parentElement;
    if (!container) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var cssW = 0, cssH = 0, dpr = 1;
    var radius = 0, cx = 0, cy = 0;

    /* Precompute dot grid with FIXED geographic lon/lat. */
    var DOT_LAT_STEPS = 44;
    var dots = []; /* {latRad, lonRad, cosLat, sinLat, lonDeg, latDeg, landFlag} */
    (function buildDots() {
      for (var i = 0; i <= DOT_LAT_STEPS; i++) {
        var latRad = (i / DOT_LAT_STEPS) * Math.PI - Math.PI / 2;
        var cosLat = Math.cos(latRad);
        var sinLat = Math.sin(latRad);
        if (cosLat < 0.08) continue;
        var count = Math.max(6, Math.round(DOT_LAT_STEPS * cosLat * 1.5));
        for (var j = 0; j < count; j++) {
          var lonRad = (j / count) * Math.PI * 2;
          var latDeg = latRad * 180 / Math.PI;
          /* normalize lon to -180..180 for the mask */
          var lonDeg = (lonRad * 180 / Math.PI);
          if (lonDeg > 180) lonDeg -= 360;
          dots.push({
            latRad: latRad,
            lonRad: lonRad,
            cosLat: cosLat,
            sinLat: sinLat,
            latDeg: latDeg,
            lonDeg: lonDeg,
            /* precompute land flag ONCE — never changes */
            landFlag: isLand(lonDeg, latDeg)
          });
        }
      }
    })();

    /* Start with India/Asia facing us. Front-center geographic
       longitude = -rotation (in radians), so rotation=-1.2 rad
       ≈ 68.7°E → India, Middle East, Central Asia visible. */
    var rotation = -1.2;
    var tilt = 0.28;
    var autoRotate = !reduced;
    var isDragging = false;
    var lastX = 0, lastY = 0;
    var velocity = 0;
    var resumeAt = 0;

    var colors = { land: '17,24,39', ocean: '156,163,175' };
    function refreshColors() {
      var cs = getComputedStyle(document.documentElement);
      colors.land  = (cs.getPropertyValue('--globe-land')  || '17,24,39').trim();
      colors.ocean = (cs.getPropertyValue('--globe-ocean') || '156,163,175').trim();
    }
    refreshColors();
    var themeObs = new MutationObserver(refreshColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function resize() {
      var rect = container.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width  = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = cssW / 2;
      cy = cssH / 2;
      radius = Math.min(cssW, cssH) * 0.42;
    }
    resize();

    var ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    else window.addEventListener('resize', resize, { passive: true });

    var visible = true;
    var io = ('IntersectionObserver' in window)
      ? new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { rootMargin: '80px' })
      : null;
    if (io) io.observe(container);

    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);

      /* subtle outer ring */
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(127,127,137,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      var rot = rotation;
      var sinT = Math.sin(tilt), cosT = Math.cos(tilt);

      /* ⬆️ Bolder dots */
      var dotSize = Math.max(1.7, radius / 58);
      var oceanSize = dotSize * 0.85;

      /* two batched paths → 2 fills per frame */
      var landPath = [], oceanPath = [];
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var lon = d.lonRad + rot;
        var sinLon = Math.sin(lon), cosLon = Math.cos(lon);
        /* rotate around Y then tilt around X */
        var x1 = d.cosLat * sinLon;
        var z1 = d.cosLat * cosLon;
        var y1 = d.sinLat;
        var y2 = y1 * cosT - z1 * sinT;
        var z2 = y1 * sinT + z1 * cosT;
        if (z2 < -0.05) continue;   /* hide back hemisphere */

        var sx = cx + x1 * radius;
        var sy = cy - y2 * radius;

        /* ⬇️ FIX: land mask uses FIXED geographic coords,
           not the rotated screen position. */
        if (d.landFlag) landPath.push(sx, sy);
        else oceanPath.push(sx, sy);
      }

      /* ocean dots */
      ctx.fillStyle = 'rgba(' + colors.ocean + ',0.30)';
      ctx.beginPath();
      for (var oi = 0; oi < oceanPath.length; oi += 2) {
        ctx.rect(oceanPath[oi] - oceanSize * 0.5, oceanPath[oi + 1] - oceanSize * 0.5, oceanSize, oceanSize);
      }
      ctx.fill();

      /* land dots */
      ctx.fillStyle = 'rgba(' + colors.land + ',0.95)';
      ctx.beginPath();
      for (var li = 0; li < landPath.length; li += 2) {
        ctx.rect(landPath[li] - dotSize * 0.5, landPath[li + 1] - dotSize * 0.5, dotSize, dotSize);
      }
      ctx.fill();
    }

    var rafId = 0;
    var lastTime = 0;
    function tick(t) {
      rafId = 0;
      if (document.hidden || !visible) return;

      var dt = lastTime ? Math.min(48, t - lastTime) : 16;
      lastTime = t;

      if (!isDragging) {
        rotation += velocity * (dt / 16);
        velocity *= Math.pow(0.94, dt / 16);
        if (Math.abs(velocity) < 0.00005) velocity = 0;
        if (autoRotate && performance.now() > resumeAt) {
          /* ⬆️ Faster idle rotation (was 0.00035) */
          rotation += 0.00062 * (dt / 16);
        }
      }

      draw();
      rafId = requestAnimationFrame(tick);
    }

    function wake() {
      if (!rafId && !document.hidden && visible) {
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      }
    }
    function sleep() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    if (io) {
      var io2 = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) wake();
        else sleep();
      }, { rootMargin: '80px' });
      io2.observe(container);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) sleep(); else wake();
    });

    /* --- Drag interaction --- */
    function pointerX(e) { return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX; }
    function pointerY(e) { return e.touches && e.touches.length ? e.touches[0].clientY : e.clientY; }

    function onDown(e) {
      isDragging = true;
      lastX = pointerX(e); lastY = pointerY(e);
      velocity = 0;
      container.style.cursor = 'grabbing';
      if (e.cancelable) e.preventDefault();
    }
    function onMove(e) {
      if (!isDragging) return;
      var x = pointerX(e), y = pointerY(e);
      var dx = x - lastX, dy = y - lastY;
      rotation += dx * 0.008;
      tilt -= dy * 0.006;
      tilt = Math.max(-1.1, Math.min(1.1, tilt));
      velocity = dx * 0.008;
      lastX = x; lastY = y;
      if (e.cancelable) e.preventDefault();
    }
    function onUp() {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';
      resumeAt = performance.now() + 2400;
    }

    container.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    wake();
  }

  function init() {
    var canvases = document.querySelectorAll('canvas[data-globe]');
    for (var i = 0; i < canvases.length; i++) createGlobe(canvases[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();