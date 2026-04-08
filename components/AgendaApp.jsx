"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

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
  pausa:      { emoji: "☕", label: "Pausa",                  color: "#94a3b8", bg: "#0a1020", border: "#cbd5e1" },
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

const DAY_STARTS = { semana:"04:30", sabado:"07:00", domingo:"08:00" };
const DAY_LABELS  = { semana:"Lun — Vie", sabado:"Sábado", domingo:"Domingo" };

let _uid = 1;
const mkId   = () => ++_uid;
const seed   = (arr) => arr.map(b => ({ ...b, id: mkId() }));
const toTime = (startTime, extra) => {
  const [sh, sm] = startTime.split(":").map(Number);
  const t = sh * 60 + sm + extra;
  return `${Math.floor(t/60)%24}:${(t%60).toString().padStart(2,"0")}`;
};
const fmtMins = (m) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

/* ─── API helpers ──────────────────────────────────────────────────────── */
const authHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};

async function apiLoad(day, option, token) {
  const res = await fetch(`/api/agenda?day=${day}&option=${option}`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Error al cargar desde SQLite");
  return res.json();
}

async function apiSave(day, option, blocks, startTime, token) {
  const plain = blocks.map(({ id, ...rest }) => rest);
  const res = await fetch("/api/agenda", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body:    JSON.stringify({ day, option, blocks: plain, startTime }),
  });
  if (!res.ok) throw new Error("Error al guardar en SQLite");
  return res.json();
}

async function apiLoadTasks(token) {
  const res = await fetch("/api/tasks", {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Error al cargar tareas");
  return res.json();
}

async function apiCreateTask(task, token) {
  const res = await fetch("/api/tasks", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body:    JSON.stringify(task),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error al crear tarea");
  return data || { ok: false };
}

async function apiUpdateTask(id, task, token) {
  const res = await fetch(`/api/tasks?id=${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body:    JSON.stringify(task),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error al actualizar tarea");
  return data || { ok: true };
}

async function apiDeleteTask(id, token) {
  const res = await fetch(`/api/tasks?id=${id}`, {
    method:  "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Error al eliminar tarea");
  return data || { ok: true };
}

/* ─── Componente principal ─────────────────────────────────────────────── */
export default function AgendaApp() {
  const { token, user, signOut, claims } = useAuth();
  const isAdmin = claims?.role === "admin";
  const [day,      setDay]      = useState("semana");
  const [opt,      setOpt]      = useState(1);
  const [startTime, setStartTime] = useState("04:30");
  const [blocks,   setBlocks]   = useState(() => seed(PRESETS.semana[1]));
  const [customTasks, setCustomTasks] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ name: "", emoji: "📌", color: "#94a3b8", bg: "#94a3b822", border: "#334155", mins: 30 });
  const [editId,   setEditId]   = useState(null);
  const [editVal,  setEditVal]  = useState("");
  const [dragIdx,  setDragIdx]  = useState(null);
  const [overIdx,  setOverIdx]  = useState(null);
  const [dbStatus, setDbStatus] = useState("loading");
  const [savedAt,  setSavedAt]  = useState(null);
  const [loaded,   setLoaded]   = useState(false);
  const [sqlLog,   setSqlLog]   = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Hook para detectar si es móvil
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  // Effect para manejar resize
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pushLog = useCallback((msg, type = "info") => {
    setSqlLog(l => [...l.slice(-11), { msg, type, ts: new Date().toLocaleTimeString("es-CO") }]);
  }, []);

  /* ── Cargar día/opción desde SQLite ── */
  const loadFromDB = useCallback(async (d, p) => {
    if (!token) return;
    setDbStatus("loading");
    pushLog(`SELECT * FROM schedules WHERE day='${d}' AND option=${p}`, "query");
    try {
      const data = await apiLoad(d, p, token);
      if (data?.found) {
        setBlocks(seed(data.blocks));
        setStartTime(data.startTime || DAY_STARTS[d]);
        setSavedAt(new Date(data.updated_at).toLocaleTimeString("es-CO", {hour:"2-digit",minute:"2-digit"}));
        pushLog(`✓ ${data.blocks.length} bloques cargados`, "ok");
        setDbStatus("ok");
      } else {
        setBlocks(seed(PRESETS[d][p]));
        setStartTime(DAY_STARTS[d]);
        pushLog(`(sin datos) → cargando preset`, "warn");
        setDbStatus("empty");
      }
    } catch (e) {
      pushLog(`✗ ${e.message}`, "error");
      setDbStatus("error");
    }
  }, [pushLog, token]);

  /* ── Guardar en SQLite (debounce 700ms) ── */
  useEffect(() => {
    if (!loaded || !token) return;
    setDbStatus("saving");
    const t = setTimeout(async () => {
      const plain = blocks.map(({ id, ...rest }) => rest);
      pushLog(`INSERT OR REPLACE INTO schedules (day='${day}', option=${opt}, blocks[${plain.length}])`, "query");
      try {
        await apiSave(day, opt, blocks, startTime, token);
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
  }, [blocks, day, opt, startTime, loaded, token, pushLog]);

  /* ── Mount: cargar estado actual ── */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const taskData = await apiLoadTasks(token);
        if (cancelled) return;

        const tasks = {};
        (taskData?.tasks || []).forEach(t => {
          const id = typeof t.id === "bigint" ? Number(t.id) : t.id;
          tasks[`custom_${id}`] = {
            emoji: t.emoji ?? "📌",
            label: t.name ?? `custom_${id}`,
            color: t.color ?? "#94a3b8",
            bg:    t.bg    ?? `${t.color ?? "#94a3b8"}22`,
            border:t.border?? (t.color ?? "#334155"),
            mins:  Number.isFinite(Number(t.mins)) ? Number(t.mins) : 30,
          };
        });
        setCustomTasks(tasks);
      } catch (err) {
        pushLog(`✗ ${err?.message ?? "Error al cargar tareas"}`, "error");
      }

      await loadFromDB("semana", 1);
    };

    bootstrap().finally(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [loadFromDB, pushLog, token]);

  /* ── Cambiar día/opción ── */
  const switchTo = (d, p) => {
    setDay(d); setOpt(p); setEditId(null);
    loadFromDB(d, p);
  };

/* ── Drag & Drop (desktop) ── */
  const handleDragStart = (i)    => setDragIdx(i);
  const handleDragOver  = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const handleDrop      = (e) => {
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

  // Touch & hold para reordenar en móvil
  const [touchState, setTouchState] = useState({ active: false, startIdx: null, currentIdx: null });

  const handleTouchStart = (e) => {
    if (!isAdmin) return;
    
    // Buscar el índice del elemento en el bloque
    const blockDiv = e.target.closest('[data-block]');
    if (!blockDiv) return;
    
    const container = e.currentTarget;
    const blocks = container.querySelectorAll('[data-block]');
    if (!blocks) return;
    
    let idx = 0;
    blocks.forEach((b, i) => {
      if (b === blockDiv) idx = i;
    });
    
    e.preventDefault(); // Prevenir selección de texto
    setTouchState({ active: true, startIdx: idx, currentIdx: idx });
  };

  const handleTouchMove = (e) => {
    if (!touchState.active || !isAdmin) return;
    
    const touch = e.touches[0];
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const relativeY = touch.clientY - rect.top + container.scrollTop;
    
    // Calcular índice basado en posición Y
    const items = container.querySelectorAll('[data-block]');
    let newIdx = touchState.startIdx;
    
    items.forEach((item, i) => {
      const itemRect = item.getBoundingClientRect();
      const itemTop = itemRect.top - rect.top + container.scrollTop;
      if (relativeY >= itemTop && relativeY < itemTop + itemRect.height) {
        newIdx = i;
      }
    });
    
    if (newIdx !== touchState.currentIdx) {
      setTouchState(prev => ({ ...prev, currentIdx: newIdx }));
    }
    
    e.preventDefault(); // Prevenir selección de texto y scroll nativo
  };

  const handleTouchEnd = () => {
    if (!touchState.active || touchState.startIdx === null || touchState.currentIdx === null) {
      setTouchState({ active: false, startIdx: null, currentIdx: null });
      return;
    }

    const { startIdx, currentIdx } = touchState;
    
    if (startIdx !== currentIdx && startIdx !== null && currentIdx !== null) {
      const nb = [...blocks];
      const [item] = nb.splice(startIdx, 1);
      nb.splice(currentIdx, 0, item);
      setBlocks(nb);
    }
    
    setTouchState({ active: false, startIdx: null, currentIdx: null });
  };

  /* ── CRUD bloques ── */
  const remove   = (id)   => setBlocks(blocks.filter(b => b.id !== id));
  const addBlk   = (type) => {
    const isCustom = type.startsWith("custom_");
    const mins = isCustom ? (customTasks[type]?.mins || 30) : DEFAULT_MINS[type];
    setBlocks([...blocks, { type, mins, id: mkId() }]);
  };
  const saveEdit = ()     => {
    const m = parseInt(editVal);
    if (!isNaN(m) && m > 0) setBlocks(blocks.map(b => b.id === editId ? {...b, mins:m} : b));
    setEditId(null);
  };

  /* ── Timeline ── */
  let off = 0;
  const timed = blocks.map(b => {
    const s = toTime(startTime, off); off += b.mins;
    return { ...b, start:s, end:toTime(startTime, off) };
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
      <div style={{ background:"#08101a", borderBottom:"1px solid #334155", padding:"16px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"8px" }}>
          <div>
            <div style={{ fontSize:"17px", fontWeight:"700", color:"#f1f5f9" }}>⚡ MI AGENDA</div>
            <div style={{ fontSize:"9px", color:"#1e3a5f", letterSpacing:"3px", marginTop:"2px" }}>
              SQLITE · TURSO · NEXT.JS · VERCEL
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"5px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"10px", letterSpacing:"1px", color:"#94a3b8" }}>{user?.email}</span>
              <button onClick={signOut} style={{
                border:"1px solid #334155",
                background:"rgba(8,17,26,0.6)",
                color:"#f87171",
                fontSize:"10px",
                letterSpacing:"1px",
                borderRadius:"999px",
                padding:"4px 10px",
                cursor:"pointer",
                textTransform:"uppercase",
              }}>Cerrar sesión</button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"6px",
              background:"#0a1525", border:"1px solid #334155", borderRadius:"20px", padding:"4px 12px" }}>
              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:sc.dot, flexShrink:0,
                boxShadow:sc.glow ? `0 0 8px ${sc.dot}` : "none", display:"inline-block", transition:"all 0.4s" }}/>
              <span style={{ fontSize:"9px", letterSpacing:"1.5px", color:sc.dot, transition:"color 0.4s" }}>
                🗄️ SQLite — {sc.label}
              </span>
              {savedAt && dbStatus==="ok" && (
                <span style={{ fontSize:"9px", color:"#cbd5e1", marginLeft:"4px" }}>· {savedAt}</span>
              )}
            </div>
            <div style={{ fontSize:"10px", color:"#cbd5e1" }}>
              Total: <b style={{ color:"#f8fafc" }}>{fmtMins(totalMins)}</b>
              <span style={{ color:"#334155" }}> · </span>
              Productivo: <b style={{ color:"#fbbf24" }}>{fmtMins(productiveMins)}</b>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display:"flex", gap:"5px", marginTop:"14px", flexWrap:"wrap", alignItems:"center" }}>
          {/* Botón toggle sidebar en móvil */}
          {isMobileView && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              padding:"5px 10px", border:"1px solid #334155", cursor:"pointer",
              background: sidebarOpen ? "#0f2340" : "transparent",
              color: sidebarOpen ? "#93c5fd" : "#cbd5e1",
              borderRadius:"6px", fontSize:"10px", fontFamily:"inherit",
              fontWeight:"700", transition:"all 0.15s",
            }}>
              {sidebarOpen ? "☰ Ocultar" : "☰ Mostrar"}
            </button>
          )}
          {Object.keys(PRESETS).map(d => (
            <button key={d} onClick={() => switchTo(d, opt)} style={{
              padding:"5px 13px", border:"1px solid", cursor:"pointer",
              borderColor: day===d ? "#60a5fa" : "#334155",
              background:  day===d ? "#0f2340" : "transparent",
              color:       day===d ? "#93c5fd" : "#cbd5e1",
              borderRadius:"6px", fontSize:"10px", fontFamily:"inherit",
              fontWeight:"700", letterSpacing:"1px", transition:"all 0.15s",
            }}>{DAY_LABELS[d]}</button>
          ))}
          <span style={{ width:"1px", height:"22px", background:"#334155", margin:"0 3px", display:"inline-block" }}/>
          {[1,2,3].map(p => (
            <button key={p} onClick={() => switchTo(day, p)} style={{
              padding:"5px 12px", border:"1px solid", cursor:"pointer",
              borderColor: opt===p ? "#c084fc" : "#334155",
              background:  opt===p ? "#150822" : "transparent",
              color:       opt===p ? "#c084fc" : "#cbd5e1",
              borderRadius:"6px", fontSize:"10px", fontFamily:"inherit",
              fontWeight:"700", transition:"all 0.15s",
            }}>OPT {p}</button>
          ))}
          <span style={{ width:"1px", height:"22px", background:"#334155", margin:"0 3px", display:"inline-block" }}/>
          <input type="time" value={startTime}
            onChange={e=>setStartTime(e.target.value)}
            suppressHydrationWarning
            disabled={!isAdmin}
            style={{ background:"#0a1525", border:"1px solid #334155",
              color:"#6ee7b7", borderRadius:"6px", padding:"4px 8px",
              fontSize:"11px", fontFamily:"inherit", outline:"none", cursor: isAdmin ? "pointer" : "not-allowed", opacity: isAdmin ? 1 : 0.5 }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Timeline */}
        <div 
          data-timeline 
          style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ fontSize:"9px", color:"#1e3a5f", letterSpacing:"2px", marginBottom:"12px" }}>
            ↕ ARRASTRA · ✎ EDITAR · AUTO-GUARDADO EN SQLITE
          </div>
          <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
            {timed.map((b, i) => {
              const act = ACTIVITIES[b.type] || customTasks[b.type] || { emoji: "📌", label: b.type, color: "#94a3b8", bg: "#0a1020", border: "#334155" };
              const h   = Math.max(52, Math.min(b.mins * 0.75, 160));
              const isD = dragIdx === i || (touchState.active && touchState.startIdx === i);
              // Drop target: desktop drag o touch drag
              const isO = (dragIdx !== null && overIdx === i && dragIdx !== i) || 
                          (touchState.active && touchState.currentIdx === i && touchState.startIdx !== i);
              const isE = editId === b.id;
              // Estado de touch para móvil
              const isTouchDragging = touchState.active && touchState.currentIdx === i;
              return (
                <div 
                  key={b.id} 
                  data-block
                  draggable={isAdmin}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  style={{ display:"flex", alignItems:"stretch", marginBottom:"3px",
                    opacity:isD||isTouchDragging?0.4:1, transition:"opacity 0.15s",
                    userSelect:"none", WebkitUserSelect:"none" }}>
                  {/* Hora */}
                  <div style={{ width:"60px", flexShrink:0, display:"flex", flexDirection:"column",
                    justifyContent:"space-between", paddingRight:"10px", paddingBottom:"2px",
                    fontSize:"10px", color:"#cbd5e1", userSelect:"none" }}>
                    <span>{b.start}</span><span>{b.end}</span>
                  </div>
                  {/* Card */}
                  <div style={{ flex:1, minHeight:`${h}px`,
                    background:isO?act.border+"22":act.bg,
                    border:`1.5px solid ${isO?act.color:act.border}`,
                    borderRadius:"8px", padding:"10px 14px", cursor: isAdmin ? "grab" : "default",
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
                              style={{ width:"52px", background:"#334155", border:"1px solid #475569",
                                color:"#e2e8f0", borderRadius:"4px", padding:"3px 6px",
                                fontSize:"11px", fontFamily:"inherit", outline:"none" }}
                              autoFocus />
                            <span style={{ fontSize:"9px", color:"#cbd5e1" }}>min</span>
                            <button type="button" onClick={saveEdit} style={{ background:"#047857", border:"none",
                              color:"white", borderRadius:"4px", padding:"3px 9px",
                              cursor:"pointer", fontSize:"11px", fontFamily:"inherit" }}>✓</button>
                            <button onClick={()=>setEditId(null)} style={{ background:"transparent",
                              border:"1px solid #cbd5e1", color:"#cbd5e1", borderRadius:"4px",
                              padding:"3px 7px", cursor:"pointer", fontSize:"11px", fontFamily:"inherit" }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", gap:"5px", marginTop:"4px", alignItems:"center" }}>
                            {isAdmin && <button onClick={()=>{setEditId(b.id);setEditVal(String(b.mins));}} style={{
                              background:"none", border:"none", color:"#475569", fontSize:"10px",
                              cursor:"pointer", padding:0, fontFamily:"inherit", marginTop:"2px", display:"block" }}>
                              {fmtMins(b.mins)} ✎
                            </button>}
                            {!isAdmin && <span style={{ color:"#475569", fontSize:"10px", marginTop:"2px", display:"block" }}>{fmtMins(b.mins)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                      <span style={{ color:"#2d3f55", fontSize:"18px", cursor:"grab", userSelect:"none" }}>⠿</span>
                      {isAdmin && <button onClick={()=>remove(b.id)} style={{
                        background:"transparent", border:"1px solid #334155", color:"#475569",
                        cursor:"pointer", fontSize:"11px", borderRadius:"4px",
                        padding:"2px 7px", fontFamily:"inherit", lineHeight:1.2 }}>✕</button>}
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
        <div style={{ 
          width: isMobileView ? "200px" : "200px", 
          flexShrink:0, 
          background:"#07101a",
          borderLeft:"1px solid #334155", 
          padding:"18px 13px", 
          overflowY:"auto",
          display:"flex", 
          flexDirection:"column", 
          gap:"0",
          // Ocultar en móvil cuando sidebarOpen es false
          ...(isMobileView && !sidebarOpen ? { display: 'none' } : {})
        }}>

          {/* Agregar */}
          <div style={{ fontSize:"9px", color:"#cbd5e1", letterSpacing:"2.5px", marginBottom:"11px" }}>+ AGREGAR</div>
          {Object.entries({...ACTIVITIES, ...customTasks}).map(([key, act]) => {
            const isCustom = key.startsWith("custom_");
            const taskId = isCustom ? key.replace("custom_", "") : null;
            return (
              <div key={key} style={{ display:"flex", alignItems:"center", marginBottom:"4px" }}>
                {isAdmin ? (
                  <button onClick={()=>addBlk(key)} style={{
                    display:"flex", alignItems:"center", gap:"7px", flex:1,
                    padding:"7px 9px",
                    background:act.bg, border:`1px solid ${act.border}`,
                    borderRadius:"7px", cursor:"pointer", color:act.color,
                    fontSize:"10px", fontFamily:"inherit", fontWeight:"600",
                    textAlign:"left", transition:"all 0.12s", lineHeight:"1.4" }}>
                    <span style={{ flexShrink:0 }}>{act.emoji}</span>
                    <span>{act.label}</span>
                  </button>
                ) : (
                  <div style={{
                    display:"flex", alignItems:"center", gap:"7px", flex:1,
                    padding:"7px 9px",
                    background:act.bg, border:`1px solid ${act.border}`,
                    borderRadius:"7px", cursor:"not-allowed", color:act.color,
                    fontSize:"10px", fontFamily:"inherit", fontWeight:"600",
                    textAlign:"left", transition:"all 0.12s", lineHeight:"1.4", opacity: 0.5 }}>
                    <span style={{ flexShrink:0 }}>{act.emoji}</span>
                    <span>{act.label}</span>
                  </div>
                )}
              </div>
            );
          })}
          {isAdmin && <button onClick={()=>setShowModal(true)} style={{
            display:"flex", alignItems:"center", gap:"7px", width:"100%",
            padding:"7px 9px", marginTop:"8px", marginBottom:"4px",
            background:"transparent", border:"1px dashed #475569",
            borderRadius:"7px", cursor:"pointer", color:"#64748b",
            fontSize:"10px", fontFamily:"inherit", fontWeight:"600",
            textAlign:"left", transition:"all 0.12s", lineHeight:"1.4" }}>
            <span style={{ flexShrink:0 }}>+</span>
            <span>Nueva Tarea</span>
          </button>}

          {/* Resumen */}
          <div style={{ marginTop:"18px", paddingTop:"16px", borderTop:"1px solid #334155" }}>
            <div style={{ fontSize:"9px", color:"#cbd5e1", letterSpacing:"2px", marginBottom:"9px" }}>RESUMEN</div>
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
          <div style={{ marginTop:"18px", paddingTop:"16px", borderTop:"1px solid #334155", flex:1 }}>
            <div style={{ fontSize:"9px", color:"#cbd5e1", letterSpacing:"2px", marginBottom:"9px" }}>
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

      {/* Modal para nueva tarea */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
          onClick={()=>setShowModal(false)}>
          <div style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:"12px", padding:"24px", width:"300px", maxWidth:"90vw" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:"14px", fontWeight:"700", color:"#f1f5f9", marginBottom:"16px" }}>{editingTask ? "Editar Tarea" : "Nueva Tarea"}</div>
            
            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"10px", color:"#94a3b8", marginBottom:"4px" }}>Nombre</div>
              <input type="text" value={newTask.name} onChange={e=>setNewTask({...newTask, name:e.target.value})}
                style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:"6px", padding:"8px", color:"#f1f5f9", fontSize:"13px", fontFamily:"inherit", outline:"none" }} />
            </div>

            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"10px", color:"#94a3b8", marginBottom:"4px" }}>Emoji</div>
              <input type="text" value={newTask.emoji} onChange={e=>setNewTask({...newTask, emoji:e.target.value})}
                style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:"6px", padding:"8px", color:"#f1f5f9", fontSize:"13px", fontFamily:"inherit", outline:"none" }} />
            </div>

            <div style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:"#94a3b8", marginBottom:"4px" }}>Color</div>
                <input type="color" value={newTask.color} onChange={e=>setNewTask({...newTask, color:e.target.value, border:e.target.value, bg:`${e.target.value}22`})}
                  style={{ width:"100%", height:"36px", background:"#1e293b", border:"1px solid #334155", borderRadius:"6px", cursor:"pointer" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:"#94a3b8", marginBottom:"4px" }}>Minutos</div>
                <input type="number" value={newTask.mins} onChange={e=>setNewTask({...newTask, mins:parseInt(e.target.value)||30})}
                  style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:"6px", padding:"8px", color:"#f1f5f9", fontSize:"13px", fontFamily:"inherit", outline:"none" }} />
              </div>
            </div>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>{setShowModal(false); setEditingTask(null); setNewTask({ name: "", emoji: "📌", color: "#94a3b8", bg: "#94a3b822", border: "#334155", mins: 30 });}} style={{ flex:1, padding:"10px", background:"transparent", border:"1px solid #334155", borderRadius:"6px", color:"#94a3b8", fontSize:"12px", fontFamily:"inherit", cursor:"pointer" }}>
                Cancelar
              </button>
              <button onClick={async () => {
                if (!newTask.name.trim()) return;
                try {
                  const bg = newTask.bg ?? `${newTask.color}22`;
                  const border = newTask.border ?? newTask.color;
                  const payload = {
                    name: newTask.name,
                    emoji: newTask.emoji,
                    color: newTask.color,
                    bg,
                    border,
                    mins: newTask.mins,
                  };

                  if (editingTask) {
                    await apiUpdateTask(editingTask.id, payload, token);
                    setCustomTasks({
                      ...customTasks,
                      [`custom_${editingTask.id}`]: {
                        emoji: payload.emoji,
                        label: payload.name,
                        color: payload.color,
                        bg: payload.bg,
                        border: payload.border,
                        mins: payload.mins,
                      },
                    });
                  } else {
                    const res = await apiCreateTask(payload, token);
                    if (res && res.ok) {
                      const id = res.id || Date.now();
                      setCustomTasks({
                        ...customTasks,
                        [`custom_${id}`]: {
                          emoji: payload.emoji,
                          label: payload.name,
                          color: payload.color,
                          bg: payload.bg,
                          border: payload.border,
                          mins: payload.mins,
                        },
                      });
                    }
                  }

                  setShowModal(false);
                  setEditingTask(null);
                  setNewTask({ name: "", emoji: "📌", color: "#94a3b8", bg: "#94a3b822", border: "#334155", mins: 30 });
                } catch (e) { 
                  console.error(e);
                  alert("Error: " + e.message);
                }
              }} style={{ flex:1, padding:"10px", background:"#047857", border:"none", borderRadius:"6px", color:"white", fontSize:"12px", fontFamily:"inherit", cursor:"pointer" }}>
                {editingTask ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
