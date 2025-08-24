// ========================================
// Club – rendu dynamique depuis infos.xlsx
// Feuilles lues : hero_stats, club_stats, timeline, palmares,
//                 achievements, values, team
// Nécessite: data.js (AEAContent.loadClub)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.Loader) Loader.hold();
  bootClub().finally(() => { if (window.Loader) Loader.release(); });
});

async function bootClub() {
  try {
    const data = await AEAContent.loadClub();
    // 1) Stats d’intro (N° FFE, Classement national, Années)

    mountIntroStats(data.stats, data.glob);

    // 2) Timeline / Histoire
    mountTimeline(data.timeline);

    // 3) Palmarès (or)
    mountPalmares(data.palmares);

    // 4) Achievements (3 tuiles)
    mountAchievements(data.achievements);

    // 5) Équipe
    mountTeam(data.team);

    // 6) Valeurs
    mountValues(data.values);

    // (Optionnel) Re-lancer AOS si nécessaire
    if (window.AOS) AOS.refreshHard();
  } catch (e) {
    console.warn('[CLUB] fallback', e);
  }
}

/* ---------- Helpers / DOM ---------- */

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* ---------- 1) Stats intro ---------- */
function mountIntroStats(map, glob) {
  // map (club_stats) contient typiquement :
  // { club_number:"2624", national_rank:"41e", years:"20+", members:"264", ... }

  qs('#js-licencies').textContent = glob.find(a => a.label == 'adhérents').value;
  const boxes = qsa('.intro-stats .stat-box');
  boxes.forEach(box => {
    const label = (qs('.stat-label', box)?.textContent || '').toLowerCase();
    const valEl = qs('.stat-value', box);
    if (!valEl) return;

    if (label.includes('n° ffe') || label.includes('ffe')) {
      valEl.textContent = esc(map.club_number || map.ffe || '—');
    } else if (label.includes('classement')) {
      valEl.textContent = esc(map.national_rank || '—');
    } else if (label.includes('année')) {
      valEl.textContent = esc(map.years || '—');
    }
  });
}

/* ---------- 2) Timeline ---------- */
function mountTimeline(items) {
  // items: [{year:"2013", title:"...", text:"..."}, ...] actifs uniquement
  const wrap = qs('.timeline');
  if (!wrap || !Array.isArray(items)) return;

  wrap.innerHTML = items.map((it, i) => `
    <div class="timeline-item ${i === items.length-1 ? 'future' : ''}" data-aos="fade-up" data-aos-delay="${i*100}">
      <div class="timeline-date">${esc(it.year || '')}</div>
      <div class="timeline-content">
        <h3>${esc(it.title || '')}</h3>
        <p>${esc(it.text || '')}</p>
      </div>
    </div>
  `).join('');
}

/* ---------- 3) Palmarès ---------- */
function mountPalmares(rows) {
  // rows: [{tier:"gold|silver|bronze", title:"...", list:"Nom1|Nom2|..."}, ...]
  const wrap = qs('.trophy-showcase');
  if (!wrap || !Array.isArray(rows)) return;

  const order = ['gold','silver','bronze'];
  const byTier = order.map(t => rows.filter(r => (r.tier||'').toLowerCase() === t));

  wrap.innerHTML = byTier.map((arr, idx) => {
    const tier = order[idx];
    const icon = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉';
    const title = tier === 'gold' ? 'Champions' : tier === 'silver' ? 'Vice-Champions' : 'Performances notables';
    const delay = idx * 100;

    // si la feuille contient des titres spécifiques, on les affiche
    const cards = arr.length ? arr : [];
    if (!cards.length) return '';

    const first = cards[0];
    const titleFinal = first.title ? first.title : title;
    const list = (first.list || '').split('|').map(s=>s.trim()).filter(Boolean);

    return `
      <div class="trophy-card ${tier}" data-aos="zoom-in" data-aos-delay="${delay}">
        <div class="trophy-icon">${icon}</div>
        <h3>${esc(titleFinal)}</h3>
        <ul>${list.map(li => `<li>${esc(li)}</li>`).join('')}</ul>
      </div>
    `;
  }).join('');
}

/* ---------- 4) Achievements ---------- */
function mountAchievements(items) {
  // items: [{icon:"📊", title:"...", text:"..."}, ...]
  const wrap = qs('.achievements-grid');
  if (!wrap || !Array.isArray(items)) return;

  wrap.innerHTML = items.map((a, i) => `
    <div class="achievement" data-aos="fade-up" data-aos-delay="${i*100}">
      <div class="achievement-icon">${esc(a.icon || '⭐')}</div>
      <h4>${esc(a.title || '')}</h4>
      <p>${esc(a.text || '')}</p>
    </div>
  `).join('');
}

/* ---------- 5) Team ---------- */
function mountTeam(items) {
  // items: [{name, role, bio, icon, stat1, stat2, rating}, ...]
  const wrap = qs('.team-grid');
  if (!wrap || !Array.isArray(items)) return;

  wrap.innerHTML = items.map((m, i) => `
    <div class="team-member" data-aos="flip-left" data-aos-delay="${i*100}">
      <div class="member-card">
        <div class="member-avatar"><span class="avatar-icon">${esc(m.icon || '♟️')}</span></div>
        <h3>${esc(m.name || '')}</h3>
        <p class="member-role">${esc(m.role || '')}</p>
        <p class="member-bio">${esc(m.bio || '')}</p>
        <div class="member-stats">
          ${m.stat1 ? `<span><i class="fas fa-trophy"></i> ${esc(m.stat1)}</span>` : ''}
          ${m.stat2 ? `<span><i class="fas fa-users"></i> ${esc(m.stat2)}</span>` : ''}
          ${m.rating ? `<span><i class="fas fa-chess"></i> ${esc(m.rating)} Elo</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/* ---------- 6) Valeurs ---------- */
function mountValues(items) {
  // items: [{icon:"🤝", title:"Esprit d'équipe", text:"..."}, ...]
  const wrap = qs('.values-grid');
  if (!wrap || !Array.isArray(items)) return;

  wrap.innerHTML = items.map((v, i) => `
    <div class="value-card" data-aos="fade-up" data-aos-delay="${i*100}">
      <div class="value-icon">${esc(v.icon || '♟️')}</div>
      <h3>${esc(v.title || '')}</h3>
      <p>${esc(v.text || '')}</p>
    </div>
  `).join('');
}

function initCrystalKnightFA(){
  const root = document.getElementById('knight3d');
  const stack = document.getElementById('knightStack');
  if (!root || !stack) return;

  // wipe + build layers
  stack.innerHTML = '';
  const L = 56; // doit matcher --layers
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 1.1;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'knight3d-layer';
    // profondeur + très léger scale interne pour “taille” diamant
    const s = 1 - (i/(L*140));
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    // opacité un peu plus faible au cœur
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';

    // contenu : l’icône FA (déjà chargée dans ta page)
    layer.innerHTML = `<i class="fa-solid fa-chess-knight" aria-hidden="true"></i>`;
    stack.appendChild(layer);
  }

  // rotation lente + tilt souris
  let rx = -8, ry = -16;     // rotation actuelle
  let tx = -8, ty = -16;     // cible
  const spin = 0.09;        // auto-spin

  const tick = () => {
    ty -= spin;                 // spin continu
    rx += (tx - rx) * 0.08;     // easing
    ry += (ty - ry) * 0.08;
    stack.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(tick);
  };
  tick();

  // responsive: recalc Z & scale si taille change
  const ro = new ResizeObserver(()=>{
    const t = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || thickness;
    [...stack.children].forEach((layer, i)=>{
      const s = 1 - (i/(L*140));
      layer.style.transform = `translateZ(${-i*t}px) scale(${s})`;
    });
  });
  ro.observe(root);

  // fallback si FA non dispo (rare): on prend le glyph unicode ♞
  setTimeout(()=>{
    const test = stack.querySelector('i');
    if (!test || getComputedStyle(test).fontFamily.toLowerCase().indexOf('font awesome') === -1){
      [...stack.children].forEach(l => l.innerHTML = `<span style="font-size:calc(var(--size)*.58);font-weight:700">♞</span>`);
    }
  },0);
}

// 👉 appelle la fonction au chargement de la page Club
document.addEventListener('DOMContentLoaded', () => {
  initCrystalKnightFA();
});