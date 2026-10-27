import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import HeaderRibbon from './components/HeaderRibbon';
import GanttView from './components/Gantt/GanttView';
import KanbanBoard from './components/Kanban/KanbanBoard';
import TaskListView from './components/List/TaskListView';
import WorkloadMatrixView from './components/Workload/WorkloadMatrixView';
import TaskInspector from './components/Inspector/TaskInspector';
import HandoffModal from './components/Modals/HandoffModal';
import AsyncPulseModal from './components/Modals/AsyncPulseModal';
import ExecutivePortalModal from './components/Modals/ExecutivePortalModal';
import CommandPalette from './components/Modals/CommandPalette';
import NewTaskModal from './components/Modals/NewTaskModal';
import Toast from './components/Toast';

function AppContent() {
  const { activeView, selectedTaskId } = useProject();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FFFFFF] dark:bg-[#0B0C0E] text-[#0F172A] dark:text-[#F1F5F9] font-sans transition-colors duration-200">
      {/* Top Global Project Ribbon */}
      <HeaderRibbon />

      {/* Main Workspace Stage with Split Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Active View Switcher */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeView === 'gantt' && <GanttView />}
          {activeView === 'kanban' && <KanbanBoard />}
          {activeView === 'list' && <TaskListView />}
          {activeView === 'workload' && <WorkloadMatrixView />}
        </main>

        {/* Slide-Over Task Inspector & Collaboration Drawer */}
        {selectedTaskId && <TaskInspector />}
      </div>

      {/* Global Modals & Notifications */}
      <HandoffModal />
      <AsyncPulseModal />
      <ExecutivePortalModal />
      <CommandPalette />
      <NewTaskModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
