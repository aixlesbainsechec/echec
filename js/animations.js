// ========================================
// Animations JavaScript - Académie d'Échecs
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Particules d'échecs dans le hero
    initChessParticles();
    
    // Animation du titre principal
    animateHeroTitle();
    
    // News ticker
    initNewsTicker();
    
    // Hover 3D sur les cartes
    init3DCards();
    
    // Parallax mouse
    initMouseParallax();
    
    // Animation des pièces d'échecs flottantes
    initFloatingPieces();
    
    // Effet de frappe
    initTypewriter();
    
    // Animations GSAP avancées
    initGSAPAnimations();
});

// Particules d'échecs animées
function initChessParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
    const numberOfParticles = 20;
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'chess-particle';
        particle.textContent = pieces[Math.floor(Math.random() * pieces.length)];
        particle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 30 + 20}px;
            opacity: ${Math.random() * 0.3 + 0.1};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-particle ${Math.random() * 20 + 10}s infinite;
            animation-delay: ${Math.random() * 5}s;
            color: var(--accent);
        `;
        particlesContainer.appendChild(particle);
    }
    
    // CSS pour l'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-particle {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            25% {
                transform: translate(50px, -50px) rotate(90deg);
            }
            50% {
                transform: translate(-30px, 30px) rotate(180deg);
            }
            75% {
                transform: translate(30px, 50px) rotate(270deg);
            }
        }
    `;
    document.head.appendChild(style);
}

// Animation du titre hero avec GSAP
function animateHeroTitle() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    // Split text pour animation par caractère
    const titleLines = heroTitle.querySelectorAll('.title-line');
    
    titleLines.forEach((line, index) => {
        const text = line.textContent;
        line.innerHTML = text.split('').map(char => 
            `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        
        gsap.from(line.querySelectorAll('.char'), {
            opacity: 0,
            y: 50,
            rotationX: -90,
            stagger: 0.05,
            delay: 0.5 + (index * 0.3),
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
    });
}

// News ticker infini
function initNewsTicker() {
    const ticker = document.querySelector('.ticker');
    if (!ticker) return;
    
    // Dupliquer le contenu pour l'effet infini
    const tickerContent = ticker.innerHTML;
    ticker.innerHTML = tickerContent + tickerContent;
    
    // Pause au survol
    ticker.addEventListener('mouseenter', () => {
        ticker.style.animationPlayState = 'paused';
    });
    
    ticker.addEventListener('mouseleave', () => {
        ticker.style.animationPlayState = 'running';
    });
}

// Effet 3D sur les cartes
function init3DCards() {
    const cards = document.querySelectorAll('.info-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// Parallax avec la souris
function initMouseParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.5;
            const x = (clientX - centerX) * speed;
            const y = (clientY - centerY) * speed;
            
            gsap.to(element, {
                x: x,
                y: y,
                duration: 1,
                ease: 'power2.out'
            });
        });
    });
}

// Pièces d'échecs flottantes
function initFloatingPieces() {
    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'floating-pieces';
    floatingContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    
    document.body.appendChild(floatingContainer);
    
    // Créer des pièces au clic
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
        
        const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
        const piece = document.createElement('div');
        piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
        piece.style.cssText = `
            position: absolute;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            font-size: 30px;
            color: var(--accent);
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        
        floatingContainer.appendChild(piece);
        
        // Animation GSAP
        gsap.to(piece, {
            y: -100,
            opacity: 0,
            rotation: Math.random() * 360,
            duration: 1.5,
            ease: 'power2.out',
            onComplete: () => piece.remove()
        });
    });
}

// Effet machine à écrire
function initTypewriter() {
    const typewriterElements = document.querySelectorAll('.typewriter');
    
    typewriterElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.display = 'block';
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                element.textContent += text[charIndex];
                charIndex++;
            } else {
                clearInterval(typeInterval);
                element.style.borderRight = 'none';
            }
        }, 100);
    });
}

// Animations GSAP complexes
function initGSAPAnimations() {
    // ScrollTrigger pour les animations au scroll
    gsap.registerPlugin(ScrollTrigger);
    
    // Animation des sections
    gsap.utils.toArray('.section').forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
    });
    
    // Timeline pour le hero
    const heroTl = gsap.timeline({ delay: 0.5 });
    
    heroTl
        .from('.hero-subtitle', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out'
        })
        .from('.stat-item', {
            opacity: 0,
            scale: 0.5,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.7)'
        }, '-=0.4')
        .from('.hero-cta .btn', {
            opacity: 0,
            x: -30,
            duration: 0.6,
            stagger: 0.2,
            ease: 'power2.out'
        }, '-=0.4')
        .from('.hero-scroll', {
            opacity: 0,
            y: -20,
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.2');
    
    // Morph SVG pour les formes
    const morphElements = document.querySelectorAll('.morph-shape');
    morphElements.forEach(element => {
        gsap.to(element, {
            morphSVG: element.dataset.morph,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
    });
    
    // Text scramble effect
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
        }
        
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        
        update() {
            let output = '';
            let complete = 0;
            
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += char;
                } else {
                    output += from;
                }
            }
            
            this.el.innerHTML = output;
            
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }
    
    // Appliquer l'effet scramble aux titres au survol
    const scrambleElements = document.querySelectorAll('.scramble-text');
    scrambleElements.forEach(element => {
        const fx = new TextScramble(element);
        const originalText = element.textContent;
        
        element.addEventListener('mouseenter', () => {
            fx.setText(originalText);
        });
    });
    
    // Effet de particules magnétiques
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(element, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.3,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
}

// Effet de révélation au scroll
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(element => {
    revealObserver.observe(element);
});

// Export des fonctions
window.ChessAnimations = {
    initChessParticles,
    animateHeroTitle,
    init3DCards,
    initFloatingPieces
};