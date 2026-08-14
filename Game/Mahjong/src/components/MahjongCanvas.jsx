import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { createTileFaceTexture } from '../engine/TextureGenerator';

export function MahjongCanvas({ engine, syncGameState, refreshTrigger }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    // Orbit Drag state
    const isDraggingRef = useRef(false);
    const previousMousePositionRef = useRef({ x: 0, y: 0 });
    const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 4 });

    // Create 3D Tile Mesh
    const createTileMesh = (tileRecord) => {
        const geo = new THREE.BoxGeometry(0.96, 1.32, 0.4);
        const faceTex = createTileFaceTexture(tileRecord.tileID);

        const matIvory = new THREE.MeshStandardMaterial({ color: 0xfefae0, roughness: 0.35 });
        const matJadeBack = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4, metalness: 0.1 });
        const matFace = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.2 });

        const materials = [
            matIvory, matIvory, matIvory, matIvory,
            matFace,     // Front Top Face (+Z)
            matJadeBack  // Back Face (-Z)
        ];

        const mesh = new THREE.Mesh(geo, materials);
        mesh.position.set(tileRecord.x, tileRecord.y, tileRecord.z * 0.42);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        tileRecord.mesh = mesh;
        engine.meshToTileMap.set(mesh, tileRecord);
        return mesh;
    };

    // Rebuild 3D Stage
    const refresh3DStage = () => {
        if (!sceneRef.current) return;
        const scene = sceneRef.current;

        let tilesGroup = scene.getObjectByName('TILES_GROUP');
        if (tilesGroup) scene.remove(tilesGroup);

        tilesGroup = new THREE.Group();
        tilesGroup.name = 'TILES_GROUP';

        engine.tilesMap.forEach((tile) => {
            if (tile.active) {
                const mesh = createTileMesh(tile);
                tilesGroup.add(mesh);
            }
        });

        scene.add(tilesGroup);
        syncGameState();
    };

    useEffect(() => {
        refresh3DStage();
    }, [refreshTrigger]);

    useEffect(() => {
        const stageContainer = containerRef.current;
        if (!stageContainer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.background = null;
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, -10, 14);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        stageContainer.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting Rig
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
        dirLight.position.set(8, 12, 16);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0x4edea3, 0.8, 20);
        pointLight.position.set(-6, -6, 8);
        scene.add(pointLight);

        refresh3DStage();

        let animId;
        const renderLoop = () => {
            animId = requestAnimationFrame(renderLoop);
            renderer.render(scene, camera);
        };
        animId = requestAnimationFrame(renderLoop);

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
            if (renderer.domElement) renderer.domElement.remove();
        };
    }, []);

    // Pointer & Orbit drag handlers
    const handleMouseDown = (e) => {
        if (e.button === 2 || e.shiftKey) {
            isDraggingRef.current = true;
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !cameraRef.current) return;

        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        cameraAngleRef.current.theta += deltaX * 0.005;
        cameraAngleRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2.2, cameraAngleRef.current.phi - deltaY * 0.005));

        const radius = 17;
        const x = radius * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
        const y = -radius * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
        const z = radius * Math.cos(cameraAngleRef.current.phi);

        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(0, 0, 0);

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handlePointerClick = (e) => {
        if (isDraggingRef.current) return;

        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const tilesGroup = sceneRef.current ? sceneRef.current.getObjectByName('TILES_GROUP') : null;
        if (!tilesGroup) return;

        const intersects = raycasterRef.current.intersectObjects(tilesGroup.children);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const tileRecord = engine.meshToTileMap.get(clickedMesh);

            if (tileRecord && engine.isTileSelectable(tileRecord)) {
                processTileClick(tileRecord);
            } else if (tileRecord) {
                // Wobble animation for blocked tile
                gsap.to(clickedMesh.rotation, {
                    z: 0.15,
                    duration: 0.08,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => { clickedMesh.rotation.z = 0; }
                });
            }
        }
    };

    const processTileClick = (tile) => {
        // Clear active hints
        engine.hintedTiles.forEach(t => {
            if (t.mesh) t.mesh.material.forEach(m => m.emissive && m.emissive.setHex(0x000000));
        });
        engine.hintedTiles = [];

        if (!engine.selectedTile) {
            // First Tile Selected
            engine.selectedTile = tile;
            gsap.to(tile.mesh.position, { z: tile.z * 0.42 + 0.3, duration: 0.2 });
            tile.mesh.material[4].emissive = new THREE.Color(0x38bdf8);
            tile.mesh.material[4].emissiveIntensity = 0.5;
        } else if (engine.selectedTile.id === tile.id) {
            // Deselect
            gsap.to(tile.mesh.position, { z: tile.z * 0.42, duration: 0.2 });
            tile.mesh.material[4].emissive.setHex(0x000000);
            engine.selectedTile = null;
        } else {
            // Match evaluation
            const firstTile = engine.selectedTile;

            if (firstTile.tileID === tile.tileID) {
                // MATCH CONFIRMED
                engine.historyStack.push([firstTile.key, tile.key]);

                gsap.to([firstTile.mesh.position, tile.mesh.position], {
                    z: '+=1.0',
                    duration: 0.25
                });
                gsap.to([firstTile.mesh.scale, tile.mesh.scale], {
                    x: 0, y: 0, z: 0,
                    duration: 0.35,
                    delay: 0.1,
                    onComplete: () => {
                        firstTile.active = false;
                        tile.active = false;
                        const tilesGroup = sceneRef.current.getObjectByName('TILES_GROUP');
                        if (tilesGroup) {
                            tilesGroup.remove(firstTile.mesh);
                            tilesGroup.remove(tile.mesh);
                        }
                        engine.selectedTile = null;
                        syncGameState();
                    }
                });
            } else {
                // MISMATCH
                gsap.to(firstTile.mesh.position, { z: firstTile.z * 0.42, duration: 0.2 });
                firstTile.mesh.material[4].emissive.setHex(0x000000);

                engine.selectedTile = tile;
                gsap.to(tile.mesh.position, { z: tile.z * 0.42 + 0.3, duration: 0.2 });
                tile.mesh.material[4].emissive = new THREE.Color(0x38bdf8);
                tile.mesh.material[4].emissiveIntensity = 0.5;
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handlePointerClick}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
}
