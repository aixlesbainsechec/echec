
/* ===========================================
   Mini‑blog V2 – chargement à la demande + filtre année
   =========================================== */
const API_URL = 'https://public-api.wordpress.com/wp/v2/sites/aixlesbainsechecs.org/';
const PAGE_SIZE = 12;

const postGrid  = document.getElementById('postGrid');
const searchInp = document.getElementById('searchInput');
const pagiWrap  = document.getElementById('pagiWrap');
const yearList  = document.getElementById('yearList');

let currentPage = 1;
let totalPages  = 1;
let currentQuery = '';
let currentYear  = null;

const CACHE = {}; // clé `${query}_${year}_${page}`

/* ------------------- API fetch ------------------- */
async function fetchPosts(query='', year=null, page=1){
  let url = `${API_URL}posts?_embed&per_page=${PAGE_SIZE}&page=${page}`;
  if(query) url += `&search=${encodeURIComponent(query)}`;
  if(year){
    url += `&after=${year}-01-01T00:00:00&before=${year}-12-31T23:59:59`;
  }
  const res = await fetch(url);
  if(!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  totalPages = +res.headers.get('X-WP-TotalPages') || 1;
  return data;
}

/* ---------------- Skeleton ---------------------- */
function showSkeleton(){
  postGrid.innerHTML = Array.from({length:PAGE_SIZE}).map(()=>`
    <article class="post-card skeleton">
      <div class="sk-img"></div>
      <div class="sk-line" style="width:80%"></div>
      <div class="sk-line" style="width:60%"></div>
    </article>`).join('');
}

/* ---------------- Render ------------------------ */
function firstImage(html){
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
function buildCard(p){
  const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || firstImage(p.content.rendered) || '../img/default-thumb.jpg';
  const excerpt = p.excerpt?.rendered.replace(/<[^>]+>/g,'').slice(0,120)+'…';
  return `
    <a href="article.html?id=${p.id}" class="post-card">
      <img src="${img}" alt="">
      <h3>${p.title.rendered}</h3>
      <time datetime="${p.date}">${new Date(p.date).toLocaleDateString()}</time>
      <p>${excerpt}</p>
    </a>`;
}
function render(posts){
  postGrid.innerHTML = posts.map(buildCard).join('');
}
function renderPagination(){
  let html='';
  for(let i=1;i<=totalPages;i++){
    html += `<button ${i===currentPage?'disabled':''}>${i}</button>`;
  }
  pagiWrap.innerHTML = html;
}

/* ---------------- Main loader ------------------- */
async function load(page=1){
  currentPage = page;
  const key = `${currentQuery}_${currentYear}_${page}`;
  if(CACHE[key]){
    render(CACHE[key]);
    renderPagination();
    return;
  }
  showSkeleton();
  try{
    const data = await fetchPosts(currentQuery,currentYear,page);
    CACHE[key] = data;
    render(data);
    renderPagination();
  }catch(e){
    console.error(e);
    postGrid.innerHTML = '<p>Erreur de chargement.</p>';
    pagiWrap.innerHTML = '';
  }
}

/* ---------------- Events ------------------------ */
pagiWrap.addEventListener('click',e=>{
  if(e.target.tagName==='BUTTON' && !e.target.disabled){
    load(+e.target.textContent);
    window.scrollTo({top:postGrid.offsetTop-80,behavior:'smooth'});
  }
});

let debounceT;
searchInp.addEventListener('input',()=>{
  clearTimeout(debounceT);
  debounceT = setTimeout(()=>{
    currentQuery = searchInp.value.trim();
    load(1);
  },300);
});

yearList.addEventListener('click',e=>{
  if(e.target.dataset.year){
    [...yearList.children].forEach(li=>li.classList.remove('active'));
    e.target.classList.add('active');
    currentYear = e.target.dataset.year;
    load(1);
  }
});

/* ---------------- Populate year list ------------- */
async function populateYears(){
  try{
    const res = await fetch(`${API_URL}posts?per_page=1&orderby=date&order=asc&_fields=date`);
    const first = await res.json();
    const firstYear = new Date(first[0].date).getFullYear();
    const thisYear  = new Date().getFullYear();
    let html='';
    for(let y=thisYear; y>=firstYear; y--){
      html += `<li data-year="${y}">${y}</li>`;
    }
    yearList.innerHTML = html;
  }catch(e){
    console.error('Années non récupérées',e);
  }
}

/* ---------------- Init --------------------------- */
(async function init(){
  await populateYears();
  load(1);
})();

(function killLoader(){
  const loader = document.getElementById('loader');
  if(!loader) return;
  // même effet que dans app.js, mais instantané dès que la 1re page est prête
  loader.classList.add('hide');
  setTimeout(()=>loader.remove(), 600);   // délai = durée du fade-out CSS
})();
