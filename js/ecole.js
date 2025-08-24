// ========================================
// École – rendu dynamique depuis infos.xlsx
// Feuilles lues : ECOLE_LEVELS,
//                 ECOLE_INTERVENTIONS, ECOLE_STATS
// Nécessite: data.js (AEAContent.loadEcole)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initBishop3DFA();
  if (window.Loader) Loader.hold();
  bootEcole().finally(() => { if (window.Loader) Loader.release(); });
});

async function bootEcole(){
  try{
    const { levels, interventions, badges } = await AEAContent.loadEcole();

    mountHeroBadges(badges);
    mountLevels(levels);
    mountInterventions(interventions, badges);

    if (window.AOS) AOS.refreshHard();
  }catch(e){
    console.warn('[ECOLE] fallback', e);
  }
}

/* ---------- Helpers ---------- */
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* ---------- Badges du hero ---------- */
function mountHeroBadges(stats){
  // stats (ECOLE_STATS) contient badge1, badge2, badge3
  const wrap = qs('.hero-badges');
  if (!wrap) return;
  const badges = stats.filter(a => a.badge.startsWith("badge"));
  if (!badges.length) return;
  wrap.innerHTML = badges.map(b => `<span class="badge">✅ ${esc(b.text)}</span>`).join('');
}

/* ---------- Parcours / niveaux ---------- */
function mountLevels(levels){
  // levels: [{title, tag, icon, obj1..obj4 -> objectives[], hours_per_week, max_students, description, active:true}]
  const wrap = qs('.levels-grid') || qs('#levelsGrid');
  if (!wrap || !Array.isArray(levels)) return;

  wrap.innerHTML = levels.map((L, i) => {
    const objectives = (L.objectives || []).filter(Boolean);
    // classes de couleur en fonction de tag pour rester proche du design
    const cls = (L.tag || '').toLowerCase().includes('début') ? 'beginner'
               : (L.tag || '').toLowerCase().includes('inter') ? 'intermediate'
               : 'advanced';

    return `
      <div class="level-card ${cls}" data-aos="zoom-in" data-aos-delay="${i*100}">
        <div class="level-header">
          <div class="level-icon">${esc(L.icon || '♟️')}</div>
          <h3>${esc(L.title || '')}</h3>
          <span class="level-tag">${esc(L.tag || '')}</span>
        </div>
        <div class="level-content">
          <h4>Objectifs :</h4>
          <ul>${objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
          <div class="level-info">
            ${L.hours_per_week ? `<span><i class="fas fa-clock"></i> ${esc(L.hours_per_week)}</span>` : ''}
            ${L.max_students ? `<span><i class="fas fa-users"></i> ${esc(L.max_students)} élèves max</span>` : ''}
          </div>
          <p class="level-description">${esc(L.description || '')}</p>
        </div>
      </div>
    `;
  }).join('');
}


/* ---------- Interventions scolaires ---------- */
function mountInterventions(interventions, stats){
  // interventions: [{school, active:true}, ...]
  const listWrap = qs('.schools-list ul');
  if (listWrap && interventions.schools) {
    listWrap.innerHTML = interventions.schools.map(s => `
      <li><i class="fas fa-school"></i> ${esc(s)}</li>
    `).join('');
  }

  const listWrapBen = qs('.benefits ul');
  if (listWrapBen && interventions.benefits) {
    listWrapBen.innerHTML = interventions.benefits.map(s => `
      <li><i class="fas fa-tachometer "></i> ${esc(s)}</li>
    `).join('');
  }
  // Stats ronds à droite (schools_count, students_per_year, years_experience)
  const statsWrap = qs('.stats-showcase');
  const schools_count = stats.find(a => a.badge == "schools_count");
  const students_per_year = stats.find(a => a.badge == "students_per_year");
  const years_experience = stats.find(a => a.badge == "years_experience");
  if (statsWrap) {
    const circles = [
      { value: schools_count.text, label: 'Écoles partenaires' },
      { value: students_per_year.text, label: "Élèves formés/an" },
      { value: years_experience.text, label: " Ans d'expérience" }
    ].filter(x => x.value != null);

    statsWrap.innerHTML = circles.map(c => `
      <div class="stat-circle">
        <span class="stat-number">${esc(c.value)}</span>
        <span class="stat-label">${esc(c.label)}</span>
      </div>
    `).join('');
  }
}

function initBishop3DFA(){
  const root  = document.getElementById('bishop3d');
  const stack = document.getElementById('bishopStack');
  if (!root || !stack) return;

  stack.innerHTML = '';
  const L = 56; // match --layers
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 0.42;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'bishop3d-layer';
    const s = 1 - (i/(L*140));                       // légère réduction progressive
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';
    layer.innerHTML = `<i class="fa-solid fa-chess-bishop" aria-hidden="true"></i>`;
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
