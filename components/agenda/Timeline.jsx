"use client";

import styles from "@/components/agenda/Timeline.module.css";
import TimelineReorderControls from "@/components/agenda/TimelineReorderControls";

export default function Timeline({
  timed,
  activityLookup,
  isAdmin,
  editId,
  editVal,
  onEditValueChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemoveBlock,
  onMoveUp,
  onMoveDown,
  fmtMins,
}) {
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>↕ MOVER CON FLECHAS · ✎ EDITAR · AUTO-GUARDADO EN SQLITE</div>
      <div>
        {timed.map((block, index) => {
          const activity = activityLookup[block.type] || { emoji: "📌", label: block.type, color: "#94a3b8", bg: "#0a1020", border: "#334155" };
          const isEditing = editId === block.id;
          const minHeight = Math.max(52, Math.min(block.mins * 0.75, 160));

          return (
            <div key={block.id} className={styles.row}>
              <div className={styles.timeColumn}>
                <span>{block.start}</span>
                <span>{block.end}</span>
              </div>
              {isAdmin && (
                <TimelineReorderControls
                  onMoveUp={() => onMoveUp(index)}
                  onMoveDown={() => onMoveDown(index)}
                  disableUp={index === 0}
                  disableDown={index === timed.length - 1}
                />
              )}
              <div
                className={styles.card}
                style={{ minHeight: `${minHeight}px`, background: activity.bg, border: `1.5px solid ${activity.border}` }}
              >
                <div className={styles.cardContent}>
                  <span className={styles.emoji}>{activity.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.label} style={{ color: activity.color }}>
                      {activity.label}
                    </div>
                    {isEditing ? (
                      <div className={styles.editRow}>
                        <input
                          type="number"
                          value={editVal}
                          onChange={(event) => onEditValueChange(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && onSaveEdit()}
                          className={styles.editInput}
                          autoFocus
                        />
                        <span style={{ fontSize: "9px", color: "#cbd5e1" }}>min</span>
                        <button type="button" className={styles.editButton} onClick={onSaveEdit}>✓</button>
                        <button className={`${styles.editButton} ${styles.cancelButton}`} onClick={onCancelEdit}>✕</button>
                      </div>
                    ) : (
                      <div className={styles.editRow}>
                        {isAdmin ? (
                          <button className={styles.minsButton} onClick={() => onStartEdit(block.id, block.mins)}>
                            {fmtMins(block.mins)} ✎
                          </button>
                        ) : (
                          <span className={styles.staticMins}>{fmtMins(block.mins)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button className={styles.deleteButton} onClick={() => onRemoveBlock(block.id)}>✕</button>
                )}
              </div>
            </div>
          );
        })}
        {timed.length === 0 && <div className={styles.emptyState}>AGENDA VACÍA — AGREGA BLOQUES →</div>}
      </div>
    </div>
  );
}
