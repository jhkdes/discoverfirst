// ---- CONFIG ----
// Supabase Edge Function that emails the report link (see study-report/README.md).
var STUDY_REQUEST_URL = 'https://udjisdomzfzijvhnohwv.supabase.co/functions/v1/request-report';
// ----------------

var STUDY_SOURCE = (new URLSearchParams(location.search).get('src') || '').slice(0, 40);
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setupReportForm(form) {
  var input = form.querySelector('input[type="email"]');
  var honeypot = form.querySelector('input[name="website"]');
  var button = form.querySelector('button[type="submit"]');
  var status = form.parentNode.querySelector('.form-status');
  var idleLabel = button.textContent;

  function say(message, kind) {
    status.textContent = message;
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  function fail(message) {
    button.disabled = false;
    button.textContent = idleLabel;
    say(message, 'error');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = input.value.trim();

    if (!EMAIL_PATTERN.test(email)) {
      say('Enter a valid email address.', 'error');
      input.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending';
    say('', '');

    fetch(STUDY_REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, website: honeypot ? honeypot.value : '', source: STUDY_SOURCE })
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok && data.ok === true, status: response.status };
        });
      })
      .then(function (result) {
        if (result.ok) {
          input.disabled = true;
          button.textContent = 'Link sent';
          say('Check your inbox. We sent a link to ' + email + '. If it does not arrive in a few minutes, check your spam folder.', 'ok');
        } else if (result.status === 429) {
          fail('Too many requests from your network. Try again in an hour, or email jkim@discoverfirst.co.');
        } else if (result.status === 400) {
          fail('That email address did not look right. Check it and try again.');
        } else {
          fail('We could not send the link. Try again, or email jkim@discoverfirst.co and we will send it.');
        }
      })
      .catch(function () {
        fail('We could not send the link. Check your connection and try again, or email jkim@discoverfirst.co.');
      });
  });
}

document.querySelectorAll('.report-form').forEach(setupReportForm);
