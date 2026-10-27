import { addDays, diffDays, isWeekend, parseDate, formatDateStr, addWorkingDays } from './dateHelpers';

/**
 * Detects whether adding an edge (fromId -> toId) introduces a circular dependency in the graph.
 */
export function detectCycle(dependencies, newFromId, newToId) {
  if (newFromId === newToId) {
    return { hasCycle: true, cyclePath: [newFromId, newToId] };
  }

  // Build adjacency list including existing edges
  const adj = new Map();
  for (const dep of dependencies) {
    if (!adj.has(dep.predecessor_id)) adj.set(dep.predecessor_id, []);
    adj.get(dep.predecessor_id).push(dep.successor_id);
  }

  // Add the candidate edge
  if (!adj.has(newFromId)) adj.set(newFromId, []);
  adj.get(newFromId).push(newToId);

  // DFS from newToId to see if we can reach newFromId
  const visited = new Set();
  const path = [];

  function dfs(curr) {
    if (curr === newFromId) {
      path.push(curr);
      return true;
    }
    visited.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      } else if (next === newFromId) {
        path.push(next);
        return true;
      }
    }

    path.pop();
    return false;
  }

  const hasCycle = dfs(newToId);
  return {
    hasCycle,
    cyclePath: hasCycle ? [newFromId, ...path] : [],
  };
}

/**
 * Auto-cascades task shifts through downstream dependencies.
 * Respects working days (skips weekends) and Finish-to-Start (FS) constraints.
 */
export function cascadeSchedule(tasks, dependencies, changedTaskId, newStartDateStr, newEndDateStr) {
  // Create a mutable copy of tasks map
  const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));
  const targetTask = taskMap.get(changedTaskId);
  if (!targetTask) return { updatedTasks: tasks, shiftedTaskIds: [], milestoneImpactDays: 0 };

  // Calculate original project finish date before shift
  let originalMaxDate = new Date(0);
  tasks.forEach(t => {
    const end = parseDate(t.end_date);
    if (end > originalMaxDate) originalMaxDate = end;
  });

  // Update target task
  targetTask.start_date = newStartDateStr;
  targetTask.end_date = newEndDateStr;

  // Build adjacency for BFS cascade
  const successorsMap = new Map();
  for (const dep of dependencies) {
    if (!successorsMap.has(dep.predecessor_id)) successorsMap.set(dep.predecessor_id, []);
    successorsMap.get(dep.predecessor_id).push(dep);
  }

  const queue = [changedTaskId];
  const shiftedSet = new Set();
  const processed = new Set();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    const currentTask = taskMap.get(currentId);
    if (!currentTask) continue;

    const outgoingDeps = successorsMap.get(currentId) || [];
    for (const dep of outgoingDeps) {
      const succTask = taskMap.get(dep.successor_id);
      if (!succTask) continue;

      const predEnd = parseDate(currentTask.end_date);
      const succStart = parseDate(succTask.start_date);
      const lag = dep.lag_days || 0;

      // Finish-to-Start (FS): Successor must start at or after predEnd + lag
      let minSuccStart = addDays(predEnd, 1 + lag);
      while (isWeekend(minSuccStart)) {
        minSuccStart = addDays(minSuccStart, 1);
      }

      if (minSuccStart > succStart) {
        // Duration in days
        const originalDuration = Math.max(1, diffDays(succTask.start_date, succTask.end_date) + 1);
        
        // Calculate new end date skipping weekends
        const newSuccStartStr = formatDateStr(minSuccStart);
        let currentDay = new Date(minSuccStart);
        let workingDaysAdded = 1;

        if (succTask.is_milestone) {
          // Milestone is single-point timestamp
          succTask.start_date = newSuccStartStr;
          succTask.end_date = newSuccStartStr;
        } else {
          while (workingDaysAdded < originalDuration) {
            currentDay = addDays(currentDay, 1);
            if (!isWeekend(currentDay)) {
              workingDaysAdded++;
            }
          }
          succTask.start_date = newSuccStartStr;
          succTask.end_date = formatDateStr(currentDay);
        }

        shiftedSet.add(succTask.id);
        // Enqueue successor to cascade to its dependents
        processed.delete(succTask.id); // allow re-processing if multiple predecessors push it
        queue.push(succTask.id);
      }
    }
  }

  // Check new max project finish date
  let newMaxDate = new Date(0);
  taskMap.forEach(t => {
    const end = parseDate(t.end_date);
    if (end > newMaxDate) newMaxDate = end;
  });

  const milestoneImpactDays = Math.max(0, diffDays(formatDateStr(originalMaxDate), formatDateStr(newMaxDate)));

  return {
    updatedTasks: Array.from(taskMap.values()),
    shiftedTaskIds: Array.from(shiftedSet),
    milestoneImpactDays,
    newProjectEndDate: formatDateStr(newMaxDate),
  };
}

/**
 * Computes the Critical Path for all tasks using forward and backward pass (Float === 0).
 */
export function calculateCriticalPath(tasks, dependencies) {
  if (!tasks.length) return { criticalTaskIds: new Set(), criticalDepIds: new Set() };

  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const inDegree = new Map();
  const adj = new Map();
  const revAdj = new Map();

  tasks.forEach(t => {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
    revAdj.set(t.id, []);
  });

  dependencies.forEach(dep => {
    if (inDegree.has(dep.successor_id) && adj.has(dep.predecessor_id)) {
      inDegree.set(dep.successor_id, inDegree.get(dep.successor_id) + 1);
      adj.get(dep.predecessor_id).push(dep);
      revAdj.get(dep.successor_id).push(dep);
    }
  });

  // Kahn's algorithm for topological order
  const topoOrder = [];
  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const curr = queue.shift();
    topoOrder.push(curr);
    for (const dep of adj.get(curr) || []) {
      const succId = dep.successor_id;
      inDegree.set(succId, inDegree.get(succId) - 1);
      if (inDegree.get(succId) === 0) {
        queue.push(succId);
      }
    }
  }

  // Duration in days
  const durations = new Map();
  tasks.forEach(t => {
    const d = Math.max(1, diffDays(t.start_date, t.end_date) + (t.is_milestone ? 0 : 1));
    durations.set(t.id, d);
  });

  // Reference project start date (earliest start)
  let earliestProjectStart = parseDate(tasks[0].start_date);
  tasks.forEach(t => {
    const s = parseDate(t.start_date);
    if (s < earliestProjectStart) earliestProjectStart = s;
  });

  // Forward Pass: Early Start (ES) and Early Finish (EF)
  const ES = new Map();
  const EF = new Map();

  for (const id of topoOrder) {
    const task = taskMap.get(id);
    const duration = durations.get(id);
    const incoming = revAdj.get(id) || [];

    let earlyStart = diffDays(formatDateStr(earliestProjectStart), task.start_date);
    for (const dep of incoming) {
      const predEF = EF.get(dep.predecessor_id) || 0;
      const minStart = predEF + (dep.lag_days || 0);
      if (minStart > earlyStart) earlyStart = minStart;
    }

    ES.set(id, earlyStart);
    EF.set(id, earlyStart + duration);
  }

  // Project max finish
  let maxEF = 0;
  EF.forEach(val => {
    if (val > maxEF) maxEF = val;
  });

  // Backward Pass: Late Start (LS) and Late Finish (LF)
  const LS = new Map();
  const LF = new Map();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const duration = durations.get(id);
    const outgoing = adj.get(id) || [];

    let lateFinish = maxEF;
    if (outgoing.length > 0) {
      lateFinish = Infinity;
      for (const dep of outgoing) {
        const succLS = LS.get(dep.successor_id);
        const reqFinish = succLS - (dep.lag_days || 0);
        if (reqFinish < lateFinish) lateFinish = reqFinish;
      }
    }

    LF.set(id, lateFinish);
    LS.set(id, lateFinish - duration);
  }

  // Critical tasks have Total Float <= 1 day
  const criticalTaskIds = new Set();
  tasks.forEach(t => {
    const es = ES.get(t.id) || 0;
    const ls = LS.get(t.id) || 0;
    const float = Math.abs(ls - es);
    if (float <= 1) {
      criticalTaskIds.add(t.id);
    }
  });

  // Critical dependencies connect two critical tasks with float match
  const criticalDepIds = new Set();
  dependencies.forEach(dep => {
    if (criticalTaskIds.has(dep.predecessor_id) && criticalTaskIds.has(dep.successor_id)) {
      criticalDepIds.add(dep.id);
    }
  });

  return { criticalTaskIds, criticalDepIds };
}

/**
 * Computes daily workload allocations per teammate across date horizon.
 */
export function calculateWorkloadMatrix(tasks, teammates, startDateStr, endDateStr) {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const daysSpan = Math.max(1, diffDays(startDateStr, endDateStr) + 1);

  // Initialize matrix
  const matrix = {};
  teammates.forEach(m => {
    matrix[m.id] = {
      teammate: m,
      dailyHours: {},
      totalAllocated: 0,
      overbookedDaysCount: 0,
    };
  });

  // Process all tasks
  tasks.forEach(task => {
    if (!task.assignee_id || !matrix[task.assignee_id]) return;
    if (task.status === 'done') return; // Completed tasks don't burden upcoming days

    const tStart = parseDate(task.start_date);
    const tEnd = parseDate(task.end_date);
    const taskWorkingDays = Math.max(1, diffDays(task.start_date, task.end_date) + 1);
    const dailyBurden = (task.estimated_hours || 8) / taskWorkingDays;

    for (let i = 0; i < daysSpan; i++) {
      const currentDay = addDays(start, i);
      const currentDayStr = formatDateStr(currentDay);

      if (currentDay >= tStart && currentDay <= tEnd && !isWeekend(currentDay)) {
        const userStats = matrix[task.assignee_id];
        userStats.dailyHours[currentDayStr] = (userStats.dailyHours[currentDayStr] || 0) + dailyBurden;
      }
    }
  });

  // Finalize totals and flags
  teammates.forEach(m => {
    const userStats = matrix[m.id];
    let total = 0;
    let overbookedCount = 0;

    for (let i = 0; i < daysSpan; i++) {
      const dayStr = formatDateStr(addDays(start, i));
      const hours = userStats.dailyHours[dayStr] || 0;
      total += hours;

      const isPTO = m.pto_dates && m.pto_dates.includes(dayStr);
      if (hours > m.capacity_hours_per_day || (isPTO && hours > 0)) {
        overbookedCount++;
      }
    }

    userStats.totalAllocated = Math.round(total * 10) / 10;
    userStats.overbookedDaysCount = overbookedCount;
  });

  return matrix;
}
