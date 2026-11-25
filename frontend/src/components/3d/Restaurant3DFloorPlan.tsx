import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildDiningTable, animateDiningScene } from './realisticDining';
import { Table } from '../../types';
import { Layers, Compass, Eye, Users, QrCode, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface Restaurant3DFloorPlanProps {
  tables: Table[];
  onSelectTable?: (table: Table) => void;
  selectedTableId?: string;
  isInteractive?: boolean;
  /** Initial camera. Guests default to an eye-level view; admin screens can use 'iso'. */
  defaultView?: CameraView;
}

type CameraView = 'guest' | 'iso' | 'mezzanine' | 'bar' | 'vip' | 'top' | 'walk';

// Generate realistic dark oak herringbone parquet wood canvas texture
function createLuxuryWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep rich walnut base
  ctx.fillStyle = '#1c140e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw herringbone planks
  const plankWidth = 64;
  const plankLength = 256;

  for (let y = -plankLength; y < 1024 + plankLength; y += plankWidth) {
    for (let x = -plankLength; x < 1024 + plankLength; x += plankLength) {
      // Color variations between planks
      const shade = Math.floor(Math.random() * 25);
      const r = 36 + shade;
      const g = 24 + Math.floor(shade * 0.7);
      const b = 16 + Math.floor(shade * 0.5);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      // Wood plank
      ctx.fillRect(x, y, plankLength - 4, plankWidth - 4);

      // Fine woodgrain stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let gIdx = 0; gIdx < 6; gIdx++) {
        ctx.fillRect(x, y + gIdx * 10, plankLength - 4, 1.5);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Generate evening city skyline & garden panorama texture for floor-to-ceiling windows
function createEveningCityscapeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Twilight sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#0a0d1a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(0.85, '#431407');
  grad.addColorStop(1, '#1c1917');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Distant glowing city skyscrapers
  const buildingColors = ['#111827', '#1f2937', '#0f172a', '#1e293b'];
  for (let bx = 0; bx < 1024; bx += 32 + Math.random() * 40) {
    const bWidth = 24 + Math.random() * 38;
    const bHeight = 120 + Math.random() * 220;
    ctx.fillStyle = buildingColors[Math.floor(Math.random() * buildingColors.length)];
    ctx.fillRect(bx, 512 - bHeight, bWidth, bHeight);

    // Glowing warm window lights
    ctx.fillStyle = '#fef08a';
    for (let wy = 512 - bHeight + 15; wy < 490; wy += 14) {
      for (let wx = bx + 4; wx < bx + bWidth - 6; wx += 8) {
        if (Math.random() > 0.45) {
          ctx.globalAlpha = 0.6 + Math.random() * 0.4;
          ctx.fillRect(wx, wy, 3.5, 5);
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // Warm garden fairy lights at ground level
  for (let i = 0; i < 60; i++) {
    const fx = Math.random() * 1024;
    const fy = 460 + Math.random() * 45;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Live occupancy when provided by the API, otherwise inactive tables count as unavailable */
const isTableOccupied = (t: Table) => (t as any).isOccupied ?? !t.isActive;

export const Restaurant3DFloorPlan: React.FC<Restaurant3DFloorPlanProps> = ({
  tables,
  onSelectTable,
  selectedTableId,
  isInteractive = true,
  defaultView = 'guest',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cameraView, setCameraView] = useState<CameraView>(defaultView);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');

  const displayTables: Table[] = tables;

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tableMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 13, 17);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 3. High Performance Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.replaceChildren(renderer.domElement);

    // Image-based lighting gives porcelain, glass and brass believable reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.35;

    // 4. Realistic Warm Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.35);
    scene.add(ambientLight);
    scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3a2414, 0.6));

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    dirLight.position.set(10, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -18;
    dirLight.shadow.camera.right = 18;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // Warm chandelier glow in dining room center
    const centralChandelier = new THREE.PointLight(0xff9933, 1.6, 28);
    centralChandelier.position.set(0, 7.5, 0);
    scene.add(centralChandelier);

    // Subtle blue twilight window wash from the rear
    const windowTwilight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    windowTwilight.position.set(0, 6, -14);
    scene.add(windowTwilight);

    // 5. Realistic Luxury Hardwood Parquet Floor
    const woodTexture = createLuxuryWoodFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(32, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.55,
      metalness: 0.0,
    });
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 6. Realistic Panoramic City Skyline Glass Window (Rear Wall)
    const cityscapeTex = createEveningCityscapeTexture();
    const windowGeo = new THREE.PlaneGeometry(32, 10);
    const windowMat = new THREE.MeshBasicMaterial({
      map: cityscapeTex,
      side: THREE.DoubleSide,
    });
    const windowWall = new THREE.Mesh(windowGeo, windowMat);
    windowWall.position.set(0, 5, -12.9);
    scene.add(windowWall);

    // Modern Black Window Frames (Mullions)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    [-10.5, -5.2, 0, 5.2, 10.5].forEach((mX) => {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 0.2), frameMat);
      mullion.position.set(mX, 5, -12.8);
      scene.add(mullion);
    });
    const trans = new THREE.Mesh(new THREE.BoxGeometry(32, 0.2, 0.2), frameMat);
    trans.position.set(0, 6.5, -12.8);
    scene.add(trans);

    // 7. Architectural Side Walls (Acoustic Fluted Wood Paneling)
    const wallGeo = new THREE.BoxGeometry(0.6, 10, 26);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x241711, roughness: 0.6 });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-15.8, 5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(15.8, 5, 0);
    scene.add(rightWall);

    // Warm Recessed Cove Uplighting along side walls
    [-15.2, 15.2].forEach((wx) => {
      const wallLight = new THREE.PointLight(0xffa500, 1.8, 14);
      wallLight.position.set(wx, 3.5, 0);
      scene.add(wallLight);
    });

    // 8. Luxury Cocktail Bar & Lounge (Back-Left)
    const barGeo = new THREE.BoxGeometry(16, 1.3, 1.4);
    const marbleBarMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.2, metalness: 0.2 });
    const barCounter = new THREE.Mesh(barGeo, marbleBarMat);
    barCounter.position.set(0, 0.65, -10.2);
    barCounter.castShadow = true;
    scene.add(barCounter);

    // Illuminated LED Bar Strip
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(15.8, 0.06, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    ledStrip.position.set(0, 1.32, -9.5);
    scene.add(ledStrip);

    // Bar Bottles with Refractive Colored Glass
    const bottleColors = [0xd97706, 0x16a34a, 0x9333ea, 0xef4444, 0x38bdf8];
    for (let bi = 0; bi < 14; bi++) {
      const bColor = bottleColors[bi % bottleColors.length];
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12),
        new THREE.MeshPhysicalMaterial({ color: bColor, transmission: 0.7, roughness: 0.1, transparent: true })
      );
      bottle.position.set(-5.5 + bi * 0.85, 1.58, -10.2);
      scene.add(bottle);
    }

    // 9. Brass Multi-Ring Chandeliers Hanging Above Dining Area
    const chandelierMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
    [-5.5, 5.5].forEach((cx) => {
      const chGroup = new THREE.Group();
      chGroup.position.set(cx, 7.8, 0);

      const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.04, 12, 36), chandelierMat);
      r1.rotation.x = Math.PI / 2;
      chGroup.add(r1);

      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.03, 12, 36), chandelierMat);
      r2.rotation.x = Math.PI / 2;
      r2.position.y = -0.3;
      chGroup.add(r2);

      const chLight = new THREE.PointLight(0xffb703, 1.6, 12);
      chLight.position.y = -0.3;
      chGroup.add(chLight);

      scene.add(chGroup);
    });

    // 10. Decorative Potted Indoor Palms in Room Corners
    [[-14, 0, -11], [14, 0, -11], [-14, 0, 10], [14, 0, 10]].forEach(([px, py, pz]) => {
      const planter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.5, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 })
      );
      planter.position.set(px, 0.6, pz);
      scene.add(planter);

      // Palm fronds
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 6), plantMat);
        const fAngle = (f / 6) * Math.PI * 2;
        frond.position.set(px + Math.cos(fAngle) * 0.3, 1.8, pz + Math.sin(fAngle) * 0.3);
        frond.rotation.set(0.4 * Math.cos(fAngle), fAngle, 0.4 * Math.sin(fAngle));
        scene.add(frond);
      }
    });

    // 11. Build Tables with Fine Dining Place Settings
    const cols = 4;
    const spacingX = 5.2;
    const spacingZ = 4.6;
    const startX = -((Math.min(displayTables.length, cols) - 1) * spacingX) / 2;
    const startZ = -3.2;

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

      const { group: furniture, hitTargets } = buildDiningTable({
        capacity: table.capacity,
        occupied: isTableOccupied(table),
        selected: table.id === selectedTableId,
      });
      tableGroup.add(furniture);
      raycastTargets.push(...hitTargets);

      scene.add(tableGroup);
      tableMeshes.set(table.id, tableGroup);
    });

    tableMeshesRef.current = tableMeshes;

    // 12. Raycasting for Touch & Click Table Selection
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

    const handlePointerDown = (e: MouseEvent) => {
      const table = getIntersectedTable(e);
      if (table) {
        setSelectedTable(table);
        if (onSelectTable) onSelectTable(table);
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const table = getIntersectedTable(e);
      setHoveredTable(table || null);
    };

    renderer.domElement.addEventListener('click', handlePointerDown);
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // Camera Views - Realistic Architectural Perspectives
    const targetPos = new THREE.Vector3(0, 14, 18);
    const targetLook = new THREE.Vector3(0, 0.5, 0);

    if (cameraView === 'guest') {
      targetPos.set(1.2, 2.3, 8.2);
      targetLook.set(-0.5, 1.15, -2.5);
    } else if (cameraView === 'top') {
      targetPos.set(0, 24, 0.1);
      targetLook.set(0, 0, 0);
    } else if (cameraView === 'mezzanine') {
      targetPos.set(-10, 11, 15);
      targetLook.set(1.5, 0.8, -2);
    } else if (cameraView === 'bar') {
      targetPos.set(6.5, 3.2, -6);
      targetLook.set(-2, 1.2, -10.5);
    } else if (cameraView === 'vip') {
      targetPos.set(-5, 2.8, 3.5);
      targetLook.set(0, 1.2, -3);
    } else if (cameraView === 'walk') {
      targetPos.set(0, 3.2, 12);
      targetLook.set(0, 1.6, -4);
    } else {
      // Isometric Default
      targetPos.set(0, 14, 18);
      targetLook.set(0, 0.5, 0);
    }

    // Interactive Drag to Pan & Tilt Scene
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = 0;
    let rotX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      rotY += deltaX * 0.005;
      rotX += deltaY * 0.005;
      rotX = Math.max(-0.4, Math.min(0.4, rotX));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 13. Animation Loop with Gentle Camera Float & Candle Flicker
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Camera lerp
      camera.position.lerp(targetPos, 0.05);
      camera.lookAt(targetLook);

      // Interactive rotation
      scene.rotation.y = rotY;
      scene.rotation.x = rotX;

      // Candlelight subtle flicker
      centralChandelier.intensity = 1.6 + Math.sin(elapsed * 8) * 0.08;
      animateDiningScene(scene, elapsed);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [displayTables, cameraView, selectedTableId]);

  const occupiedCount = displayTables.filter(isTableOccupied).length;
  const activeCount = displayTables.length - occupiedCount;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#0a0c10] border border-white/10 shadow-2xl select-none">
      {/* Top Header Bar with Live Badge & Statistics */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-[#111827]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Compass size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white leading-none">3D Interactive Floor Plan</h4>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Three.js
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Touch & drag to explore restaurant dining hall</p>
          </div>
        </div>

        {/* Status Counters & Camera View Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {activeCount} Available
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {occupiedCount} Occupied
            </span>
          </div>

          <div className="bg-[#111827]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 flex flex-wrap items-center gap-1">
            <button
              onClick={() => setCameraView('guest')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'guest' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Guest View
            </button>
            <button
              onClick={() => setCameraView('iso')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'iso' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraView('mezzanine')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'mezzanine' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mezzanine
            </button>
            <button
              onClick={() => setCameraView('bar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'bar' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bar Lounge
            </button>
            <button
              onClick={() => setCameraView('vip')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'vip' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              VIP Table
            </button>
            <button
              onClick={() => setCameraView('top')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'top' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => setCameraView('walk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                cameraView === 'walk' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrance
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container - Expanded Breadth & Realistic Proportions */}
      <div ref={mountRef} className="w-full h-[560px] sm:h-[620px] cursor-grab active:cursor-grabbing" />

      {/* Hovered or Selected Table Info Tooltip */}
      {hoveredTable && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#111827]/95 backdrop-blur-md border border-orange-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none animate-in fade-in zoom-in-95">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isTableOccupied(hoveredTable) ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <div>
            <p className="text-xs font-black text-white">{hoveredTable.name}</p>
            <p className="text-[10px] text-orange-400 font-bold">
              {hoveredTable.capacity} seats · {isTableOccupied(hoveredTable) ? 'Occupied' : 'Available · Tap to sit here'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurant3DFloorPlan;
