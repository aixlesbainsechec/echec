/* ===========================================================
   Home – Cartes dynamiques (pricing fixe, palmarès, école)
   Dépend de window.AEAData (data.js) et AOS (optionnel).
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  mountHomeCards();
});

async function mountHomeCards() {
  try {
    const cont = document.querySelector('.info-grid');
    if (!cont) return;

    // Sécurité si AEAData pas encore chargé
    if (!window.AEAData) {
      console.warn('[home-cards] AEAData indisponible – fallback statique.');
      cont.innerHTML = fallbackHTML();
      return;
    }

    const [palmares, levels] = await Promise.all([
      AEAData.fetchPalmares().catch(()=>[]),
      AEAData.fetchEcoleLevels().catch(()=>[])
    ]);

    const pickRandom = (arr) =>
      Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

    // ───────── 1) Carte Tarifs (fixe) ─────────
    const cardPricing = {
      iconHTML: '<i class="fas fa-tags"></i>',
      title: 'Nos Tarifs 2024–2025',
      text: "Licence FFE incluse • aides Pass’Sport / Pass Région",
      href: 'pages/horaires.html#tarifs'
    };

    // ───────── 2) Carte Palmarès (aléatoire) ─────────
    const p = pickRandom(palmares);
    const cardPalmares = p && {
      iconHTML: `<i class="fas ${medalForTier(p.tier)}"></i>`,
      title: p.title || 'Palmarès',
      text: (p.items && p.items.length ? p.items.slice(0, 2).join(' • ') : 'Résultats marquants du club'),
      href: 'pages/club.html#palmares'
    };

    // ───────── 3) Carte École (aléatoire) ─────────
    const l = pickRandom(levels);
    const iconHTML = iconFrom(l && l.icon);
    const cardEcole = l && {
      iconHTML,
      title: `École — ${escapeHtml(l.name || 'Parcours')}`,
      text: l.desc ? truncate(l.desc, 110) :
            (Array.isArray(l.objectives) && l.objectives.length ? l.objectives.slice(0,3).join(' • ') : 'Parcours de formation'),
      href: 'pages/ecole.html'
    };

    const cards = [cardPricing, cardPalmares, cardEcole].filter(Boolean);

    // Si une source est vide, on complète avec des fallbacks “propres”
    while (cards.length < 3) cards.push(null);
    cont.innerHTML = cards.map((c, i) => c ? cardHTML(c, 100 + i * 100) : fallbackCard(i)).join('');

  } catch (e) {
    console.warn('[home-cards] erreur', e);
    const cont = document.querySelector('.info-grid');
    if (cont) cont.innerHTML = fallbackHTML();
  }
}

/* ───────── Helpers rendu ───────── */

function cardHTML(c, delay = 0) {
  return `
    <div class="info-card" data-aos="zoom-in" data-aos-delay="${delay}">
      <div class="info-icon">${c.iconHTML}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.text)}</p>
      <a href="${c.href}" class="info-link">En savoir plus <i class="fas fa-arrow-right"></i></a>
    </div>
  `;
}

function fallbackCard(i){
  const defs = [
    {
      iconHTML: '<i class="fas fa-tags"></i>',
      title: 'Nos Tarifs',
      text: 'Licence FFE incluse • réductions',
      href: 'pages/horaires.html#tarifs'
    },
    {
      iconHTML: '<i class="fas fa-trophy"></i>',
      title: 'Palmarès',
      text: 'Résultats marquants',
      href: 'pages/club.html#palmares'
    },
    {
      iconHTML: '<i class="fas fa-graduation-cap"></i>',
      title: 'École d’échecs',
      text: 'Parcours de formation',
      href: 'pages/ecole.html'
    }
  ];
  return cardHTML(defs[i], 100 + i*100);
}

function fallbackHTML(){
  return [0,1,2].map(fallbackCard).join('');
}

/* ───────── Petits utilitaires ───────── */

function medalForTier(tier) {
  switch (String(tier||'').toLowerCase()) {
    case 'gold':   return 'fa-trophy';
    case 'silver': return 'fa-medal';
    case 'bronze': return 'fa-award';
    default:       return 'fa-trophy';
  }
}

function iconFrom(str){
  if (!str) return '<i class="fas fa-graduation-cap"></i>';
  const s = String(str).trim();
  // si c’est une classe Font Awesome “fa-...”
  if (/^fa[bsrl]?-/.test(s)) return `<i class="fas ${s}"></i>`;
  // sinon on assume un emoji ou texte
  return `<span class="emoji">${escapeHtml(s)}</span>`;
}

function truncate(text, max){
  const s = String(text||'');
  return s.length > max ? s.slice(0, max-1) + '…' : s;
}

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);
}
