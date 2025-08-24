/* ======================================================
   Contact – reine 3D + Leaflet + petites anims
   ====================================================== */
if (window.gsap) { gsap.registerPlugin(window.ScrollTrigger); }

document.addEventListener('DOMContentLoaded', () => {
  initQueen3DFA();
  initLeaflet();
  initContactCards();
  initTransportAnim();
  initPhoneEasterEgg();
  window.AOS?.init?.();
  // petit refresh des observers si GSAP/AOS présents
  window.AOS?.refreshHard?.();
  window.ScrollTrigger?.refresh?.();
});

/* ------------ Reine 3D (Font Awesome) ------------- */
function initQueen3DFA(){
  const root  = document.getElementById('queen3d');
  const stack = document.getElementById('queenStack');
  if (!root || !stack) return;

  stack.innerHTML = '';
  const L = 56; // match --layers
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 0.42;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'queen3d-layer';
    const s = 1 - (i/(L*140));                       // légère réduction progressive
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';
    layer.innerHTML = `<i class="fa-solid fa-chess-queen" aria-hidden="true"></i>`;
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

/* ------------------ Leaflet ------------------ */
function initLeaflet(){
  if (!window.L) return;
  const lat = 45.69525, lng = 5.91172;
  const map = L.map('mapOSM', { scrollWheelZoom:false }).setView([lat,lng], 17);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap', maxZoom:19
  }).addTo(map);

  L.marker([lat,lng])
    .addTo(map)
    .bindPopup("<b>Académie d'Échecs</b><br>15 av. d'Annecy")
    .openPopup();
}

/* ------------ Hover des cartes de contact ------------ */
function initContactCards() {
  if (!window.gsap) return;
  document.querySelectorAll('.contact-card').forEach(card => {
    const icon = card.querySelector('.contact-icon');
    card.addEventListener('mouseenter', () =>
      gsap.to(icon, { rotation: 360, scale: 1.1, duration: 0.6, ease: 'power2.out' })
    );
    card.addEventListener('mouseleave', () =>
      gsap.to(icon, { rotation: 0,   scale: 1,   duration: 0.6, ease: 'power2.inOut' })
    );
  });
}

/* -------- Animation des options de transport --------- */
function initTransportAnim() {
  if (!window.gsap || !window.ScrollTrigger) return;
  document.querySelectorAll('.transport-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 85%' },
      x: -50, opacity: 0, duration: 0.6, delay: i * 0.05
    });
    item.addEventListener('mouseenter', () =>
      gsap.to(item.querySelector('i'), { scale: 1.2, rotation: 15, duration: 0.25 })
    );
    item.addEventListener('mouseleave', () =>
      gsap.to(item.querySelector('i'), { scale: 1, rotation: 0, duration: 0.25 })
    );
  });
}

/* -------------- Easter-egg sur le numéro ------------- */
function initPhoneEasterEgg() {
  if (!window.gsap) return;
  const phone = document.querySelector('a[href^="sms:"]');
  if (!phone) return;

  let clicks = 0;
  phone.addEventListener('click', e => {
    clicks++;
    if (clicks === 5) {
      e.preventDefault();
      const pieces = ['♔','♕','♖','♗','♘','♙'];
      const colors = ['#f4c430','#e6b520','#1a1a1a'];
      for (let i=0;i<20;i++){
        const p = document.createElement('div');
        p.textContent = pieces[Math.floor(Math.random()*pieces.length)];
        p.style.cssText = `position:fixed;font-size:2rem;pointer-events:none;z-index:9999;
          color:${colors[Math.floor(Math.random()*colors.length)]};
          left:${Math.random()*innerWidth}px; top:${Math.random()*innerHeight}px`;
        document.body.appendChild(p);
        gsap.to(p, {
          y: 100, opacity: 0, rotation: Math.random()*360, duration: 2, ease: 'power2.in',
          onComplete: () => p.remove()
        });
      }
      clicks = 0;
    }
  });
}
  