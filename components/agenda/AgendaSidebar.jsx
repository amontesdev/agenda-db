"use client";

import styles from "@/components/agenda/AgendaSidebar.module.css";

export default function AgendaSidebar({
  isMobileView,
  sidebarOpen,
  isAdmin,
  activities,
  blocks,
  summaryGroups,
  fmtMins,
  onAddBlock,
  onOpenModal,
  sqlLog,
  logColors,
}) {
  const sidebarClass = `${styles.sidebar} ${isMobileView && !sidebarOpen ? styles.hidden : ""}`;

  return (
    <div className={sidebarClass}>
      <div className={styles.sectionTitle}>+ AGREGAR</div>
      {Object.entries(activities).map(([key, activity]) => {
        const content = (
          <>
            <span style={{ flexShrink: 0 }}>{activity.emoji}</span>
            <span>{activity.label}</span>
          </>
        );

        return (
          <div key={key} className={styles.activityRow}>
            {isAdmin ? (
              <button
                className={styles.activityButton}
                style={{ background: activity.bg, borderColor: activity.border, color: activity.color }}
                onClick={() => onAddBlock(key)}
              >
                {content}
              </button>
            ) : (
              <div
                className={`${styles.activityButton} ${styles.activityGhost}`}
                style={{ background: activity.bg, borderColor: activity.border, color: activity.color }}
              >
                {content}
              </div>
            )}
          </div>
        );
      })}
      {isAdmin && (
        <button className={styles.customButton} onClick={onOpenModal}>
          <span style={{ flexShrink: 0 }}>+</span>
          <span>Nueva Tarea</span>
        </button>
      )}

      <div className={styles.summarySection}>
        <div className={styles.sectionTitle}>RESUMEN</div>
        {summaryGroups.map(([emoji, label, types]) => {
          const minutes = blocks.filter((block) => types.includes(block.type)).reduce((sum, block) => sum + block.mins, 0);
          if (!minutes) return null;
          return (
            <div key={label} className={styles.summaryRow}>
              <span style={{ color: "#475569" }}>{emoji} {label}</span>
              <span style={{ color: "#94a3b8" }}>{fmtMins(minutes)}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.logSection}>
        <div className={styles.logTitle}>SQL LOG</div>
        <div className={styles.logList}>
          {sqlLog.length === 0 && <span style={{ color: "#1e3a5f" }}>sin actividad aún...</span>}
          {sqlLog.map((entry, index) => (
            <div key={index} className={styles.logEntry} style={{ color: logColors[entry.type] || "#94a3b8" }}>
              <span className={styles.logTimestamp}>{entry.ts}</span>
              {entry.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
