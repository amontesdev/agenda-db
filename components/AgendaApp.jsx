"use client";

import AgendaHeader from "@/components/agenda/AgendaHeader";
import Timeline from "@/components/agenda/Timeline";
import AgendaSidebar from "@/components/agenda/AgendaSidebar";
import TaskModal from "@/components/agenda/TaskModal";
import { useAdminControls } from "@/hooks/useAdminControls";
import { useAgendaData } from "@/hooks/useAgendaData";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSqlLog } from "@/hooks/useSqlLog";
import { LOG_COLORS } from "@/lib/agendaConstants";
import styles from "@/components/agenda/AgendaApp.module.css";

export default function AgendaApp() {
  const { token, user, signOut, isAdmin } = useAdminControls();
  const { sqlLog, pushLog } = useSqlLog();
  const { sidebarOpen, toggleSidebar, isMobileView } = useSidebarState();
  const agenda = useAgendaData({ token, isAdmin, pushLog });

  const handleStartTimeChange = (value) => {
    if (!isAdmin) return;
    agenda.setStartTime(value);
  };

  return (
    <div className={styles.app}>
      <AgendaHeader
        userEmail={user?.email}
        onSignOut={signOut}
        statusIndicator={agenda.statusIndicator}
        savedAt={agenda.savedAt}
        totalMins={agenda.totalMins}
        productiveMins={agenda.productiveMins}
        day={agenda.day}
        dayLabels={agenda.dayLabels}
        option={agenda.option}
        startTime={agenda.startTime}
        onStartTimeChange={handleStartTimeChange}
        onSelectDay={agenda.selectDay}
        onSelectOption={agenda.selectOption}
        isAdmin={isAdmin}
        isMobileView={isMobileView}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        fmtMins={agenda.formatMinutes}
      />

      <div className={styles.body}>
        <Timeline
          timed={agenda.timed}
          activityLookup={agenda.activityLookup}
          isAdmin={isAdmin}
          editId={agenda.editId}
          editVal={agenda.editVal}
          onEditValueChange={agenda.setEditVal}
          onStartEdit={agenda.startEditBlock}
          onCancelEdit={agenda.cancelEditBlock}
          onSaveEdit={agenda.saveEditBlock}
          onRemoveBlock={agenda.removeBlock}
          onMoveUp={agenda.moveBlockUp}
          onMoveDown={agenda.moveBlockDown}
          fmtMins={agenda.formatMinutes}
        />
        <AgendaSidebar
          isMobileView={isMobileView}
          sidebarOpen={sidebarOpen}
          isAdmin={isAdmin}
          activities={agenda.activityLookup}
          blocks={agenda.blocks}
          summaryGroups={agenda.summaryGroups}
          fmtMins={agenda.formatMinutes}
          onAddBlock={agenda.addBlock}
          onOpenModal={agenda.openNewTaskModal}
          onEditTask={agenda.openEditTaskModal}
          onDeleteTask={agenda.deleteTask}
          sqlLog={sqlLog}
          logColors={LOG_COLORS}
        />
      </div>

      <TaskModal
        open={agenda.showModal}
        isEditing={Boolean(agenda.editingTask)}
        task={agenda.newTask}
        onClose={agenda.closeTaskModal}
        onSubmit={agenda.submitTask}
        onChange={agenda.updateNewTask}
      />
    </div>
  );
}
