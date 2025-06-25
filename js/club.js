// ========================================
// JavaScript Page Club - Académie d'Échecs
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Animation des pièces 3D sur le plateau
    init3DChessBoard();
    
    // Animation de la timeline
    animateTimeline();
    
    // Animation des trophées
    animateTrophies();
    
    // Effet hover sur les membres de l'équipe
    initTeamCards();
    
    // Compteurs pour les statistiques
    animateStats();
    
    // Parallax sur les sections
    initSectionParallax();
});

// Animation du plateau d'échecs 3D
function init3DChessBoard() {
    const board = document.querySelector('.chess-board-3d');
    if (!board) return;
    
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    
    board.addEventListener('mousemove', (e) => {
        const rect = board.getBoundingClientRect();
        mouseX = (e.clientX - rect.left - rect.width / 2) / 10;
        mouseY = (e.clientY - rect.top - rect.height / 2) / 10;
    });
    
    board.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });
    
    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        board.style.transform = `
            perspective(800px) 
            rotateX(${25 - currentY}deg) 
            rotateY(${-25 + currentX}deg)
        `;
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Animation des pièces flottantes
    const pieces = board.querySelectorAll('.floating-piece');
    pieces.forEach((piece, index) => {
        gsap.to(piece, {
            y: -30,
            rotation: 360,
            duration: 3 + index,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut'
        });
    });
}

// Animation de la timeline au scroll
function animateTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animation du point
                gsap.from(entry.target.querySelector('::before'), {
                    scale: 0,
                    duration: 0.5,
                    ease: 'back.out(1.7)'
                });
                
                // Animation du contenu
                const content = entry.target.querySelector('.timeline-content');
                const isOdd = Array.from(timelineItems).indexOf(entry.target) % 2 === 0;
                
                gsap.from(content, {
                    x: isOdd ? -100 : 100,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    });
    
    timelineItems.forEach(item => observer.observe(item));
}

// Animation des trophées avec effet de brillance
function animateTrophies() {
    const trophyCards = document.querySelectorAll('.trophy-card');
    
    trophyCards.forEach((card, index) => {
        // Effet de pulsation sur l'icône
        const icon = card.querySelector('.trophy-icon');
        gsap.to(icon, {
            scale: 1.1,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
            delay: index * 0.2
        });
        
        // Effet de brillance au survol
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                backgroundPosition: '200% 0%',
                duration: 1,
                ease: 'power2.inOut'
            });
        });
    });
}

// Interactions avec les cartes d'équipe
function initTeamCards() {
    const memberCards = document.querySelectorAll('.member-card');
    
    memberCards.forEach(card => {
        const avatar = card.querySelector('.member-avatar');
        const stats = card.querySelectorAll('.member-stats span');
        
        // Animation de l'avatar au survol
        card.addEventListener('mouseenter', () => {
            gsap.to(avatar, {
                rotationY: 360,
                duration: 0.6,
                ease: 'power2.inOut'
            });
            
            // Animation des stats
            gsap.from(stats, {
                x: -20,
                opacity: 0,
                duration: 0.3,
                stagger: 0.1,
                ease: 'power2.out'
            });
        });
        
        // Effet de particules au clic
        card.addEventListener('click', (e) => {
            createParticles(e.clientX, e.clientY);
        });
    });
}

// Création de particules d'échecs
function createParticles(x, y) {
    const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
    const colors = ['#f4c430', '#e6b520', '#1a1a1a'];
    
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.textContent = pieces[Math.floor(Math.random() * pieces.length)];
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 20px;
            color: ${colors[Math.floor(Math.random() * colors.length)]};
            pointer-events: none;
            z-index: 9999;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (i / 6) * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        
        gsap.to(particle, {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity,
            opacity: 0,
            rotation: Math.random() * 720 - 360,
            duration: 1 + Math.random() * 0.5,
            ease: 'power2.out',
            onComplete: () => particle.remove()
        });
    }
}

// Animation des statistiques
function animateStats() {
    const statBoxes = document.querySelectorAll('.stat-box');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const box = entry.target;
                const value = box.querySelector('.stat-value');
                
                // Animation de la boîte
                gsap.from(box, {
                    scale: 0,
                    rotation: -180,
                    duration: 0.8,
                    ease: 'back.out(1.7)'
                });
                
                // Animation du nombre si c'est un nombre
                const text = value.textContent;
                const number = parseInt(text);
                
                if (!isNaN(number)) {
                    value.textContent = '0';
                    
                    gsap.to({}, {
                        duration: 2,
                        onUpdate: function() {
                            value.textContent = Math.floor(this.progress() * number);
                        },
                        onComplete: () => {
                            value.textContent = text; // Restaurer le texte original avec suffixe
                        }
                    });
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statBoxes.forEach(box => observer.observe(box));
}

// Effet parallax sur les sections
function initSectionParallax() {
    const sections = document.querySelectorAll('.section');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        sections.forEach((section, index) => {
            const rate = scrolled * -0.2 * (index % 2 === 0 ? 1 : -1);
            
            // Parallax subtil sur le background
            if (section.classList.contains('timeline-section') || 
                section.classList.contains('team-section')) {
                section.style.backgroundPositionY = `${rate}px`;
            }
        });
    });
}

// Animation des achievements au survol
document.querySelectorAll('.achievement').forEach(achievement => {
    const icon = achievement.querySelector('.achievement-icon');
    
    achievement.addEventListener('mouseenter', () => {
        gsap.to(icon, {
            scale: 1.2,
            rotation: 360,
            duration: 0.5,
            ease: 'power2.out'
        });
        
        gsap.to(achievement, {
            y: -10,
            boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
            duration: 0.3,
            ease: 'power2.out'
        });
    });
    
    achievement.addEventListener('mouseleave', () => {
        gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
        
        gsap.to(achievement, {
            y: 0,
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});

// Animation des valeurs
document.querySelectorAll('.value-card').forEach((card, index) => {
    const icon = card.querySelector('.value-icon');
    
    // Rotation continue de l'icône
    card.addEventListener('mouseenter', () => {
        gsap.to(icon, {
            rotation: 360,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    });
});

// Easter egg : Konami code
let konamiIndex = 0;
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        
        if (konamiIndex === konamiCode.length) {
            activateEasterEgg();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateEasterEgg() {
    const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
    
    // Pluie de pièces d'échecs
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const piece = document.createElement('div');
            piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
            piece.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: -50px;
                font-size: ${20 + Math.random() * 30}px;
                color: var(--accent);
                z-index: 9999;
                pointer-events: none;
            `;
            
            document.body.appendChild(piece);
            
            gsap.to(piece, {
                y: window.innerHeight + 100,
                rotation: Math.random() * 720,
                duration: 2 + Math.random() * 2,
                ease: 'none',
                onComplete: () => piece.remove()
            });
        }, i * 50);
    }
    
    // Message secret
    const message = document.createElement('div');
    message.textContent = '♔ Échec et Mat ! ♔';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 3rem;
        font-weight: bold;
        color: var(--accent);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        z-index: 10000;
        pointer-events: none;
    `;
    
    document.body.appendChild(message);
    
    gsap.from(message, {
        scale: 0,
        rotation: 720,
        duration: 1,
        ease: 'back.out(1.7)'
    });
    
    gsap.to(message, {
        opacity: 0,
        scale: 2,
        duration: 1,
        delay: 2,
        ease: 'power2.in',
        onComplete: () => message.remove()
    });
}