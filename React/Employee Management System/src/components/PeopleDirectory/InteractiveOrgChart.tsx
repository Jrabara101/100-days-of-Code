import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Building2, 
  Move, 
  AlertTriangle,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { Employee } from '../../types';
import { storage } from '../../services/storageService';
import { getSubordinateIds, getSpanOfControl, wouldCreateCycle } from '../../services/rbacService';
import confetti from 'canvas-confetti';

interface InteractiveOrgChartProps {
  onSelectEmployee: (emp: Employee) => void;
  onOpenAddModal: () => void;
}

interface TreeNode {
  employee: Employee;
  children: TreeNode[];
}

export const InteractiveOrgChart: React.FC<InteractiveOrgChartProps> = ({
  onSelectEmployee,
  onOpenAddModal
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  
  // Re-parenting state
  const [draggedEmpId, setDraggedEmpId] = useState<string | null>(null);
  const [dropTargetEmpId, setDropTargetEmpId] = useState<string | null>(null);
  const [showReparentModal, setShowReparentModal] = useState(false);
  const [reparentError, setReparentError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const allEmployees = storage.getEmployees();
  const allDepts = storage.getDepartments();

  // Build tree from root (CEO or employees without managerId)
  const buildTree = (): TreeNode[] => {
    const roots = allEmployees.filter(e => !e.managerId);
    
    const getChildren = (mgrId: string): TreeNode[] => {
      const directReports = allEmployees.filter(e => e.managerId === mgrId);
      return directReports.map(e => ({
        employee: e,
        children: getChildren(e.id)
      }));
    };

    return roots.map(root => ({
      employee: root,
      children: getChildren(root.id)
    }));
  };

  const tree = buildTree();

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.org-node-card') || (e.target as HTMLElement).closest('.zoom-controls')) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.4, +(prev + delta).toFixed(2)), 1.8));
  };

  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Drag and drop reparenting
  const handleDragStart = (e: React.DragEvent, empId: string) => {
    e.stopPropagation();
    setDraggedEmpId(empId);
    e.dataTransfer.setData('text/plain', empId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedEmpId && draggedEmpId !== targetId) {
      setDropTargetEmpId(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, targetMgrId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedEmpId || draggedEmpId === targetMgrId) {
      setDropTargetEmpId(null);
      return;
    }

    // Check circular reporting loop
    if (wouldCreateCycle(draggedEmpId, targetMgrId, allEmployees)) {
      setReparentError(`Circular reporting chain detected! ${allEmployees.find(e => e.id === targetMgrId)?.firstName} is already a subordinate of ${allEmployees.find(e => e.id === draggedEmpId)?.firstName}.`);
      setShowReparentModal(true);
      return;
    }

    setReparentError(null);
    setShowReparentModal(true);
  };

  const confirmReparent = () => {
    if (!draggedEmpId || !dropTargetEmpId) return;

    storage.updateEmployee(draggedEmpId, {
      managerId: dropTargetEmpId
    });

    confetti({ particleCount: 40, spread: 60 });
    setShowReparentModal(false);
    setDraggedEmpId(null);
    setDropTargetEmpId(null);
  };

  const draggedEmp = allEmployees.find(e => e.id === draggedEmpId);
  const targetMgr = allEmployees.find(e => e.id === dropTargetEmpId);
  const draggedSubordinates = draggedEmp ? getSubordinateIds(draggedEmp.id, allEmployees, true) : [];

  // Recursive tree node renderer
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const { employee, children } = node;
    const isCollapsed = collapsedNodes.has(employee.id);
    const hasChildren = children.length > 0;
    const department = allDepts.find(d => d.id === employee.departmentId);
    const span = getSpanOfControl(employee.id, allEmployees);
    const isDropTarget = dropTargetEmpId === employee.id;

    return (
      <div key={employee.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, employee.id)}
          onDragOver={(e) => handleDragOver(e, employee.id)}
          onDrop={(e) => handleDrop(e, employee.id)}
          onClick={() => onSelectEmployee(employee)}
          className={`org-node-card w-64 rounded-xl border p-3.5 shadow-sm transition-all cursor-pointer relative ${
            isDropTarget
              ? 'border-brand bg-brand/10 ring-4 ring-brand/20 scale-105'
              : 'border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark hover:border-brand/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <img
                src={employee.avatarUrl}
                alt={employee.firstName}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                employee.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                employee.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                employee.attendanceStatus === 'on_break' ? 'bg-amber-500' :
                employee.attendanceStatus === 'on_leave' ? 'bg-purple-500' : 'bg-slate-400'
              }`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {employee.firstName} {employee.lastName}
                </p>
                <span className="font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {employee.jobTitle}
              </p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span 
                  className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold text-white truncate max-w-[120px]"
                  style={{ backgroundColor: department?.colorHex || '#4F46E5' }}
                >
                  {department?.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {employee.workMode}
                </span>
              </div>
            </div>
          </div>

          {/* Span of Control / Children Expander Pill */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(employee.id, e)}
              className="mt-3 w-full py-1 px-2 rounded-lg bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-brand/40 flex items-center justify-between text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 transition-colors"
            >
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-brand" />
                {span.directCount} Direct • {span.totalCount} Total
              </span>
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Tree Connectors & Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center">
            {/* Vertical connector line going down from parent */}
            <div className="w-px h-6 bg-divider-light dark:bg-divider-dark" />

            {/* Horizontal distribution bar & child branches */}
            <div className="flex items-start justify-center relative pt-4">
              {children.length > 1 && (
                <div 
                  className="absolute top-0 h-px bg-divider-light dark:bg-divider-dark" 
                  style={{
                    left: 'calc(50% / ' + children.length + ')',
                    right: 'calc(50% / ' + children.length + ')'
                  }}
                />
              )}

              <div className="flex gap-8 items-start">
                {children.map(child => (
                  <div key={child.employee.id} className="relative flex flex-col items-center">
                    {/* Vertical line up to horizontal bar */}
                    <div className="w-px h-4 bg-divider-light dark:bg-divider-dark absolute -top-4" />
                    {renderNode(child, depth + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-210px)] min-h-[580px] rounded-2xl border border-divider-light dark:border-divider-dark bg-slate-50 dark:bg-[#07080a] overflow-hidden select-none">
      
      {/* Infinite Dotted Canvas Background */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="zoom-controls absolute top-4 right-4 z-20 flex items-center gap-1 p-1.5 rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs px-2 text-slate-500 font-semibold min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => handleZoom(0.1)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-divider-light dark:bg-divider-dark mx-0.5" />

        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fit & Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Instruction Tag */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light/80 dark:bg-elevated-dark/80 backdrop-blur-md text-[11px] text-slate-500 font-medium">
        <Move className="w-3.5 h-3.5 text-brand" />
        <span>Click & drag canvas to pan • Drag node card onto another to re-parent hierarchy</span>
      </div>

      {/* Pannable & Zoomable Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out'
          }}
          className="p-20 flex flex-col items-center"
        >
          {tree.map(rootNode => renderNode(rootNode))}
        </div>
      </div>

      {/* Reparenting Confirmation Modal */}
      {showReparentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl space-y-4">
            {reparentError ? (
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hierarchy Loop Forbidden
                </h3>
                <p className="text-xs text-rose-500 leading-relaxed font-medium">
                  {reparentError}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowReparentModal(false);
                      setReparentError(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Confirm Reporting Hierarchy Reassignment
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Preview cascading headcount transition and reporting tree adjustments.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Employee to Reassign:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {draggedEmp?.firstName} {draggedEmp?.lastName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">New Direct Manager:</span>
                    <strong className="text-brand dark:text-brand-dark">
                      {targetMgr?.firstName} {targetMgr?.lastName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-divider-light dark:border-divider-dark">
                    <span className="text-slate-500">Cascading Subordinates Moving:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      +{draggedSubordinates.length} direct & indirect reports
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowReparentModal(false);
                      setDraggedEmpId(null);
                      setDropTargetEmpId(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReparent}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20 transition-all"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
