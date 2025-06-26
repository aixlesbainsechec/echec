/* ==============================================================
   ÉVÉNEMENTS – Académie d’Échecs              v2025-06-27-b
   ============================================================== */

/* █ 1. CONFIG ─────────────────────────────────────────────── */
const SHEET_ID  = "1Nku_OIPzC1gW56sBnekMxUVqZLtOqJoNmFgnmfIDyQ4";
const TAB_GID   = "1";                                     // onglet « Événements »
const EVENTS_URL= `https://opensheet.elk.sh/${SHEET_ID}/${TAB_GID}`;

const MONTHS_ABBR = ["JAN","FÉV","MAR","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"];
const WEEKDAYS    = {MO:1,TU:2,WE:3,TH:4,FR:5,SA:6,SU:0};   // 0 = dimanche
const WINDOW_PAST = 7;    // jours en arrière
const WINDOW_FUT  = 14;   // jours à venir (1ère tranche)
const STEP_FUT    = 30;   // « Voir plus » ajoute +30 j
let  maxFuture    = WINDOW_FUT;

/* █ 2. ÉTAT ──────────────────────────────────────────────── */
let eventsData   = [];     // tous les évènements (après expansion)
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();

/* █ 3. INIT DOM ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  initCalendar();
  initEventFilters();
  initNewsletter();
  animateCalendarPages();
});

/* █ 4. FETCH + EXPANSION ────────────────────────────────── */
async function loadEvents(){
  const loader   = document.getElementById("eventsLoader");
  const grid     = document.getElementById("eventsGrid");
  const noEvents = document.getElementById("noEvents");

  try{
    const rows = await (await fetch(EVENTS_URL,{cache:"no-store"})).json();
    if(!Array.isArray(rows)) throw new Error("JSON inattendu");

    /* mapping brut → objet JS */
    eventsData = rows.map(r=>({
      id   : r.id?.trim()        || crypto.randomUUID(),
      title: r.title?.trim()     || "(sans titre)",
      day  : r.day               || "",
      month:(r.month||"").trim().toUpperCase(),
      year : r.year              || "",
      type :(r.type||"autre").trim(),
      description:(r.description||"").trim(),
      time :(r.time||"").trim(),
      location:(r.location||"").trim(),
      price:(r.price||"Gratuit").trim(),
      spots:(r.spots||"").trim(),
      repeat :(r.repeat||"").trim(),   // weekly | monthly | yearly
      rrule  :(r.rrule ||"").trim(),   // ex BYDAY=FR
      except :(r.except||"").trim()    // ISO dates
    }));

    eventsData = expandRecurring(eventsData);
    renderLimited();                   // 1er affichage

    loader.style.display = "none";
    grid  .style.display = "grid";
    updateCalendar();
  }
  catch(err){
    console.error("Erreur de chargement",err);
    loader.style.display  = "none";
    noEvents.style.display= "block";
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

    /* weekly avec BYDAY */
    if(ev.repeat==="weekly"){
      const byDayRaw = (ev.rrule.match(/BYDAY=([^;]+)/)||[])[1]||"";
      const daysWanted = byDayRaw.split(",").filter(Boolean);
      if(daysWanted.length){
        // pour chaque jour voulu on boucle jusqu’à horizon
        daysWanted.forEach(code=>{
          const targetDow = WEEKDAYS[code] ?? startDate.getDay();
          let cursor = nextWeekday(startDate,targetDow);
          while(cursor<=horizon){
            pushOcc(cursor);
            cursor = new Date(+cursor+7*864e5);
          }
        });
      }else{
        // weekly sans BYDAY ⇒ même weekday que startDate
        let cursor = new Date(startDate);
        while(cursor<=horizon){ pushOcc(cursor); cursor.setDate(cursor.getDate()+7); }
      }
      return;
    }

    /* monthly / yearly ⇒ simple incrément */
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

  return out.sort((a,b)=>{
    const da = new Date(`${a.year}-${pad(MONTHS_ABBR.indexOf(a.month)+1)}-${pad(a.day)}`);
    const db = new Date(`${b.year}-${pad(MONTHS_ABBR.indexOf(b.month)+1)}-${pad(b.day)}`);
    return da-db;
  });
}
function nextWeekday(from,dow){                   // dow : 0-6  (0=dim)
  const diff = (dow-from.getDay()+7)%7;
  return new Date(+from + diff*864e5);
}

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
    btn.onclick = ()=>{ maxFuture += STEP_FUT; renderLimited(); };
  }
  // cacher si plus rien à charger
  const today = new Date();
  const furthest = eventsData.at(-1);
  const lastDate = new Date(`${furthest.year}-${pad(MONTHS_ABBR.indexOf(furthest.month)+1)}-${pad(furthest.day)}`);
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
          <h3 class="event-title">${e.title}</h3>
          <span class="event-type">${getEventTypeLabel(e.type)}</span>
        </div>
        <div class="event-body">
          <p class="event-description">${e.description}</p>
          <div class="event-details">
            ${e.time     ? `<div class="event-detail"><i class="fas fa-clock"></i><span>${e.time}</span></div>` : ""}
            ${e.location ? `<div class="event-detail"><i class="fas fa-map-marker-alt"></i><span>${e.location}</span></div>` : ""}
            ${e.spots    ? `<div class="event-detail"><i class="fas fa-users"></i><span>${e.spots} places</span></div>` : ""}
          </div>
          <div class="event-footer">
            <span class="event-price">${e.price}</span>
            <a class="btn btn-primary btn-sm" href="contact.html?event=${e.id}">S'inscrire</a>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* █ 7. FILTRES (identique) ─────────────────────────────── */
function initEventFilters(){
  const btns=document.querySelectorAll(".filter-btn");
  btns.forEach(btn=>{
    btn.onclick=()=>{
      const filter=btn.dataset.filter;
      btns.forEach(b=>b.classList.toggle("active",b===btn));
      document.querySelectorAll(".event-card").forEach(c=>{
        const show=filter==="all"||c.dataset.type===filter;
        c.classList.toggle("hidden",!show);
        gsap.to(c,{opacity:show?1:0,scale:show?1:0.85,duration:0.25});
      });
    };
  });
}

/* █ 8. CALENDRIER ──────────────────────────────────────── */
// (inchangé sauf qu’il s’appuie sur eventsData déjà chargés)
function initCalendar(){
  updateCalendar();
  document.getElementById("prevMonth").onclick=()=>stepMonth(-1);
  document.getElementById("nextMonth").onclick=()=>stepMonth(+1);
}
function stepMonth(d){ currentMonth+=d;
  if(currentMonth<0){currentMonth=11;currentYear--;}
  if(currentMonth>11){currentMonth=0;currentYear++;}
  updateCalendar();
}
function updateCalendar(){
  document.getElementById("currentMonth").textContent=
    `${["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][currentMonth]} ${currentYear}`;

  const grid    = document.getElementById("calendarGrid");
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
      cell.classList.add("has-event",evts[0].type);
      cell.onclick=()=>showDayEvents(d,evts);
    }
    grid.appendChild(cell);
  }
  const rest=35-(grid.children.length-headers.length);
  for(let d=1;d<=rest;d++)grid.appendChild(dayCell(d,true));

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
      ${evts.map(e=>`<div class="modal-event"><h4>${e.title}</h4>
        <p>${[e.time,e.location].filter(Boolean).join(" – ")}</p></div>`).join("")}
      <button class="close-modal">Fermer</button>
    </div>`;
  document.body.appendChild(m);
  m.querySelector(".close-modal").onclick=()=>m.remove();
  m.onclick=e=>{if(e.target===m)m.remove();};
}

/* █ 9. ANIMATIONS / NEWSLETTER (identique) ─────────────── */
function animateCalendarPages(){ gsap.to(".calendar-animation",{rotationY:360,duration:10,repeat:-1,ease:"none"}); }
function initNewsletter(){ /* … inchangé … */ }

/* █ 10. UTILS ─────────────────────────────────────────── */
function pad(n){return n.toString().padStart(2,"0");}
function getEventTypeLabel(t){return{tournoi:"Tournoi",stage:"Stage",competition:"Compétition",special:"Événement spécial"}[t]||"Événement";}
