// navigation.js
(function(){
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');
  const header    = document.getElementById('header');
  let lastScrollY = 0;

  // Backdrop injecté si absent
  let backdrop = document.getElementById('navBackdrop');
  if(!backdrop){
    backdrop = document.createElement('div');
    backdrop.id = 'navBackdrop';
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  function openMenu(){
    navMenu.classList.add('active');
    navToggle.setAttribute('aria-expanded','true');

    lastScrollY = window.scrollY || 0;
    // Technique "position:fixed" qui garde la position du scroll
    document.body.style.top = `-${lastScrollY}px`;
    document.body.classList.add('nav-open');
  }

  function closeMenu(){
    navMenu.classList.remove('active');
    navToggle.setAttribute('aria-expanded','false');

    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, lastScrollY || 0);
  }

  navToggle?.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('active');
    isOpen ? closeMenu() : openMenu();
  });

  // Clic sur backdrop => fermeture
  backdrop.addEventListener('click', closeMenu);

  // Ferme au clic d’un lien du menu
  navMenu.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(a) closeMenu();
  });

  // Évite le "pull to refresh" / rubber band pendant le lock
  document.addEventListener('touchmove', (e)=>{
    if(document.body.classList.contains('nav-open') && !e.target.closest('#navMenu')){
      e.preventDefault();
    }
  }, {passive:false});
})();
