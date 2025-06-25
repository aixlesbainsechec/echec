/* ==========================================
   Bande défilante dynamique
   ========================================== */
const TICKER      = document.getElementById('ticker');
const SITE_WP     = 'aixlesbainsechecs.org';
const API_ARTICLE = `https://public-api.wordpress.com/wp/v2/sites/${SITE_WP}/posts?_fields=id,title,link&per_page=4&orderby=date&order=desc`;
const API_EVENTS  = 'js/events.json';   // <- ton export JSON du planning (voir plus bas)

/* ---------- helpers ---------- */
const icon = i => `<i class="fas fa-${i}"></i>`;

/* ---------- bloc CTA statiques ---------- */
const STATIC_ITEMS = [
  { html: `${icon('user-plus')}  Inscription 2025-2026`, url: 'pages/horaires.html#tarifs' },
  { html: `${icon('envelope')}  Contactez-nous`,        url: 'pages/contact.html' }
];

/* ---------- fetch derniers articles ---------- */
async function fetchLastPosts() {
  try {
    const data = await fetch(API_ARTICLE).then(r => r.json());
    return data.map(p => ({
      html: `${icon('newspaper')}  ${p.title.rendered}`,
      url : `blog/article.html?id=${p.id}`
    }));
  } catch (e) {
    console.error('Posts:', e);
    return [];
  }
}

/* ---------- événement du jour ---------- */
async function fetchTodayEvent() {
  try {
    /* exemple : un petit JSON statique {date:"2025-06-26",title:"Apéro Blitz",url:"pages/evenements.html"} */
    const data = await fetch(API_EVENTS).then(r => r.json());
    const today = new Date().toISOString().slice(0, 10);
    const ev = data.find(e => e.date === today);
    return ev
      ? [{ html: `${icon('calendar-check')}  ${ev.title} aujourd’hui`, url: ev.url }]
      : [];
  } catch (e) {
    console.error('Event:', e);
    return [];
  }
}

/* ---------- build ticker ---------- */
(async function initTicker() {
  const items = [
    ...(await fetchLastPosts()),
    ...STATIC_ITEMS,
    ...(await fetchTodayEvent())
  ];

  if (!items.length) return;

  TICKER.innerHTML = items
    .map(i => `<div class="ticker-item"><a href="${i.url}">${i.html}</a></div>`)
    .join('');

  /* duplication pour l’infini */
  TICKER.innerHTML += TICKER.innerHTML;
})();
