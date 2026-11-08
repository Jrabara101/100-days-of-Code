import React, { useState } from 'react';

export default function ThreadSpine({ 
  isCollapsed, 
  onToggleCollapse, 
  childCount, 
  hasChildren,
  isBranchHovered,
  setIsBranchHovered
}) {
  const [isRailHovered, setIsRailHovered] = useState(false);

  if (!hasChildren) {
    return null;
  }

  return (
    <div 
      className="relative flex flex-col items-center group cursor-pointer"
      onClick={onToggleCollapse}
      onMouseEnter={() => {
        setIsRailHovered(true);
        if (setIsBranchHovered) setIsBranchHovered(true);
      }}
      onMouseLeave={() => {
        setIsRailHovered(false);
        if (setIsBranchHovered) setIsBranchHovered(false);
      }}
      title={isCollapsed ? `Expand ${childCount} replies` : `Collapse ${childCount} replies`}
    >
      {/* 2px Interactive Vertical Spine Rail */}
      <div 
        className={`w-[2px] h-full transition-colors duration-200 rounded-full ${
          isRailHovered || isBranchHovered
            ? 'bg-indigo-600 dark:bg-indigo-400' 
            : 'bg-salon-rail-idle group-hover:bg-indigo-400/70'
        }`}
      />
    </div>
  );
}

