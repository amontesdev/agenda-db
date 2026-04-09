"use client";

import { PRESETS } from "@/lib/agendaConstants";
import styles from "@/components/agenda/AgendaHeader.module.css";

export default function AgendaHeader({
  userEmail,
  onSignOut,
  statusIndicator,
  savedAt,
  totalMins,
  productiveMins,
  day,
  dayLabels,
  option,
  startTime,
  onStartTimeChange,
  onSelectDay,
  onSelectOption,
  isAdmin,
  isMobileView,
  sidebarOpen,
  onToggleSidebar,
  fmtMins,
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div>
          <div className={styles.title}>⚡ MI AGENDA</div>
          <div className={styles.subtitle}>SQLITE · TURSO · NEXT.JS · VERCEL</div>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userRow}>
            <span className={styles.userEmail}>{userEmail}</span>
            <button onClick={onSignOut} className={styles.signOutButton}>Cerrar sesión</button>
          </div>
          <div className={styles.statusPill}>
            <span className={styles.statusDot} style={{ background: statusIndicator.dot, boxShadow: statusIndicator.glow ? `0 0 8px ${statusIndicator.dot}` : "none" }}/>
            <span className={styles.statusText} style={{ color: statusIndicator.dot }}>
              🗄️ SQLite — {statusIndicator.label}
            </span>
            {savedAt && <span className={styles.savedAt}>· {savedAt}</span>}
          </div>
          <div className={styles.stats}>
            Total: <b style={{ color: "#f8fafc" }}>{fmtMins(totalMins)}</b>
            <span style={{ color: "var(--color-border)" }}> · </span>
            Productivo: <b style={{ color: "#fbbf24" }}>{fmtMins(productiveMins)}</b>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        {isMobileView && (
          <button
            onClick={onToggleSidebar}
            className={`${styles.toggleSidebarButton} ${sidebarOpen ? styles.toggleSidebarActive : ""}`}
          >
            {sidebarOpen ? "☰ Ocultar" : "☰ Mostrar"}
          </button>
        )}
        {Object.keys(PRESETS).map((presetDay) => (
          <button
            key={presetDay}
            onClick={() => onSelectDay(presetDay)}
            className={`${styles.dayButton} ${day === presetDay ? styles.dayButtonActive : ""}`}
          >
            {dayLabels[presetDay]}
          </button>
        ))}
        <span className={styles.divider} />
        {[1, 2, 3].map((value) => (
          <button
            key={value}
            onClick={() => onSelectOption(value)}
            className={`${styles.optionButton} ${option === value ? styles.optionButtonActive : ""}`}
          >
            OPT {value}
          </button>
        ))}
        <span className={styles.divider} />
        <input
          type="time"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          suppressHydrationWarning
          disabled={!isAdmin}
          className={styles.timeInput}
        />
      </div>
    </div>
  );
}
