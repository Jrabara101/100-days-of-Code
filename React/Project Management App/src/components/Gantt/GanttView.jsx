import React, { useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import TaskTreePane from './TaskTreePane';
import GanttCanvas from './GanttCanvas';
import WorkloadRibbon from './WorkloadRibbon';
import SandboxHUD from '../Sandbox/SandboxHUD';

export default function GanttView() {
  const { isSandboxMode } = useProject();

  const treeScrollRef = useRef(null);
  const canvasScrollRef = useRef(null);
  const isSyncingScroll = useRef(false);

  // Synchronize vertical scrolling between Left Tree and Right Canvas
  const handleTreeScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (canvasScrollRef.current && treeScrollRef.current) {
      canvasScrollRef.current.scrollTop = treeScrollRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleCanvasScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (treeScrollRef.current && canvasScrollRef.current) {
      treeScrollRef.current.scrollTop = canvasScrollRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isSandboxMode ? 'sandbox-active-border' : ''}`}>
      {/* Sandbox Mode Floating HUD */}
      <SandboxHUD />

      {/* Main Split-Pane Master Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Hierarchical Task Tree */}
        <TaskTreePane
          verticalScrollRef={treeScrollRef}
          onScroll={handleTreeScroll}
        />

        {/* Right Pane: 2D Virtualized Gantt Timeline Canvas */}
        <GanttCanvas
          verticalScrollRef={canvasScrollRef}
          onScroll={handleCanvasScroll}
        />
      </div>

      {/* Bottom Collapsible Drawer: Team Workload & Capacity Ribbon */}
      <WorkloadRibbon />
    </div>
  );
}
