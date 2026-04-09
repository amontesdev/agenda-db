"use client";

import styles from "@/components/agenda/TaskModal.module.css";

export default function TaskModal({ open, isEditing, task, onClose, onSubmit, onChange }) {
  if (!open) return null;

  const handleField = (field) => (event) => {
    const value = field === "mins" ? parseInt(event.target.value, 10) || 30 : event.target.value;
    if (field === "color") {
      onChange({ color: value, border: value, bg: `${value}22` });
    } else {
      onChange({ [field]: value });
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.title}>{isEditing ? "Editar Tarea" : "Nueva Tarea"}</div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>Nombre</div>
          <input type="text" value={task.name} onChange={handleField("name")} className={styles.textInput} />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>Emoji</div>
          <input type="text" value={task.emoji} onChange={handleField("emoji")} className={styles.textInput} />
        </div>

        <div className={styles.row}>
          <div className={styles.field} style={{ flex: 1 }}>
            <div className={styles.fieldLabel}>Color</div>
            <input type="color" value={task.color} onChange={handleField("color")} className={styles.colorInput} />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <div className={styles.fieldLabel}>Minutos</div>
            <input type="number" value={task.mins} onChange={handleField("mins")} className={styles.numberInput} />
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.secondary}`} onClick={onClose}>Cancelar</button>
          <button className={`${styles.button} ${styles.primary}`} onClick={onSubmit}>
            {isEditing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
