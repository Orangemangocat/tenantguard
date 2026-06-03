/* Staff Todo Panel — stafftodo.js
   Vanilla JS, no dependencies.
   All panel navigation is handled via fetch → innerHTML swap.
   Content is server-rendered by Django templates (auto-escaped),
   so innerHTML with server responses is safe here.
*/
(function () {
  'use strict';

  const PANEL_ID   = 'todo-panel';
  const BODY_ID    = 'todo-panel-body';
  const OVERLAY_ID = 'todo-overlay';
  const OPEN_CLASS = 'td-open';

  /* ── CSRF token ─────────────────────────────────────── */
  function getCsrf() {
    const m = document.cookie.match(/csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* ── Fetch helpers ──────────────────────────────────── */
  function load(url, opts) {
    const body = document.getElementById(BODY_ID);
    // Loading state — textContent is safe for this literal string
    body.textContent = '';
    const spinner = document.createElement('div');
    spinner.className = 'td-loading';
    spinner.textContent = 'Loading\u2026';
    body.appendChild(spinner);

    const fetchOpts = Object.assign({
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': getCsrf(),
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, opts || {});

    fetch(url, fetchOpts)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        // Server-rendered Django HTML (all user content auto-escaped by template engine)
        body.innerHTML = html; // safe: origin-same server response
        bindAll();
      })
      .catch(function (err) {
        body.textContent = '';
        const msg = document.createElement('div');
        msg.className = 'td-error';
        msg.textContent = 'Something went wrong \u2014 please try again.';
        body.appendChild(msg);
        console.error('[stafftodo]', err);
      });
  }

  function loadUrl(url) { load(url); }

  function postForm(url, formData) {
    load(url, { method: 'POST', body: formData });
  }

  /* ── Open / close ───────────────────────────────────── */
  function openPanel() {
    const panel   = document.getElementById(PANEL_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    if (!panel) return;
    panel.classList.add(OPEN_CLASS);
    overlay.classList.add(OPEN_CLASS);
    panel.setAttribute('aria-hidden', 'false');
    const body = document.getElementById(BODY_ID);
    // Load list on first open (body is empty or still showing spinner from a prior load)
    if (!body.firstElementChild || body.firstElementChild.classList.contains('td-loading')) {
      loadUrl('/staff/todos/');
    }
  }

  function closePanel() {
    const panel   = document.getElementById(PANEL_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    if (!panel) return;
    panel.classList.remove(OPEN_CLASS);
    overlay.classList.remove(OPEN_CLASS);
    panel.setAttribute('aria-hidden', 'true');
  }

  /* ── Bind interactions inside the panel body ─────────── */
  function bindAll() {
    const root = document.getElementById(BODY_ID);
    if (!root) return;

    /* Nav links → fetch GET */
    root.querySelectorAll('[data-td-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const href = el.getAttribute('href') || el.getAttribute('data-href');
        if (href) loadUrl(href);
      });
    });

    /* Forms → fetch POST */
    root.querySelectorAll('[data-td-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        postForm(form.action, new FormData(form));
      });
    });

    /* Live search — debounced */
    const searchInput = root.querySelector('[data-td-search]');
    if (searchInput) {
      let searchTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        const baseUrl = searchInput.getAttribute('data-td-search-url') || '/staff/todos/list/';
        const q = encodeURIComponent(searchInput.value.trim());
        searchTimer = setTimeout(function () {
          loadUrl(baseUrl + '&q=' + q);
        }, 320);
      });
    }
  }

  /* ── Keyboard shortcut: Escape to close ─────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const panel = document.getElementById(PANEL_ID);
    if (panel && panel.classList.contains(OPEN_CLASS)) closePanel();
  });

  /* ── Init ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const launcher = document.getElementById('todo-launcher');
    const overlay  = document.getElementById(OVERLAY_ID);
    const closeBtn = document.querySelector('#' + PANEL_ID + ' .td-panel-close');

    if (launcher) launcher.addEventListener('click', openPanel);
    if (overlay)  overlay.addEventListener('click', closePanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
  });
})();
