/* ========================================
   Horaires & Tarifs – scripts (V2)
   ======================================== */

/* ---------------- Planning filters ---------------- */
function initScheduleFilters() {
  const btns = [...document.querySelectorAll('.filter-btn')];
  const slots = [...document.querySelectorAll('.time-slot')];

  btns.forEach(btn =>
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      slots.forEach(s => {
        const show = filter === 'all' || s.dataset.category === filter;
        s.classList.toggle('hidden', !show);
        gsap.to(s, {
          opacity: show ? 1 : 0.2,
          scale: show ? 1 : 0.9,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      gsap.fromTo(
        btn,
        { scale: 1 },
        { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      );
    })
  );
}

/* ---------------- FAQ accordion (fix) ------------- */
function initFAQAccordion() {
  const items = [...document.querySelectorAll('.faq-item')];
  if (!items.length) {console.log("c'est la merde");} else { console.log("cool");}

  items.forEach(item => {
    const q = item.querySelector('.faq-question');
    const ans = item.querySelector('.faq-answer');
    ans.style.maxHeight = null; // reset

    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // fermer les autres
      items.forEach(it => {
        it.classList.remove('active');
        it.querySelector('.faq-answer').style.maxHeight = null;
      });

      // toggle courant
      if (!isOpen) {
        item.classList.add('active');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        ans.style.maxHeight = null;
      }

      // rotation chevron
      const ico = q.querySelector('i');
      gsap.to(ico, {
        rotation: isOpen ? 0 : 180,
        duration: 0.3,
        ease: 'power2.inOut'
      });
    });
  });
}

/* ---------------- Pricing cards ------------------- */
function initPricingCards() {
  const cards = [...document.querySelectorAll('.pricing-card')];
  gsap.registerPlugin(ScrollTrigger);

  // apparition au scroll
  cards.forEach(card =>
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    })
  );

  // hover
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('featured')) {
        gsap.to(card, {
          y: -10,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          duration: 0.3
        });
      }
      gsap.to(card.querySelector('.amount'), {
        scale: 1.1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });
    });

    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('featured')) {
        gsap.to(card, {
          y: 0,
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          duration: 0.3
        });
      }
      gsap.to(card.querySelector('.amount'), { scale: 1, duration: 0.3 });
    });
  });

  // carte en vedette qui “flotte”
  const featured = document.querySelector('.pricing-card.featured');
  if (featured) {
    gsap.to(featured, {
      y: -5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
  }

  /* discount cards entrance */
  const discCards = [...document.querySelectorAll('.discount-card')];
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.fromTo(
            e.target,
            { y: 40, opacity: 0, rotation: -15 },
            {
              y: 0,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              ease: 'back.out(1.7)',
              clearProps: 'transform,opacity'
            }
          );
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  discCards.forEach(c => io.observe(c));

  discCards.forEach(c =>
    c.addEventListener('mouseenter', () => {
      gsap.to(c.querySelector('.discount-icon'), {
        rotation: 360,
        duration: 0.6,
        ease: 'power2.out'
      });
    })
  );
}

/* ---------------- Clock -------------------------- */
function animateClock() {
  const h = document.querySelector('.hour-hand');
  const m = document.querySelector('.minute-hand');
  if (!h || !m) return;

  function update() {
    const now = new Date();
    const hourDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
    const minDeg = now.getMinutes() * 6;
    gsap.set(h, { rotation: hourDeg });
    gsap.set(m, { rotation: minDeg });
  }
  update();
  setInterval(update, 60000); // une fois par minute
}

/* --------------- Highlight current day ----------- */
function highlightCurrentDay() {
  const days = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi'
  ];
  const idx = new Date().getDay();

  document.querySelectorAll('.day-column').forEach(col => {
    const head = col.querySelector('.day-header');
    if (head && head.textContent.trim() === days[idx]) {
      col.classList.add('today');
      head.style.background = 'var(--accent)';
      head.style.color = 'var(--primary)';
      gsap.to(head, { scale: 1.05, yoyo: true, repeat: -1, duration: 1 });
    }
  });
}

/* --------------- Clickable slots ----------------- */
function makeTimeSlotsClickable() {
  const slots = [...document.querySelectorAll('.time-slot:not(.empty)')];

  slots.forEach(slot => {
    slot.style.cursor = 'pointer';

    slot.addEventListener('click', () => {
      const time = slot.querySelector('.slot-time').textContent;
      const title = slot.querySelector('.slot-title').textContent;
      const level = slot.querySelector('.slot-level').textContent;

      const modal = document.createElement('div');
      modal.className = 'slot-modal';
      modal.innerHTML = `
        <h3>${title}</h3>
        <p><strong>Horaire :</strong> ${time}</p>
        <p><strong>Niveau :</strong> ${level}</p>
        <p>Pour vous inscrire à ce créneau, contactez-nous !</p>
        <div class="modal-actions">
          <a href="contact.html" class="btn btn-primary">S'inscrire</a>
          <button class="btn btn-secondary close-modal">Fermer</button>
        </div>`;
      Object.assign(modal.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,.2)',
        zIndex: 1000,
        maxWidth: '400px',
        width: '90%'
      });

      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 999
      });

      document.body.append(overlay, modal);
      gsap.from(modal, { scale: 0.5, opacity: 0, duration: 0.3, ease: 'back.out(1.7)' });

      function close() {
        gsap.to(modal, {
          scale: 0.5,
          opacity: 0,
          duration: 0.2,
          onComplete: () => modal.remove()
        });
        overlay.remove();
      }
      modal.querySelector('.close-modal').addEventListener('click', close);
      overlay.addEventListener('click', close);
    });

    /* petit effet shine */
    slot.addEventListener('mouseenter', function () {
      gsap.to(this, { scale: 1.05, duration: 0.2 });
      const shine = document.createElement('div');
      shine.style.cssText = `
        position:absolute;top:0;left:-100%;width:100%;height:100%;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
        pointer-events:none;`;
      this.appendChild(shine);
      gsap.to(shine, {
        left: '100%',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => shine.remove()
      });
    });

    slot.addEventListener('mouseleave', function () {
      gsap.to(this, { scale: 1, duration: 0.2 });
    });
  });
}
