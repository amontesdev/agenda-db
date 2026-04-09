export const ACTIVITIES = {
  trabajo:    { emoji: "💼", label: "Trabajo Principal",      color: "#93c5fd", bg: "#0c1e3a", border: "#1d4ed8" },
  software:   { emoji: "🛠️", label: "Software Propio",        color: "#c084fc", bg: "#150b28", border: "#6d28d9" },
  interviews: { emoji: "📚", label: "Estudio Interviews",     color: "#fcd34d", bg: "#1c1000", border: "#b45309" },
  tiktok:     { emoji: "🎬", label: "TikTok / Redes",         color: "#f9a8d4", bg: "#1f0018", border: "#be185d" },
  lectura:    { emoji: "📖", label: "Lectura + Afirmaciones", color: "#6ee7b7", bg: "#021a12", border: "#047857" },
  desayuno:   { emoji: "🍳", label: "Desayuno",               color: "#fdba74", bg: "#1c0b00", border: "#c2410c" },
  almuerzo:   { emoji: "🥗", label: "Almuerzo",               color: "#bef264", bg: "#101f02", border: "#4d7c0f" },
  cena:       { emoji: "🍽️", label: "Cena",                   color: "#fca5a5", bg: "#1f0505", border: "#b91c1c" },
  pausa:      { emoji: "☕", label: "Pausa",                  color: "#94a3b8", bg: "#0a1020", border: "#cbd5e1" },
  libre:      { emoji: "☀️", label: "Tiempo Libre",           color: "#fde68a", bg: "#1a1000", border: "#92400e" },
};

export const DEFAULT_MINS = {
  trabajo:480, software:90, interviews:120, tiktok:60,
  lectura:20, desayuno:40, almuerzo:45, cena:45, pausa:15, libre:60,
};

export const PRODUCTIVE_TYPES = ["trabajo","software","interviews","tiktok"];

export const PRESETS = {
  semana: {
    1: [{type:"lectura",mins:20},{type:"desayuno",mins:30},{type:"interviews",mins:120},{type:"trabajo",mins:310},{type:"almuerzo",mins:45},{type:"trabajo",mins:165},{type:"software",mins:90},{type:"tiktok",mins:45},{type:"cena",mins:45},{type:"libre",mins:30}],
    2: [{type:"lectura",mins:20},{type:"desayuno",mins:30},{type:"trabajo",mins:240},{type:"pausa",mins:10},{type:"trabajo",mins:240},{type:"almuerzo",mins:45},{type:"software",mins:105},{type:"interviews",mins:90},{type:"tiktok",mins:45},{type:"cena",mins:45},{type:"libre",mins:30}],
    3: [{type:"lectura",mins:20},{type:"desayuno",mins:30},{type:"interviews",mins:90},{type:"pausa",mins:10},{type:"trabajo",mins:180},{type:"pausa",mins:10},{type:"software",mins:90},{type:"pausa",mins:20},{type:"almuerzo",mins:45},{type:"trabajo",mins:180},{type:"software",mins:60},{type:"tiktok",mins:60},{type:"cena",mins:45},{type:"libre",mins:30}],
  },
  sabado: {
    1: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"software",mins:180},{type:"pausa",mins:15},{type:"software",mins:75},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
    2: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"software",mins:90},{type:"pausa",mins:15},{type:"software",mins:90},{type:"interviews",mins:60},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
    3: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"interviews",mins:90},{type:"software",mins:90},{type:"tiktok",mins:45},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
  },
  domingo: {
    1: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"interviews",mins:120},{type:"tiktok",mins:90},{type:"interviews",mins:60},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
    2: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"tiktok",mins:90},{type:"interviews",mins:60},{type:"pausa",mins:15},{type:"software",mins:90},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
    3: [{type:"lectura",mins:20},{type:"desayuno",mins:40},{type:"software",mins:90},{type:"libre",mins:150},{type:"almuerzo",mins:60},{type:"libre",mins:120}],
  },
};

export const DAY_STARTS = { semana:"04:30", sabado:"07:00", domingo:"08:00" };
export const DAY_LABELS  = { semana:"Lun — Vie", sabado:"Sábado", domingo:"Domingo" };

export const SUMMARY_GROUPS = [
  ["💼","Trabajo",     ["trabajo"]],
  ["🔬","Crecimiento", ["software","interviews"]],
  ["🎬","Contenido",   ["tiktok"]],
  ["🍽️","Comidas",     ["desayuno","almuerzo","cena"]],
  ["☕","Resto",       ["pausa","libre","lectura"]],
];

export const STATUS_CONFIG = {
  loading:{ dot:"#94a3b8", label:"Conectando...", glow:false },
  ok:     { dot:"#6ee7b7", label:"Guardado",      glow:true  },
  saving: { dot:"#fcd34d", label:"Guardando...",  glow:false },
  empty:  { dot:"#f97316", label:"Sin datos",     glow:false },
  error:  { dot:"#f87171", label:"Error",         glow:false },
};

export const LOG_COLORS = { query:"#60a5fa", ok:"#6ee7b7", warn:"#fcd34d", error:"#f87171", info:"#94a3b8" };

let internalId = 1;
export const mkId = () => ++internalId;
export const seed = (arr = []) => arr.map(b => ({ ...b, id: mkId() }));

export const toTime = (startTime, extra) => {
  const [sh, sm] = startTime.split(":").map(Number);
  const t = sh * 60 + sm + extra;
  return `${Math.floor(t/60)%24}:${(t%60).toString().padStart(2,"0")}`;
};

export const fmtMins = (m) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
};
