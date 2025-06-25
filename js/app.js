// ========================================
// JavaScript Principal - Académie d'Échecs
// ========================================

const CONFIG = {
  animationDuration: 300,
  scrollOffset: 100,
  loaderDelay: 1500,
  counterDuration: 2000,
  googleSheetId: '1_EXAMPLE_ID_A_REMPLACER'
};

const APP_STATE = {
  isLoading: true,
  scrollPosition: 0,
  isMobile: window.innerWidth <= 768
};

document.addEventListener('DOMContentLoaded', () => {
  initLoader();                 // ⬅ tout commence là

  initScrollEffects();
  initCounters();
  initBackToTop();
  initSmoothScroll();
  updateProgressBar();

  window.addEventListener(
    'resize',
    debounce(() => (APP_STATE.isMobile = window.innerWidth <= 768), 250)
  );
});

/* ========================================================= */
/* ===============         LOADER         ================== */
/* ========================================================= */
function initLoader() {
  const loader = document.getElementById('loader');

  setTimeout(() => {
    loader.classList.add('hide');
    APP_STATE.isLoading = false;
    document.body.style.overflow = 'visible';

    setTimeout(() => {
      loader.style.display = 'none';

      /* ====== 🔥 PATCH : tout ce qui suit se lance APRES le loader ===== */

      // AOS
      AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: true,
        offset: 50,
        disable: 'mobile'
      });

      // Fonctions spécifiques si elles existent
      [
        'initScheduleFilters',
        'initFAQAccordion',
        'initPricingCards',
        'animateClock',
        'highlightCurrentDay',
        'makeTimeSlotsClickable'
      ].forEach(fnName => {
        if (typeof window[fnName] === 'function') window[fnName]();
      });

      // Refresh généraux
      AOS.refreshHard();
      if (window.ScrollTrigger) ScrollTrigger.refresh();

      /* ================================================================= */
    }, CONFIG.animationDuration); // attend la fin du fade out du loader
  }, CONFIG.loaderDelay);
}

/* ------------------ Effets de scroll ------------------ */
function initScrollEffects() {
  const header = document.getElementById('header');

  window.addEventListener(
    'scroll',
    throttle(() => {
      const y = window.pageYOffset;
      header.classList.toggle('scrolled', y > CONFIG.scrollOffset);
      APP_STATE.scrollPosition = y;
      updateProgressBar();
    }, 100)
  );
}

function updateProgressBar() {
  const bar = document.getElementById('progressBar');
  const y = document.body.scrollTop || document.documentElement.scrollTop;
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  bar.style.width = (y / h) * 100 + '%';
}

/* ------------------ Compteurs ------------------ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.classList.contains('counted')) {
          animateCounter(e.target);
          e.target.classList.add('counted');
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(c => io.observe(c));
}

function animateCounter(el) {
  const target = +el.dataset.count;
  const inc = target / (CONFIG.counterDuration / 16);
  let cur = 0;
  const t = setInterval(() => {
    cur += inc;
    if (cur >= target) {
      el.textContent = target;
      clearInterval(t);
    } else {
      el.textContent = Math.floor(cur);
    }
  }, 16);
}

/* ------------------ Back to top ------------------ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () =>
    btn.classList.toggle('show', window.pageYOffset > 300)
  );
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ------------------ Smooth scroll ------------------ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t)
        window.scrollTo({
          top: t.offsetTop - 80,
          behavior: 'smooth'
        });
    })
  );
}

/* ------------------ Helpers ------------------ */
function debounce(fn, w) {
  let to;
  return (...a) => {
    clearTimeout(to);
    to = setTimeout(() => fn(...a), w);
  };
}
function throttle(fn, l) {
  let t;
  return function () {
    if (!t) {
      fn.apply(this, arguments);
      t = setTimeout(() => (t = 0), l);
    }
  };
}

/* ------------------ Global errors ------------------ */
window.addEventListener('error', e => console.error('Erreur globale :', e.error));

/* ------------------ SW (option) ------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // navigator.serviceWorker.register('/sw.js')
    //   .then(r => console.log('SW ok'))
    //   .catch(err => console.error('SW fail', err));
  });
}

window.ChessClub = { CONFIG, APP_STATE, debounce, throttle, animateCounter };
