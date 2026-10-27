import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Calendar,
  Layers,
  Kanban as KanbanIcon,
  List as ListIcon,
  Users,
  Compass,
  Eye,
  FlaskConical,
  Plus,
  Search,
  Sparkles,
  Command,
  Sun,
  Moon,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function HeaderRibbon() {
  const {
    project,
    activeView,
    setActiveView,
    zoomLevel,
    setZoomLevel,
    showCriticalPath,
    setShowCriticalPath,
    showBaseline,
    setShowBaseline,
    isSandboxMode,
    enterSandboxMode,
    discardSandbox,
    multiplayerUsers,
    collaboratorGhostDrag,
    setCollaboratorGhostDrag,
    isDarkMode,
    toggleDarkMode,
    setIsPulseDigestOpen,
    setIsExecPortalOpen,
    setIsCommandPaletteOpen,
    setIsNewTaskModalOpen,
  } = useProject();

  // Helper to trigger simulated ghost drag on Gantt
  const toggleSimulateMultiplayerDrag = () => {
    if (collaboratorGhostDrag) {
      setCollaboratorGhostDrag(null);
    } else {
      setCollaboratorGhostDrag({
        taskId: 'PRJ-105',
        userName: 'Sarah Chen',
        color: '#3B82F6',
        offsetDays: 2,
      });
    }
  };

  return (
    <header className="h-14 border-b border-[#E2E8F0] dark:border-[#22252B] bg-[#FFFFFF] dark:bg-[#121417] px-4 flex items-center justify-between select-none shrink-0 z-30 transition-colors duration-200">
      {/* LEFT: Project Identity, Health Status & View Switcher */}
      <div className="flex items-center gap-3.5">
        {/* Project Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {project.name}
              </span>
              {/* Health Status Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>On Track</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Q4 Milestone: Nov 20, 2026</p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-[#22252B] mx-1"></div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#0B0C0E] border border-slate-200/80 dark:border-[#22252B]">
          <button
            onClick={() => setActiveView('gantt')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'gantt'
                ? 'bg-white dark:bg-[#181A1F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Gantt</span>
          </button>

          <button
            onClick={() => setActiveView('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'kanban'
                ? 'bg-white dark:bg-[#181A1F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'list'
                ? 'bg-white dark:bg-[#181A1F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => setActiveView('workload')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'workload'
                ? 'bg-white dark:bg-[#181A1F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workload</span>
          </button>
        </div>
      </div>

      {/* CENTER: Timeline Horizon Controls & Simulation Modes */}
      <div className="flex items-center gap-2">
        {/* Zoom Horizon Pills (Shown in Gantt view) */}
        {activeView === 'gantt' && (
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#0B0C0E] border border-slate-200/80 dark:border-[#22252B] mr-2">
            {['day', 'week', 'month'].map((level) => (
              <button
                key={level}
                onClick={() => setZoomLevel(level)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors ${
                  zoomLevel === level
                    ? 'bg-white dark:bg-[#181A1F] text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        )}

        {/* Critical Path Spotlight Toggle */}
        <button
          onClick={() => setShowCriticalPath(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
            showCriticalPath
              ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-glow-crimson font-semibold'
              : 'border-slate-200 dark:border-[#22252B] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181A1F]'
          }`}
          title="Spotlight tasks dictating project completion"
        >
          <Flame className={`w-3.5 h-3.5 ${showCriticalPath ? 'text-rose-500 animate-pulse' : ''}`} />
          <span>Critical Path</span>
        </button>

        {/* Baseline Shadow Toggle */}
        <button
          onClick={() => setShowBaseline(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
            showBaseline
              ? 'bg-slate-100 dark:bg-[#181A1F] border-slate-400/50 text-slate-800 dark:text-slate-200 font-medium'
              : 'border-slate-200 dark:border-[#22252B] text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181A1F]'
          }`}
          title="Render ghost baseline shadows beneath active bars"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Baseline Shadow</span>
        </button>

        {/* What-If Sandbox Mode Button */}
        <button
          onClick={() => {
            if (isSandboxMode) {
              discardSandbox();
            } else {
              enterSandboxMode();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-all ${
            isSandboxMode
              ? 'bg-amber-500 text-black font-semibold shadow-md animate-pulse border-amber-400'
              : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
          }`}
          title="Non-destructive schedule simulation sandbox"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>{isSandboxMode ? 'Sandbox Active' : '🧪 What-If Sandbox'}</span>
        </button>
      </div>

      {/* RIGHT: Multiplayer Presence, Tools & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Multiplayer Avatar Stack */}
        <div className="flex items-center -space-x-1.5 overflow-hidden pl-1" title="Collaborators active on this board">
          {multiplayerUsers.map((user) => (
            <div
              key={user.id}
              className="relative inline-block"
              title={`${user.name} (Viewing ${user.activeTask})`}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#121417] object-cover hover:scale-110 transition-transform cursor-pointer"
              />
              <span
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#121417]"
                style={{ backgroundColor: user.color }}
              />
            </div>
          ))}
        </div>

        {/* Multiplayer Live Drag Simulation Button */}
        <button
          onClick={toggleSimulateMultiplayerDrag}
          className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
            collaboratorGhostDrag
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
              : 'border-slate-200 dark:border-[#22252B] text-slate-400 hover:text-slate-200'
          }`}
          title="Simulate teammate ghost cursor moving a Gantt bar in real-time"
        >
          {collaboratorGhostDrag ? '👻 Ghosting Sarah' : 'Live Ghost'}
        </button>

        {/* Morning Async Pulse Button */}
        <button
          onClick={() => setIsPulseDigestOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-[#22252B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181A1F] transition-colors"
          title="View automated morning async status rollup"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Pulse</span>
        </button>

        {/* Executive Read-Only Portal */}
        <button
          onClick={() => setIsExecPortalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-[#22252B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181A1F] transition-colors"
          title="Shareable stakeholder view"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          <span>Exec Portal</span>
        </button>

        {/* Cmd+K Quick Helper Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0B0C0E] border border-slate-200 dark:border-[#22252B] hover:border-slate-400 transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181A1F] transition-colors"
          title="Toggle Light / Dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Primary CTA: + New Task */}
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-light text-white shadow-xs hover:shadow-glow-indigo transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
