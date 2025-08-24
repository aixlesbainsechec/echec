// ========================================
// Horaires & Tarifs – rendu dynamique
// Feuilles lues : SCHEDULE_WEEK, PRICING, DISCOUNTS,
//                 FAQ_HORAIRES, META_HORAIRES
// Nécessite: data.js (AEAContent.loadHoraires)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.Loader) Loader.hold();
  bootHoraires().finally(() => { if (window.Loader) Loader.release(); });
});

async function bootHoraires(){
  try{
    const { week, pricing, discounts, faq, meta } = await AEAContent.loadHoraires();

    // Sous-titre (saison)
    const sub = document.querySelector('.page-subtitle');
    if (sub && meta.season) sub.textContent = meta.season;

    renderSchedule(week);
    renderFilters(week);
    renderLegend(week);

    renderPricing(pricing);
    renderPassage(meta.passage_fee);
    renderDiscounts(discounts);

    renderFAQ(faq);
    initKing3DFA();
    initScheduleFilters();
    initFAQAccordion();
    initPricingCards();
    highlightCurrentDay();
    makeTimeSlotsClickable();

    // Notes
    const notes = document.querySelector('.schedule-notes');
    if (notes) {
      const lines = [];
      if (meta.note1) lines.push(`<p><strong>Note :</strong> ${escapeHtml(meta.note1)}</p>`);
      if (meta.note2) lines.push(`<p>${escapeHtml(meta.note2)}</p>`);
      if (lines.length) notes.innerHTML = lines.join('');
    }

    if (window.AOS) AOS.refreshHard();
  }catch(e){
    console.warn('[HORAIRES] fallback', e);
  }
}

/* ---------------- Rendering ---------------- */

const DAY_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function groupByDay(rows){
  const m = new Map(); DAY_ORDER.forEach(d=>m.set(d,[]));
  rows.forEach(r => { if (!m.has(r.day)) m.set(r.day, []); m.get(r.day).push(r); });
  for (const [k,arr] of m) arr.sort((a,b)=> (a.start||'').localeCompare(b.start||''));
  return m;
}
const FMT = t => t ? t.replace(':','h') : '';

function renderSchedule(rows){
  const wrap = document.getElementById('weeklySchedule'); if (!wrap) return;
  const grouped = groupByDay(rows);
  wrap.innerHTML = [...grouped.entries()].map(([day, arr]) => `
    <div class="day-column">
      <div class="day-header">${day}</div>
      <div class="time-slots">
        ${arr.length ? arr.map(s => `
          <div class="time-slot" data-category="${escapeHtml(s.category)}">
            <span class="slot-time">${FMT(s.start)} - ${FMT(s.end)}</span>
            <span class="slot-title">${escapeHtml(s.title)}</span>
            <span class="slot-level">${escapeHtml(s.level || s.location || '')}</span>
          </div>
        `).join('') : `<div class="time-slot empty">—</div>`}
      </div>
    </div>
  `).join('');
}

function renderFilters(rows){
  const cont = document.getElementById('scheduleFilters'); if (!cont) return;
  const cats = Array.from(new Set(rows.map(r=>r.category))).filter(Boolean);
  cont.innerHTML = [
    `<button class="filter-btn active" data-filter="all"><i class="fas fa-calendar-week"></i> Tout voir</button>`,
    ...cats.map(c => `<button class="filter-btn" data-filter="${c}">${iconFor(c)} ${labelFor(c)}</button>`)
  ].join('');
}

function renderLegend(rows){
  const cont = document.getElementById('scheduleLegend'); if (!cont) return;
  const cats = Array.from(new Set(rows.map(r=>r.category))).filter(Boolean);
  cont.innerHTML = cats.map(c => `
    <div class="legend-item">
      <span class="legend-color" data-cat="${c}"></span><span>${labelFor(c)}</span>
    </div>
  `).join('');
}

function renderPricing(plans){
  const cont = document.getElementById('pricingGrid'); if (!cont) return;
  cont.innerHTML = plans.map(p => `
    <div class="pricing-card ${p.featured ? 'featured':''}">
      ${p.featured ? `<div class="ribbon">Formule complète</div>`:''}
      <div class="pricing-header">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">
          <span class="amount">${Number(p.price || 0).toLocaleString('fr-FR')}</span>
          <span class="currency">€</span>
          <span class="period">${escapeHtml(p.period || '/an')}</span>
        </div>
        ${p.subtitle ? `<p class="price-desc">${escapeHtml(p.subtitle)}</p>` : ''}
      </div>
      <div class="pricing-features">
        <ul>${(p.features||[]).map(f=>`<li><i class="fas fa-check"></i> ${escapeHtml(f)}</li>`).join('')}</ul>
      </div>
      <div class="pricing-footer"><a href="contact.html" class="btn btn-primary">S'inscrire</a></div>
    </div>
  `).join('');
}
function renderPassage(text){
  const el = document.getElementById('passageFee'); if (!el) return;
  el.innerHTML = text ? `<p><strong>${escapeHtml(text)}</strong></p>` : '';
}

function renderDiscounts(items){
  const cont = document.getElementById('discountGrid'); if (!cont) return;
  cont.innerHTML = items.map(d => `
    <div class="discount-card">
      <div class="discount-icon">${escapeHtml(d.icon||'🎫')}</div>
      <h4>${escapeHtml(d.title||'')}</h4>
      <p>${escapeHtml(d.text||'')}</p>
    </div>
  `).join('');
}

function renderFAQ(items){
  const cont = document.getElementById('faqAccordion'); if (!cont) return;
  cont.innerHTML = items.map(i => `
    <div class="faq-item">
      <button class="faq-question"><span>${escapeHtml(i.q)}</span><i class="fas fa-chevron-down"></i></button>
      <div class="faq-answer"><p>${escapeHtml(i.a)}</p></div>
    </div>
  `).join('');
}

/* ---------------- Interactions ---------------- */

function initScheduleFilters() {
  const btns = [...document.querySelectorAll('.filter-btn')];
  const slots = [...document.querySelectorAll('.time-slot')];

  btns.forEach(btn =>
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      slots.forEach(s => {
        const show = filter === 'all' || s.dataset.category === filter;
        s.classList.toggle('hidden', !show);
        if (window.gsap) {
          gsap.to(s, {
            opacity: show ? 1 : 0.2,
            scale: show ? 1 : 0.95,
            duration: 0.25,
            ease: 'power2.out'
          });
        }
      });
    })
  );
}

function initFAQAccordion() {
  const items = [...document.querySelectorAll('.faq-item')];
  items.forEach(item => {
    const q = item.querySelector('.faq-question');
    const ans = item.querySelector('.faq-answer');
    ans.style.maxHeight = null;

    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      items.forEach(it => { it.classList.remove('active'); it.querySelector('.faq-answer').style.maxHeight = null; });
      if (!isOpen) {
        item.classList.add('active');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
      const ico = q.querySelector('i');
      if (window.gsap) gsap.to(ico, { rotation: isOpen ? 0 : 180, duration: 0.3, ease: 'power2.inOut' });
    });
  });
}

function initPricingCards() {
  const cards = [...document.querySelectorAll('.pricing-card')];
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    cards.forEach(card =>
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none reverse' },
        y: 40, opacity: 0, duration: 0.6, ease: 'power2.out'
      })
    );
  }
  const featured = document.querySelector('.pricing-card.featured');
  if (featured && window.gsap) {
    gsap.to(featured, { y: -5, duration: 2, repeat: -1, yoyo: true, ease: 'power1.inOut' });
  }
}

function highlightCurrentDay() {
  const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const idx = new Date().getDay();
  document.querySelectorAll('.day-column').forEach(col => {
    const head = col.querySelector('.day-header');
    if (head && head.textContent.trim() === days[idx]) {
      col.classList.add('today');
      if (window.gsap) gsap.to(head, { scale: 1.05, yoyo: true, repeat: -1, duration: 1 });
    }
  });
}

function makeTimeSlotsClickable() {
  const slots = [...document.querySelectorAll('.time-slot:not(.empty)')];
  slots.forEach(slot => {
    slot.style.cursor = 'pointer';
    slot.addEventListener('click', () => {
      const time = slot.querySelector('.slot-time')?.textContent || '';
      const title = slot.querySelector('.slot-title')?.textContent || '';
      const level = slot.querySelector('.slot-level')?.textContent || '';

      const modal = document.createElement('div');
      modal.className = 'slot-modal';
      modal.innerHTML = `
        <h3>${escapeHtml(title)}</h3>
        <p><strong>Horaire :</strong> ${escapeHtml(time)}</p>
        ${level ? `<p><strong>Niveau :</strong> ${escapeHtml(level)}</p>` : ''}
        <p>Pour vous inscrire à ce créneau, contactez-nous !</p>
        <div class="modal-actions">
          <a href="contact.html" class="btn btn-primary">S'inscrire</a>
          <a class="btn btn-primary close-modal">Fermer</a>
        </div>`;
      Object.assign(modal.style, {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#fff', padding: '2rem', borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,.2)', zIndex: 1000, maxWidth: '420px', width: '90%'
      });

      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999
      });

      document.body.append(overlay, modal);
      if (window.gsap) gsap.from(modal, { scale: 0.5, opacity: 0, duration: 0.3, ease: 'back.out(1.7)' });

      function close() {
        if (window.gsap) {
          gsap.to(modal, { scale: 0.5, opacity: 0, duration: 0.2, onComplete: () => modal.remove() });
        } else modal.remove();
        overlay.remove();
      }
      modal.querySelector('.close-modal').addEventListener('click', close);
      overlay.addEventListener('click', close);
    });
  });
}

/* ---------------- Utils ---------------- */
function iconFor(c){
  switch((c||'').toLowerCase()){
    case 'jeunes': return '<i class="fas fa-child"></i>';
    case 'adultes': return '<i class="fas fa-user"></i>';
    case 'competition': return '<i class="fas fa-trophy"></i>';
    case 'libre': return '<i class="fas fa-chess-board"></i>';
    case 'online': return '<i class="fas fa-laptop"></i>';
    default: return '<i class="fas fa-circle"></i>';
  }
}
function labelFor(c){
  const m = { jeunes:'Jeunes', adultes:'Adultes', competition:'Compétition', libre:'Club ouvert', online:'En ligne' };
  return m[(c||'').toLowerCase()] || (c || 'Autre');
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function initKing3DFA(){
  const root  = document.getElementById('king3d');
  const stack = document.getElementById('kingStack');
  if (!root || !stack) return;

  stack.innerHTML = '';
  const L = 56; // match --layers
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 0.42;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'king3d-layer';
    const s = 1 - (i/(L*140));                       // légère réduction progressive
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';
    layer.innerHTML = `<i class="fa-solid fa-chess-king" aria-hidden="true"></i>`;
    stack.appendChild(layer);
  }

  // rotation douce + auto-spin (sans GSAP pour rester light)
  let rx = -8, ry = -16;   // rotation courante
  let tx = -8, ty = -16;   // cible
  const spin = 0.08;       // auto-spin Y

  const tick = () => {
    ty -= spin;
    rx += (tx - rx) * 0.08;
    ry += (ty - ry) * 0.08;
    stack.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(tick);
  };
  tick();

  // responsive: recalc profondeur si taille change
  const ro = new ResizeObserver(()=>{
    const t = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || thickness;
    [...stack.children].forEach((layer, i)=>{
      const s = 1 - (i/(L*140));
      layer.style.transform = `translateZ(${-i*t}px) scale(${s})`;
    });
  });
  ro.observe(root);

  // fallback si FA indispo → unicode ♛
  setTimeout(()=>{
    const test = stack.querySelector('i');
    if (!test || getComputedStyle(test).fontFamily.toLowerCase().indexOf('font awesome') === -1){
      [...stack.children].forEach(l => l.innerHTML = `<span style="font-size:calc(var(--size)*.58);font-weight:700">♛</span>`);
    }
  }, 0);
}