"use client";
import { useState, useEffect, useCallback } from "react";

/* ─── Datos ────────────────────────────────────────────────────────────── */
const ACTIVITIES = {
  trabajo:    { emoji: "💼", label: "Trabajo Principal",      color: "#93c5fd", bg: "#0c1e3a", border: "#1d4ed8" },
  software:   { emoji: "🛠️", label: "Software Propio",        color: "#c084fc", bg: "#150b28", border: "#6d28d9" },
  interviews: { emoji: "📚", label: "Estudio Interviews",     color: "#fcd34d", bg: "#1c1000", border: "#b45309" },
  tiktok:     { emoji: "🎬", label: "TikTok / Redes",         color: "#f9a8d4", bg: "#1f0018", border: "#be185d" },
  lectura:    { emoji: "📖", label: "Lectura + Afirmaciones", color: "#6ee7b7", bg: "#021a12", border: "#047857" },
  desayuno:   { emoji: "🍳", label: "Desayuno",               color: "#fdba74", bg: "#1c0b00", border: "#c2410c" },
  almuerzo:   { emoji: "🥗", label: "Almuerzo",               color: "#bef264", bg: "#101f02", border: "#4d7c0f" },
  cena:       { emoji: "🍽️", label: "Cena",                   color: "#fca5a5", bg: "#1f0505", border: "#b91c1c" },
  pausa:      { emoji: "☕", label: "Pausa",                  color: "#94a3b8", bg: "#0a1020", border: "#334155" },
  libre:      { emoji: "☀️", label: "Tiempo Libre",           color: "#fde68a", bg: "#1a1000", border: "#92400e" },
};

const DEFAULT_MINS = {
  trabajo:480, software:90, interviews:120, tiktok:60,
  lectura:20, desayuno:40, almuerzo:45, cena:45, pausa:15, libre:60,
};

const PRESETS = {
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

const DAY_STARTS = { semana:{h:4,m:30}, sabado:{h:7,m:0}, domingo:{h:8,m:0} };
const DAY_LABELS  = { semana:"Lun — Vie", sabado:"Sábado", domingo:"Domingo" };

let _uid = 1;
const mkId   = () => ++_uid;
const seed   = (arr) => arr.map(b => ({ ...b, id: mkId() }));
const toTime = (sh, sm, extra) => {
  const t = sh * 60 + sm + extra;
  return `${Math.floor(t/60)%24}:${(t%60).toString().padStart(2,"0")}`;
};
const fmtMins = (m) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

/* ─── API helpers ──────────────────────────────────────────────────────── */
async function apiLoad(day, option) {
  const res = await fetch(`/api/agenda?day=${day}&option=${option}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Error al cargar desde SQLite");
  return res.json();
}

async function apiSave(day, option, blocks) {
  const plain = blocks.map(({ id, ...rest }) => rest);
  const res = await fetch("/api/agenda", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ day, option, blocks: plain }),
  });
  if (!res.ok) throw new Error("Error al guardar en SQLite");
  return res.json();
}

/* ─── Componente principal ─────────────────────────────────────────────── */
export default function AgendaApp() {
  const [day,      setDay]      = useState("semana");
  const [opt,      setOpt]      = useState(1);
  const [blocks,   setBlocks]   = useState(() => seed(PRESETS.semana[1]));
  const [editId,   setEditId]   = useState(null);
  const [editVal,  setEditVal]  = useState("");
  const [dragIdx,  setDragIdx]  = useState(null);
  const [overIdx,  setOverIdx]  = useState(null);
  const [dbStatus, setDbStatus] = useState("loading");
  const [savedAt,  setSavedAt]  = useState(null);
  const [loaded,   setLoaded]   = useState(false);
  const [sqlLog,   setSqlLog]   = useState([]);

  const pushLog = (msg, type = "info") =>
    setSqlLog(l => [...l.slice(-11), { msg, type, ts: new Date().toLocaleTimeString("es-CO") }]);

  /* ── Cargar día/opción desde SQLite ── */
  const loadFromDB = useCallback(async (d, p) => {
    setDbStatus("loading");
    pushLog(`SELECT * FROM schedules WHERE day='${d}' AND option=${p}`, "query");
    try {
      const data = await apiLoad(d, p);
      if (data?.found) {
        setBlocks(seed(data.blocks));
        setSavedAt(new Date(data.updated_at).toLocaleTimeString("es-CO", {hour:"2-digit",minute:"2-digit"}));
        pushLog(`✓ ${data.blocks.length} bloques cargados`, "ok");
        setDbStatus("ok");
      } else {
        setBlocks(seed(PRESETS[d][p]));
        pushLog(`(sin datos) → cargando preset`, "warn");
        setDbStatus("empty");
      }
    } catch (e) {
      pushLog(`✗ ${e.message}`, "error");
      setDbStatus("error");
    }
  }, []);

  /* ── Guardar en SQLite (debounce 700ms) ── */
  useEffect(() => {
    if (!loaded) return;
    setDbStatus("saving");
    const t = setTimeout(async () => {
      const plain = blocks.map(({ id, ...rest }) => rest);
      pushLog(`INSERT OR REPLACE INTO schedules (day='${day}', option=${opt}, blocks[${plain.length}])`, "query");
      try {
        await apiSave(day, opt, blocks);
        const ts = new Date().toLocaleTimeString("es-CO", {hour:"2-digit",minute:"2-digit"});
        setSavedAt(ts);
        setDbStatus("ok");
        pushLog(`✓ Guardado correctamente — ${ts}`, "ok");
      } catch (e) {
        setDbStatus("error");
        pushLog(`✗ ${e.message}`, "error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [blocks, day, opt, loaded]);

  /* ── Mount: cargar estado actual ── */
  useEffect(() => {
    loadFromDB("semana", 1).finally(() => setLoaded(true));
  }, []);

  /* ── Cambiar día/opción ── */
  const switchTo = (d, p) => {
    setDay(d); setOpt(p); setEditId(null);
    loadFromDB(d, p);
  };

  /* ── Drag & Drop ── */
  const handleDragStart = (i)    => setDragIdx(i);
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (e)    => {
    e.preventDefault();
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const nb = [...blocks];
      const [item] = nb.splice(dragIdx, 1);
      nb.splice(overIdx, 0, item);
      setBlocks(nb);
    }
    setDragIdx(null); setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  /* ── CRUD bloques ── */
  const remove   = (id)   => setBlocks(blocks.filter(b => b.id !== id));
  const addBlk   = (type) => setBlocks([...blocks, { type, mins: DEFAULT_MINS[type], id: mkId() }]);
  const saveEdit = ()     => {
    const m = parseInt(editVal);
    if (!isNaN(m) && m > 0) setBlocks(blocks.map(b => b.id === editId ? {...b, mins:m} : b));
    setEditId(null);
  };

  /* ── Timeline ── */
  const { h:sh, m:sm } = DAY_STARTS[day];
  let off = 0;
  const timed = blocks.map(b => {
    const s = toTime(sh, sm, off); off += b.mins;
    return { ...b, start:s, end:toTime(sh, sm, off) };
  });
  const totalMins      = blocks.reduce((s,b)=>s+b.mins,0);
  const productiveMins = blocks.filter(b=>["trabajo","software","interviews","tiktok"].includes(b.type))
                               .reduce((s,b)=>s+b.mins,0);

  /* ── Status config ── */
  const STATUS = {
    loading:{ dot:"#94a3b8", label:"Conectando...", glow:false },
    ok:     { dot:"#6ee7b7", label:"Guardado",      glow:true  },
    saving: { dot:"#fcd34d", label:"Guardando...",  glow:false },
    empty:  { dot:"#f97316", label:"Sin datos",     glow:false },
    error:  { dot:"#f87171", label:"Error",         glow:false },
  };
  const sc = STATUS[dbStatus] || STATUS.ok;

  const LOG_COLORS = { query:"#60a5fa", ok:"#6ee7b7", warn:"#fcd34d", error:"#f87171", info:"#94a3b8" };

  /* ── Render ── */
  return (
    <div style={{ minHeight:"100vh", background:"#060a10", color:"#cbd5e1",
      fontFamily:"'Space Mono','Courier New',monospace", display:"flex", flexDirection:"column" }}>

      {/* ── Header ── */}
      <div style={{ background:"#08101a", borderBottom:"1px solid #1e293b", padding:"16px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"8px" }}>
          <div>
            <div style={{ fontSize:"17px", fontWeight:"700", color:"#f1f5f9" }}>⚡ MI AGENDA</div>
            <div style={{ fontSize:"9px", color:"#1e3a5f", letterSpacing:"3px", marginTop:"2px" }}>
              SQLITE · TURSO · NEXT.JS · VERCEL
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"5px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px",
              background:"#0a1525", border:"1px solid #1e293b", borderRadius:"20px", padding:"4px 12px" }}>
              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:sc.dot, flexShrink:0,
                boxShadow:sc.glow ? `0 0 8px ${sc.dot}` : "none", display:"inline-block", transition:"all 0.4s" }}/>
              <span style={{ fontSize:"9px", letterSpacing:"1.5px", color:sc.dot, transition:"color 0.4s" }}>
                🗄️ SQLite — {sc.label}
              </span>
              {savedAt && dbStatus==="ok" && (
                <span style={{ fontSize:"9px", color:"#334155", marginLeft:"4px" }}>· {savedAt}</span>
              )}
            </div>
            <div style={{ fontSize:"10px", color:"#64748b" }}>
              Total: <b style={{ color:"#f8fafc" }}>{fmtMins(totalMins)}</b>
              <span style={{ color:"#1e293b" }}> · </span>
              Productivo: <b style={{ color:"#fbbf24" }}>{fmtMins(productiveMins)}</b>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display:"flex", gap:"5px", marginTop:"14px", flexWrap:"wrap", alignItems:"center" }}>
          {Object.keys(PRESETS).map(d => (
            <button key={d} onClick={() => switchTo(d, opt)} style={{
              padding:"5px 13px", border:"1px solid", cursor:"pointer",
              borderColor: day===d ? "#60a5fa" : "#1e293b",
              background:  day===d ? "#0f2340" : "transparent",
              color:       day===d ? "#93c5fd" : "#475569",
              borderRadius:"6px", fontSize:"10px", fontFamily:"inherit",
              fontWeight:"700", letterSpacing:"1px", transition:"all 0.15s",
            }}>{DAY_LABELS[d]}</button>
          ))}
          <div style={{ width:"1px", height:"22px", background:"#1e293b", margin:"0 3px" }}/>
          {[1,2,3].map(p => (
            <button key={p} onClick={() => switchTo(day, p)} style={{
              padding:"5px 12px", border:"1px solid", cursor:"pointer",
              borderColor: opt===p ? "#c084fc" : "#1e293b",
              background:  opt===p ? "#150822" : "transparent",
              color:       opt===p ? "#c084fc" : "#475569",
              borderRadius:"6px", fontSize:"10px", fontFamily:"inherit",
              fontWeight:"700", transition:"all 0.15s",
            }}>OPT {p}</button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Timeline */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
          <div style={{ fontSize:"9px", color:"#1e3a5f", letterSpacing:"2px", marginBottom:"12px" }}>
            ↕ ARRASTRA · ✎ EDITAR · AUTO-GUARDADO EN SQLITE
          </div>
          <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
            {timed.map((b, i) => {
              const act = ACTIVITIES[b.type];
              const h   = Math.max(52, Math.min(b.mins * 0.75, 160));
              const isD = dragIdx === i;
              const isO = overIdx === i && dragIdx !== null && dragIdx !== i;
              const isE = editId === b.id;
              return (
                <div key={b.id} draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  style={{ display:"flex", alignItems:"stretch", marginBottom:"3px",
                    opacity:isD?0.25:1, transition:"opacity 0.15s" }}>
                  {/* Hora */}
                  <div style={{ width:"60px", flexShrink:0, display:"flex", flexDirection:"column",
                    justifyContent:"space-between", paddingRight:"10px", paddingBottom:"2px",
                    fontSize:"10px", color:"#334155", userSelect:"none" }}>
                    <span>{b.start}</span><span>{b.end}</span>
                  </div>
                  {/* Card */}
                  <div style={{ flex:1, minHeight:`${h}px`,
                    background:isO?act.border+"22":act.bg,
                    border:`1.5px solid ${isO?act.color:act.border}`,
                    borderRadius:"8px", padding:"10px 14px", cursor:"grab",
                    display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px",
                    transition:"all 0.12s", boxSizing:"border-box",
                    boxShadow:isO?`0 0 0 2px ${act.border}44`:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", flex:1, minWidth:0 }}>
                      <span style={{ fontSize:"18px", flexShrink:0 }}>{act.emoji}</span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:act.color,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {act.label}
                        </div>
                        {isE ? (
                          <div style={{ display:"flex", gap:"5px", marginTop:"4px", alignItems:"center" }}>
                            <input type="number" value={editVal}
                              onChange={e=>setEditVal(e.target.value)}
                              onKeyDown={e=>e.key==="Enter"&&saveEdit()}
                              style={{ width:"52px", background:"#1e293b", border:"1px solid #475569",
                                color:"#e2e8f0", borderRadius:"4px", padding:"3px 6px",
                                fontSize:"11px", fontFamily:"inherit", outline:"none" }}
                              autoFocus />
                            <span style={{ fontSize:"9px", color:"#64748b" }}>min</span>
                            <button onClick={saveEdit} style={{ background:"#047857", border:"none",
                              color:"white", borderRadius:"4px", padding:"3px 9px",
                              cursor:"pointer", fontSize:"11px", fontFamily:"inherit" }}>✓</button>
                            <button onClick={()=>setEditId(null)} style={{ background:"transparent",
                              border:"1px solid #334155", color:"#64748b", borderRadius:"4px",
                              padding:"3px 7px", cursor:"pointer", fontSize:"11px", fontFamily:"inherit" }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={()=>{setEditId(b.id);setEditVal(String(b.mins));}} style={{
                            background:"none", border:"none", color:"#475569", fontSize:"10px",
                            cursor:"pointer", padding:0, fontFamily:"inherit", marginTop:"2px", display:"block" }}>
                            {fmtMins(b.mins)} ✎
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                      <span style={{ color:"#2d3f55", fontSize:"18px", cursor:"grab", userSelect:"none" }}>⠿</span>
                      <button onClick={()=>remove(b.id)} style={{
                        background:"transparent", border:"1px solid #1e293b", color:"#475569",
                        cursor:"pointer", fontSize:"11px", borderRadius:"4px",
                        padding:"2px 7px", fontFamily:"inherit", lineHeight:1.2 }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {blocks.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#1e3a5f", fontSize:"11px", letterSpacing:"1px" }}>
                AGENDA VACÍA — AGREGA BLOQUES →
              </div>
            )}
          </div>
        </div>

        {/* ─ Panel derecho ─ */}
        <div style={{ width:"200px", flexShrink:0, background:"#07101a",
          borderLeft:"1px solid #1e293b", padding:"18px 13px", overflowY:"auto",
          display:"flex", flexDirection:"column", gap:"0" }}>

          {/* Agregar */}
          <div style={{ fontSize:"9px", color:"#334155", letterSpacing:"2.5px", marginBottom:"11px" }}>+ AGREGAR</div>
          {Object.entries(ACTIVITIES).map(([key, act]) => (
            <button key={key} onClick={()=>addBlk(key)} style={{
              display:"flex", alignItems:"center", gap:"7px", width:"100%",
              padding:"7px 9px", marginBottom:"4px",
              background:act.bg, border:`1px solid ${act.border}`,
              borderRadius:"7px", cursor:"pointer", color:act.color,
              fontSize:"10px", fontFamily:"inherit", fontWeight:"600",
              textAlign:"left", transition:"all 0.12s", lineHeight:"1.4" }}>
              <span style={{ flexShrink:0 }}>{act.emoji}</span>
              <span>{act.label}</span>
            </button>
          ))}

          {/* Resumen */}
          <div style={{ marginTop:"18px", paddingTop:"16px", borderTop:"1px solid #1e293b" }}>
            <div style={{ fontSize:"9px", color:"#334155", letterSpacing:"2px", marginBottom:"9px" }}>RESUMEN</div>
            {[
              ["💼","Trabajo",     ["trabajo"]],
              ["🔬","Crecimiento", ["software","interviews"]],
              ["🎬","Contenido",   ["tiktok"]],
              ["🍽️","Comidas",     ["desayuno","almuerzo","cena"]],
              ["☕","Resto",       ["pausa","libre","lectura"]],
            ].map(([emoji, label, types]) => {
              const m = blocks.filter(b=>types.includes(b.type)).reduce((s,b)=>s+b.mins,0);
              return m > 0 ? (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  fontSize:"10px", marginBottom:"5px" }}>
                  <span style={{ color:"#475569" }}>{emoji} {label}</span>
                  <span style={{ color:"#94a3b8" }}>{fmtMins(m)}</span>
                </div>
              ) : null;
            })}
          </div>

          {/* SQL Log */}
          <div style={{ marginTop:"18px", paddingTop:"16px", borderTop:"1px solid #1e293b", flex:1 }}>
            <div style={{ fontSize:"9px", color:"#334155", letterSpacing:"2px", marginBottom:"9px" }}>
              SQL LOG
            </div>
            <div style={{ fontSize:"8.5px", lineHeight:"1.8", maxHeight:"220px", overflowY:"auto" }}>
              {sqlLog.length === 0 && <span style={{ color:"#1e3a5f" }}>sin actividad aún...</span>}
              {sqlLog.map((l, i) => (
                <div key={i} style={{ color: LOG_COLORS[l.type] || "#94a3b8", wordBreak:"break-word" }}>
                  <span style={{ color:"#1e3a5f", marginRight:"4px" }}>{l.ts}</span>
                  {l.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
