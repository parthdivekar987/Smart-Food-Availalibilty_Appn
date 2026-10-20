import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Table } from '../../types';
import { Layers, Compass, Eye, Users, QrCode, CheckCircle2, Clock } from 'lucide-react';

interface Restaurant3DFloorPlanProps {
  tables: Table[];
  onSelectTable?: (table: Table) => void;
  selectedTableId?: string;
  isInteractive?: boolean;
}

export const Restaurant3DFloorPlan: React.FC<Restaurant3DFloorPlanProps> = ({
  tables,
  onSelectTable,
  selectedTableId,
  isInteractive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cameraView, setCameraView] = useState<'iso' | 'top' | 'walk'>('iso');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');

  // Fallback tables if empty
  const displayTables: Table[] = tables.length > 0 ? tables : [
    { id: 't1', name: 'Table 01', capacity: 2, isActive: true, restaurantId: 'r1' },
    { id: 't2', name: 'Table 02', capacity: 4, isActive: true, restaurantId: 'r1' },
    { id: 't3', name: 'Table 03', capacity: 4, isActive: false, restaurantId: 'r1' },
    { id: 't4', name: 'Table 04', capacity: 6, isActive: true, restaurantId: 'r1' },
    { id: 't5', name: 'Table 05', capacity: 2, isActive: true, restaurantId: 'r1' },
    { id: 't6', name: 'Table 06', capacity: 8, isActive: false, restaurantId: 'r1' },
    { id: 't7', name: 'Table 07', capacity: 4, isActive: true, restaurantId: 'r1' },
    { id: 't8', name: 'Table 08', capacity: 4, isActive: true, restaurantId: 'r1' },
  ];

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tableMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1117);
    scene.fog = new THREE.FogExp2(0x0f1117, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.replaceChildren(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    dirLight.position.set(12, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Warm chandelier glow in dining center
    const centralChandelier = new THREE.PointLight(0xffaa44, 2.5, 25);
    centralChandelier.position.set(0, 6, 0);
    scene.add(centralChandelier);

    // 5. Floor: Elegant modern restaurant tile floor
    const floorGeo = new THREE.PlaneGeometry(28, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d26,
      roughness: 0.25,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Floor Overlay
    const grid = new THREE.GridHelper(28, 28, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    // Perimeter architectural accent lines (Walls & Bar counter)
    const barGeo = new THREE.BoxGeometry(22, 1.2, 1.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x2e1c14, roughness: 0.4 });
    const backBar = new THREE.Mesh(barGeo, barMat);
    backBar.position.set(0, 0.6, -10.5);
    scene.add(backBar);

    // Neon bar sign line
    const neonGeo = new THREE.BoxGeometry(18, 0.08, 0.08);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xec6d13 });
    const neonLine = new THREE.Mesh(neonGeo, neonMat);
    neonLine.position.set(0, 1.25, -10.2);
    scene.add(neonLine);

    // 6. Build Tables in 3D Space
    const cols = 4;
    const spacingX = 4.8;
    const spacingZ = 4.2;
    const startX = -((Math.min(displayTables.length, cols) - 1) * spacingX) / 2;
    const startZ = -3.5;

    const tableMeshes = new Map<string, THREE.Group>();
    const raycastTargets: THREE.Object3D[] = [];

    displayTables.forEach((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const posX = startX + col * spacingX;
      const posZ = startZ + row * spacingZ;

      const tableGroup = new THREE.Group();
      tableGroup.position.set(posX, 0, posZ);
      tableGroup.userData = { table };

      const isOccupied = !table.isActive || index % 3 === 1;
      const isSelected = table.id === selectedTableId;

      // Tabletop
      const isLarge = table.capacity >= 6;
      const tableGeo = isLarge
        ? new THREE.CylinderGeometry(1.4, 1.4, 0.12, 32)
        : new THREE.CylinderGeometry(1.1, 1.1, 0.12, 32);

      const tableMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xff7700 : 0x3d271d,
        roughness: 0.35,
        metalness: 0.1,
      });

      const tableTop = new THREE.Mesh(tableGeo, tableMat);
      tableTop.position.y = 1.15;
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      tableGroup.add(tableTop);

      // Central metallic pillar leg
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 16);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 0.55;
      leg.castShadow = true;
      tableGroup.add(leg);

      // Round metal base plate
      const baseGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24);
      const base = new THREE.Mesh(baseGeo, legMat);
      base.position.y = 0.02;
      tableGroup.add(base);

      // Ambient Status Glow Ring around table
      const statusColor = isOccupied ? 0xf59e0b : 0x10b981; // Amber = Occupied, Emerald = Available
      const ringGeo = new THREE.RingGeometry(1.5, 1.62, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: statusColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      tableGroup.add(ring);

      // Small modern table lamp
      const lampGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.35, 12);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0, 1.35, 0);
      tableGroup.add(lamp);

      const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.16, 16),
        new THREE.MeshBasicMaterial({ color: statusColor })
      );
      lampShade.position.set(0, 1.5, 0);
      tableGroup.add(lampShade);

      // Chairs around table
      const chairCount = table.capacity || 4;
      for (let c = 0; c < chairCount; c++) {
        const angle = (c / chairCount) * Math.PI * 2;
        const dist = (isLarge ? 1.7 : 1.4);
        const chairGroup = new THREE.Group();
        chairGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        chairGroup.rotation.y = -angle + Math.PI / 2;

        // Seat cushion
        const seatGeo = new THREE.BoxGeometry(0.5, 0.08, 0.5);
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 0.65;
        seat.castShadow = true;
        chairGroup.add(seat);

        // Chair legs
        const cLegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8);
        const cLegMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.6 });
        [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([lx, lz]) => {
          const cl = new THREE.Mesh(cLegGeo, cLegMat);
          cl.position.set(lx, 0.325, lz);
          chairGroup.add(cl);
        });

        // Curved backrest
        const backGeo = new THREE.BoxGeometry(0.48, 0.45, 0.06);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(0, 0.95, -0.22);
        back.castShadow = true;
        chairGroup.add(back);

        tableGroup.add(chairGroup);
      }

      scene.add(tableGroup);
      tableMeshes.set(table.id, tableGroup);
      raycastTargets.push(tableTop);
    });

    tableMeshesRef.current = tableMeshes;

    // 7. Raycasting for Touch & Click Table Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedTable = (e: MouseEvent | Touch) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastTargets);
      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.table) {
          parent = parent.parent;
        }
        return parent?.userData?.table as Table | undefined;
      }
      return null;
    };

    // Orbit Drag Handling
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let touchDistance = 0;
    let rotY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;

        rotY += deltaX * 0.007;
        camera.position.x = Math.sin(rotY) * 16;
        camera.position.z = Math.cos(rotY) * 16;
        camera.position.y = THREE.MathUtils.clamp(camera.position.y + deltaY * 0.03, 6, 22);
        camera.lookAt(0, 0.5, 0);
      } else {
        const found = getIntersectedTable(e);
        setHoveredTable(found || null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        const dist = Math.hypot(e.clientX - prevX, e.clientY - prevY);
        // If not dragged significantly, treat as click
        if (dist < 4 && isInteractive) {
          const clicked = getIntersectedTable(e);
          if (clicked) {
            setSelectedTable(clicked);
            if (onSelectTable) onSelectTable(clicked);
          }
        }
      }
      isDragging = false;
    };

    // Mobile Pinch Zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchDistance > 0) {
          const delta = (touchDistance - dist) * 0.05;
          camera.position.y = THREE.MathUtils.clamp(camera.position.y + delta, 6, 25);
        }
        touchDistance = dist;
      }
    };

    const handleTouchEnd = () => {
      touchDistance = 0;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('touchmove', handleTouchMove, { passive: true });
    dom.addEventListener('touchend', handleTouchEnd);

    // 8. Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Gentle floating animation for selected table
      tableMeshes.forEach((mesh, id) => {
        if (id === (selectedTable?.id || selectedTableId)) {
          mesh.position.y = Math.sin(time * 3) * 0.08;
        } else {
          mesh.position.y = 0;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
    };
  }, [tables, selectedTableId, isInteractive]);

  // Switch camera angle preset
  const setViewPreset = (view: 'iso' | 'top' | 'walk') => {
    setCameraView(view);
    const camera = cameraRef.current;
    if (!camera) return;

    if (view === 'iso') {
      camera.position.set(0, 14, 16);
      camera.lookAt(0, 0, 0);
    } else if (view === 'top') {
      camera.position.set(0, 24, 0.1);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 2.5, 10);
      camera.lookAt(0, 1.2, 0);
    }
  };

  const activeCount = displayTables.filter(t => t.isActive).length;
  const occupiedCount = displayTables.length - activeCount;

  return (
    <div className="relative w-full flex flex-col bg-[#0f1117] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Top Header HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        {/* Title & Live Status Counter */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Compass size={18} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm tracking-wide flex items-center gap-2">
              3D Interactive Floor Plan
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Three.js
              </span>
            </h3>
            <p className="text-gray-400 text-xs hidden sm:block">Touch & drag to explore restaurant dining hall</p>
          </div>
        </div>

        {/* View Angle Presets & Stats */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-gray-900/80 rounded-xl border border-gray-800 text-xs text-white">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeCount} Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{occupiedCount} Occupied</span>
            </div>
          </div>

          <div className="flex items-center bg-gray-900/90 rounded-xl p-1 border border-gray-800">
            <button
              onClick={() => setViewPreset('iso')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraView === 'iso' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setViewPreset('top')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraView === 'top' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => setViewPreset('walk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cameraView === 'walk' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Eye-Level
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-[360px] sm:h-[460px] cursor-grab active:cursor-grabbing" />

      {/* Floating Selected / Hovered Table HUD Card */}
      {(selectedTable || hoveredTable) && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-10 bg-gray-950/90 backdrop-blur-xl border border-orange-500/30 p-4 rounded-2xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-base font-black tracking-wide">
                {(selectedTable || hoveredTable)?.name}
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
              Capacity: {(selectedTable || hoveredTable)?.capacity} Guests
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Dining Area: Main Hall • Ready for guest seating and dine-in ordering
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTable && onSelectTable(selectedTable || hoveredTable!)}
              className="flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <CheckCircle2 size={14} />
              Select Table
            </button>
            {selectedTable && (
              <button
                onClick={() => setSelectedTable(null)}
                className="py-2 px-3 bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurant3DFloorPlan;
