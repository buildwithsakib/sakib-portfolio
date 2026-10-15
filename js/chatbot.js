/**
 * AI Portfolio Chatbot — frontend widget (v3)
 *
 * Changes vs v2:
 *  - Suggested questions live in a persistent container and are
 *    re-rendered after every response (success or error).
 *  - Only the send button is disabled while a request is in flight;
 *    the input stays usable so users can start typing the next question.
 *  - A single `renderSuggestions()` helper guarantees no duplicate
 *    buttons or multiple containers.
 *  - Server errors surface with a specific, actionable message.
 */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  var API_ENDPOINT = '/api/chat';
  var MAX_HISTORY_TURNS = 4;                 /* user+model pairs kept in memory */
  var MAX_HISTORY_MESSAGES = MAX_HISTORY_TURNS * 2;
  var TYPING_DELAY_MS = 250;                 /* minimum visible typing time */
  var FOLLOW_UP_COUNT = 3;                   /* how many follow-up chips to show */

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
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
    '</svg>';

  var ICON_CLOSE =
    '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' +
    '</svg>';

  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>' +
    '</svg>';

  /* ---------- State ---------- */
  var state = {
    isOpen: false,
    isSending: false,
    history: [],          /* committed turns only: [{role:'user'|'model', text}] */
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

  /* ---------- History normalization (client side) ---------- */
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
      if (prev && prev.role === curr.role) {
        prev.text += '\n\n' + curr.text;
      } else {
        merged.push({ role: curr.role, text: curr.text });
      }
    }

    if (merged.length > MAX_HISTORY_MESSAGES) {
      merged = merged.slice(-MAX_HISTORY_MESSAGES);
      while (merged.length > 0 && merged[0].role !== 'user') merged.shift();
    }

    return merged;
  }

  /* ---------- Suggestion helpers ---------- */

  /* Renders the given questions into the persistent container, replacing
     whatever was there before. Never creates a second container. */
  function renderSuggestions(questions) {
    if (!els.suggestions) return;

    while (els.suggestions.firstChild) {
      els.suggestions.removeChild(els.suggestions.firstChild);
    }

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
    while (els.suggestions.firstChild) {
      els.suggestions.removeChild(els.suggestions.firstChild);
    }
  }

  /* ---------- DOM construction ---------- */
  function buildUI() {
    /* Launcher button */
    els.launcher = createEl('button', 'chat-launcher', {
      type: 'button',
      'aria-label': 'Open chat assistant',
      'aria-expanded': 'false',
      'aria-controls': 'chat-window'
    });
    els.launcher.innerHTML = ICON_CHAT + ICON_CLOSE;
    document.body.appendChild(els.launcher);

    /* Chat window */
    els.window = createEl('div', 'chat-window', {
      id: 'chat-window',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-label': 'Portfolio chat assistant'
    });

    /* Header */
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

    /* Messages */
    els.messages = createEl('div', 'chat-messages', {
      role: 'log',
      'aria-live': 'polite',
      'aria-label': 'Chat messages'
    });

    /* Suggestions (persistent container — content is filled in later) */
    els.suggestions = createEl('div', 'chat-suggestions', {
      'aria-label': 'Suggested questions'
    });

    /* Input row */
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

    /* Events */
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
      if (e.key === 'Escape' && state.isOpen) {
        e.preventDefault();
        close();
      }
    });

    document.addEventListener('mousedown', function (e) {
      if (!state.isOpen) return;
      if (els.window.contains(e.target) || els.launcher.contains(e.target)) return;
      close();
    });

    /* Initial suggestions */
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
      addBotMessage(
        "Hi! I'm Sakib's portfolio assistant. Ask me anything about his projects, skills, education, or how to get in touch."
      );
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
      try { state.returnFocus.focus({ preventScroll: true }); }
      catch (e) { state.returnFocus.focus(); }
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

  function addBotMessage(text) {
    var msg = createEl('div', 'chat-msg chat-msg--bot');
    var bubble = createEl('div', 'chat-bubble');
    bubble.textContent = text;
    msg.appendChild(bubble);
    els.messages.appendChild(msg);
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

  /* ---------- Error message mapping ---------- */
  function mapErrorToMessage(err) {
    var code = (err && err.code) || '';
    var msg  = (err && err.message) || '';

    switch (code) {
      case 'rate_limited':
        return "You're sending messages too quickly. Please wait a few seconds and try again.";
      case 'timeout':
        return "The request took too long. Please try again.";
      case 'no_api_key':
      case 'auth_error':
      case 'internal_error':
        return "The assistant isn't available right now. Please try again in a moment.";
      case 'bad_request':
      case 'invalid_json':
        return "I couldn't process that. Try rephrasing your question.";
      case 'model_not_found':
      case 'upstream_error':
      case 'upstream_unavailable':
        return "The assistant is temporarily unavailable. Please try again in a moment.";
      case 'missing_message':
        return "Please type a question first.";
      case 'empty_reply':
        return "I couldn't generate a response. Please try rephrasing your question.";
    }

    if (/429|too many requests/i.test(msg)) return "You're sending messages too quickly. Please wait a few seconds and try again.";
    if (/timed? ?out|504/i.test(msg))       return "The request took too long. Please try again.";
    if (/failed to fetch|networkerror|network/i.test(msg))
      return "Network issue. Please check your connection and try again.";
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

    /* History sent to the server = previously COMMITTED turns only. */
    var outgoingHistory = normalizeHistory(state.history);

    /* Clear suggestions while the request is in flight. */
    hideSuggestions();

    state.isSending = true;
    els.send.disabled = true;                /* only the send button is disabled */
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

        /* Commit the successful turn only. */
        state.history.push({ role: 'user', text: text });
        state.history.push({ role: 'model', text: reply });
        state.history = normalizeHistory(state.history);

        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, TYPING_DELAY_MS - elapsed);

        setTimeout(function () {
          hideTyping();
          state.isSending = false;
          els.send.disabled = false;

          addBotMessage(reply);
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

  /* ---------- Init ---------- */
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
