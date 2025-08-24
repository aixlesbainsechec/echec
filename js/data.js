/* ===========================================================
   AEA - data.js  (UNIQUE data provider for the whole site)
   Reads the Google Sheet via OpenSheet and exposes a small API.
   -----------------------------------------------------------
   Google Sheet (must be public): 
   https://docs.google.com/spreadsheets/d/1Xgqf2afvEuewqLzzpxntkxpMY2PEkTlHCA3kF6DOunI
   -----------------------------------------------------------
   TABS (must match sheet tab names exactly):
    - hero_stats
    - club_stats, timeline, palmares, achievements, values, team
    - ECOLE_LEVELS, ECOLE_INTERVENTIONS, ECOLE_STATS
    - SCHEDULE_WEEK, PRICING, DISCOUNTS, FAQ_HORAIRES, META_HORAIRES
   =========================================================== */
(function(){
  const SHEET_ID = "1Xgqf2afvEuewqLzzpxntkxpMY2PEkTlHCA3kF6DOunI";
  const BASE = `https://opensheet.elk.sh/${SHEET_ID}/`;

  const TABS = {
    HERO: "hero_stats",

    CLUB_STATS: "club_stats",
    CLUB_TIMELINE: "timeline",
    CLUB_PALMARES: "palmares",
    CLUB_ACHIEVEMENTS: "achievements",
    CLUB_VALUES: "values",
    CLUB_TEAM: "team",

    ECOLE_LEVELS: "ECOLE_LEVELS",
    ECOLE_INTERVENTIONS: "ECOLE_INTERVENTIONS",
    ECOLE_STATS: "ECOLE_STATS",

    HR_WEEK: "SCHEDULE_WEEK",
    HR_PRICING: "PRICING",
    HR_DISCOUNTS: "DISCOUNTS",
    HR_FAQ: "FAQ_HORAIRES",
    HR_META: "META_HORAIRES",

    EVENTS_CAMPS: "EVENTS_CAMPS",
    EVENTS_COMPETITIONS: "EVENTS_COMPETITIONS",
  };

  /* ---------- small fetch/cache layer ---------- */
  const CACHE = Object.create(null);
  const pending = [];
  function track(p){
    pending.push(p.catch(()=>{}));
    window.__AEA_DATA_READY__ = Promise.all(pending);
    return p;
  }
  async function fetchTab(tab){
    const key = String(tab);
    if (CACHE[key]) return CACHE[key];
    const p = fetch(BASE + encodeURIComponent(key), { cache:"no-store" })
      .then(r => (r.ok ? r.json() : []))
      .catch(()=>[]);
    CACHE[key] = p;
    return p;
  }

  /* ---------------- utils --------------------- */
  const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  const DAY_INDEX = { lundi:0, mardi:1, mercredi:2, jeudi:3, vendredi:4, samedi:5, dimanche:6 };

  function parseBool(v){
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === "1" || s === "y" || s === "yes" || s === "true" || s === "ok" || s === "✓";
  }
  function toNumberLoose(v){
    if (v == null || v === "") return 0;
    const n = Number(String(v).replace(/\s/g,"").replace(",","."));
    return Number.isFinite(n) ? n : 0;
  }
  function splitList(v){
    if (!v) return [];
    const s = String(v);
    // supports: "a | b | c"  or  "a ; b ; c"
    const parts = s.split(/[\|;]/g).map(x=>x.trim()).filter(Boolean);
    return parts;
  }
  // Accept "17h", "17h30", "17:30", "17.30", "17:00:00"
  function parseTimeMin(t){
    if (!t) return null;
    let s = String(t).trim().toLowerCase().replace("h",":").replace(/\./g,":");
    const m = s.match(/^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?$/);
    if (!m) return null;
    const hh = Math.max(0, Math.min(23, parseInt(m[1],10)||0));
    const mm = Math.max(0, Math.min(59, parseInt(m[2]||"0",10)||0));
    return hh*60 + mm;
  }
  function dayIndexFrom(val){
    if (val==null) return null;
    const s = String(val).trim();
    if (/^\d+$/.test(s)) {
      const n = parseInt(s,10);
      return (n>=1 && n<=7) ? (n-1) : (n>=0 && n<=6 ? n : null);
    }
    const k = s.toLowerCase();
    return DAY_INDEX[k] ?? null;
  }

  /* ============ Raw fetchers (per tab) ============ */

  // --- hero ---
  async function getHeroStats(){
    const rows = await fetchTab(TABS.HERO);
    return rows
      .map(r => ({
        label: String(r.label || r.Label || "").trim(),
        value: toNumberLoose(r.value ?? r.Value ?? r.number ?? 0),
        order: toNumberLoose(r.order ?? r.ord)
      }))
      .filter(r=>r.label)
      .sort((a,b)=>(a.order||999) - (b.order||999));
  }

  // --- club ---
  async function getClubStats(){
    const rows = await fetchTab(TABS.CLUB_STATS);
    return rows
      .map(r => ({
        icon: String(r.icon || "").trim(),
        value: String(r.value ?? "").trim(),
        label: String(r.label || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(r => r.label || r.value)
      .sort((a,b) => (a.order||999) - (b.order||999));
  }

  async function getTimeline(){
    const rows = await fetchTab(TABS.CLUB_TIMELINE);
    return rows
      .map(r => ({
        year: String(r.year ?? "").trim(),
        title: String(r.title || "").trim(),
        text: String(r.text || r.description || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(r => r.title && r.year)
      .sort((a,b) => (a.order||999) - (b.order||999));
  }

  async function getPalmares(){
    const rows = await fetchTab(TABS.CLUB_PALMARES);
    return rows
      .map(r => ({
        tier: String(r.tier || "").trim().toLowerCase(), // gold/silver/bronze
        title: String(r.title || "").trim(),
        items: splitList(r.items),
        order: toNumberLoose(r.order)
      }))
      .filter(r => r.title)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  async function getAchievements(){
    const rows = await fetchTab(TABS.CLUB_ACHIEVEMENTS);
    return rows
      .map(r => ({
        icon: String(r.icon || "").trim(),
        title: String(r.title || "").trim(),
        text: String(r.text || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(x => x.title)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  async function getValues(){
    const rows = await fetchTab(TABS.CLUB_VALUES);
    return rows
      .map(r => ({
        icon: String(r.icon || "").trim(), // emoji accepted (e.g., ♟️)
        title: String(r.title || "").trim(),
        text: String(r.text || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(x => x.title)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  async function getTeam(){
    const rows = await fetchTab(TABS.CLUB_TEAM);
    return rows
      .map(r => ({
        icon: String(r.icon || "").trim(),
        name: String(r.name || "").trim(),
        role: String(r.role || "").trim(),
        bio: String(r.bio || r.description || "").trim(),
        stat1: String(r.s1 || r.stat1 || "").trim(),
        stat2: String(r.s2 || r.stat2 || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(x => x.name)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  // --- ecole ---
  async function getEcoleLevels(){
    const rows = await fetchTab(TABS.ECOLE_LEVELS);
    return rows
      .map(r => ({
        level_id: String(r.level_id || r.id || "").trim(),
        name: String(r.name || "").trim(),
        tag: String(r.tag || "").trim(),
        icon: String(r.icon || "").trim(),
        hours: String(r.hours || r.h || "").trim(),
        group_size: String(r.group_size || r.group || "").trim(),
        objectives: splitList(r.objectives),
        desc: String(r.desc || r.text || "").trim(),
        order: toNumberLoose(r.order)
      }))
      .filter(x => x.name)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  async function getEcoleInterventions(){
    const rows = await fetchTab(TABS.ECOLE_INTERVENTIONS);
    return rows.map(r => ({
      title: String(r.title || "").trim(),
      schools: splitList(r.schools),
      benefits: splitList(r.benefits),
      quote: String(r.quote || "").trim(),
      cite: String(r.cite || r.author || "").trim(),
      order: toNumberLoose(r.order)
    })).sort((a,b)=>(a.order||999)-(b.order||999));
  }

  async function getEcoleStats(){
    const rows = await fetchTab(TABS.ECOLE_STATS);
    // badges for the hero on "École"
    return rows.map(r => ({
      badge: String(r.badge || "").trim(),
      text: String(r.text || "").trim(),
      order: toNumberLoose(r.order)
    })).filter(x => x.badge || x.text)
      .sort((a,b)=>(a.order||999)-(b.order||999));
  }

  // --- horaires & tarifs ---
  async function getScheduleWeek(){
    const rows = await fetchTab(TABS.HR_WEEK);
    const items = rows
      .filter(r => parseBool(r.active ?? r.enabled ?? true))
      .map(r => {
        const dIdx = dayIndexFrom(r.day);
        const startMin = parseTimeMin(r.start);
        const endMin   = parseTimeMin(r.end);
        const cat = String(r.category || "autre").trim().toLowerCase();
        return {
          dayIndex: dIdx,
          day: dIdx!=null ? DAYS[dIdx] : String(r.day || "").trim(),
          start: String(r.start||"").trim(),
          end: String(r.end||"").trim(),
          startMin, endMin,
          title: String(r.title || "").trim(),
          level: String(r.level || "").trim(),
          category: cat,
          location: String(r.location || "").trim()
        };
      })
      .filter(x => x.dayIndex!=null && x.startMin!=null && x.endMin!=null)
      .sort((a,b) => (a.dayIndex - b.dayIndex) || (a.startMin - b.startMin));
    return items;
  }

  async function getPricing(){
    const rows = await fetchTab(TABS.HR_PRICING);
    return rows.map(r => ({
      plan_id: String(r.plan_id || r.id || r.title || "").trim().toLowerCase().replace(/\s+/g,'_'),
      name: String(r.name || "").trim(),
      price: toNumberLoose(r.price),
      currency: String(r.currency || "€").trim(),
      period: String(r.period || "/an").trim(),
      subtitle: String(r.desc || r.subtitle || "").trim(),
      features: splitList(r.features),
      featured: parseBool(r.featured)
    })).filter(x => x.name);
  }

  async function getDiscounts(){
    const rows = await fetchTab(TABS.HR_DISCOUNTS);
    return rows.map(r => ({
      icon: String(r.icon || "").trim(),  // emoji ok
      title: String(r.title || "").trim(),
      text: String(r.text || "").trim()
    })).filter(x => x.title);
  }

  async function getFAQ(){
    const rows = await fetchTab(TABS.HR_FAQ);
    return rows.map(r => ({
      q: String(r.q || r.question || "").trim(),
      a: String(r.a || r.answer || "").trim()
    })).filter(x => x.q && x.a);
  }

  async function getHorairesMeta(){
    const rows = await fetchTab(TABS.HR_META);
    const r = rows && rows[0] || {};
    return {
      season: String(r.season || "").trim(),
      note1: String(r.note1 || "").trim(),
      note2: String(r.note2 || "").trim(),
      passage_fee: String(r.passage_fee || r.passage || "").trim()
    };
  }

  // --- événements : Stages vacances ---
async function getEventsCamps(){
  const rows = await fetchTab(TABS.EVENTS_CAMPS);
  return rows
    .filter(r => parseBool(r.enabled ?? r.active ?? true))
    .map(r => ({
      month: String(r.month || "").trim().toUpperCase(),  // ex: JUIL
      days: String(r.days || "").trim(),
      title: String(r.title || "").trim(),
      description: String(r.description || r.desc || "").trim(),
      age: String(r.age || "").trim(),
      time: String(r.time || "").trim(),
      price: String(r.price || "").trim(),
      cta_text: String(r.cta_text || "S'inscrire").trim(),
      cta_url: String(r.cta_url || "pages/contact.html").trim(),
      order: toNumberLoose(r.order)
    }))
    .filter(x => x.title)
    .sort((a,b) => (a.order||999) - (b.order||999));
}

// --- événements : Compétitions officielles ---
async function getEventsCompetitions(){
  const rows = await fetchTab(TABS.EVENTS_COMPETITIONS);
  return rows
    .filter(r => parseBool(r.enabled ?? r.active ?? true))
    .map(r => ({
      icon: String(r.icon || "flag-checkered").trim(), // sans 'fa-' (on l'ajoute au rendu)
      title: String(r.title || "").trim(),
      description: String(r.description || r.desc || "").trim(),
      period: String(r.period || "").trim(),
      link_text: String(r.link_text || "").trim(),
      link_url: String(r.link_url || "").trim(),
      order: toNumberLoose(r.order)
    }))
    .filter(x => x.title)
    .sort((a,b) => (a.order||999) - (b.order||999));
}

  /* ============ High level API (pages) ============ */
  const AEAData = {
    // raw access (returns Promises)
    _fetchTab: (name) => track(fetchTab(name)),

    // home
    fetchHeroStats: () => track(getHeroStats()),

    // club
    fetchClubStats: () => track(getClubStats()),
    fetchTimeline: () => track(getTimeline()),
    fetchPalmares: () => track(getPalmares()),
    fetchAchievements: () => track(getAchievements()),
    fetchValues: () => track(getValues()),
    fetchTeam: () => track(getTeam()),

    // ecole
    fetchEcoleLevels: () => track(getEcoleLevels()),
    fetchEcoleInterventions: () => track(getEcoleInterventions()),
    fetchEcoleStats: () => track(getEcoleStats()),

    // horaires
    fetchScheduleWeek: () => track(getScheduleWeek()),
    fetchPricing: () => track(getPricing()),
    fetchDiscounts: () => track(getDiscounts()),
    fetchFAQ: () => track(getFAQ()),
    fetchHorairesMeta: () => track(getHorairesMeta()),

    fetchEventsCamps:        () => track(getEventsCamps()),
    fetchEventsCompetitions: () => track(getEventsCompetitions()),

    // utils
    utils: { DAYS, parseTimeMin, parseBool, splitList }
  };

  // Optional compositors (used by xxx.js)
  const AEAContent = {
    async loadClub(){
      const [stats, timeline, palmares, achievements, values, team, glob] = await Promise.all([
        getClubStats(), getTimeline(), getPalmares(), getAchievements(), getValues(), getTeam(), getHeroStats()
      ]);
      return { stats, timeline, palmares, achievements, values, team, glob };
    },

    async loadEcole(){
      const [levels, interventions, badges] = await Promise.all([
        getEcoleLevels(), getEcoleInterventions(), getEcoleStats()
      ]);
      // Flatten interventions: if multiple rows, keep first as main
      const interventionsMain = interventions[0] || { title:"", schools:[], benefits:[], quote:"", cite:"" };
      return { levels, interventions: interventionsMain, badges };
    },

    async loadHoraires(){
      const [week, pricing, discounts, faq, meta] = await Promise.all([
        getScheduleWeek(), getPricing(), getDiscounts(), getFAQ(), getHorairesMeta()
      ]);
      return { week, pricing, discounts, faq, meta };
    },

    async loadEvenements(){
      const [camps, competitions] = await Promise.all([
        getEventsCamps(),
        getEventsCompetitions()
      ]);
      return { camps, competitions };
    }
  };

  // expose globally
  window.AEAData = AEAData;
  window.AEAContent = AEAContent;
})();
