import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { BabylonBoardController } from '../engine/BabylonBoardController';

export const Viewport3D = forwardRef(({ onCellClick, onCellHover }, ref) => {
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    spawnPiece: (index, playerRole, onComplete) => {
      controllerRef.current?.spawnPiece(index, playerRole, onComplete);
    },
    spawnWinLaser: (winningIndices) => {
      controllerRef.current?.spawnWinLaser(winningIndices);
    },
    resetScene: () => {
      controllerRef.current?.resetScene();
    },
    resetCamera: () => {
      controllerRef.current?.resetCamera();
    },
    getController: () => controllerRef.current,
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize headless controller
    const controller = new BabylonBoardController(canvasRef.current);
    controllerRef.current = controller;

    // Bind event listeners to communicate with React HUD
    const unsubClick = controller.on('cellClick', (data) => {
      if (onCellClick) onCellClick(data.index);
    });

    const unsubHover = controller.on('cellHover', (data) => {
      if (onCellHover) onCellHover(data.index);
    });

    return () => {
      unsubClick();
      unsubHover();
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        id="renderCanvas"
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing focus:outline-none"
      />
    </div>
  );
});

Viewport3D.displayName = 'Viewport3D';
