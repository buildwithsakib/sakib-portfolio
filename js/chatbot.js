/**
 * AI Portfolio Chatbot — frontend widget
 *
 * Self-contained: injects its own DOM, manages state, calls /api/chat.
 * Safe rendering: uses textContent only (no innerHTML for user/AI content).
 * Accessible: focus trap, Escape to close, ARIA labels, keyboard support.
 */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  var API_ENDPOINT = '/api/chat';
  var MAX_HISTORY = 8;           /* conversation turns to send */
  var TYPING_DELAY_MS = 350;     /* minimum visible typing time */

  var SUGGESTED_QUESTIONS = [
    'Who is Sakib Shaikh?',
    'Show me your projects',
    'What are your skills?',
    'Tell me about your education',
    'How can I contact you?'
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
    history: [],        /* [{ role: 'user'|'model', text: string }] */
    hasWelcomed: false,
    returnFocus: null
  };

  var els = {};         /* cached DOM references */
  var typingTimeout = null;
  var typingEl = null;

  /* ---------- Helpers ---------- */

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

    /* Suggestions */
    els.suggestions = createEl('div', 'chat-suggestions', {
      'aria-label': 'Suggested questions'
    });
    SUGGESTED_QUESTIONS.forEach(function (q) {
      var btn = createEl('button', 'chat-suggestion', {
        type: 'button',
        text: q
      });
      btn.addEventListener('click', function () {
        sendMessage(q);
      });
      els.suggestions.appendChild(btn);
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

    /* Assemble */
    els.window.appendChild(header);
    els.window.appendChild(els.messages);
    els.window.appendChild(els.suggestions);
    els.window.appendChild(inputRow);
    document.body.appendChild(els.window);

    /* Cache close button */
    els.closeBtn = closeBtn;

    /* ---------- Events ---------- */
    els.launcher.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);
    els.send.addEventListener('click', function () { sendMessage(); });

    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    /* Auto-resize textarea */
    els.input.addEventListener('input', function () {
      els.input.style.height = 'auto';
      els.input.style.height = Math.min(els.input.scrollHeight, 120) + 'px';
    });

    /* Escape to close */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.isOpen) {
        e.preventDefault();
        close();
      }
    });

    /* Click outside to close (desktop only) */
    document.addEventListener('mousedown', function (e) {
      if (!state.isOpen) return;
      if (els.window.contains(e.target) || els.launcher.contains(e.target)) return;
      close();
    });
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

    setTimeout(function () {
      if (els.input) els.input.focus();
    }, 120);

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

  function toggle() {
    state.isOpen ? close() : open();
  }

  /* ---------- Message rendering ---------- */

  function addUserMessage(text) {
    var msg = createEl('div', 'chat-msg chat-msg--user');
    var bubble = createEl('div', 'chat-bubble');
    bubble.textContent = text;           /* safe: no HTML injection */
    msg.appendChild(bubble);
    els.messages.appendChild(msg);
    scrollToBottom();
  }

  function addBotMessage(text) {
    var msg = createEl('div', 'chat-msg chat-msg--bot');
    var bubble = createEl('div', 'chat-bubble');
    bubble.textContent = text;           /* safe: no HTML injection */
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
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
    typingEl = null;
  }

  /* ---------- Send flow ---------- */

  function sendMessage(overrideText) {
    if (state.isSending) return;

    var text = (overrideText || els.input.value || '').trim();
    if (!text) return;

    /* Clear input */
    if (!overrideText) {
      els.input.value = '';
      els.input.style.height = 'auto';
    }

    /* Hide suggestions after first user message */
    if (els.suggestions && els.suggestions.parentNode) {
      els.suggestions.parentNode.removeChild(els.suggestions);
      els.suggestions = null;
    }

    addUserMessage(text);

    /* Push to history */
    state.history.push({ role: 'user', text: text });
    if (state.history.length > MAX_HISTORY * 2) {
      state.history = state.history.slice(-MAX_HISTORY * 2);
    }

    /* Disable input while sending */
    state.isSending = true;
    els.input.disabled = true;
    els.send.disabled = true;
    showTyping();

    var startTime = Date.now();

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: state.history.slice(0, -1)   /* exclude the just-added user turn */
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            throw new Error(data.error || 'Request failed with status ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (data) {
        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, TYPING_DELAY_MS - elapsed);

        setTimeout(function () {
          hideTyping();
          state.isSending = false;
          els.input.disabled = false;
          els.send.disabled = false;

          var reply = (data && data.reply) ? String(data.reply).trim() : '';
          if (reply) {
            addBotMessage(reply);
            state.history.push({ role: 'model', text: reply });
            if (state.history.length > MAX_HISTORY * 2) {
              state.history = state.history.slice(-MAX_HISTORY * 2);
            }
          } else {
            addErrorMessage("I couldn't generate a response. Please try again.");
          }

          if (!state.isOpen) {
            els.launcher.classList.add('has-unread');
          }

          els.input.focus();
        }, wait);
      })
      .catch(function (err) {
        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, TYPING_DELAY_MS - elapsed);

        setTimeout(function () {
          hideTyping();
          state.isSending = false;
          els.input.disabled = false;
          els.send.disabled = false;

          var message = "Something went wrong. Please try again.";
          if (err && err.message) {
            if (/Too many requests/i.test(err.message)) {
              message = "You're sending messages too quickly. Please wait a few seconds and try again.";
            } else if (/timed out/i.test(err.message)) {
              message = "The request took too long. Please try again.";
            } else if (/not configured/i.test(err.message)) {
              message = "The assistant isn't available right now. Please try again later.";
            } else if (/rephrase/i.test(err.message)) {
              message = "I couldn't understand that. Could you rephrase your question?";
            }
          }

          addErrorMessage(message);
          els.input.focus();
        }, wait);
      });
  }

  /* ---------- Init ---------- */

  function init() {
    /* Prevent double-injection (e.g., if script is included twice) */
    if (document.getElementById('chat-window')) return;

    buildUI();

    /* Optional: expose a global to open the chat programmatically */
    window.PortfolioChat = {
      open: open,
      close: close,
      toggle: toggle
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();