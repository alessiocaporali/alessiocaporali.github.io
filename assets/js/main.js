/* Alessio Caporali — site interactions (no dependencies). */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('.theme-toggle');
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }
  function syncToggleLabel() {
    if (!toggle) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    toggle.setAttribute('title', 'Switch to ' + next + ' mode');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncToggleLabel();
    });
    if (media.addEventListener) media.addEventListener('change', syncToggleLabel);
    syncToggleLabel();
  }

  /* ---------- Header border on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Reduced motion: freeze the hero wires ---------- */
  var wireSvg = document.querySelector('.hero-wire');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPref() {
    if (!wireSvg || !wireSvg.pauseAnimations) return;
    if (reduce.matches) wireSvg.pauseAnimations(); else wireSvg.unpauseAnimations();
  }
  applyMotionPref();
  if (reduce.addEventListener) reduce.addEventListener('change', applyMotionPref);

  /* ---------- Publications: filter + search ---------- */
  var controls = document.querySelector('.pub-controls');
  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var years = Array.prototype.slice.call(document.querySelectorAll('.pub-year'));
  var empty = document.querySelector('.pub-empty');
  var segs = Array.prototype.slice.call(document.querySelectorAll('.seg'));
  var input = controls ? controls.querySelector('input[type="search"]') : null;
  var filter = 'all';

  if (controls && pubs.length) {
    controls.hidden = false;

    var counts = { all: pubs.length, journal: 0, conference: 0 };
    pubs.forEach(function (li) {
      counts[li.dataset.type] = (counts[li.dataset.type] || 0) + 1;
      li._text = li.textContent.replace(/\s+/g, ' ').toLowerCase();
      // remember original markup for search highlighting
      li._title = li.querySelector('.pub-title');
      li._titleHTML = li._title ? li._title.innerHTML : '';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
      el.textContent = counts[el.getAttribute('data-count')] || 0;
    });

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function apply() {
      var q = input ? input.value.trim().toLowerCase() : '';
      var terms = q ? q.split(/\s+/) : [];
      var shown = 0;

      pubs.forEach(function (li) {
        var okType = filter === 'all' || li.dataset.type === filter;
        var okText = terms.every(function (t) { return li._text.indexOf(t) !== -1; });
        var visible = okType && okText;
        li.hidden = !visible;
        if (visible) shown++;

        if (li._title) {
          if (visible && terms.length) {
            var re = new RegExp('(' + terms.map(escapeRe).join('|') + ')', 'gi');
            li._title.innerHTML = li._titleHTML.replace(re, '<mark>$1</mark>');
          } else {
            li._title.innerHTML = li._titleHTML;
          }
        }
      });

      years.forEach(function (y) {
        y.hidden = !y.querySelector('.pub:not([hidden])');
      });
      if (empty) empty.hidden = shown !== 0;
    }

    segs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-filter');
        segs.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply();
      });
    });
    if (input) input.addEventListener('input', apply);
  }

  /* ---------- Lightbox for research figures ---------- */
  var dialog = document.querySelector('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    var dImg = dialog.querySelector('img');
    Array.prototype.forEach.call(document.querySelectorAll('.card-media[data-full]'), function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        dImg.src = btn.getAttribute('data-full');
        dImg.alt = img ? img.alt : '';
        dialog.showModal();
      });
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  } else {
    // No <dialog> support: open the figure in a new tab instead.
    Array.prototype.forEach.call(document.querySelectorAll('.card-media[data-full]'), function (btn) {
      btn.addEventListener('click', function () { window.open(btn.getAttribute('data-full'), '_blank', 'noopener'); });
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector('[data-current-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
