# ⚡ Mi Agenda — SQLite + Turso + Next.js + Vercel

Planificador de productividad personal con persistencia real en SQLite.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + React |
| Base de datos | SQLite vía `@libsql/client` |
| BD en producción | [Turso](https://turso.tech) (libSQL cloud, gratis) |
| Deploy | Vercel |

---

## 🚀 Correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local

# El archivo .env.local ya tiene TURSO_DATABASE_URL=file:local.db
# No necesitas configurar nada más para desarrollo local.

# 3. Correr
npm run dev
# → http://localhost:3000
```

La primera vez que guardes un bloque, se crea automáticamente el archivo `local.db`.

---

## ☁️ Deploy en Vercel

### Paso 1 — Crear base de datos en Turso (gratis)

```bash
# Instalar CLI de Turso
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Crear base de datos
turso db create agenda-db

# Obtener URL
turso db show agenda-db --url
# → libsql://agenda-db-<usuario>.turso.io

# Crear token de acceso
turso db tokens create agenda-db
# → eyJ...token largo...
```

### Paso 2 — Subir a Vercel

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Deploy
vercel
```

### Paso 3 — Agregar variables de entorno en Vercel

En el dashboard de Vercel → tu proyecto → **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `TURSO_DATABASE_URL` | `libsql://agenda-db-<tu-usuario>.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJ...` (el token del paso 1) |

Luego hacer redeploy:
```bash
vercel --prod
```

---

## 🗄️ Esquema SQLite

```sql
CREATE TABLE schedules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  day        TEXT    NOT NULL,        -- 'semana' | 'sabado' | 'domingo'
  option     INTEGER NOT NULL,        -- 1 | 2 | 3
  blocks     TEXT    NOT NULL,        -- JSON: [{type, mins}, ...]
  updated_at TEXT    DEFAULT (datetime('now')),
  UNIQUE(day, option)                 -- upsert limpio
);
```

## API Endpoints

```
GET  /api/agenda?day=semana&option=1   → bloques guardados
POST /api/agenda                       → { day, option, blocks[] }
```

---

## 📁 Estructura

```
agenda-app/
├── app/
│   ├── api/agenda/route.js   ← API SQLite (GET + POST)
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   └── AgendaApp.jsx         ← UI drag & drop
├── lib/
│   └── db.js                 ← Cliente SQLite (local + Turso)
├── .env.example
└── package.json
```
# agenda-db
# agenda-db
# agenda-db
# agenda-db
