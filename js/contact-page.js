/* Contact page (contact.html) — real FormSubmit AJAX submission. */
(function () {
  'use strict';
  var ENDPOINT = 'https://formsubmit.co/ajax/sakib.in7@gmail.com';

  function init() {
    var form = document.getElementById('contact-form-el');
    if (!form) return;

    var successBox = document.getElementById('form-success');
    var errBox = document.getElementById('form-error');
    var submitBtn = document.getElementById('contact-submit');
    var submitLabel = document.getElementById('contact-submit-label');

    var pills = form.querySelectorAll('.topic-pill');
    var selectedTopic = '';

    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        pills.forEach(function (q) { q.classList.remove('selected'); });
        p.classList.add('selected');
        selectedTopic = p.dataset.value;
        setErr('group-topic', false);
      });
    });

    function setErr(id, on) {
      var g = document.getElementById(id);
      if (g) g.classList.toggle('has-error', !!on);
    }
    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    ['field-name', 'field-email', 'field-message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        setErr('group-' + id.replace('field-', ''), false);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) return;

      var name = (document.getElementById('field-name').value || '').trim();
      var email = (document.getElementById('field-email').value || '').trim();
      var message = (document.getElementById('field-message').value || '').trim();
      var agree = document.getElementById('field-agree');

      var ok = true;
      if (name.length < 2) { setErr('group-name', true); ok = false; } else setErr('group-name', false);
      if (!isEmail(email)) { setErr('group-email', true); ok = false; } else setErr('group-email', false);
      if (!selectedTopic) { setErr('group-topic', true); ok = false; } else setErr('group-topic', false);
      if (message.length < 10) { setErr('group-message', true); ok = false; } else setErr('group-message', false);
      if (!agree.checked) { ok = false; agree.focus(); }
      if (!ok) return;

      successBox.classList.remove('visible');
      errBox.classList.remove('visible');

      var original = submitLabel.textContent;
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          topic: selectedTopic,
          message: message,
          _subject: 'New portfolio message from ' + name,
          _template: 'table',
          _captcha: 'false'
        })
      })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function () {
        successBox.classList.add('visible');
        setTimeout(function () { successBox.classList.remove('visible'); }, 6000);
        form.reset();
        pills.forEach(function (p) { p.classList.remove('selected'); });
        selectedTopic = '';
      })
      .catch(function () { errBox.classList.add('visible'); })
      .finally(function () {
        submitBtn.disabled = false;
        submitLabel.textContent = original;
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
