/* ======================================================
   Contact – version light (pas de formulaire)
   ====================================================== */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  initMapAnimation();
  initContactCards();
  initTransportAnim();
  initPhoneEasterEgg();
  AOS.refreshHard();
});

function initOpenStreetMap(){
  const map = L.map('mapOSM',{ scrollWheelZoom:false }).setView([45.69525,5.91172],17);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution:'© OpenStreetMap', maxZoom:19 }
  ).addTo(map);

  L.marker([45.69525,5.91172])
    .addTo(map)
    .bindPopup("<b>Académie d'Échecs</b><br>15 av. d'Annecy")
    .openPopup();
}

document.addEventListener('DOMContentLoaded', initOpenStreetMap);

/* ------------ Carte : pulsation + vagues ------------- */
function initMapAnimation() {
  const marker = document.querySelector('.map-marker');
  if (!marker) return;

  gsap.to(marker, { scale: 1.1, duration: 1, repeat: -1, yoyo: true, ease: 'power1.inOut' });

  setInterval(() => {
    const wave = document.createElement('div');
    wave.style.cssText =
      'position:absolute;top:50%;left:50%;width:60px;height:60px;border:2px solid var(--accent);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;';
    marker.appendChild(wave);

    gsap.to(wave, {
      width: 160,
      height: 160,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => wave.remove()
    });
  }, 2000);
}

/* ------------ Hover des cartes de contact ------------ */
function initContactCards() {
  document.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('mouseenter', () =>
      gsap.to(card.querySelector('.contact-icon'), { rotation: 360, scale: 1.1, duration: 0.6 })
    );
    card.addEventListener('mouseleave', () =>
      gsap.to(card.querySelector('.contact-icon'), { rotation: 0,   scale: 1,   duration: 0.6 })
    );
  });
}

/* -------- Animation des options de transport --------- */
function initTransportAnim() {
  document.querySelectorAll('.transport-item').forEach((item, i) => {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 80%' },
      x: -50,
      opacity: 0,
      duration: 0.6,
      delay: i * 0.1
    });
    item.addEventListener('mouseenter', () =>
      gsap.to(item.querySelector('i'), { scale: 1.2, rotation: 15, duration: 0.3 })
    );
    item.addEventListener('mouseleave', () =>
      gsap.to(item.querySelector('i'), { scale: 1, rotation: 0, duration: 0.3 })
    );
  });
}

/* -------------- Easter-egg sur le numéro ------------- */
function initPhoneEasterEgg() {
  const phone = document.querySelector('a[href^="sms:"]');
  if (!phone) return;

  let clicks = 0;
  phone.addEventListener('click', e => {
    clicks++;
    if (clicks === 5) {
      e.preventDefault();
      const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
      const colors = ['#f4c430', '#e6b520', '#1a1a1a'];

      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.textContent = pieces[Math.floor(Math.random() * pieces.length)];
        p.style.cssText = `position:fixed;font-size:2rem;pointer-events:none;z-index:9999;
          color:${colors[Math.floor(Math.random() * colors.length)]};
          left:${Math.random() * innerWidth}px;top:${Math.random() * innerHeight}px`;
        document.body.appendChild(p);

        gsap.to(p, {
          y: 100,
          opacity: 0,
          rotation: Math.random() * 360,
          duration: 2,
          ease: 'power2.in',
          onComplete: () => p.remove()
        });
      }
      clicks = 0;
    }
  });
}
