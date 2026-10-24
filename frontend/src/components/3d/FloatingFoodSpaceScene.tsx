import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Sparkles, Move3d, Compass } from 'lucide-react';

export const FloatingFoodSpaceScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = 360;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 6.2);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 3. CINEMATIC STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.2);
    scene.add(ambientLight);

    // Warm Key Light (Sun-like gourmet glow)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 3.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Vibrant Orange-Red Backlight (Rim lighting for floating edges)
    const rimRed = new THREE.DirectionalLight(0xff3300, 4.0);
    rimRed.position.set(-4, 3, -3);
    scene.add(rimRed);

    // Cool Azure Fill Light (Space atmosphere contrast)
    const coolFill = new THREE.PointLight(0x38bdf8, 2.0, 12);
    coolFill.position.set(3, -2, 2);
    scene.add(coolFill);

    // Warm Golden Center Core Glow
    const centerGlow = new THREE.PointLight(0xf59e0b, 2.5, 8);
    centerGlow.position.set(0, 0.5, 0);
    scene.add(centerGlow);

    // 4. MAIN ZERO-GRAVITY SPACE GROUP
    const spaceUniverse = new THREE.Group();
    scene.add(spaceUniverse);

    // ─── A. FLOATING DOUBLE ANGUS BURGER (Centerpiece) ───────────
    const burgerGroup = new THREE.Group();
    spaceUniverse.add(burgerGroup);
    burgerGroup.position.set(0, -0.15, 0.4);

    // Materials
    const bunMat = new THREE.MeshPhysicalMaterial({
      color: 0xc87d32,
      roughness: 0.38,
      metalness: 0.05,
      clearcoat: 0.3,
    });
    const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3b1c10, roughness: 0.85 });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.25 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x44aa22, roughness: 0.65 });
    const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xd62828, roughness: 0.2, clearcoat: 0.8 });
    const onionMat = new THREE.MeshStandardMaterial({ color: 0x7c2d58, roughness: 0.4 });
    const sesameMat = new THREE.MeshStandardMaterial({ color: 0xfff3d0, roughness: 0.5 });

    // Top Bun
    const topBunGeo = new THREE.SphereGeometry(1.05, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const topBun = new THREE.Mesh(topBunGeo, bunMat);
    topBun.position.y = 0.55;
    topBun.scale.set(1.0, 0.65, 1.0);
    topBun.castShadow = true;
    burgerGroup.add(topBun);

    // Sesame Seeds on Top Bun
    for (let i = 0; i < 40; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * 0.7 + 0.15;
      const r = 1.05;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.cos(phi)) * 0.65 + 0.55;
      const z = r * Math.sin(phi) * Math.sin(theta);
      const seedGeo = new THREE.SphereGeometry(0.024, 6, 6);
      const seed = new THREE.Mesh(seedGeo, sesameMat);
      seed.position.set(x, y, z);
      seed.scale.set(1, 0.4, 2);
      seed.rotation.y = theta;
      burgerGroup.add(seed);
    }

    // Tomato Slices (2 slices)
    [[-0.2, 0.45, 0.1], [0.25, 0.44, -0.1]].forEach(([x, y, z]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 20), tomatoMat);
      t.position.set(x, y, z);
      burgerGroup.add(t);
    });

    // Red Onion Rings
    const onionRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 24), onionMat);
    onionRing.rotation.x = Math.PI / 2 - 0.1;
    onionRing.position.set(0.05, 0.4, 0.05);
    burgerGroup.add(onionRing);

    // Melted Golden Cheese (Dripping over patty)
    const cheeseGeo = new THREE.BoxGeometry(1.6, 0.06, 1.6);
    const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
    cheese.position.y = 0.28;
    cheese.rotation.y = 0.35;
    burgerGroup.add(cheese);

    // Top Patty
    const patty1 = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.24, 32), pattyMat);
    patty1.position.y = 0.15;
    burgerGroup.add(patty1);

    // Second Cheese Layer
    const cheese2 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 1.55), cheeseMat);
    cheese2.position.y = 0.01;
    cheese2.rotation.y = 0.8;
    burgerGroup.add(cheese2);

    // Second Patty
    const patty2 = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.24, 32), pattyMat);
    patty2.position.y = -0.13;
    burgerGroup.add(patty2);

    // Crispy Ruffled Green Lettuce
    const lettuceGeo = new THREE.CylinderGeometry(1.15, 1.1, 0.08, 24);
    const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
    lettuce.position.y = -0.28;
    burgerGroup.add(lettuce);

    // Bottom Bun
    const botBun = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.88, 0.28, 32), bunMat);
    botBun.position.y = -0.45;
    burgerGroup.add(botBun);

    // ─── B. FLOATING WOOD-FIRED PIZZA SLICE (Left-Rear) ───────────
    const pizzaSliceGroup = new THREE.Group();
    spaceUniverse.add(pizzaSliceGroup);
    pizzaSliceGroup.position.set(-1.85, 0.55, -0.6);
    pizzaSliceGroup.rotation.set(0.35, 0.6, -0.25);

    // Pizza crust wedge
    const pizzaGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 32, 1, false, 0, Math.PI / 3);
    const pizzaCrustMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 });
    const pizzaSlice = new THREE.Mesh(pizzaGeo, pizzaCrustMat);
    pizzaSliceGroup.add(pizzaSlice);

    // Melted Mozzarella surface
    const cheeseSurfGeo = new THREE.CylinderGeometry(1.18, 1.18, 0.11, 32, 1, false, 0, Math.PI / 3);
    const mozMat = new THREE.MeshStandardMaterial({ color: 0xffea75, roughness: 0.35 });
    const mozMesh = new THREE.Mesh(cheeseSurfGeo, mozMat);
    mozMesh.position.y = 0.01;
    pizzaSliceGroup.add(mozMesh);

    // Pepperoni Slices
    const pepMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45 });
    [[0.6, 0.08, 0.25], [0.85, 0.08, 0.5], [0.4, 0.08, 0.55]].forEach(([x, y, z]) => {
      const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16), pepMat);
      pep.position.set(x, y, z);
      pizzaSliceGroup.add(pep);
    });

    // Fresh Basil Leaves
    const basilMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    const basil1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), basilMat);
    basil1.scale.set(1.4, 0.2, 0.8);
    basil1.position.set(0.7, 0.09, 0.35);
    pizzaSliceGroup.add(basil1);

    // ─── C. FLOATING CHILLED COCA-COLA GLASS & ICE (Right-Front) ───
    const cokeGroup = new THREE.Group();
    spaceUniverse.add(cokeGroup);
    cokeGroup.position.set(1.85, 0.1, 0.2);
    cokeGroup.rotation.set(-0.2, -0.4, 0.15);

    // PBR Crystal Glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      clearcoat: 1.0,
    });
    const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.6, 32, 1, true), glassMat);
    glassMesh.position.y = 0.3;
    cokeGroup.add(glassMesh);

    // Chilled Cola Liquid
    const colaLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.53, 0.43, 1.45, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x1f0b04, transmission: 0.35, roughness: 0.1, transparent: true, opacity: 0.95 })
    );
    colaLiquid.position.y = 0.25;
    cokeGroup.add(colaLiquid);

    // Floating Ice Cubes orbiting glass
    const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xdff4fc, transmission: 0.88, roughness: 0.15, transparent: true, opacity: 0.85 });
    const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), iceMat);
    ice1.position.set(0.1, 0.8, 0.05);
    ice1.rotation.set(0.4, 0.5, 0.2);
    cokeGroup.add(ice1);

    const ice2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), iceMat);
    ice2.position.set(-0.12, 0.55, -0.08);
    ice2.rotation.set(-0.3, 0.6, 0.4);
    cokeGroup.add(ice2);

    // Floating Lemon Slice on Rim
    const lemon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3 })
    );
    lemon.rotation.z = Math.PI / 2;
    lemon.position.set(0.52, 1.08, 0.05);
    cokeGroup.add(lemon);

    // Metallic Drinking Straw
    const straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.9, 12),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.15 })
    );
    straw.rotation.z = 0.28;
    straw.position.set(-0.12, 0.85, 0);
    cokeGroup.add(straw);

    // ─── D. FLOATING CRISPY FRENCH FRIES IN MID-AIR ───────────────
    const friesGroup = new THREE.Group();
    spaceUniverse.add(friesGroup);
    friesGroup.position.set(0.9, 1.15, -0.8);
    friesGroup.rotation.set(0.4, 0.2, -0.3);

    const fryMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    const fryGeo = new THREE.BoxGeometry(0.08, 0.9, 0.08);

    for (let i = 0; i < 9; i++) {
      const fry = new THREE.Mesh(fryGeo, fryMat);
      const angle = (i / 9) * Math.PI * 2;
      fry.position.set(Math.cos(angle) * 0.22, (Math.random() - 0.5) * 0.2, Math.sin(angle) * 0.22);
      fry.rotation.set(Math.random() * 0.4 - 0.2, angle, Math.random() * 0.4 - 0.2);
      friesGroup.add(fry);
    }

    // ─── E. FLOATING WEIGHTLESS DUST & STARDUST PARTICLES ─────────
    const particleCount = 45;
    const particleGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.7 });
    const particleList: { mesh: THREE.Mesh; seedX: number; seedY: number; speed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set((Math.random() - 0.5) * 7.5, (Math.random() - 0.5) * 5.0, (Math.random() - 0.5) * 4.0);
      spaceUniverse.add(p);
      particleList.push({
        mesh: p,
        seedX: Math.random() * 10,
        seedY: Math.random() * 10,
        speed: 0.3 + Math.random() * 0.7,
      });
    }

    // ─── 5. INTERACTIVE MOUSE PARALLAX & ROTATION ─────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isMouseDown) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        targetRotY += deltaX * 0.01;
        targetRotX += deltaY * 0.01;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      isMouseDown = true;
      setIsInteracting(true);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = () => {
      isMouseDown = false;
      setIsInteracting(false);
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);

    // ─── 6. ANIMATION LOOP: ZERO-GRAVITY FLOATING PHYSICS ─────────
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Zero-G Gentle Floating Motion for Burger
      burgerGroup.position.y = -0.15 + Math.sin(elapsed * 1.5) * 0.12;
      burgerGroup.rotation.y = elapsed * 0.25 + targetRotY * 0.4;
      burgerGroup.rotation.x = Math.sin(elapsed * 1.1) * 0.08 + targetRotX * 0.3;
      burgerGroup.rotation.z = Math.cos(elapsed * 0.9) * 0.06;

      // Zero-G Tumbling for Pizza Slice
      pizzaSliceGroup.position.y = 0.55 + Math.sin(elapsed * 1.8 + 1) * 0.14;
      pizzaSliceGroup.position.x = -1.85 + Math.cos(elapsed * 0.8) * 0.08;
      pizzaSliceGroup.rotation.y = 0.6 + Math.sin(elapsed * 0.9) * 0.35;
      pizzaSliceGroup.rotation.x = 0.35 + Math.cos(elapsed * 1.2) * 0.15;

      // Zero-G Bobbing for Coke Glass
      cokeGroup.position.y = 0.1 + Math.sin(elapsed * 1.6 + 2) * 0.15;
      cokeGroup.rotation.y = -0.4 + Math.sin(elapsed * 0.7) * 0.25;

      // Floating Fries drifting
      friesGroup.position.y = 1.15 + Math.sin(elapsed * 1.3 + 0.5) * 0.1;
      friesGroup.rotation.y = elapsed * 0.2;

      // Stardust particles floating drift
      particleList.forEach((pt) => {
        pt.mesh.position.y += Math.sin(elapsed * pt.speed + pt.seedY) * 0.003;
        pt.mesh.position.x += Math.cos(elapsed * pt.speed + pt.seedX) * 0.002;
      });

      // Mouse Parallax on entire universe
      spaceUniverse.rotation.y += (targetRotY + mouseX * 0.35 - spaceUniverse.rotation.y) * 0.05;
      spaceUniverse.rotation.x += (targetRotX - mouseY * 0.25 - spaceUniverse.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[480px] h-[370px] my-2 select-none">
      {/* Space Nebula Background Glows */}
      <div className="absolute -top-10 -left-10 w-44 h-44 bg-orange-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/15 rounded-full blur-[90px] pointer-events-none" />

      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`w-full h-full relative cursor-grab active:cursor-grabbing rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#161820]/90 via-[#101217]/95 to-[#0b0c10]/95 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 ${
          isInteracting ? 'ring-2 ring-orange-500/50' : ''
        }`}
      />

      {/* Floating 3D Zero-G Badge 1: Double Angus Burger */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 left-3 bg-[#181a20]/95 backdrop-blur-md border border-orange-500/30 px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2.5 pointer-events-auto"
      >
        <span className="text-xl">🍔</span>
        <div className="text-left">
          <p className="text-[11px] font-black text-white leading-none tracking-tight">Double Angus Burger</p>
          <p className="text-[9px] text-orange-400 font-bold tracking-wide mt-0.5">3D Zero-G Flame Grilled</p>
        </div>
      </motion.div>

      {/* Floating 3D Zero-G Badge 2: Wood-Fired Pizza */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [1, -1, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-5 right-3 bg-[#181a20]/95 backdrop-blur-md border border-amber-500/30 px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2.5 pointer-events-auto"
      >
        <span className="text-xl">🍕</span>
        <div className="text-left">
          <p className="text-[11px] font-black text-white leading-none tracking-tight">Wood-Fired Pizza</p>
          <p className="text-[9px] text-amber-400 font-bold tracking-wide mt-0.5">100% Artisanal Crust</p>
        </div>
      </motion.div>

      {/* Floating 3D Zero-G Badge 3: Chilled Coca-Cola */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-2 -translate-y-1/2 bg-[#181a20]/90 backdrop-blur-md border border-red-500/30 px-2.5 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 pointer-events-none hidden sm:flex"
      >
        <span className="text-base">🥤</span>
        <div className="text-left">
          <p className="text-[10px] font-black text-white leading-none">Chilled Coke</p>
          <p className="text-[8px] text-red-400 font-bold">Sub-Zero Fizz</p>
        </div>
      </motion.div>

      {/* Drag Hint Overlay */}
      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] text-gray-400 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-none">
        <Move3d size={12} className="text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Drag to rotate 3D space feast</span>
      </div>
    </div>
  );
};

export default FloatingFoodSpaceScene;
