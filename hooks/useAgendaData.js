"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVITIES,
  DAY_LABELS,
  DAY_STARTS,
  DEFAULT_MINS,
  PRESETS,
  PRODUCTIVE_TYPES,
  SUMMARY_GROUPS,
  STATUS_CONFIG,
  fmtMins,
  seed,
  toTime,
} from "@/lib/agendaConstants";
import {
  apiCreateTask,
  apiDeleteTask,
  apiLoad,
  apiLoadTasks,
  apiSave,
  apiUpdateTask,
} from "@/lib/agendaApi";
import { useBlockReorder } from "@/hooks/useBlockReorder";

const DEFAULT_TASK_FORM = { name: "", emoji: "📌", color: "#94a3b8", bg: "#94a3b822", border: "#334155", mins: 30 };

export function useAgendaData({ token, isAdmin, pushLog }) {
  const [day, setDay] = useState("semana");
  const [option, setOption] = useState(1);
  const [startTime, setStartTime] = useState(DAY_STARTS.semana);
  const [blocks, setBlocks] = useState(() => seed(PRESETS.semana[1]));
  const [customTasks, setCustomTasks] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState(DEFAULT_TASK_FORM);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [dbStatus, setDbStatus] = useState("loading");
  const [savedAt, setSavedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const activityLookup = useMemo(() => ({ ...ACTIVITIES, ...customTasks }), [customTasks]);
  const log = pushLog || (() => {});
  const selectionRef = useRef({ day, option });

  useEffect(() => {
    selectionRef.current = { day, option };
  }, [day, option]);

  const loadFromDB = useCallback(async (targetDay, targetOption) => {
    if (!token) return;
    setDbStatus("loading");
    log(`SELECT * FROM schedules WHERE day='${targetDay}' AND option=${targetOption}`, "query");
    try {
      const data = await apiLoad(targetDay, targetOption, token);
      const { day: currentDay, option: currentOption } = selectionRef.current;
      if (currentDay !== targetDay || currentOption !== targetOption) {
        return;
      }
      if (data?.found) {
        setBlocks(seed(data.blocks));
        setStartTime(data.startTime || DAY_STARTS[targetDay]);
        setSavedAt(new Date(data.updated_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
        log(`✓ ${data.blocks.length} bloques cargados`, "ok");
        setDbStatus("ok");
      } else {
        const preset = PRESETS[targetDay]?.[targetOption] || [];
        setBlocks(seed(preset));
        setStartTime(DAY_STARTS[targetDay]);
        log(`(sin datos) → cargando preset`, "warn");
        setDbStatus("empty");
      }
    } catch (error) {
      log(`✗ ${error.message}`, "error");
      setDbStatus("error");
    }
  }, [log, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const taskData = await apiLoadTasks(token);
        if (cancelled) return;
        const tasks = {};
        (taskData?.tasks || []).forEach((t) => {
          const id = typeof t.id === "bigint" ? Number(t.id) : t.id;
          tasks[`custom_${id}`] = {
            emoji: t.emoji ?? "📌",
            label: t.name ?? `custom_${id}`,
            color: t.color ?? "#94a3b8",
            bg: t.bg ?? `${t.color ?? "#94a3b8"}22`,
            border: t.border ?? (t.color ?? "#334155"),
            mins: Number.isFinite(Number(t.mins)) ? Number(t.mins) : 30,
            id,
          };
        });
        setCustomTasks(tasks);
      } catch (error) {
        log(`✗ ${error?.message ?? "Error al cargar tareas"}`, "error");
      }

      await loadFromDB("semana", 1);
    };

    bootstrap().finally(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [loadFromDB, log, token]);

  useEffect(() => {
    if (!loaded || !token) return;
    setDbStatus("saving");
    const timer = setTimeout(async () => {
      log(`INSERT OR REPLACE INTO schedules (day='${day}', option=${option}, blocks[${blocks.length}])`, "query");
      try {
        await apiSave(day, option, blocks, startTime, token);
        const ts = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
        setSavedAt(ts);
        setDbStatus("ok");
        log(`✓ Guardado correctamente — ${ts}`, "ok");
      } catch (error) {
        setDbStatus("error");
        log(`✗ ${error.message}`, "error");
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [blocks, day, option, startTime, loaded, token, log]);

  const switchTo = useCallback((nextDay, nextOption) => {
    setDay(nextDay);
    setOption(nextOption);
    setEditId(null);
    loadFromDB(nextDay, nextOption);
  }, [loadFromDB]);

  const selectDay = useCallback((nextDay) => switchTo(nextDay, option), [option, switchTo]);
  const selectOption = useCallback((value) => switchTo(day, value), [day, switchTo]);

  const addBlock = useCallback((type) => {
    if (!isAdmin) return;
    const base = activityLookup[type];
    if (!base) return;
    setBlocks((prev) => [...prev, { type, mins: base.mins ?? DEFAULT_MINS[type] ?? 30, id: Date.now() + Math.random() }]);
  }, [activityLookup, isAdmin]);

  const removeBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  }, []);

  const { moveBlockUp, moveBlockDown } = useBlockReorder(setBlocks);

  const startEditBlock = useCallback((blockId, mins) => {
    if (!isAdmin) return;
    setEditId(blockId);
    setEditVal(String(mins));
  }, [isAdmin]);

  const cancelEditBlock = useCallback(() => {
    setEditId(null);
    setEditVal("");
  }, []);

  const saveEditBlock = useCallback(() => {
    if (!editId) return;
    const mins = parseInt(editVal, 10);
    if (Number.isNaN(mins) || mins <= 0) return;
    setBlocks((prev) => prev.map((block) => (block.id === editId ? { ...block, mins } : block)));
    setEditId(null);
    setEditVal("");
  }, [editId, editVal]);

  const openNewTaskModal = useCallback(() => {
    setEditingTask(null);
    setNewTask(DEFAULT_TASK_FORM);
    setShowModal(true);
  }, []);

  const openEditTaskModal = useCallback((taskKey) => {
    const payload = customTasks[taskKey];
    if (!payload) return;
    setEditingTask({ id: Number(taskKey.replace("custom_", "")), key: taskKey });
    setNewTask({
      name: payload.label,
      emoji: payload.emoji,
      color: payload.color,
      bg: payload.bg,
      border: payload.border,
      mins: payload.mins,
    });
    setShowModal(true);
  }, [customTasks]);

  const closeTaskModal = useCallback(() => {
    setShowModal(false);
    setEditingTask(null);
    setNewTask(DEFAULT_TASK_FORM);
  }, []);

  const updateNewTask = useCallback((changes) => {
    setNewTask((prev) => ({ ...prev, ...changes }));
  }, []);

  const deleteTask = useCallback(async (taskKey) => {
    if (!isAdmin || !token) return;
    const entry = customTasks[taskKey];
    if (!entry) return;
    const id = entry.id ?? Number(taskKey.replace("custom_", ""));
    if (!Number.isFinite(id)) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("¿Eliminar esta tarea personalizada?");
    if (!confirmed) return;
    try {
      await apiDeleteTask(id, token);
      setCustomTasks((prev) => {
        const next = { ...prev };
        delete next[taskKey];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  }, [customTasks, isAdmin, token]);

  const submitTask = useCallback(async () => {
    if (!token) return;
    if (!newTask.name.trim()) return;
    const payload = {
      name: newTask.name,
      emoji: newTask.emoji,
      color: newTask.color,
      bg: newTask.bg ?? `${newTask.color}22`,
      border: newTask.border ?? newTask.color,
      mins: newTask.mins,
    };

    try {
      if (editingTask) {
        await apiUpdateTask(editingTask.id, payload, token);
        setCustomTasks((prev) => ({
          ...prev,
          [`custom_${editingTask.id}`]: {
            emoji: payload.emoji,
            label: payload.name,
            color: payload.color,
            bg: payload.bg,
            border: payload.border,
            mins: payload.mins,
            id: editingTask.id,
          },
        }));
      } else {
        const res = await apiCreateTask(payload, token);
        if (res?.ok) {
          const id = res.id || Date.now();
          setCustomTasks((prev) => ({
            ...prev,
            [`custom_${id}`]: {
              emoji: payload.emoji,
              label: payload.name,
              color: payload.color,
              bg: payload.bg,
              border: payload.border,
              mins: payload.mins,
              id,
            },
          }));
        }
      }
      closeTaskModal();
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  }, [closeTaskModal, editingTask, newTask, token]);

  const timed = useMemo(() => {
    let offset = 0;
    return blocks.map((block) => {
      const start = toTime(startTime, offset);
      offset += block.mins;
      const end = toTime(startTime, offset);
      return { ...block, start, end };
    });
  }, [blocks, startTime]);

  const totalMins = useMemo(() => blocks.reduce((sum, block) => sum + block.mins, 0), [blocks]);
  const productiveMins = useMemo(() => blocks
    .filter((block) => PRODUCTIVE_TYPES.includes(block.type))
    .reduce((sum, block) => sum + block.mins, 0), [blocks]);

  const statusIndicator = STATUS_CONFIG[dbStatus] || STATUS_CONFIG.ok;

  return {
    day,
    dayLabels: DAY_LABELS,
    option,
    startTime,
    setStartTime,
    blocks,
    timed,
    customTasks,
    activityLookup,
    showModal,
    editingTask,
    newTask,
    editId,
    editVal,
    dbStatus,
    savedAt,
    statusIndicator,
    summaryGroups: SUMMARY_GROUPS,
    totalMins,
    productiveMins,
    switchTo,
    selectDay,
    selectOption,
    addBlock,
    removeBlock,
    moveBlockUp,
    moveBlockDown,
    startEditBlock,
    cancelEditBlock,
    saveEditBlock,
    setEditVal,
    openNewTaskModal,
    openEditTaskModal,
    closeTaskModal,
    updateNewTask,
    deleteTask,
    submitTask,
    fmtMins,
    formatMinutes: fmtMins,
    isLoaded: loaded,
    isAdmin,
  };
}
