/**
 * AI Portfolio Chatbot — frontend widget (v4)
 *
 * Adds:
 *   - Safe DOM-based mini-Markdown renderer (no innerHTML for model output)
 *   - Contact card renderer (brand SVG icons)
 *   - Resume card renderer (download CTA + navigation steps)
 *
 * Preserves: suggestions, history, error handling, only-send-button-disabled,
 * textContent-only rendering for user/AI text.
 */
(function () {
  'use strict';

  var API_ENDPOINT = '/api/chat';
  var MAX_HISTORY_TURNS = 4;
  var MAX_HISTORY_MESSAGES = MAX_HISTORY_TURNS * 2;
  var TYPING_DELAY_MS = 250;
  var FOLLOW_UP_COUNT = 3;

  var INITIAL_SUGGESTIONS = [
    'Who is Sakib Shaikh?',
    'Show me your projects',
    'What are your skills?',
    'Tell me about your education',
    'How can I contact you?'
  ];

  var FOLLOW_UP_POOL = [
    'Tell me about SmartPresence',
    'What is DineX?',
    'Explain TenderIQ Pro',
    'What is VisionPuzzle?',
    'Tell me about FinVault',
    'Tell me about KGN Enterprises',
    'Where can I find his resume?',
    'What technologies does he use?',
    'Is he available for hire?',
    'How can I reach him?',
    'What is his educational background?',
    'What are his strengths as a developer?'
  ];

  /* ---------- Icons ---------- */
  var ICON_CHAT =
    '<svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var ICON_CLOSE =
    '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';

  var CONTACT_ICONS = {
    email:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    github:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    portfolio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    download:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
  };

  /* ---------- State ---------- */
  var state = {
    isOpen: false,
    isSending: false,
    history: [],
    hasWelcomed: false,
    returnFocus: null
  };

  var els = {};
  var typingEl = null;

  /* ---------- DOM helpers ---------- */
  function createEl(tag, className, attrs) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'text') el.textContent = attrs[key];
        else if (key === 'html') el.innerHTML = attrs[key];
        else el.setAttribute(key, attrs[key]);
      });
    }
    return el;
  }

  function scrollToBottom() {
    if (!els.messages) return;
    requestAnimationFrame(function () {
      els.messages.scrollTop = els.messages.scrollHeight;
    });
  }

  /* =========================================================
     SAFE MINI-MARKDOWN RENDERER
     Builds a DOM tree. Never uses innerHTML for model output.
     ========================================================= */

  function sanitizeUrl(raw) {
    var url = String(raw || '').trim();
    if (/^(javascript|data|vbscript):/i.test(url)) return '#';
    return url;
  }

  function friendlyUrlLabel(url) {
    var s = String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return s.length > 42 ? s.slice(0, 40) + '…' : s;
  }

  /* Handles inline formatting inside a line: `code`, **bold**, __bold__,
     *italic*, _italic_, [label](url), and raw https://... URLs. */
  function appendInline(parent, text) {
    var re = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\([^)\n]+\))|(https?:\/\/[^\s<>"')]+)/g;
    var lastIndex = 0;
    var match;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      var token = match[0];

      if (token.charAt(0) === '`') {
        var code = document.createElement('code');
        code.className = 'chat-md-inline-code';
        code.textContent = token.slice(1, -1);
        parent.appendChild(code);
      } else if (token.indexOf('**') === 0 || token.indexOf('__') === 0) {
        var strong = document.createElement('strong');
        strong.textContent = token.slice(2, -2);
        parent.appendChild(strong);
      } else if (token.charAt(0) === '*' || token.charAt(0) === '_') {
        var em = document.createElement('em');
        em.textContent = token.slice(1, -1);
        parent.appendChild(em);
      } else if (token.charAt(0) === '[') {
        var lm = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (lm) {
          var a = document.createElement('a');
          a.className = 'chat-md-link';
          a.href = sanitizeUrl(lm[2]);
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = lm[1];
          parent.appendChild(a);
        }
      } else if (/^https?:\/\//.test(token)) {
        var a2 = document.createElement('a');
        a2.className = 'chat-md-link';
        a2.href = sanitizeUrl(token);
        a2.target = '_blank';
        a2.rel = 'noopener noreferrer';
        a2.textContent = friendlyUrlLabel(token);
        parent.appendChild(a2);
      }

      lastIndex = re.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function renderMarkdown(markdown) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-md';

    var lines = String(markdown || '').split(/\r?\n/);
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      /* Code block */
      if (/^```/.test(line.trim())) {
        var lang = line.trim().slice(3).trim();
        i++;
        var codeLines = [];
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; /* skip closing fence */
        var pre = document.createElement('pre');
        pre.className = 'chat-md-code-block';
        var codeEl = document.createElement('code');
        if (lang) codeEl.setAttribute('data-lang', lang);
        codeEl.textContent = codeLines.join('\n');
        pre.appendChild(codeEl);
        wrap.appendChild(pre);
        continue;
      }

      /* Heading */
      var hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        var level = Math.min(hm[1].length + 2, 6); /* h3..h6 to keep hierarchy */
        var h = document.createElement('h' + level);
        h.className = 'chat-md-heading';
        appendInline(h, hm[2]);
        wrap.appendChild(h);
        i++;
        continue;
      }

      /* Bullet list */
      if (/^\s*[-*+]\s+/.test(line)) {
        var ul = document.createElement('ul');
        ul.className = 'chat-md-list';
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          var li = document.createElement('li');
          appendInline(li, lines[i].replace(/^\s*[-*+]\s+/, ''));
          ul.appendChild(li);
          i++;
        }
        wrap.appendChild(ul);
        continue;
      }

      /* Numbered list */
      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = document.createElement('ol');
        ol.className = 'chat-md-list';
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          var li2 = document.createElement('li');
          appendInline(li2, lines[i].replace(/^\s*\d+\.\s+/, ''));
          ol.appendChild(li2);
          i++;
        }
        wrap.appendChild(ol);
        continue;
      }

      /* Paragraph */
      var paraLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,6})\s/.test(lines[i]) &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^```/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      var p = document.createElement('p');
      p.className = 'chat-md-paragraph';
      appendInline(p, paraLines.join(' '));
      wrap.appendChild(p);
    }

    return wrap;
  }

  /* =========================================================
     CONTACT CARD
     ========================================================= */

  function renderContactCard(contacts) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-contact-card';

    var header = document.createElement('div');
    header.className = 'chat-contact-card-header';
    header.textContent = 'Get in touch';
    wrap.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'chat-contact-card-grid';

    contacts.forEach(function (c) {
      var a = document.createElement('a');
      a.className = 'chat-contact-item';
      a.href = sanitizeUrl(c.href);
      a.setAttribute('aria-label', c.label + ': ' + c.value);
      if (c.type !== 'email') {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      var icon = document.createElement('span');
      icon.className = 'chat-contact-icon';
      icon.innerHTML = CONTACT_ICONS[c.type] || CONTACT_ICONS.portfolio;

      var meta = document.createElement('span');
      meta.className = 'chat-contact-meta';

      var lbl = document.createElement('span');
      lbl.className = 'chat-contact-label';
      lbl.textContent = c.label;

      var val = document.createElement('span');
      val.className = 'chat-contact-value';
      val.textContent = c.value;

      meta.appendChild(lbl);
      meta.appendChild(val);

      a.appendChild(icon);
      a.appendChild(meta);
      grid.appendChild(a);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  /* =========================================================
     RESUME CARD
     ========================================================= */

  function renderResumeCard(resume) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-resume-card';

    var header = document.createElement('div');
    header.className = 'chat-resume-card-header';
    header.textContent = 'Resume';
    wrap.appendChild(header);

    if (Array.isArray(resume.steps) && resume.steps.length) {
      var ol = document.createElement('ol');
      ol.className = 'chat-resume-steps';
      resume.steps.forEach(function (s) {
        var li = document.createElement('li');
        li.textContent = s;
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
    }

    var cta = document.createElement('a');
    cta.className = 'chat-resume-cta';
    cta.href = sanitizeUrl(resume.href);
    cta.setAttribute('download', '');
    cta.rel = 'noopener noreferrer';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'chat-resume-cta-icon';
    iconSpan.innerHTML = CONTACT_ICONS.download;

    var labelSpan = document.createElement('span');
    labelSpan.textContent = resume.label || 'Download Resume';

    cta.appendChild(iconSpan);
    cta.appendChild(labelSpan);
    wrap.appendChild(cta);

    return wrap;
  }

  /* ---------- History normalization ---------- */
  function normalizeHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return [];
    var valid = [];
    for (var i = 0; i < history.length; i++) {
      var t = history[i];
      if (!t || typeof t !== 'object') continue;
      if (t.role !== 'user' && t.role !== 'model') continue;
      var text = typeof t.text === 'string' ? t.text.trim() : '';
      if (!text) continue;
      valid.push({ role: t.role, text: text });
    }
    while (valid.length > 0 && valid[0].role !== 'user') valid.shift();
    var merged = [];
    for (var j = 0; j < valid.length; j++) {
      var curr = valid[j];
      var prev = merged[merged.length - 1];
      if (prev && prev.role === curr.role) prev.text += '\n\n' + curr.text;
      else merged.push({ role: curr.role, text: curr.text });
    }
    if (merged.length > MAX_HISTORY_MESSAGES) {
      merged = merged.slice(-MAX_HISTORY_MESSAGES);
      while (merged.length > 0 && merged[0].role !== 'user') merged.shift();
    }
    return merged;
  }

  /* ---------- Suggestions ---------- */
  function renderSuggestions(questions) {
    if (!els.suggestions) return;
    while (els.suggestions.firstChild) els.suggestions.removeChild(els.suggestions.firstChild);
    if (!Array.isArray(questions) || questions.length === 0) return;
    questions.forEach(function (q) {
      var btn = createEl('button', 'chat-suggestion', { type: 'button', text: q });
      btn.addEventListener('click', function () { sendMessage(q); });
      els.suggestions.appendChild(btn);
    });
  }

  function pickFollowUps() {
    var pool = FOLLOW_UP_POOL.slice();
    var picked = [];
    while (picked.length < FOLLOW_UP_COUNT && pool.length > 0) {
      var idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  }

  function hideSuggestions() {
    if (!els.suggestions) return;
    while (els.suggestions.firstChild) els.suggestions.removeChild(els.suggestions.firstChild);
  }

  /* ---------- Build UI ---------- */
  function buildUI() {
    els.launcher = createEl('button', 'chat-launcher', {
      type: 'button',
      'aria-label': 'Open chat assistant',
      'aria-expanded': 'false',
      'aria-controls': 'chat-window'
    });
    els.launcher.innerHTML = ICON_CHAT + ICON_CLOSE;
    document.body.appendChild(els.launcher);

    els.window = createEl('div', 'chat-window', {
      id: 'chat-window',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-label': 'Portfolio chat assistant'
    });

    var header = createEl('div', 'chat-header');
    var avatar = createEl('div', 'chat-header-avatar', { text: 'S', 'aria-hidden': 'true' });
    var meta = createEl('div', 'chat-header-meta');
    meta.appendChild(createEl('h3', null, { text: "Sakib's Assistant" }));
    var statusP = createEl('p');
    statusP.appendChild(createEl('span', 'chat-status-dot', { 'aria-hidden': 'true' }));
    statusP.appendChild(document.createTextNode(' Online'));
    meta.appendChild(statusP);

    var closeBtn = createEl('button', 'chat-close', {
      type: 'button',
      'aria-label': 'Close chat'
    });
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    header.appendChild(avatar);
    header.appendChild(meta);
    header.appendChild(closeBtn);

    els.messages = createEl('div', 'chat-messages', {
      role: 'log',
      'aria-live': 'polite',
      'aria-label': 'Chat messages'
    });

    els.suggestions = createEl('div', 'chat-suggestions', { 'aria-label': 'Suggested questions' });

    var inputRow = createEl('div', 'chat-input-row');
    els.input = createEl('textarea', 'chat-input', {
      placeholder: 'Ask about Sakib...',
      rows: '1',
      'aria-label': 'Type your message',
      maxlength: '600'
    });

    els.send = createEl('button', 'chat-send', {
      type: 'button',
      'aria-label': 'Send message'
    });
    els.send.innerHTML = ICON_SEND;

    inputRow.appendChild(els.input);
    inputRow.appendChild(els.send);

    els.window.appendChild(header);
    els.window.appendChild(els.messages);
    els.window.appendChild(els.suggestions);
    els.window.appendChild(inputRow);
    document.body.appendChild(els.window);

    els.launcher.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);
    els.send.addEventListener('click', function () { sendMessage(); });

    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    els.input.addEventListener('input', function () {
      els.input.style.height = 'auto';
      els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.isOpen) { e.preventDefault(); close(); }
    });

    document.addEventListener('mousedown', function (e) {
      if (!state.isOpen) return;
      if (els.window.contains(e.target) || els.launcher.contains(e.target)) return;
      close();
    });

    renderSuggestions(INITIAL_SUGGESTIONS);
  }

  /* ---------- Open / close ---------- */
  function open() {
    if (state.isOpen) return;
    state.isOpen = true;
    state.returnFocus = document.activeElement;

    els.window.classList.add('is-open');
    els.launcher.classList.add('is-open');
    els.launcher.setAttribute('aria-expanded', 'true');
    els.launcher.setAttribute('aria-label', 'Close chat assistant');
    els.launcher.classList.remove('has-unread');

    if (!state.hasWelcomed) {
      state.hasWelcomed = true;
      addBotMessage("Hi! I'm Sakib's portfolio assistant. Ask me anything about his projects, skills, education, or how to get in touch.");
    }
    setTimeout(function () { if (els.input) els.input.focus(); }, 120);
    scrollToBottom();
  }

  function close() {
    if (!state.isOpen) return;
    state.isOpen = false;
    els.window.classList.remove('is-open');
    els.launcher.classList.remove('is-open');
    els.launcher.setAttribute('aria-expanded', 'false');
    els.launcher.setAttribute('aria-label', 'Open chat assistant');
    if (state.returnFocus && state.returnFocus.focus) {
      try { state.returnFocus.focus({ preventScroll: true }); } catch (e) { state.returnFocus.focus(); }
    }
  }

  function toggle() { state.isOpen ? close() : open(); }

  /* ---------- Message rendering ---------- */
  function addUserMessage(text) {
    var msg = createEl('div', 'chat-msg chat-msg--user');
    var bubble = createEl('div', 'chat-bubble');
    bubble.textContent = text;
    msg.appendChild(bubble);
    els.messages.appendChild(msg);
    scrollToBottom();
  }

  function addBotMessage(text, meta) {
    var msg = createEl('div', 'chat-msg chat-msg--bot');
    var bubble = createEl('div', 'chat-bubble');
    bubble.appendChild(renderMarkdown(text));
    msg.appendChild(bubble);
    els.messages.appendChild(msg);

    if (meta && Array.isArray(meta.contacts) && meta.contacts.length > 0) {
      var cMsg = createEl('div', 'chat-msg chat-msg--bot chat-msg--wide');
      cMsg.appendChild(renderContactCard(meta.contacts));
      els.messages.appendChild(cMsg);
    }

    if (meta && meta.resume && meta.resume.href) {
      var rMsg = createEl('div', 'chat-msg chat-msg--bot chat-msg--wide');
      rMsg.appendChild(renderResumeCard(meta.resume));
      els.messages.appendChild(rMsg);
    }

    scrollToBottom();
  }

  function addErrorMessage(text) {
    var el = createEl('div', 'chat-error', { role: 'alert' });
    el.textContent = text;
    els.messages.appendChild(el);
    scrollToBottom();
  }

  /* ---------- Typing indicator ---------- */
  function showTyping() {
    if (typingEl) return;
    typingEl = createEl('div', 'chat-typing', { 'aria-label': 'Assistant is typing' });
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    els.messages.appendChild(typingEl);
    scrollToBottom();
  }

  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  /* ---------- Error mapping ---------- */
  function mapErrorToMessage(err) {
    var code = (err && err.code) || '';
    var msg  = (err && err.message) || '';

    switch (code) {
      case 'rate_limited':         return "You're sending messages too quickly. Please wait a few seconds and try again.";
      case 'timeout':              return "The request took too long. Please try again.";
      case 'no_api_key':
      case 'auth_error':
      case 'internal_error':       return "The assistant isn't available right now. Please try again in a moment.";
      case 'bad_request':
      case 'invalid_json':         return "I couldn't process that. Try rephrasing your question.";
      case 'model_not_found':      return "The assistant is temporarily unavailable. Please try again in a moment.";
      case 'upstream_unavailable': return "The AI service is briefly overloaded. Please try again in a few seconds.";
      case 'upstream_error':       return "The assistant is temporarily unavailable. Please try again in a moment.";
      case 'missing_message':      return "Please type a question first.";
      case 'empty_reply':          return "I couldn't generate a response. Please try rephrasing your question.";
    }

    if (/429|too many requests/i.test(msg)) return "You're sending messages too quickly. Please wait a few seconds and try again.";
    if (/timed? ?out|504/i.test(msg))       return "The request took too long. Please try again.";
    if (/failed to fetch|networkerror|network/i.test(msg)) return "Network issue. Please check your connection and try again.";
    if (/405|method/i.test(msg))            return "The assistant is misconfigured. Please try again later.";
    return "Something went wrong. Please try again.";
  }

  /* ---------- Send flow ---------- */
  function sendMessage(overrideText) {
    if (state.isSending) return;

    var text = (overrideText || els.input.value || '').trim();
    if (!text) return;

    if (!overrideText) {
      els.input.value = '';
      els.input.style.height = 'auto';
    }

    addUserMessage(text);
    var outgoingHistory = normalizeHistory(state.history);
    hideSuggestions();

    state.isSending = true;
    els.send.disabled = true;
    showTyping();

    var startTime = Date.now();

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ message: text, history: outgoingHistory })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var e = new Error((data && data.error) || ('Request failed with status ' + res.status));
            e.code = (data && data.code) || ('http_' + res.status);
            e.status = res.status;
            throw e;
          }
          return data;
        });
      })
      .then(function (data) {
        var reply = (data && typeof data.reply === 'string') ? data.reply.trim() : '';
        if (!reply) {
          var e = new Error('empty_reply');
          e.code = 'empty_reply';
          throw e;
        }

        state.history.push({ role: 'user', text: text });
        state.history.push({ role: 'model', text: reply });
        state.history = normalizeHistory(state.history);

        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, TYPING_DELAY_MS - elapsed);

        setTimeout(function () {
          hideTyping();
          state.isSending = false;
          els.send.disabled = false;

          addBotMessage(reply, {
            contacts: Array.isArray(data.contacts) ? data.contacts : null,
            resume:   data.resume || null
          });
          renderSuggestions(pickFollowUps());

          if (!state.isOpen) els.launcher.classList.add('has-unread');
          els.input.focus();
        }, wait);
      })
      .catch(function (err) {
        if (window.console && console.warn) {
          console.warn('[chatbot] request failed:', err && err.code, err && err.message);
        }

        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, TYPING_DELAY_MS - elapsed);

        setTimeout(function () {
          hideTyping();
          state.isSending = false;
          els.send.disabled = false;

          addErrorMessage(mapErrorToMessage(err));
          renderSuggestions(pickFollowUps());

          els.input.focus();
        }, wait);
      });
  }

  function init() {
    if (document.getElementById('chat-window')) return;
    buildUI();
    window.PortfolioChat = { open: open, close: close, toggle: toggle };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
