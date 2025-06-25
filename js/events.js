/* ==============================================================
   JS ÉVÉNEMENTS – Académie d’Échecs           v2025-06-26
   → Lecture Google Sheets via opensheet.elk.sh (CORS OK)
   ============================================================== */

/* ███ 1. CONFIGURATION ───────────────────────────────────────── */
const SHEET_ID = "1Nku_OIPzC1gW56sBnekMxUVqZLtOqJoNmFgnmfIDyQ4"; // ID du classeur
const TAB_GID  = "1";                                            // ← onglet « Événements »
const EVENTS_URL = `https://opensheet.elk.sh/${SHEET_ID}/${TAB_GID}`;

const MONTHS_ABBR = [
  "JAN","FÉV","MAR","AVR","MAI","JUIN",
  "JUIL","AOÛT","SEPT","OCT","NOV","DÉC"
];

/* ███ 2. ÉTAT ───────────────────────────────────────────────── */
let eventsData   = [];
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();

/* ███ 3. AU CHARGEMENT ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  initCalendar();
  initEventFilters();
  initNewsletter();
  animateCalendarPages();
});

/* ███ 4. CHARGEMENT DES ÉVÉNEMENTS ─────────────────────────── */
async function loadEvents() {
  const loader   = document.getElementById("eventsLoader");
  const grid     = document.getElementById("eventsGrid");
  const noEvents = document.getElementById("noEvents");

  try {
    /* ----- fetch (CORS OK avec opensheet) ----- */
    const rows = await (await fetch(EVENTS_URL, { cache: "no-store" })).json();
    if (!Array.isArray(rows)) throw new Error("JSON inattendu");

    /* ----- mapping brut → objet JS ----- */
    eventsData = rows.map(r => ({
      id:         r.id?.trim()          ?? crypto.randomUUID(),
      title:      r.title?.trim()       ?? "(sans titre)",
      day:        r.day                 ?? "",
      month:      r.month               ?? "",
      year:       r.year                ?? "",
      type:       r.type?.trim()        ?? "autre",
      description:r.description?.trim() ?? "",
      time:       r.time?.trim()        ?? "",
      location:   r.location?.trim()    ?? "",
      price:      r.price?.trim()       ?? "Gratuit",
      spots:      r.spots?.trim()       ?? "",
      repeat:     r.repeat?.trim()      ?? "",
      rrule:      r.rrule?.trim()       ?? "",
      except:     r.except?.trim()      ?? ""
    }));

    /* ----- expansion des événements récurrents ----- */
    eventsData = expandRecurring(eventsData);

    /* ----- affichage ----- */
    displayEvents(eventsData);

    loader.style.display = "none";
    grid.style.display   = "grid";
    gsap.from(".event-card", { opacity: 0, y: 50, duration: 0.6, stagger: 0.05 });

  } catch (err) {
    console.error("Erreur de chargement", err);
    loader.style.display  = "none";
    noEvents.style.display = "block";
  }
}

/* ███ 4-bis.  RÉCURRENCE  ──────────────────────────────────── */
/*  repeat : "weekly" / "monthly" / "yearly"
    rrule  : ex. BYDAY=FR       (weekly)
             ex. BYDAY=FR;BYSETPOS=1  (monthly – 1er vendredi)
             ex. BYMONTHDAY=15       (monthly – le 15)
    except : dates ISO séparées par ,  */
function expandRecurring(list) {
  const out = [];
  const today  = new Date();
  const horizon = new Date(today.getFullYear(), today.getMonth() + 12, 1); // 12 mois

  list.forEach(ev => {
    if (!ev.repeat) {                    // événement ponctuel → on pousse tel quel
      out.push(ev);
      return;
    }

    /* ---------- préparation ---------- */
    const startYear  = parseInt(ev.year) || today.getFullYear();
    const startMonth = ev.month ? MONTHS_ABBR.indexOf(ev.month) : today.getMonth();
    const startDay   = parseInt(ev.day)  || 1;
    const startDate  = new Date(startYear, startMonth, startDay);
    const exceptSet  = new Set(ev.except.split(",").map(s => s.trim()).filter(Boolean));

    /* ---------- générateur selon type ---------- */
    let cursor = new Date(startDate);

    while (cursor <= horizon) {
      const iso = cursor.toISOString().slice(0,10);
      if (!exceptSet.has(iso)) {
        const occ = structuredClone(ev);
        occ.day   = cursor.getDate();
        occ.month = MONTHS_ABBR[cursor.getMonth()];
        occ.year  = cursor.getFullYear();
        out.push(occ);
      }

      switch (ev.repeat) {
        case "weekly":
          cursor.setDate(cursor.getDate() + 7);
          break;

        case "monthly":
          cursor.setMonth(cursor.getMonth() + 1);
          break;

        case "yearly":
          cursor.setFullYear(cursor.getFullYear() + 1);
          break;

        default:
          console.warn("repeat inconnu:", ev.repeat);
          cursor = new Date(horizon.getTime() + 1); // sortir boucle
      }
    }
  });

  /* tri chronologique pour l’affichage */
  return out.sort((a,b)=>{
    const da = new Date(`${a.year}-${pad(MONTHS_ABBR.indexOf(a.month)+1)}-${pad(a.day)}`);
    const db = new Date(`${b.year}-${pad(MONTHS_ABBR.indexOf(b.month)+1)}-${pad(b.day)}`);
    return da - db;
  });
}

/* ███ 5. AFFICHAGE DANS LA GRILLE ─────────────────────────── */
function displayEvents(arr) {
  const grid = document.getElementById("eventsGrid");
  grid.innerHTML = arr.map(e => `
    <div class="event-card ${e.type}" data-type="${e.type}">
      <div class="event-header ${e.type}">
        <div class="event-date">
          <span class="event-day">${e.day}</span><span class="event-month">${e.month}</span>
        </div>
        <h3 class="event-title">${e.title}</h3>
        <span class="event-type">${getEventTypeLabel(e.type)}</span>
      </div>
      <div class="event-body">
        <p class="event-description">${e.description}</p>
        <div class="event-details">
          ${ e.time      ? `<div class="event-detail"><i class="fas fa-clock"></i><span>${e.time}</span></div>` : "" }
          ${ e.location  ? `<div class="event-detail"><i class="fas fa-map-marker-alt"></i><span>${e.location}</span></div>` : "" }
          ${ e.spots     ? `<div class="event-detail"><i class="fas fa-users"></i><span>${e.spots} places</span></div>` : "" }
        </div>
        <div class="event-footer">
          <span class="event-price">${e.price}</span>
          <a class="btn btn-primary btn-sm" href="contact.html?event=${e.id}">S'inscrire</a>
        </div>
      </div>
    </div>
  `).join("");
}

/* ███ 6. FILTRES (boutons) ─────────────────────────────────── */
function initEventFilters() {
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach(btn=>{
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      btns.forEach(b => b.classList.toggle("active", b===btn));
      document.querySelectorAll(".event-card").forEach(c => {
        const show = filter==="all" || c.dataset.type===filter;
        c.classList.toggle("hidden", !show);
        gsap.to(c, { opacity: show?1:0, scale: show?1:0.8, duration: 0.3 });
      });
    });
  });
}

/* ███ 7. CALENDRIER ────────────────────────────────────────── */
function initCalendar() {
  updateCalendar();
  document.getElementById("prevMonth").onclick = () => { stepMonth(-1); };
  document.getElementById("nextMonth").onclick = () => { stepMonth(+1); };
}

function stepMonth(delta){
  currentMonth += delta;
  if(currentMonth<0){ currentMonth=11; currentYear--; }
  if(currentMonth>11){ currentMonth=0;  currentYear++; }
  updateCalendar();
}

function updateCalendar() {
  document.getElementById("currentMonth").textContent =
    `${["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][currentMonth]} ${currentYear}`;

  const calGrid = document.getElementById("calendarGrid");
  const headers = calGrid.querySelectorAll(".calendar-header");
  calGrid.innerHTML = "";
  headers.forEach(h => calGrid.appendChild(h));      // on remet les en-têtes

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay() || 7; // 1→lun … 7→dim
  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
  const daysPrevMon = new Date(currentYear, currentMonth  , 0).getDate();

  // jours du mois précédent
  for(let i=firstDay-1;i>0;i--) calGrid.appendChild(createDay(daysPrevMon-i+1,true));

  // jours du mois courant
  const today = new Date();
  for(let d=1; d<=daysInMonth; d++){
    const isToday = d===today.getDate() && currentMonth===today.getMonth() && currentYear===today.getFullYear();
    const cell = createDay(d,false,isToday);
    const evts = getEventsForDay(d,currentMonth,currentYear);
    if(evts.length){
      cell.classList.add("has-event", evts[0].type);
      cell.onclick = () => showDayEvents(d,evts);
    }
    calGrid.appendChild(cell);
  }

  // jours suivant pour compléter la grille (35 cases)
  const remaining = 35 - (calGrid.children.length-headers.length);
  for(let d=1; d<=remaining; d++) calGrid.appendChild(createDay(d,true));

  if(window.AOS?.refreshHard) AOS.refreshHard();
}

function createDay(n,other,today=false){
  const div = document.createElement("div");
  div.className = "calendar-day";
  if(other) div.classList.add("other-month");
  if(today) div.classList.add("today");
  div.textContent = n;
  return div;
}

function getEventsForDay(day,month,year){
  return eventsData.filter(e=>{
    return +e.day===day &&
           MONTHS_ABBR.indexOf(e.month)===month &&
           +e.year===year;
  });
}

function showDayEvents(day,events){
  const modal = document.createElement("div");
  modal.className = "day-events-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Événements du ${day} ${MONTHS_ABBR[currentMonth]} ${currentYear}</h3>
      ${events.map(e=>`
        <div class="modal-event">
          <h4>${e.title}</h4>
          <p>${e.time||""} ${e.location?(" – "+e.location):""}</p>
        </div>`).join("")}
      <button class="close-modal">Fermer</button>
    </div>`;
  document.body.appendChild(modal);
  gsap.from(modal.querySelector(".modal-content"),{scale:0.5,opacity:0,duration:0.3,ease:"back.out(1.7)"});
  const close = ()=>gsap.to(modal,{opacity:0,duration:0.3,onComplete:()=>modal.remove()});
  modal.querySelector(".close-modal").onclick = close;
  modal.onclick = e=>{ if(e.target===modal) close(); };
}

/* ███ 8. ANIMATIONS SECONDAIRES ────────────────────────────── */
function animateCalendarPages(){
  gsap.to(".calendar-animation",{rotationY:360,duration:10,repeat:-1,ease:"none"});
}

/* ███ 9. NEWSLETTER (inchangé) ─────────────────────────────── */
function initNewsletter(){
  const form = document.getElementById("newsletterForm");
  if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const email = form.querySelector("input[type=email]").value;
    const btn   = form.querySelector("button");
    const txt   = btn.innerHTML;
    btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Inscription…';
    btn.disabled=true;
    setTimeout(()=>{
      btn.innerHTML='<i class="fas fa-check"></i> Inscrit !';
      btn.style.background="var(--success)";
      setTimeout(()=>{
        form.reset();
        btn.innerHTML=txt;
        btn.disabled=false;
        btn.style.background="";
      },2500);
    },1200);
  });
}

/* ███ 10. UTILITAIRE ──────────────────────────────────────── */
function getEventTypeLabel(t){
  return ({tournoi:"Tournoi",stage:"Stage",competition:"Compétition",special:"Événement spécial"}[t]||"Événement");
}
function pad(n){ return n.toString().padStart(2,"0"); }
