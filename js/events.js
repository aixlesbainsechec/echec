/* ==============================================================
   ÉVÉNEMENTS – Académie d’Échecs              v2025-06-27-fix
   - Fix "opacity:0 inline" (GSAP) après rendu dynamique
   ============================================================== */

/* █ 1. CONFIG ─────────────────────────────────────────────── */
const SHEET_ID   = "1Nku_OIPzC1gW56sBnekMxUVqZLtOqJoNmFgnmfIDyQ4"; // onglet « Événements »
const TAB_GID    = "1";
const EVENTS_URL = `https://opensheet.elk.sh/${SHEET_ID}/${TAB_GID}`;

const MONTHS_ABBR = ["JAN","FÉV","MAR","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"];
const WEEKDAYS    = {MO:1,TU:2,WE:3,TH:4,FR:5,SA:6,SU:0};   // 0 = dimanche
const WINDOW_PAST = 7;   // jours en arrière
const WINDOW_FUT  = 14;  // jours à venir (1ère tranche)
const STEP_FUT    = 30;  // « Voir plus » ajoute +30 j
let   maxFuture   = WINDOW_FUT;

/* █ 2. ÉTAT ──────────────────────────────────────────────── */
let eventsData   = [];   // tous les évènements (après expansion)
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();

/* █ 3. INIT DOM ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  initCalendar();
  initEventFilters();
  animateCalendarPages();
});

/* █ 4. FETCH + EXPANSION ────────────────────────────────── */
async function loadEvents(){
  const loader   = document.getElementById("eventsLoader");
  const grid     = document.getElementById("eventsGrid");
  const noEvents = document.getElementById("noEvents");

  try{
    const res  = await fetch(EVENTS_URL, { cache:"no-store" });
    const rows = await res.json();
    if(!Array.isArray(rows)) throw new Error("JSON inattendu");

    // mapping brut → objet JS
    eventsData = rows.map(r=>({
      id   : (r.id && String(r.id).trim()) || crypto.randomUUID(),
      title: (r.title||"").trim() || "(sans titre)",
      day  : r.day || "",
      month: (r.month||"").trim().toUpperCase(),
      year : r.year || "",
      type : (r.type||"autre").trim(),
      description: (r.description||"").trim(),
      time : (r.time||"").trim(),
      location: (r.location||"").trim(),
      price: (r.price||"Gratuit").trim(),
      spots: (r.spots||"").trim(),
      repeat: (r.repeat||"").trim(),   // weekly | monthly | yearly
      rrule : (r.rrule ||"").trim(),   // ex BYDAY=FR
      except: (r.except||"").trim()    // ISO dates
    }));

    eventsData = expandRecurring(eventsData);

    renderLimited();         // 1er affichage limité (prochains événements)
    updateCalendar();        // affichage calendrier

    finalizeEventsMount();   // <<< Fix affichage/animations (voir §6-bis)
  }
  catch(err){
    console.error("Events – erreur de chargement:", err);
    safeHide(loader);
    safeShow(noEvents);
  }
}

/* █ 4-bis. EXPANSION RÉCURRENTES ────────────────────────── */
function expandRecurring(list){
  const out     = [];
  const today   = new Date();
  const horizon = new Date(today); horizon.setFullYear(horizon.getFullYear()+1);

  list.forEach(ev=>{
    if(!ev.repeat){ out.push(ev); return; }

    const startYear  = parseInt(ev.year)  || today.getFullYear();
    const startMonth = ev.month ? MONTHS_ABBR.indexOf(ev.month) : today.getMonth();
    const startDay   = parseInt(ev.day)   || 1;
    const startDate  = new Date(startYear,startMonth,startDay);
    const exceptSet  = new Set(ev.except.split(",").map(s=>s.trim()).filter(Boolean));

    /* weekly + BYDAY=... */
    if(ev.repeat==="weekly"){
      const byDayRaw   = (ev.rrule.match(/BYDAY=([^;]+)/)||[])[1]||"";
      const daysWanted = byDayRaw.split(",").filter(Boolean);

      if(daysWanted.length){
        daysWanted.forEach(code=>{
          const targetDow = WEEKDAYS[code] ?? startDate.getDay();
          let cursor = nextWeekday(startDate,targetDow);
          while(cursor<=horizon){ pushOcc(cursor); cursor = new Date(+cursor+7*864e5); }
        });
      }else{
        let cursor = new Date(startDate);
        while(cursor<=horizon){ pushOcc(cursor); cursor.setDate(cursor.getDate()+7); }
      }
      return;
    }

    /* monthly / yearly */
    let cursor = new Date(startDate);
    while(cursor<=horizon){
      pushOcc(cursor);
      if(ev.repeat==="monthly") cursor.setMonth(cursor.getMonth()+1);
      else if(ev.repeat==="yearly") cursor.setFullYear(cursor.getFullYear()+1);
      else break;
    }

    function pushOcc(date){
      const iso = date.toISOString().slice(0,10);
      if(exceptSet.has(iso)) return;
      const occ = structuredClone(ev);
      occ.day   = date.getDate();
      occ.month = MONTHS_ABBR[date.getMonth()];
      occ.year  = date.getFullYear();
      out.push(occ);
    }
  });

  // tri par date
  return out.sort((a,b)=>{
    const da = new Date(`${a.year}-${pad(MONTHS_ABBR.indexOf(a.month)+1)}-${pad(a.day)}`);
    const db = new Date(`${b.year}-${pad(MONTHS_ABBR.indexOf(b.month)+1)}-${pad(b.day)}`);
    return da-db;
  });
}
function nextWeekday(from,dow){ const diff = (dow-from.getDay()+7)%7; return new Date(+from + diff*864e5); }

/* █ 5. LIMITE + « VOIR PLUS » ───────────────────────────── */
function renderLimited(){
  const today   = new Date();
  const pastLim = new Date(+today - WINDOW_PAST*864e5);
  const futLim  = new Date(+today + maxFuture*864e5);

  const limited = eventsData.filter(e=>{
    const d = new Date(`${e.year}-${pad(MONTHS_ABBR.indexOf(e.month)+1)}-${pad(e.day)}`);
    return d>=pastLim && d<=futLim;
  });

  displayEvents(limited);
  toggleMoreBtn();
}
function toggleMoreBtn(){
  let btn = document.getElementById("moreEventsBtn");
  if(!btn){
    btn = document.createElement("button");
    btn.id  = "moreEventsBtn";
    btn.className = "btn btn-outline";
    btn.style.display = "block";
    btn.style.margin = "2rem auto 0";
    btn.innerHTML = "Voir plus &nbsp;<i class='fas fa-chevron-down'></i>";
    document.querySelector(".upcoming-events .container").appendChild(btn);
    btn.onclick = ()=>{ maxFuture += STEP_FUT; renderLimited(); finalizeEventsMount(); };
  }
  // cacher si plus rien à charger
  const today = new Date();
  const furthest = eventsData.at(-1);
  const lastDate = furthest ? new Date(`${furthest.year}-${pad(MONTHS_ABBR.indexOf(furthest.month)+1)}-${pad(furthest.day)}`) : today;
  btn.style.display = (lastDate - today) > maxFuture*864e5 ? "block":"none";
}

/* █ 6. CARTES ───────────────────────────────────────────── */
function displayEvents(arr){
  const todayISO = new Date().toISOString().slice(0,10);
  const grid = document.getElementById("eventsGrid");

  grid.innerHTML = arr.map(e=>{
    const iso = `${e.year}-${pad(MONTHS_ABBR.indexOf(e.month)+1)}-${pad(e.day)}`;
    const state = iso<todayISO ? "past" : iso===todayISO ? "today" : "";
    return `
      <div class="event-card ${e.type} ${state}" data-type="${e.type}">
        <div class="event-header ${e.type}">
          <div class="event-date">
            <span class="event-day">${e.day}</span><span class="event-month">${e.month}</span>
          </div>
          <h3 class="event-title">${escapeHtml(e.title)}</h3>
          <span class="event-type">${getEventTypeLabel(e.type)}</span>
        </div>
        <div class="event-body">
          <p class="event-description">${escapeHtml(e.description)}</p>
          <div class="event-details">
            ${e.time     ? `<div class="event-detail"><i class="fas fa-clock"></i><span>${escapeHtml(e.time)}</span></div>` : ""}
            ${e.location ? `<div class="event-detail"><i class="fas fa-map-marker-alt"></i><span>${escapeHtml(e.location)}</span></div>` : ""}
            ${e.spots    ? `<div class="event-detail"><i class="fas fa-users"></i><span>${escapeHtml(e.spots)} places</span></div>` : ""}
          </div>
          <div class="event-footer">
            <span class="event-price">${escapeHtml(e.price)}</span>
            <a class="btn btn-primary btn-sm" href="contact.html?event=${encodeURIComponent(e.id)}">S'inscrire</a>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* █ 6-bis. POST-MOUNT FIX (opacity inline / GSAP) ───────── */
function finalizeEventsMount(){
  const loader = document.getElementById("eventsLoader");
  const grid   = document.getElementById("eventsGrid");
  const cards  = grid.querySelectorAll(".event-card");

  // afficher la grille
  safeHide(loader);
  safeShow(grid, "grid");

  // tuer les tweens globaux éventuels sur ces cartes (si un script global a préposé opacity:0)
  if (window.gsap) {
    gsap.killTweensOf(cards);
  }

  // réinitialiser styles inline posés par d’autres animations
  cards.forEach(el => {
    el.classList.remove("hidden");
    el.style.opacity   = "";
    el.style.transform = "";
    el.style.scale     = "";
  });

  // petit reveal au besoin (optionnel)
  if (window.gsap) {
    gsap.from(cards, { opacity: 0, y: 12, duration: 0.35, stagger: 0.04, clearProps: "all" });
  }

  // rafraîchir les observateurs d’anim
  window.AOS?.refreshHard?.();
  window.ScrollTrigger?.refresh?.();
}

/* █ 7. FILTRES ─────────────────────────────────────────── */
function initEventFilters(){
  const btns=document.querySelectorAll(".filter-btn");
  btns.forEach(btn=>{
    btn.onclick=()=>{
      const filter=btn.dataset.filter;
      btns.forEach(b=>{
        const active = (b===btn);
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      document.querySelectorAll(".event-card").forEach(c=>{
        const show = filter==="all" || c.dataset.type===filter;
        c.classList.toggle("hidden", !show);
        if (window.gsap) gsap.to(c,{opacity:show?1:0,scale:show?1:0.85,duration:0.25});
        else c.style.opacity = show ? "1" : "0";
      });
    };
  });
}

/* █ 8. CALENDRIER ──────────────────────────────────────── */
function initCalendar(){
  updateCalendar();
  const pm = document.getElementById("prevMonth");
  const nm = document.getElementById("nextMonth");
  if (pm) pm.onclick = () => stepMonth(-1);
  if (nm) nm.onclick = () => stepMonth(+1);
}
function stepMonth(d){
  currentMonth += d;
  if(currentMonth<0){currentMonth=11;currentYear--;}
  if(currentMonth>11){currentMonth=0;currentYear++;}
  updateCalendar();
}
function updateCalendar(){
  const monthLbl = document.getElementById("currentMonth");
  if (monthLbl) monthLbl.textContent =
    `${["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][currentMonth]} ${currentYear}`;

  const grid    = document.getElementById("calendarGrid");
  if (!grid) return;
  const headers = grid.querySelectorAll(".calendar-header");
  grid.innerHTML=""; headers.forEach(h=>grid.appendChild(h));

  const first   = (new Date(currentYear,currentMonth,1).getDay()+6)%7;   // lundi = 0
  const daysCur = new Date(currentYear,currentMonth+1,0).getDate();
  const daysPrev= new Date(currentYear,currentMonth  ,0).getDate();

  for(let i=first;i>0;i--) grid.appendChild(dayCell(daysPrev-i+1,true));
  const today = new Date();

  for(let d=1;d<=daysCur;d++){
    const cell = dayCell(d,false,
      d===today.getDate()&&currentMonth===today.getMonth()&&currentYear===today.getFullYear());
    const evts = getEventsForDay(d,currentMonth,currentYear);

    if(evts.length){
      const isPast = new Date(currentYear, currentMonth, d) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
      if (isPast) cell.classList.add("past");
      cell.classList.add("has-event", evts[0].type);
      cell.onclick=()=>showDayEvents(d,evts);
    }
    grid.appendChild(cell);
  }
  const minCells = 35;
  const rest = Math.max(0, minCells - (grid.children.length - headers.length));
  for(let d=1;d<=rest;d++) grid.appendChild(dayCell(d,true));

  window.AOS?.refreshHard?.();
}
function dayCell(n,other,today=false){
  const el=document.createElement("div");
  el.className="calendar-day";
  if(other) el.classList.add("other-month");
  if(today) el.classList.add("today");
  el.textContent=n;
  return el;
}
function getEventsForDay(d,m,y){
  return eventsData.filter(e=>+e.day===d && MONTHS_ABBR.indexOf(e.month)===m && +e.year===y);
}
function showDayEvents(d,evts){
  const m=document.createElement("div");
  m.className="day-events-modal";
  m.innerHTML=`
    <div class="modal-content">
      <h3>${d} ${MONTHS_ABBR[currentMonth]} ${currentYear}</h3>
      ${evts.map(e=>`<div class="modal-event"><h4>${escapeHtml(e.title)}</h4>
        <p>${[escapeHtml(e.time),escapeHtml(e.location)].filter(Boolean).join(" – ")}</p></div>`).join("")}
      <button class="close-modal">Fermer</button>
    </div>`;
  document.body.appendChild(m);
  m.querySelector(".close-modal").onclick=()=>m.remove();
  m.onclick=e=>{if(e.target===m)m.remove();};
}

/* █ 9. ANIMATIONS / NEWSLETTER ─────────────────────────── */
function animateCalendarPages(){
  if (window.gsap) gsap.to(".calendar-animation",{rotationY:360,duration:10,repeat:-1,ease:"none"});
}

/* █ 10. UTILS ─────────────────────────────────────────── */
function pad(n){return n.toString().padStart(2,"0");}
function getEventTypeLabel(t){return{tournoi:"Tournoi",stage:"Stage",competition:"Compétition",special:"Événement spécial"}[t]||"Événement";}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}
function safeShow(el,display="block"){ if(el){ el.style.display = display; el.hidden=false; } }
function safeHide(el){ if(el){ el.style.display = "none"; el.hidden=true; } }


document.addEventListener('DOMContentLoaded', async () => {
  try{
    if(!window.AEAContent){ console.warn('[events.sections] data.js manquant'); return; }
    const { camps, competitions } = await AEAContent.loadEvenements();
    renderCamps(camps);
    renderCompetitions(competitions);
    // rafraîchit les anims si présentes
    window.AOS?.refreshHard?.();
    window.ScrollTrigger?.refresh?.();
  }catch(err){
    console.warn('[events.sections] fail:', err);
  }
});

function renderCamps(items){
  const wrap = document.querySelector('.camps-timeline');
  if(!wrap) return;
  if(!items?.length){
    wrap.innerHTML = `<p style="text-align:center;color:var(--gray)">Aucun stage programmé pour le moment.</p>`;
    return;
  }
  wrap.innerHTML = items.map((c,idx)=>`
    <div class="camp-item" data-aos="${idx%2? 'fade-left':'fade-right'}" ${idx?`data-aos-delay="${idx*100}"`:''}>
      <div class="camp-date">
        <span class="camp-month">${escapeHtml(c.month)}</span>
        <span class="camp-days">${escapeHtml(c.days)}</span>
      </div>
      <div class="camp-content">
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description)}</p>
        <div class="camp-details">
          ${c.age   ? `<span><i class="fas fa-users"></i> ${escapeHtml(c.age)}</span>` : ''}
          ${c.time  ? `<span><i class="fas fa-clock"></i> ${escapeHtml(c.time)}</span>` : ''}
          ${c.price ? `<span><i class="fas fa-euro-sign"></i> ${escapeHtml(c.price)}</span>` : ''}
        </div>
        ${c.cta_url ? `<a href="${escapeAttr(c.cta_url)}" class="btn btn-primary btn-sm">${escapeHtml(c.cta_text||"S'inscrire")}</a>` : ''}
      </div>
    </div>
  `).join('');
}

function renderCompetitions(items){
  const wrap = document.querySelector('.competitions-cards');
  if(!wrap) return;
  if(!items?.length){
    wrap.innerHTML = `<p style="text-align:center;color:var(--gray)">Aucune compétition listée.</p>`;
    return;
  }
  wrap.innerHTML = items.map((x,idx)=>`
    <div class="competition-card" data-aos="zoom-in" ${idx?`data-aos-delay="${idx*100}"`:''}>
      <div class="competition-header">
        <i class="fas fa-${escapeHtml(x.icon)}"></i>
        <h3>${escapeHtml(x.title)}</h3>
      </div>
      <p>${escapeHtml(x.description)}</p>
      ${x.period ? `<div class="competition-date"><i class="fas fa-calendar"></i> ${escapeHtml(x.period)}</div>` : ''}
      ${x.link_url ? `<div style="margin-top:0.75rem">
          <a class="btn btn-outline btn-sm" href="${escapeAttr(x.link_url)}">
            ${escapeHtml(x.link_text||"En savoir plus")}
          </a>
        </div>` : ''}
    </div>
  `).join('');
}

/* utils */
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}
function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;');}

function initCrystalKnightFA(){
  const root = document.getElementById('knight3d');
  const stack = document.getElementById('knightStack');
  if (!root || !stack) return;

  // wipe + build layers
  stack.innerHTML = '';
  const L = 56; // doit matcher --layers
  const thickness = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || 1.1;

  for (let i=0;i<L;i++){
    const layer = document.createElement('div');
    layer.className = 'knight3d-layer';
    // profondeur + très léger scale interne pour “taille” diamant
    const s = 1 - (i/(L*140));
    layer.style.transform = `translateZ(${-i*thickness}px) scale(${s})`;
    // opacité un peu plus faible au cœur
    if (i > L*0.45 && i < L*0.85) layer.dataset.inner = '1';
    if (i > L*0.60 && i < L*0.78) layer.dataset.inner = '2';

    // contenu : l’icône FA (déjà chargée dans ta page)
    layer.innerHTML = `<i class="fa-solid fa-chess-pawn" aria-hidden="true"></i>`;
    stack.appendChild(layer);
  }

  // rotation lente + tilt souris
  let rx = -8, ry = -16;     // rotation actuelle
  let tx = -8, ty = -16;     // cible
  const spin = 0.09;        // auto-spin

  const tick = () => {
    ty -= spin;                 // spin continu
    rx += (tx - rx) * 0.08;     // easing
    ry += (ty - ry) * 0.08;
    stack.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    requestAnimationFrame(tick);
  };
  tick();

  // responsive: recalc Z & scale si taille change
  const ro = new ResizeObserver(()=>{
    const t = parseFloat(getComputedStyle(root).getPropertyValue('--thickness')) || thickness;
    [...stack.children].forEach((layer, i)=>{
      const s = 1 - (i/(L*140));
      layer.style.transform = `translateZ(${-i*t}px) scale(${s})`;
    });
  });
  ro.observe(root);

  // fallback si FA non dispo (rare): on prend le glyph unicode ♞
  setTimeout(()=>{
    const test = stack.querySelector('i');
    if (!test || getComputedStyle(test).fontFamily.toLowerCase().indexOf('font awesome') === -1){
      [...stack.children].forEach(l => l.innerHTML = `<span style="font-size:calc(var(--size)*.58);font-weight:700">♞</span>`);
    }
  },0);
}

// 👉 appelle la fonction au chargement de la page Club
document.addEventListener('DOMContentLoaded', () => {
  initCrystalKnightFA();
});