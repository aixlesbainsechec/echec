// ========================================
// Animations – AEA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  init3DCards();
  initMouseParallax();
  initFloatingPieces();
  initTypewriter();
});

/* Effet 3D sur les cartes */
function init3DCards(){
  const cards = document.querySelectorAll('.info-card');
  cards.forEach(card=>{
    let rafId = 0;
    const onMove = (e)=>{
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = (y - r.height/2) / 12;
      const ry = (r.width/2 - x) / 12;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(()=>{
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
    };
    const reset = ()=>{
      cancelAnimationFrame(rafId);
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
    };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);
  });
}

function initMouseParallax(){
  const els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;
  document.addEventListener('mousemove', (e)=>{
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    els.forEach(el=>{
      const s = parseFloat(el.dataset.parallax || '0.05');
      el.style.transform = `translate(${(-dx*s).toFixed(1)}px, ${(-dy*s).toFixed(1)}px)`;
    });
  });
}

function initFloatingPieces(){
  const container = document.createElement('div');
  container.className = 'floating-pieces';
  Object.assign(container.style,{
    position:'fixed', inset:'0', pointerEvents:'none', zIndex:'2'
  });
  document.body.appendChild(container);

  document.addEventListener('click', (e)=>{
    if (e.target.closest('a,button,[role="button"]')) return;
    const glyphs = ['♔','♕','♖','♗','♘','♙'];
    const d = document.createElement('div');
    d.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    Object.assign(d.style,{
      position:'absolute', left:`${e.clientX}px`, top:`${e.clientY}px`,
      fontSize:'34px', color:'var(--accent)', transform:'translate(-50%,-50%)', willChange:'transform,opacity'
    });
    container.appendChild(d);
    if (window.gsap){
      gsap.to(d,{
        y:(Math.random()*200-100), x:(Math.random()*200-100), rotation:(Math.random()*220-110),
        opacity:0, duration: .8 + Math.random()*1.2, ease:'power2.out',
        onComplete:()=> d.remove()
      });
    }else{
      d.style.transition='transform .9s ease, opacity .9s ease';
      requestAnimationFrame(()=>{
        d.style.transform = 'translate(-50%,-50%) translate(20px,-40px) rotate(40deg)';
        d.style.opacity = '0';
        setTimeout(()=>d.remove(), 900);
      });
    }
  });
}

function initTypewriter(){
  document.querySelectorAll('.typewriter').forEach(el=>{
    const txt = el.textContent;
    el.textContent='';
    let i=0;
    const it = setInterval(()=>{
      el.textContent += txt.charAt(i++);
      if (i>=txt.length){ clearInterval(it); el.style.borderRight='none'; }
    }, 70);
  });
}
