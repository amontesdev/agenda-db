"use client";

import styles from "@/components/agenda/Timeline.module.css";

export default function TimelineReorderControls({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}) {
  return (
    <div className={styles.moveControls}>
      <button className={styles.moveButton} onClick={onMoveUp} disabled={disableUp}>↑</button>
      <button className={styles.moveButton} onClick={onMoveDown} disabled={disableDown}>↓</button>
    </div>
  );
}
