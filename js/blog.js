/* ======================================================
   Blog – agrégation WordPress.com + Tour 3D (MAJ liens internes)
   ====================================================== */

/* ---------- Config API ---------- */
const API_BASE = 'https://public-api.wordpress.com/wp/v2/sites/aixlesbainsechecs.org/';
const PAGE_SIZE = 12;

/* ---------- State / DOM ---------- */
const postGrid  = document.getElementById('postGrid');
const searchInp = document.getElementById('searchInput');
const searchClr = document.getElementById('searchClear');
const pagiWrap  = document.getElementById('pagiWrap');
const yearList  = document.getElementById('yearList');

let currentPage = 1;
let totalPages  = 1;
let currentQuery = '';
let currentYear  = null;

const CACHE = Object.create(null);

/* ======================================================
   HERO – Tour 3D (Font Awesome)
   ====================================================== */
function initRook3DFA(){
  const root  = document.getElementById('rook3d');
  const stack = document.getElementById('rookStack');
  if (!root || !stack) return;

  stack.innerHTML = '';
  const L = 56;
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 0.42;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'rook3d-layer';
    const s = 1 - (i/(L*140));
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';
    layer.innerHTML = `<i class="fa-solid fa-chess-rook" aria-hidden="true"></i>`;
    stack.appendChild(layer);
  }

  let rx = -8, ry = -16, tx = -8, ty = -16;
  const spin = 0.08;
  const tick = () => {
    ty -= spin;
    rx += (tx - rx) * 0.08;
    ry += (ty - ry) * 0.08;
    stack.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(tick);
  };
  tick();

  const ro = new ResizeObserver(()=>{
    const t = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || thickness;
    [...stack.children].forEach((layer, i)=>{
      const s = 1 - (i/(L*140));
      layer.style.transform = `translateZ(${-i*t}px) scale(${s})`;
    });
  });
  ro.observe(root);

  setTimeout(()=>{
    const test = stack.querySelector('i');
    if (!test || getComputedStyle(test).fontFamily.toLowerCase().indexOf('font awesome') === -1){
      [...stack.children].forEach(l => l.innerHTML = `<span style="font-size:calc(var(--size)*.58);font-weight:700">♜</span>`);
    }
  }, 0);
}

/* ======================================================
   API WordPress – Fetch helpers
   ====================================================== */
async function fetchPosts(query='', year=null, page=1){
  let url = `${API_BASE}posts?_embed&per_page=${PAGE_SIZE}&page=${page}`;
  if (query) url += `&search=${encodeURIComponent(query)}`;
  if (year){
    url += `&after=${year}-01-01T00:00:00&before=${year}-12-31T23:59:59`;
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur API (${res.status})`);
  totalPages = +res.headers.get('X-WP-TotalPages') || 1;
  return res.json();
}

async function fetchFirstYear(){
  const res = await fetch(`${API_BASE}posts?per_page=1&orderby=date&order=asc&_fields=date`, { cache:'no-store' });
  if (!res.ok) return new Date().getFullYear();
  const arr = await res.json();
  return arr?.[0]?.date ? new Date(arr[0].date).getFullYear() : new Date().getFullYear();
}

/* ======================================================
   Render helpers
   ====================================================== */
function showSkeleton(){
  postGrid.innerHTML = Array.from({length:PAGE_SIZE}).map(()=>`
    <article class="post-card skeleton" aria-hidden="true">
      <div class="sk-img"></div>
      <div class="sk-line" style="width:80%"></div>
      <div class="sk-line" style="width:60%"></div>
    </article>`).join('');
}

function firstImage(html){
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
function htmlToText(html){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  const text = tmp.textContent || tmp.innerText || '';
  return text.replace(/\s+/g,' ').trim();
}
function formatDateFR(iso){
  try{ return new Date(iso).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'2-digit' }); }
  catch{ return iso; }
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function getFeatured(p){
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const src   = media?.source_url || firstImage(p.content?.rendered) || '../assets/img/default-thumb.jpg';
  const alt   = media?.alt_text || htmlToText(p.title?.rendered) || 'Illustration';
  return { src, alt };
}

function buildCard(p){
  const { src, alt } = getFeatured(p);
  const title   = htmlToText(p.title?.rendered || '(sans titre)');
  const excerpt = htmlToText(p.excerpt?.rendered || p.content?.rendered || '');
  const small   = excerpt.length > 160 ? excerpt.slice(0,160) + '…' : excerpt;
  const dateFR  = formatDateFR(p.date);

  // 👉 Lien interne vers la page article
  const href = `article.html?id=${p.id}`;
  return `
    <a href="${href}" class="post-card">
      <img class="post-thumb" src="${src}" alt="${escapeHtml(alt)}"/>
      <div class="post-body">
        <time class="post-meta" datetime="${p.date}">${dateFR}</time>
        <h3>${escapeHtml(title)}</h3>
        <p class="post-excerpt">${escapeHtml(small)}</p>
      </div>
    </a>`;
}

function render(posts){ postGrid.innerHTML = posts.map(buildCard).join(''); }

function renderPagination(){
  const makeBtn = (n, label=n) => `<button ${n===currentPage?'disabled':''} data-page="${n}">${label}</button>`;
  const pages = totalPages;
  if (pages <= 8){
    pagiWrap.innerHTML = Array.from({length:pages},(_,i)=>makeBtn(i+1)).join('');
    return;
  }
  const parts = [];
  parts.push(makeBtn(1));
  if (currentPage > 4) parts.push(`<span>…</span>`);
  const start = Math.max(2, currentPage-2);
  const end   = Math.min(pages-1, currentPage+2);
  for(let i=start;i<=end;i++) parts.push(makeBtn(i));
  if (currentPage < pages-3) parts.push(`<span>…</span>`);
  parts.push(makeBtn(pages));
  pagiWrap.innerHTML = parts.join('');
}

/* ======================================================
   Loader principal
   ====================================================== */
async function load(page=1){
  currentPage = page;
  const key = `${currentQuery}_${currentYear}_${page}`;
  if (CACHE[key]){
    render(CACHE[key]); renderPagination(); return;
  }
  showSkeleton();
  try{
    const data = await fetchPosts(currentQuery, currentYear, page);
    CACHE[key] = data;
    render(data);
    renderPagination();
  }catch(e){
    console.warn('Blog load error', e);
    postGrid.innerHTML = `
      <div class="sidebar-card" style="text-align:center">
        <p><strong>Impossible de charger les articles pour le moment.</strong></p>
        <p>Vous pouvez consulter le <a href="http://aixlesbains-echecs.blogspot.com" target="_blank" rel="noopener">blog historique</a>.</p>
      </div>`;
    pagiWrap.innerHTML = '';
  }finally{
    const loader = document.getElementById('loader');
    if (loader) { loader.classList.add('hide'); setTimeout(()=>loader.remove(), 600); }
    window.AOS?.refreshHard?.();
    window.ScrollTrigger?.refresh?.();
  }
}

/* ======================================================
   Filtres / Recherche / URL
   ====================================================== */
function bindEvents(){
  // Pagination
  pagiWrap.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    const n = +btn.dataset.page;
    load(n);
    window.scrollTo({ top: postGrid.offsetTop - 90, behavior: 'smooth' });
    updateURL();
  });

  // Recherche (debounce)
  let t;
  searchInp.addEventListener('input', ()=>{
    clearTimeout(t);
    t = setTimeout(()=>{
      currentQuery = searchInp.value.trim();
      currentPage = 1;
      load(1);
      updateURL();
    }, 280);
  });
  // Effacer
  searchClr?.addEventListener('click', ()=>{
    searchInp.value = '';
    if (currentQuery){
      currentQuery = '';
      load(1);
      updateURL();
    }
    searchInp.focus();
  });

  // Filtre année
  yearList.addEventListener('click', e=>{
    const li = e.target.closest('li[data-year], li[data-all]');
    if (!li) return;
    [...yearList.querySelectorAll('li')].forEach(n => n.classList.remove('active'));
    li.classList.add('active');
    currentYear = li.dataset.all ? null : li.dataset.year;
    currentPage = 1;
    load(1);
    updateURL();
  });
}

async function populateYears(){
  try{
    const firstYear = await fetchFirstYear();
    const thisYear  = new Date().getFullYear();
    let html = `<li class="active" data-all="1">Tous</li>`;
    for (let y=thisYear; y>=firstYear; y--) html += `<li data-year="${y}">${y}</li>`;
    yearList.innerHTML = html;
  }catch{
    yearList.innerHTML = `<li class="active" data-all="1">Tous</li>`;
  }
}

function updateURL(){
  const params = new URLSearchParams();
  if (currentQuery) params.set('q', currentQuery);
  if (currentYear)  params.set('year', currentYear);
  if (currentPage>1) params.set('page', currentPage);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}
function readURL(){
  const u = new URL(location.href);
  const q = u.searchParams.get('q') || '';
  const y = u.searchParams.get('year');
  const p = +(u.searchParams.get('page') || 1);
  if (q) { currentQuery = q; searchInp.value = q; }
  if (y) { currentYear  = y; }
  currentPage = Math.max(1, p);
}

/* ======================================================
   Init
   ====================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.gsap) { gsap.registerPlugin(window.ScrollTrigger); }
  initRook3DFA();
  await populateYears();
  readURL();
  if (currentYear){
    const li = yearList.querySelector(`li[data-year="${currentYear}"]`);
    yearList.querySelectorAll('li').forEach(n=>n.classList.remove('active'));
    (li || yearList.querySelector('li[data-all]'))?.classList.add('active');
  }
  bindEvents();
  load(currentPage);
  window.AOS?.init?.();
  window.AOS?.refreshHard?.();
  window.ScrollTrigger?.refresh?.();
});
