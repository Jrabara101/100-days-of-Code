import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { initialProject, initialTasks, initialDependencies, initialTeammates, initialComments } from '../data/initialData';
import { detectCycle, cascadeSchedule, calculateCriticalPath, calculateWorkloadMatrix } from '../utils/dagEngine';
import { formatDateStr, parseDate, diffDays, addDays } from '../utils/dateHelpers';
import confetti from 'canvas-confetti';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Core Data
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState(initialTasks);
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [teammates] = useState(initialTeammates);
  const [comments, setComments] = useState(initialComments);

  // View & UI Navigation
  const [activeView, setActiveView] = useState('gantt'); // 'gantt' | 'kanban' | 'list' | 'workload'
  const [zoomLevel, setZoomLevel] = useState('day'); // 'day' | 'week' | 'month' | 'quarter'
  const [selectedTaskId, setSelectedTaskId] = useState('PRJ-107'); // Default inspect PRJ-107 to show blocker Sentinel!
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showBaseline, setShowBaseline] = useState(true);
  
  // What-If Simulation Sandbox Mode
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxBackupTasks, setSandboxBackupTasks] = useState(null);
  const [sandboxImpact, setSandboxImpact] = useState({
    shiftedCount: 0,
    milestoneImpactDays: 0,
    originalLaunch: '2026-11-18',
    simulatedLaunch: '2026-11-18',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Drawers
  const [activeHandoffTask, setActiveHandoffTask] = useState(null);
  const [isPulseDigestOpen, setIsPulseDigestOpen] = useState(false);
  const [isExecPortalOpen, setIsExecPortalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  // Multiplayer Live Presence simulation
  const [multiplayerUsers, setMultiplayerUsers] = useState([
    { id: 'user-sarah', name: 'Sarah Chen', color: '#3B82F6', activeTask: 'PRJ-105', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces' },
    { id: 'user-marcus', name: 'Marcus Vance', color: '#10B981', activeTask: 'PRJ-103', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
    { id: 'user-elena', name: 'Elena Rostova', color: '#EC4899', activeTask: 'PRJ-109', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces' },
  ]);
  const [collaboratorGhostDrag, setCollaboratorGhostDrag] = useState(null);

  // Keep dark class synchronized with document.documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Compute Critical Path
  const criticalPath = useMemo(() => {
    return calculateCriticalPath(tasks, dependencies);
  }, [tasks, dependencies]);

  // Compute Workload Matrix across timeline horizon
  const workloadMatrix = useMemo(() => {
    return calculateWorkloadMatrix(tasks, teammates, '2026-10-12', '2026-11-25');
  }, [tasks, teammates]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesId = t.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId) return false;
      }
      if (filterAssignee !== 'all' && t.assignee_id !== filterAssignee) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, searchQuery, filterAssignee, filterStatus]);

  // Handle Drag / Resize update on a Gantt Task Bar
  const updateTaskDates = useCallback((taskId, newStartDateStr, newEndDateStr) => {
    const cascadeResult = cascadeSchedule(tasks, dependencies, taskId, newStartDateStr, newEndDateStr);
    
    setTasks(cascadeResult.updatedTasks);

    if (isSandboxMode) {
      setSandboxImpact(prev => ({
        ...prev,
        shiftedCount: cascadeResult.shiftedTaskIds.length,
        milestoneImpactDays: cascadeResult.milestoneImpactDays,
        simulatedLaunch: cascadeResult.newProjectEndDate,
      }));
    } else {
      if (cascadeResult.shiftedTaskIds.length > 0) {
        showToast(
          `Cascade ripple auto-adjusted ${cascadeResult.shiftedTaskIds.length} downstream dependent tasks. Final milestone moved to ${cascadeResult.newProjectEndDate}.`,
          'warning'
        );
      }
    }
  }, [tasks, dependencies, isSandboxMode, showToast]);

  // What-If Sandbox Mode controls
  const enterSandboxMode = useCallback(() => {
    setSandboxBackupTasks(JSON.parse(JSON.stringify(tasks)));
    setIsSandboxMode(true);
    setSandboxImpact({
      shiftedCount: 0,
      milestoneImpactDays: 0,
      originalLaunch: '2026-11-18',
      simulatedLaunch: '2026-11-18',
    });
    showToast('Entered What-If Simulation Sandbox. Drag timeline bars freely without committing to team schedule.', 'info');
  }, [tasks, showToast]);

  const commitSandbox = useCallback(() => {
    setIsSandboxMode(false);
    setSandboxBackupTasks(null);
    showToast(`Committed simulation! Updated schedule with ${sandboxImpact.shiftedCount} shifted tasks.`, 'success');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  }, [sandboxImpact, showToast]);

  const discardSandbox = useCallback(() => {
    if (sandboxBackupTasks) {
      setTasks(sandboxBackupTasks);
    }
    setIsSandboxMode(false);
    setSandboxBackupTasks(null);
    showToast('Simulation discarded. Schedule restored to original baseline.', 'info');
  }, [sandboxBackupTasks, showToast]);

  // Dependency Management with Circular Cycle Prevention
  const addDependency = useCallback((predecessorId, successorId, type = 'FS', lagDays = 0) => {
    if (predecessorId === successorId) {
      showToast('Cannot link a task to itself.', 'error');
      return false;
    }

    // Check for existing link
    const exists = dependencies.some(
      d => d.predecessor_id === predecessorId && d.successor_id === successorId
    );
    if (exists) {
      showToast('Dependency already exists between these tasks.', 'info');
      return false;
    }

    // Check for circular dependency
    const cycleCheck = detectCycle(dependencies, predecessorId, successorId);
    if (cycleCheck.hasCycle) {
      showToast(
        `⛔ Circular dependency rejected! Link would create an infinite cycle: ${cycleCheck.cyclePath.join(' → ')}`,
        'error'
      );
      // Trigger haptic / sound if available
      return false;
    }

    const newDep = {
      id: `dep-${Date.now()}`,
      predecessor_id: predecessorId,
      successor_id: successorId,
      type,
      lag_days: lagDays,
    };

    const newDeps = [...dependencies, newDep];
    setDependencies(newDeps);

    // Auto-cascade immediate alignment
    const predTask = tasks.find(t => t.id === predecessorId);
    if (predTask) {
      const cascadeResult = cascadeSchedule(tasks, newDeps, predecessorId, predTask.start_date, predTask.end_date);
      setTasks(cascadeResult.updatedTasks);
    }

    showToast(`Linked ${predecessorId} → ${successorId} (Finish-to-Start)`, 'success');
    return true;
  }, [dependencies, tasks, showToast]);

  const removeDependency = useCallback((depId) => {
    setDependencies(prev => prev.filter(d => d.id !== depId));
    showToast('Dependency link removed.', 'info');
  }, [showToast]);

  // Task Status updates & Handoff Ritual triggering
  const updateTaskStatus = useCallback((taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If moving into 'in_review' or changing to 'done' from engineering, trigger Handoff ritual if appropriate
    if (newStatus === 'in_review' && task.status !== 'in_review') {
      setActiveHandoffTask(task);
      return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isDone = newStatus === 'done';
        return {
          ...t,
          status: newStatus,
          progress: isDone ? 100 : (newStatus === 'in_progress' ? Math.max(t.progress, 25) : t.progress),
        };
      }
      return t;
    }));

    // If a task that was blocking another is marked 'done', auto-unblock dependents!
    if (newStatus === 'done') {
      const blockedDependents = tasks.filter(t => t.blocked_by === taskId);
      if (blockedDependents.length > 0) {
        setTasks(prev => prev.map(t => {
          if (t.blocked_by === taskId) {
            return {
              ...t,
              status: 'in_progress',
              blocked_by: null,
              blocker_reason: null,
            };
          }
          return t;
        }));
        showToast(`🎉 Obstacle ${taskId} marked complete! Auto-unblocked ${blockedDependents.map(d => d.id).join(', ')}.`, 'success');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    }
  }, [tasks, showToast]);

  // Unblock a task directly
  const resolveBlocker = useCallback((taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'in_progress',
          blocked_by: null,
          blocker_reason: null,
        };
      }
      return t;
    }));
    showToast(`Obstacle resolved for ${taskId}. Task resumed to In Progress.`, 'success');
  }, [showToast]);

  // Complete Handoff Ritual
  const completeHandoff = useCallback((taskId, newAssigneeId, notes) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'in_review',
          assignee_id: newAssigneeId || t.assignee_id,
        };
      }
      return t;
    }));

    if (notes && notes.trim()) {
      const newComment = {
        id: `comm-${Date.now()}`,
        task_id: taskId,
        author_id: 'user-alex',
        content: `**Handoff Baton Transferred:** ${notes}`,
        is_decision: false,
        resolved_at: null,
        timestamp: new Date().toISOString(),
      };
      setComments(prev => [newComment, ...prev]);
    }

    setActiveHandoffTask(null);
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    showToast(`Handoff baton passed successfully! Owner updated.`, 'success');
  }, [showToast]);

  // Comments & Decisions
  const addComment = useCallback((taskId, content, isDecision = false) => {
    const newComment = {
      id: `comm-${Date.now()}`,
      task_id: taskId,
      author_id: 'user-alex', // active session user
      content,
      is_decision: isDecision,
      resolved_at: isDecision ? new Date().toISOString() : null,
      timestamp: new Date().toISOString(),
    };

    setComments(prev => [newComment, ...prev]);
    showToast(isDecision ? '⚖️ Decision pinned to task header!' : 'Comment posted.', 'success');
  }, [showToast]);

  // Create Task (with Scope-Creep Sentinel)
  const createTask = useCallback((taskData) => {
    const newId = `PRJ-${100 + tasks.length + 1}`;
    const newTask = {
      id: newId,
      phase: taskData.phase || 'Phase 3: High-Velocity Workflows & Multiplayer',
      title: taskData.title || 'Untitled Task',
      description: taskData.description || 'Task description pending.',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignee_id: taskData.assignee_id || 'user-alex',
      reporter_id: 'user-alex',
      start_date: taskData.start_date || '2026-10-28',
      end_date: taskData.end_date || '2026-11-02',
      baseline_start: null, // Since baseline was locked, this is post-baseline!
      baseline_end: null,
      estimated_hours: taskData.estimated_hours || 16,
      progress: 0,
      is_milestone: taskData.is_milestone || false,
      added_post_baseline: true, // Scope Creep Flagged!
      subtasks: taskData.subtasks || [],
    };

    setTasks(prev => [...prev, newTask]);
    setSelectedTaskId(newId);
    showToast(`Created ${newId}. Flagged as Scope-Creep (Injected post-baseline).`, 'warning');
  }, [tasks.length, showToast]);

  // Assign task
  const assignTask = useCallback((taskId, assigneeId) => {
    const teammate = teammates.find(m => m.id === assigneeId);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, assignee_id: assigneeId };
      }
      return t;
    }));

    // Check PTO warning
    const task = tasks.find(t => t.id === taskId);
    if (task && teammate && teammate.pto_dates.length > 0) {
      const overlapsPTO = teammate.pto_dates.some(
        d => d >= task.start_date && d <= task.end_date
      );
      if (overlapsPTO) {
        showToast(`⚠️ Warning: ${teammate.name} has scheduled PTO during this task schedule!`, 'warning');
      }
    }
  }, [teammates, tasks, showToast]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = {
    isDarkMode,
    toggleDarkMode,
    project,
    setProject,
    tasks,
    setTasks,
    dependencies,
    setDependencies,
    teammates,
    comments,
    activeView,
    setActiveView,
    zoomLevel,
    setZoomLevel,
    selectedTaskId,
    setSelectedTaskId,
    showCriticalPath,
    setShowCriticalPath,
    showBaseline,
    setShowBaseline,
    isSandboxMode,
    enterSandboxMode,
    commitSandbox,
    discardSandbox,
    sandboxImpact,
    searchQuery,
    setSearchQuery,
    filterAssignee,
    setFilterAssignee,
    filterStatus,
    setFilterStatus,
    filteredTasks,
    activeHandoffTask,
    setActiveHandoffTask,
    isPulseDigestOpen,
    setIsPulseDigestOpen,
    isExecPortalOpen,
    setIsExecPortalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    multiplayerUsers,
    collaboratorGhostDrag,
    setCollaboratorGhostDrag,
    toast,
    showToast,
    criticalPath,
    workloadMatrix,
    updateTaskDates,
    addDependency,
    removeDependency,
    updateTaskStatus,
    resolveBlocker,
    completeHandoff,
    addComment,
    createTask,
    assignTask,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
