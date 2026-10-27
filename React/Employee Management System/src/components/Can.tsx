import React, { ReactNode } from 'react';
import { canPerform, RbacAction } from '../services/rbacService';
import { storage } from '../services/storageService';

interface CanProps {
  perform: RbacAction;
  targetEmployeeId?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const Can: React.FC<CanProps> = ({
  perform,
  targetEmployeeId,
  fallback = null,
  children
}) => {
  const activeEmp = storage.getActiveEmployee();
  const allRoles = storage.getRoles();
  const activeRole = allRoles.find(r => r.id === activeEmp?.roleId);
  const allEmployees = storage.getEmployees();
  const activeDelegations = storage.getDelegations();

  const isAllowed = canPerform(
    activeEmp,
    activeRole,
    perform,
    targetEmployeeId,
    allEmployees,
    activeDelegations
  );

  if (isAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
