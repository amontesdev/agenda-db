const authHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};

export function apiLoad(day, option, token) {
  return fetch(`/api/agenda?day=${day}&option=${option}`, {
    headers: authHeaders(token),
  }).then(async (res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Error al cargar desde SQLite");
    return res.json();
  });
}

export function apiSave(day, option, blocks, startTime, token) {
  const plain = blocks.map(({ id, ...rest }) => rest);
  return fetch("/api/agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ day, option, blocks: plain, startTime }),
  }).then((res) => {
    if (!res.ok) throw new Error("Error al guardar en SQLite");
    return res.json();
  });
}

export function apiLoadTasks(token) {
  return fetch("/api/tasks", {
    headers: authHeaders(token),
  }).then(async (res) => {
    if (!res.ok) throw new Error("Error al cargar tareas");
    return res.json();
  });
}

export function apiCreateTask(task, token) {
  return fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(task),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Error al crear tarea");
    return data || { ok: false };
  });
}

export function apiUpdateTask(id, task, token) {
  return fetch(`/api/tasks?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(task),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Error al actualizar tarea");
    return data || { ok: true };
  });
}

export function apiDeleteTask(id, token) {
  return fetch(`/api/tasks?id=${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Error al eliminar tarea");
    return data || { ok: true };
  });
}

export { authHeaders };
