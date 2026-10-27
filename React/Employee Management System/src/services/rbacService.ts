import { Employee, Role, PermissionScope, ActingDelegation } from '../types';

export type RbacAction = 
  | 'employee:read'
  | 'employee:update'
  | 'employee:create'
  | 'employee:delete'
  | 'compensation:read'
  | 'compensation:write'
  | 'attendance:manage'
  | 'leave:approve'
  | 'system:admin';

/**
 * Recursive subordinate resolver (mirrors PostgreSQL recursive CTE get_subordinate_ids)
 * Includes cycle detection to safeguard against circular reporting chains.
 */
export function getSubordinateIds(
  managerId: string, 
  allEmployees: Employee[],
  includeIndirect: boolean = true
): string[] {
  const subordinates = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [managerId];

  while (queue.length > 0) {
    const currentMgr = queue.shift()!;
    if (visited.has(currentMgr)) continue;
    visited.add(currentMgr);

    // Find direct reports
    const directReports = allEmployees.filter(e => e.managerId === currentMgr);
    for (const report of directReports) {
      if (!subordinates.has(report.id)) {
        subordinates.add(report.id);
        if (includeIndirect) {
          queue.push(report.id);
        }
      }
    }
  }

  return Array.from(subordinates);
}

/**
 * Calculates direct and total span-of-control counts for an employee
 */
export function getSpanOfControl(
  employeeId: string, 
  allEmployees: Employee[]
): { directCount: number; totalCount: number } {
  const directCount = allEmployees.filter(e => e.managerId === employeeId).length;
  const totalSubordinates = getSubordinateIds(employeeId, allEmployees, true);
  return {
    directCount,
    totalCount: totalSubordinates.length
  };
}

/**
 * Cycle detection before reassignment:
 * Prevents A -> B -> A or target becoming an ancestor of its new manager.
 */
export function wouldCreateCycle(
  employeeToMoveId: string, 
  newManagerId: string | null, 
  allEmployees: Employee[]
): boolean {
  if (!newManagerId) return false;
  if (employeeToMoveId === newManagerId) return true;

  // If newManagerId is currently an indirect or direct subordinate of employeeToMoveId,
  // moving employeeToMoveId under newManagerId would form a circular loop!
  const subordinatesOfTarget = getSubordinateIds(employeeToMoveId, allEmployees, true);
  return subordinatesOfTarget.includes(newManagerId);
}

/**
 * Evaluates whether an actor can perform an action on a target employee
 */
export function canPerform(
  actor: Employee | undefined,
  actorRole: Role | undefined,
  action: RbacAction,
  targetEmployeeId: string | undefined,
  allEmployees: Employee[],
  activeDelegations: ActingDelegation[] = []
): boolean {
  if (!actor || !actorRole) return false;

  // Super Admin bypass
  if (actorRole.code === 'SUPER_ADMIN') return true;

  // Check active delegations where actor is acting manager
  const today = new Date().toISOString().split('T')[0];
  const actingFor = activeDelegations.filter(
    d => d.actingManagerId === actor.id && today >= d.startDate && today <= d.endDate
  );

  let targetEmp: Employee | undefined;
  if (targetEmployeeId) {
    targetEmp = allEmployees.find(e => e.id === targetEmployeeId);
  }

  const isSelf = targetEmployeeId === actor.id;

  // Extract scope for this action
  let scope: PermissionScope = 'none';
  switch (action) {
    case 'employee:read':
    case 'employee:create':
    case 'employee:update':
    case 'employee:delete':
      scope = actorRole.permissions.employeeCrud;
      break;
    case 'compensation:read':
      scope = actorRole.permissions.compensationRead;
      break;
    case 'compensation:write':
      scope = actorRole.permissions.compensationWrite;
      break;
    case 'attendance:manage':
      scope = actorRole.permissions.attendanceManage;
      break;
    case 'leave:approve':
      scope = actorRole.permissions.leaveApprove;
      break;
    case 'system:admin':
      scope = actorRole.permissions.systemAdmin;
      break;
  }

  // Evaluate base scope
  if (scope === 'all') return true;
  if (scope === 'none' && !isSelf) return false;
  if (scope === 'own' && isSelf) return true;

  if (targetEmp) {
    if (scope === 'department' && targetEmp.departmentId === actor.departmentId) {
      return true;
    }

    if (scope === 'direct_reports') {
      const subordinates = getSubordinateIds(actor.id, allEmployees, true);
      if (subordinates.includes(targetEmp.id)) {
        return true;
      }
    }
  }

  // Evaluate delegation inheritance (e.g. Marcus delegated to Sarah Chen or Elena)
  for (const del of actingFor) {
    const originalManagerSubordinates = getSubordinateIds(del.managerId, allEmployees, true);
    if (targetEmployeeId && originalManagerSubordinates.includes(targetEmployeeId)) {
      if (action === 'leave:approve' || action === 'attendance:manage') {
        return true;
      }
    }
  }

  return false;
}
