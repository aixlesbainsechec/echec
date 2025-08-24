/* ==============================================================
   Bande défilante dynamique – v2025-07-03
   - Articles récents (WordPress API)
   - CTA statiques
   - Prochain événement (Google Sheet)
   ============================================================== */

/* █ 1.  CONSTANTES ──────────────────────────────────────────── */
const TICKER = document.getElementById("ticker");

/* 1-a)  Articles WordPress ----------------------------------- */
const WP_SITE   = "aixlesbainsechecs.org";   // domaine du blog
const WP_POSTS  = `https://public-api.wordpress.com/wp/v2/sites/${WP_SITE}/posts`
               +  "?_fields=id,title,link&per_page=4&orderby=date&order=desc";

/* 1-b)  Google Sheet  ---------------------------------------- */
const SHEET_ID  = "1Nku_OIPzC1gW56sBnekMxUVqZLtOqJoNmFgnmfIDyQ4";
const TAB_GID   = "1";                       // onglet « Événements »
const SHEET_URL = `https://opensheet.elk.sh/${SHEET_ID}/${TAB_GID}`;

/* 1-c) CTA permanents ---------------------------------------- */
const STATIC_ITEMS = [
  { html: icn("user-plus") + "  Inscriptions 2025-2026", url: "pages/horaires.html#tarifs" },
  { html: icn("envelope")  + "  Contactez-nous",         url: "pages/contact.html" }
];

/* █ 2.  HELPERS ─────────────────────────────────────────────── */
function icn(name){ return `<i class="fas fa-${name}"></i>`; }
function pad(n){ return n.toString().padStart(2,"0"); }
function isoDate(d,y){ const m=d.getMonth()+1, dd=d.getDate(); return `${y??d.getFullYear()}-${pad(m)}-${pad(dd)}`; }

/* █ 3.  ARTICLES WP ─────────────────────────────────────────── */
async function getLastPosts(){
  try{
    const posts = await (await fetch(WP_POSTS)).json();
    return posts.map(p => ({
      html: icn("newspaper") + "  " + p.title.rendered,
      url : `pages/article.html?id=${p.id}`
    }));
  }catch(err){
    console.error("Ticker – posts :",err);
    return [];
  }
}

/* █ 4.  PROCHAIN ÉVÉNEMENT ─────────────────────────────────── */
async function getNextEvent(){
  try{
    const rows = await (await fetch(SHEET_URL,{cache:"no-store"})).json(); // tableau d’objets
    if(!Array.isArray(rows)) throw new Error("Format Sheet inattendu");

    /* ► on convertit chaque ligne en Date JS */
    const today       = new Date();
    const horizonPlus = new Date(today); horizonPlus.setDate(horizonPlus.getDate()+30); // chercher dans les 30 j
    const monthIdx    = abbr => ["JAN","FÉV","MAR","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"].indexOf(abbr);

    const upcoming = rows
      .filter(r => r.day && r.month && r.year)          // lignes datées
      .map(r => {
        const d = new Date(r.year, monthIdx(r.month), r.day);
        return {...r, dateObj:d};
      })
      .filter(r => r.dateObj >= today && r.dateObj <= horizonPlus) // entre aujourd’hui et +30 j
      .sort((a,b)=>a.dateObj-b.dateObj)[0];                         // plus proche

    if(!upcoming) return [];

    const prettyDate = upcoming.dateObj.toLocaleDateString("fr-FR",{ day:"numeric", month:"short" });
    return [{
      html: icn("calendar-check") + `  ${upcoming.title} – ${prettyDate}`,
      url : "pages/evenements.html#eventsGrid"
    }];
  }catch(err){
    console.error("Ticker – event :",err);
    return [];
  }
}

/* █ 5.  CONSTRUCTION DU TICKER ─────────────────────────────── */
(async function initTicker(){
  const items = [
    ...(await getLastPosts()),
    ...STATIC_ITEMS,
    ...(await getNextEvent())
  ];

  if(!items.length){ TICKER.style.display = "none"; return; }

  /* • contenu */
  TICKER.innerHTML = items
    .map(i => `<div class="ticker-item"><a href="${i.url}">${i.html}</a></div>`)
    .join("");

  /* • duplication pour défilement infini */
  TICKER.innerHTML += TICKER.innerHTML + TICKER.innerHTML;
})();
