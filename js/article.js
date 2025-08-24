/* ======================================================
   Article – lecture d’un post WordPress.com par ID/slug
   ====================================================== */
const API = 'https://public-api.wordpress.com/wp/v2/sites/aixlesbainsechecs.org/';

const params = new URLSearchParams(location.search);
const id    = params.get('id');
const slug  = params.get('slug');

const wrap  = document.getElementById('articleWrap');
const h1    = document.getElementById('articleTitle');
const sub   = document.getElementById('articleSubtitle');
const crumb = document.getElementById('crumbTitle');

function htmlToText(html){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  const text = tmp.textContent || tmp.innerText || '';
  return text.replace(/\s+/g,' ').trim();
}
function firstImage(html){
  const m = (html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
function fmtDateFR(iso){
  try{ return new Date(iso).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'2-digit' }); }
  catch{ return iso; }
}

async function fetchPost(){
  if (id) {
    const r = await fetch(`${API}posts/${id}?_embed`, { cache:'no-store' });
    if (!r.ok) throw new Error('Post introuvable');
    return r.json();
  }
  if (slug) {
    const r = await fetch(`${API}posts?slug=${encodeURIComponent(slug)}&_embed`, { cache:'no-store' });
    if (!r.ok) throw new Error('Post introuvable');
    const arr = await r.json();
    if (!arr.length) throw new Error('Post introuvable');
    return arr[0];
  }
  throw new Error('Aucun ID/slug fourni');
}

function applyContent(p){
  const titleTxt = htmlToText(p.title?.rendered || 'Article');
  const dateFR   = fmtDateFR(p.date);
  const media    = p._embedded?.['wp:featuredmedia']?.[0];
  const heroSrc  = media?.source_url || firstImage(p.content?.rendered);
  const heroAlt  = media?.alt_text || titleTxt;

  // Titre / Sous-titre / Crumb / <title>
  h1.textContent = titleTxt;
  crumb.textContent = titleTxt;
  sub.textContent = dateFR;
  document.title = `${titleTxt} – Académie d’Échecs`;

  // Catégories & tags (si présents via _embed)
  const terms = p._embedded?.['wp:term'] || [];
  const cats  = (terms[0] || []).map(t => t.name).filter(Boolean);
  const tags  = (terms[1] || []).map(t => t.name).filter(Boolean);

  // Contenu WP (on sécurise les liens/iframes/images après insertion)
  wrap.innerHTML = `
    <article class="wp-article">
      <div class="post-meta">
        <i class="fa-regular fa-calendar"></i> <time datetime="${p.date}">${dateFR}</time>
        ${cats.length ? `• <i class="fa-regular fa-folder-open"></i> ${cats.map(c=>`<span class="tag-badge">${c}</span>`).join(' ')}` : ''}
      </div>
      ${heroSrc ? `<img class="post-hero" src="${heroSrc}" alt="${heroAlt}">` : ''}
      <div class="wp-content" id="wpContent">${p.content?.rendered || ''}</div>
      <div class="open-wp">
        <a class="btn btn-outline" href="${p.link}" target="_blank" rel="noopener">
          Lire sur WordPress <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    </article>
  `;

  // Post-traitement du HTML rendu
  const content = document.getElementById('wpContent');
  if (content){
    content.querySelectorAll('a[href]').forEach(a=>{
      // liens externes → nouvel onglet
      const url = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(url)) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    content.querySelectorAll('img').forEach(img=>{
      img.loading = 'lazy'; img.decoding = 'async';
      img.style.maxWidth = '100%'; img.style.height = 'auto';
    });
    // Nettoyage éventuel des styles inline agressifs
    content.querySelectorAll('[style]').forEach(el=>{
    });
  }
}

async function init(){
  try{
    const post = await fetchPost();
    applyContent(post);
  }catch(e){
    console.warn(e);
    wrap.innerHTML = `<div class="sidebar-card"><p>Article introuvable.</p><p><a class="btn btn-primary" href="blog.html">Retour au blog</a></p></div>`;
  }finally{
    const loader = document.getElementById('loader');
    if (loader){ loader.classList.add('hide'); setTimeout(()=>loader.remove(), 600); }
    window.AOS?.refreshHard?.();
    window.ScrollTrigger?.refresh?.();
  }
}

document.addEventListener('DOMContentLoaded', init);
