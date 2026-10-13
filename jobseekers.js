// ---- CONFIG: fill these in ----
var INTERVIEW_URL = 'https://user-interviewer.vercel.app/interview/oRRmE13e6egBgsSsQmHuJJvL96ElRAdb';        // the voice AI interview link (collects email at interview time)
var COUNT_API_URL = 'https://user-interviewer.vercel.app/api/public/completed-interviews-count'; // returns {completedInterviews: n}
var GOAL = 200;
var EARLY_THRESHOLD = 100;       // below this (or if the API is unset or fails), show the "first 100" message instead of the number
// --------------------------------

var SHARE_URL = 'https://discoverfirst.co/jobseekers';
var SHARE_TEXT = "I'm taking a free 15-minute AI interview that shows how my job search compares with other job seekers, plus specific changes to get more interviews. If you are having trouble getting interviews, I suggest you give it a try for your own personalized job search report.";

function withSrc(url, src) {
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'src=' + encodeURIComponent(src);
}

// Carry the visitor's incoming ?src= (from a share link) through to the interview link.
function interviewHref() {
  if (!INTERVIEW_URL) return '#';
  var src = new URLSearchParams(location.search).get('src');
  return src ? withSrc(INTERVIEW_URL, src) : INTERVIEW_URL;
}

document.querySelectorAll('[data-interview-cta]').forEach(function (a) {
  a.href = interviewHref();
  if (INTERVIEW_URL) { a.target = '_blank'; a.rel = 'noopener'; }
});

// Accepts: 12 | {completedInterviews: 12} | {count: 12} | [{count: 12}]
function readCount(data) {
  if (Array.isArray(data)) data = data[0];
  if (data && typeof data === 'object') data = 'completedInterviews' in data ? data.completedInterviews : data.count;
  var n = Number(data);
  return isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

function renderCount(n) {
  var pct = Math.min(100, Math.round((n / GOAL) * 100));
  document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = n; });
  document.querySelectorAll('[data-goal]').forEach(function (el) { el.textContent = GOAL; });
  document.querySelectorAll('[data-remaining]').forEach(function (el) { el.textContent = Math.max(GOAL - n, 0); });
  document.querySelectorAll('[data-pct]').forEach(function (el) { el.textContent = pct + '%'; });
  document.querySelectorAll('[data-bar]').forEach(function (el) {
    el.style.width = pct + '%';
    el.parentNode.setAttribute('aria-valuenow', n);
  });
}

// Show the live counter only once the real count reaches the threshold.
function showCount(n) {
  var live = n !== null && n >= EARLY_THRESHOLD;
  if (live) renderCount(n);
  document.querySelectorAll('[data-state="live"]').forEach(function (el) { el.hidden = !live; });
  document.querySelectorAll('[data-state="early"]').forEach(function (el) { el.hidden = live; });
}

showCount(null);
if (COUNT_API_URL) {
  fetch(COUNT_API_URL, { headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { showCount(readCount(d)); })
    .catch(function () { /* keep the early message */ });
}

// ---- Sharing ----
var shareStatus = document.getElementById('share-status');
function say(msg) { if (shareStatus) shareStatus.textContent = msg; }

var shareEmail = document.getElementById('share-email');
var shareLinkedIn = document.getElementById('share-linkedin');
var shareCopy = document.getElementById('share-copy');
var shareNative = document.getElementById('share-native');

if (shareEmail) {
  shareEmail.href = 'mailto:?subject=' + encodeURIComponent('Free AI interview for your job search') +
    '&body=' + encodeURIComponent(SHARE_TEXT + '\n\n' + withSrc(SHARE_URL, 'email'));
}
if (shareLinkedIn) {
  var linkedInUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(withSrc(SHARE_URL, 'linkedin'));
  shareLinkedIn.href = linkedInUrl;
  shareLinkedIn.target = '_blank';
  shareLinkedIn.rel = 'noopener';

  // LinkedIn's share URL accepts only a link, so copy the suggested post text and
  // tell the person to paste it before sending them to LinkedIn.
  var dialog = document.getElementById('linkedin-dialog');
  var dialogText = document.getElementById('linkedin-dialog-text');
  var dialogGo = document.getElementById('linkedin-dialog-go');
  var dialogClose = document.getElementById('linkedin-dialog-close');
  var canDialog = dialog && typeof dialog.showModal === 'function' && navigator.clipboard;

  if (canDialog) {
    dialogText.textContent = SHARE_TEXT;
    dialogGo.href = linkedInUrl;
    var copyText = function () { return navigator.clipboard.writeText(SHARE_TEXT).catch(function () {}); };

    shareLinkedIn.addEventListener('click', function (e) {
      e.preventDefault();
      copyText();
      dialog.showModal();
    });
    dialogGo.addEventListener('click', function () { copyText(); dialog.close(); });
    dialogClose.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }
}
if (shareCopy) {
  shareCopy.addEventListener('click', function () {
    var link = withSrc(SHARE_URL, 'link');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () { say('Link copied.'); }, function () { say(link); });
    } else {
      say(link);
    }
  });
}
if (shareNative) {
  if (navigator.share) {
    shareNative.hidden = false;
    shareNative.addEventListener('click', function () {
      navigator.share({ title: 'Discover First', text: SHARE_TEXT, url: withSrc(SHARE_URL, 'native') }).catch(function () {});
    });
  }
}
