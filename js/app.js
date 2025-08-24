// ========================================
// JavaScript Principal - Académie d'Échecs
// v2025-08-21 (loader smart + stats via Sheet)
// ========================================

const CONFIG = {
  animationDuration: 150,
  scrollOffset: 100,
  loaderDelay: 400,   // durée minimale d'affichage du loader (ms)
  counterDuration: 2000
};

const APP_STATE = {
  isLoading: true,
  scrollY: 0,
  isMobile: window.innerWidth <= 768
};

// === Compat (fallback direct vers une sheet si AEAContent n'est pas chargé) ===
const STATS_SHEET_ID = "1Xgqf2afvEuewqLzzpxntkxpMY2PEkTlHCA3kF6DOunI";
const STATS_TAB_NAME = "hero_stats";
const STATS_URL = `https://opensheet.elk.sh/${STATS_SHEET_ID}/${STATS_TAB_NAME}`;

/* ================== Loader avec verrous ================== */
const Loader = {
  el: null,
  holds: 0,
  mounted: false,
  hidden: false,
  mount(){
    this.el = document.getElementById('loader');
    this.mounted = true;
    this.show();
  },
  show(){
    if (!this.el) return;
    this.hidden = false;
    this.el.style.display = 'flex';
    this.el.classList.remove('hide');
    document.body.style.overflow = 'hidden';
    APP_STATE.isLoading = true;
  },
  hide(){
    if (!this.el || this.hidden) return;
    this.el.classList.add('hide');
    APP_STATE.isLoading = false;
    document.body.style.overflow = 'visible';
    setTimeout(() => {
      this.el.style.display = 'none';
      this.hidden = true;
    }, CONFIG.animationDuration);
  },
  hold(){ this.holds++; },
  release(){ this.holds = Math.max(0, this.holds - 1); }
};

// Utilitaire : exécute un “travail” asynchrone et ne ferme le loader
// qu’après la fin + lorsque tous les verrous externes sont libérés.
async function runWithLoader(work){
  Loader.show();
  const t0 = performance.now();
  try {
    await work();
  } finally {
    const elapsed = performance.now() - t0;
    const waitMin = Math.max(0, CONFIG.loaderDelay - elapsed);
    const tryHide = () => {
      if (Loader.holds === 0) Loader.hide();
      else setTimeout(tryHide, 50);
    };
    setTimeout(tryHide, waitMin);
  }
}

/* ================== Boot ================== */
document.addEventListener('DOMContentLoaded', () => {
  Loader.mount();

  // tout ce qui doit être prêt *avant* fermeture du loader :
  runWithLoader(async () => {
    initAOS();
    ensureGlobalHero();
    initHeroShrink();
    initBackToTop();
    initSmoothScroll();
    updateProgressBar();

    // Si un hero existe sur la page, on attend vraiment ses stats
    if (document.getElementById('hero')) {
      const stats = await fetchHeroStats();
      const fallback = [
        { label: "adhérents", value: 301 },
        { label: "équipes", value: 4 },
        { label: "ans d'histoire", value: 21 }
      ];
      mountHeroStats(stats.length ? stats : fallback);
    }
  });

  window.addEventListener('resize', debounce(() => {
    APP_STATE.isMobile = window.innerWidth <= 768;
  }, 250));
});

/* =============== AOS ===================== */
function initAOS(){
  if (window.AOS){
    AOS.init({ duration:700, easing:'ease-out', once:true, offset:50 });
  }
}

/* ======= HERO commun (injecté sur pages internes) ======= */
function ensureGlobalHero(){
  if (document.getElementById('hero') || document.body.hasAttribute('data-no-hero')) return;

  const tpl = `
  <section class="hero" id="hero" aria-label="Introduction" aria-hidden="false">
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-line">Académie d'Échecs</span>
        <span class="title-line accent">d'Aix-les-Bains</span>
      </h1>
      <p class="hero-subtitle">Le club de référence en Savoie depuis plus de 20 ans</p>
      <div class="hero-stats"></div>
      <div class="hero-cta">
        <a href="pages/contact.html" class="btn btn-secondary"><i class="fas fa-user-plus"></i> Nous rejoindre</a>
        <a href="pages/club.html" class="btn btn-secondary"><i class="fas fa-info-circle"></i> Découvrir le club</a>
      </div>
    </div>
    <div class="hero-scroll" aria-hidden="true"><i class="fas fa-chevron-down"></i></div>
  </section>`;
  const header = document.getElementById('header');
  const wrap = document.createElement('div');
  wrap.innerHTML = tpl.trim();
  header.insertAdjacentElement('afterend', wrap.firstElementChild);
}

/* ======= HERO shrink on scroll ======= */
function initHeroShrink(){
  const header = document.getElementById('header');
  const hero   = document.getElementById('hero'); // peut être null
  let ticking  = false;

  const onScroll = () => {
    APP_STATE.scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      if (header) header.classList.toggle('scrolled', APP_STATE.scrollY > CONFIG.scrollOffset);

      if (hero) {
        const max = Math.max(window.innerHeight * 0.95, 560);
        const min = Math.max(window.innerHeight * 0.42, 280);
        const range  = max - min;
        const y      = Math.min(APP_STATE.scrollY, range);
        const shrink = range ? (y / range) : 0; // 0..1
        hero.style.setProperty('--hero-shrink', shrink.toFixed(4));
      }

      updateProgressBar();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll(); // état initial au chargement
}


/* ======= Progress bar ======= */
function updateProgressBar(){
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  const y = document.documentElement.scrollTop || document.body.scrollTop;
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
}

async function fetchHeroStats(){
  try{
    if (window.AEAContent && typeof AEAContent.loadHeroStats === 'function') {
      const rows = await AEAContent.loadHeroStats(); // [{label, value, ...}]
      return normalizeStats(rows);
    }
    const res = await fetch(STATS_URL, { cache:'no-store' });
    if (!res.ok) throw new Error(res.status);
    const rows = await res.json();
    return normalizeStats(rows);
  }catch(e){
    console.warn('[STATS] fetch fail:', e);
    return [];
  }
}

function normalizeStats(rows){
  return (rows||[])
    .filter(r => r.label && (r.value !== undefined && r.value !== null))
    .map(r => ({
      label: String(r.label).trim(),
      value: Number(String(r.value).replace(/\s/g,'')) || 0
    }))
    .slice(0, 5);
}

/* ======= Counters ======= */
function mountHeroStats(stats){
  const wrap = document.querySelector('.hero-stats');
  if (!wrap || !Array.isArray(stats)) return;
  wrap.innerHTML = stats.map(s => `
    <div class="stat"><span data-count="${Number(s.value)||0}">0</span> ${s.label}</div>
  `).join('');
  initCounters();
}
function initCounters(){
  const els = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (e.isIntersecting && !e.target.dataset.done){
        animateCounter(e.target);
        e.target.dataset.done = '1';
      }
    });
  }, {threshold:.6});
  els.forEach(el => io.observe(el));
}
function animateCounter(el){
  const target = +el.dataset.count || 0;
  const dur = CONFIG.counterDuration;
  const start = performance.now();
  function step(t){
    const p = Math.min(1, (t - start) / dur);
    el.textContent = Math.floor(target * p).toLocaleString('fr-FR');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ======= Back to top ======= */
function initBackToTop(){
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () =>
    btn.classList.toggle('show', window.pageYOffset > 300)
  );
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ======= Smooth anchors ======= */
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href'); if (id.length <= 1) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior:'smooth' });
    });
  });
}

/* ======= Helpers ======= */
function debounce(fn, w){ let to; return (...a)=>{ clearTimeout(to); to=setTimeout(()=>fn(...a),w); } }

window.ChessClub = { CONFIG, APP_STATE, Loader };
