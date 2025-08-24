// ========================================
// Navigation – AEA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const dropdowns = document.querySelectorAll('.dropdown');
  const header = document.getElementById('header');

  // Burger
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('active');
    navToggle.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // Dropdown mobile
  dropdowns.forEach(d=>{
    const link = d.querySelector('.nav-link');
    link.addEventListener('click', (e)=>{
      if (window.innerWidth <= 768){
        e.preventDefault();
        d.classList.toggle('active');
        // ferme autres
        dropdowns.forEach(x=>{ if (x!==d) x.classList.remove('active'); });
      }
    });
  });

  // Fermeture au clic hors menu
  document.addEventListener('click', (e)=>{
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)){
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded','false');
    }
  });

  // Header up/down on scroll (complète app.js)
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    if (y <= 0){
      header.classList.remove('scroll-up','scroll-down');
      last = 0; return;
    }
    if (y > last){
      header.classList.remove('scroll-up');
      header.classList.add('scroll-down');
    }else{
      header.classList.remove('scroll-down');
      header.classList.add('scroll-up');
    }
    last = y;
  }, {passive:true});

  // Active link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a=>{
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    if (current === href.split('/').pop()) a.classList.add('active');
  });
});
