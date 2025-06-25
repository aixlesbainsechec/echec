
const API = 'https://public-api.wordpress.com/wp/v2/sites/aixlesbainsechecs.org/';
const id = new URLSearchParams(location.search).get('id');
const wrap = document.getElementById('articleWrap');

function firstImage(html){
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

async function loadPost(pid){
  try{
    const res = await fetch(`${API}posts/${pid}?_embed`);
    if(!res.ok) throw new Error(res.statusText);
    const p = await res.json();
    let img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || firstImage(p.content.rendered);
    wrap.innerHTML = `
      <h1>${p.title.rendered}</h1>
      ${img?`<img src="${img}" style="width:100%;border-radius:12px;margin:1.5rem 0">`:''}
      <time datetime="${p.date}">${new Date(p.date).toLocaleDateString()}</time>
      <div class="wp-content">${p.content.rendered}</div>
    `;
  }catch(e){
    console.error(e);
    wrap.innerHTML = '<p>Impossible de charger l’article.</p>';
  }
}

if(id) loadPost(id);
else wrap.innerHTML = '<p>Article introuvable.</p>';
