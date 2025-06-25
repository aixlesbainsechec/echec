// ========================================
// Navigation - Académie d'Échecs
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    // Toggle menu mobile
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Animation GSAP pour le menu
        if (navMenu.classList.contains('active')) {
            gsap.from('.nav-item', {
                opacity: 0,
                x: -50,
                duration: 0.3,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    });
    
    // Fermer le menu au clic sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Si c'est un lien dropdown sur mobile, empêcher la navigation
            if (window.innerWidth <= 768 && link.parentElement.classList.contains('dropdown')) {
                e.preventDefault();
                toggleDropdown(link.parentElement);
            } else if (!link.getAttribute('href').startsWith('#')) {
                // Pour les liens normaux, fermer le menu
                closeMenu();
            }
        });
    });
    
    // Gestion des dropdowns sur mobile
    function toggleDropdown(dropdown) {
        dropdown.classList.toggle('active');
        
        // Fermer les autres dropdowns
        dropdowns.forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
            }
        });
    }
    
    // Fermer le menu
    function closeMenu() {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            closeMenu();
        }
    });
    
    // Gestion du scroll pour masquer/afficher le header
    let lastScroll = 0;
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scroll vers le bas
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scroll vers le haut
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });
    
    // Indicateur de page active
    function setActiveNavItem() {
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            
            if (currentPath.includes(linkPath) && linkPath !== '#') {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    setActiveNavItem();
    
    // Breadcrumb dynamique (pour les pages internes)
    function generateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        const path = window.location.pathname.split('/').filter(p => p);
        let html = '<a href="/">Accueil</a>';
        
        path.forEach((segment, index) => {
            const name = segment.replace('.html', '').replace(/-/g, ' ');
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            
            if (index === path.length - 1) {
                html += ` <span>></span> <span class="current">${capitalizedName}</span>`;
            } else {
                html += ` <span>></span> <a href="/${path.slice(0, index + 1).join('/')}">${capitalizedName}</a>`;
            }
        });
        
        breadcrumb.innerHTML = html;
    }
    
    generateBreadcrumb();
    
    // Préchargement des pages au survol
    const prefetchLinks = document.querySelectorAll('a[href^="/"], a[href^="pages/"]');
    
    prefetchLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            const href = link.getAttribute('href');
            if (!document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
                const prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = href;
                document.head.appendChild(prefetch);
            }
        });
    });
    
    // Animation de transition entre pages
    function initPageTransition() {
        const links = document.querySelectorAll('a:not([target="_blank"])');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Ignorer les ancres et liens externes
                if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) {
                    return;
                }
                
                e.preventDefault();
                
                // Animation de sortie
                gsap.to('body', {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        window.location.href = href;
                    }
                });
            });
        });
    }
    
    // Désactiver pour le moment pour éviter les problèmes
    // initPageTransition();
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Échap pour fermer le menu
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
        
        // Tab navigation améliorée
        if (e.key === 'Tab') {
            // Gérer le focus trap dans le menu mobile si ouvert
            if (navMenu.classList.contains('active')) {
                const focusableElements = navMenu.querySelectorAll(
                    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
    
    // Accessibilité - Annonces pour les lecteurs d'écran
    function announcePageChange(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Export des fonctions utiles
    window.Navigation = {
        closeMenu,
        toggleDropdown,
        setActiveNavItem,
        announcePageChange
    };
});