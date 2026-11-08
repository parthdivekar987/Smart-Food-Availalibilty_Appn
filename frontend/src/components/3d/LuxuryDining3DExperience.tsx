import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Move3d, Flame, Eye, RefreshCw, Award, Compass, ShieldCheck } from 'lucide-react';

interface LuxuryDining3DProps {
  onExploreHall?: () => void;
  onInstantDemo?: () => void;
}

export const LuxuryDining3DExperience: React.FC<LuxuryDining3DProps> = ({
  onExploreHall,
  onInstantDemo,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClocheOpen, setIsClocheOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cloche' | 'spaceFeast'>('cloche');
  const [isInteracting, setIsInteracting] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // References to communicate with Three.js animation loop
  const stateRef = useRef({
    isClocheOpen: false,
    viewMode: 'cloche' as 'cloche' | 'spaceFeast',
    autoRotate: true,
    targetClocheY: 0,
    currentClocheY: 0,
    targetClocheRotX: 0,
    currentClocheRotX: 0,
    targetCameraDist: 5.4,
    currentCameraDist: 5.4,
  });

  useEffect(() => {
    stateRef.current.isClocheOpen = isClocheOpen;
    stateRef.current.targetClocheY = isClocheOpen ? 2.4 : 0;
    stateRef.current.targetClocheRotX = isClocheOpen ? -0.32 : 0;
  }, [isClocheOpen]);

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 480;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 5.4);
    camera.lookAt(0, 0.2, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 3. CINEMATIC LUXURY LIGHTING
    const ambientLight = new THREE.AmbientLight(0xfff1e0, 1.2);
    scene.add(ambientLight);

    // Warm Key Light (Golden Gastronomy Spotlight)
    const keyLight = new THREE.DirectionalLight(0xffd599, 3.5);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Ruby & Amber Rim Light
    const rimLight = new THREE.DirectionalLight(0xf97316, 3.2);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    // Cyan Fill for Specular Contrast
    const fillLight = new THREE.PointLight(0x38bdf8, 1.8, 14);
    fillLight.position.set(4, -2, 3);
    scene.add(fillLight);

    // Internal Cloche Hearth Fire / Glow (Emits warm light when cloche opens)
    const innerDishGlow = new THREE.PointLight(0xff7700, 3.8, 5);
    innerDishGlow.position.set(0, 0.8, 0);
    scene.add(innerDishGlow);

    // ROOT UNIVERSE GROUP
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // ==========================================
    // SCENE A: ROYAL MICHELIN CLOCHE & DISH
    // ==========================================
    const clocheSceneGroup = new THREE.Group();
    universeGroup.add(clocheSceneGroup);

    // Base Pedestal: Nero Marquina Dark Polished Platter
    const platterBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0x12141a,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 0.18, 64), platterBaseMat);
    platter.position.y = -0.55;
    platter.receiveShadow = true;
    clocheSceneGroup.add(platter);

    // Platter Gold Outer Ring
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 0.9,
    });
    const outerGoldRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.05, 16, 64), goldMat);
    outerGoldRing.rotation.x = Math.PI / 2;
    outerGoldRing.position.y = -0.5;
    clocheSceneGroup.add(outerGoldRing);

    // Concentric Inner Gold Trim
    const innerGoldRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.035, 16, 64), goldMat);
    innerGoldRing.rotation.x = Math.PI / 2;
    innerGoldRing.position.y = -0.45;
    clocheSceneGroup.add(innerGoldRing);

    // Platter Inner Ceramic Inset
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x1e212b, roughness: 0.25 });
    const ceramicDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.68, 0.02, 48), ceramicMat);
    ceramicDisk.position.y = -0.45;
    clocheSceneGroup.add(ceramicDisk);

    // ─── GOURMET DISH (Under Cloche) ───
    const dishGroup = new THREE.Group();
    dishGroup.position.y = -0.42;
    clocheSceneGroup.add(dishGroup);

    // Materials for the Gourmet Dish
    const bunMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.4,
    });
    const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3d1c10, roughness: 0.88 });
    const cheeseMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      clearcoat: 0.6,
    });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.15, clearcoat: 0.8 });
    const sesameMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

    // Bottom Toasted Brioche Bun
    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.78, 0.22, 32), bunMat);
    bottomBun.position.y = 0.11;
    dishGroup.add(bottomBun);

    // Fresh Ruffled Greens
    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.98, 0.06, 24), lettuceMat);
    lettuce.position.y = 0.24;
    dishGroup.add(lettuce);

    // Flame-Seared Wagyu Patty
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.26, 32), pattyMat);
    patty.position.y = 0.38;
    dishGroup.add(patty);

    // Melted Gourmet Cheddar Blanket
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.4), cheeseMat);
    cheese.position.y = 0.52;
    cheese.rotation.y = 0.4;
    dishGroup.add(cheese);

    // Ripe Heirloom Tomato Slices
    const tomato1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 20), tomatoMat);
    tomato1.position.set(-0.2, 0.58, 0.1);
    dishGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 20), tomatoMat);
    tomato2.position.set(0.25, 0.58, -0.08);
    dishGroup.add(tomato2);

    // Glazed Brioche Top Crown
    const topBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      bunMat
    );
    topBun.scale.set(1.0, 0.62, 1.0);
    topBun.position.y = 0.65;
    dishGroup.add(topBun);

    // Sesame Seeds scattered on Crown
    for (let i = 0; i < 35; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * 0.75 + 0.1;
      const r = 0.92;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.62 + 0.65;
      const z = r * Math.sin(phi) * Math.sin(theta);
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), sesameMat);
      seed.position.set(x, y, z);
      seed.scale.set(1, 0.4, 2);
      seed.rotation.y = theta;
      dishGroup.add(seed);
    }

    // ─── STEAM & AROMA PARTICLES ───
    const steamCount = 30;
    const steamGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.35,
    });
    const steamParticles: { mesh: THREE.Mesh; seedX: number; seedZ: number; speed: number; phase: number }[] = [];

    for (let i = 0; i < steamCount; i++) {
      const p = new THREE.Mesh(steamGeo, steamMat);
      p.position.set((Math.random() - 0.5) * 0.8, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8);
      clocheSceneGroup.add(p);
      steamParticles.push({
        mesh: p,
        seedX: Math.random() * 4,
        seedZ: Math.random() * 4,
        speed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ─── THE ROYAL CLOCHE DOME (Animated Lift) ───
    const clocheGroup = new THREE.Group();
    clocheGroup.position.y = -0.42;
    clocheSceneGroup.add(clocheGroup);

    // The Mirror-Polished Gold Dome
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.96,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
    });
    const clocheDomeGeo = new THREE.SphereGeometry(1.58, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const clocheDome = new THREE.Mesh(clocheDomeGeo, domeMat);
    clocheDome.castShadow = true;
    clocheGroup.add(clocheDome);

    // Cloche Bottom Beveled Lip
    const clocheLipGeo = new THREE.TorusGeometry(1.61, 0.07, 16, 64);
    const clocheLip = new THREE.Mesh(clocheLipGeo, goldMat);
    clocheLip.rotation.x = Math.PI / 2;
    clocheGroup.add(clocheLip);

    // Cloche Ornamental Handle / Crown
    const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 16), goldMat);
    handleStem.position.y = 1.68;
    clocheGroup.add(handleStem);

    const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 16, 32), goldMat);
    handleRing.rotation.y = Math.PI / 4;
    handleRing.position.y = 1.95;
    clocheGroup.add(handleRing);

    // ─── AMBIENT ORBITAL RINGS & STARDUST ───
    const orbitRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.7, 0.015, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.3 })
    );
    orbitRing1.rotation.x = Math.PI / 3;
    clocheSceneGroup.add(orbitRing1);

    const orbitRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.015, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.25 })
    );
    orbitRing2.rotation.y = Math.PI / 4;
    clocheSceneGroup.add(orbitRing2);

    // ─── FLOATING GLOWING EMBERS ───
    const emberCount = 50;
    const emberGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.8 });
    const embers: { mesh: THREE.Mesh; orbitR: number; speed: number; angle: number; yBase: number }[] = [];

    for (let i = 0; i < emberCount; i++) {
      const ember = new THREE.Mesh(emberGeo, emberMat);
      const orbitR = 1.8 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const yBase = (Math.random() - 0.5) * 2.5;
      ember.position.set(Math.cos(angle) * orbitR, yBase, Math.sin(angle) * orbitR);
      clocheSceneGroup.add(ember);
      embers.push({ mesh: ember, orbitR, speed: 0.2 + Math.random() * 0.4, angle, yBase });
    }

    // ==========================================
    // SCENE B: ZERO-G COSMIC FEAST
    // ==========================================
    const spaceSceneGroup = new THREE.Group();
    universeGroup.add(spaceSceneGroup);
    spaceSceneGroup.visible = false;

    // Center Burger for Space Scene
    const spaceBurger = dishGroup.clone(true);
    spaceBurger.position.set(0, 0, 0);
    spaceBurger.scale.set(1.15, 1.15, 1.15);
    spaceSceneGroup.add(spaceBurger);

    // Floating Pizza Slice
    const pizzaGroup = new THREE.Group();
    pizzaGroup.position.set(-2.0, 0.6, -0.4);
    pizzaGroup.rotation.set(0.35, 0.6, -0.25);
    const pizzaGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.09, 32, 1, false, 0, Math.PI / 3);
    const pizzaCrust = new THREE.Mesh(pizzaGeo, new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 }));
    pizzaGroup.add(pizzaCrust);
    const pizzaCheese = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.1, 32, 1, false, 0, Math.PI / 3),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 })
    );
    pizzaCheese.position.y = 0.01;
    pizzaGroup.add(pizzaCheese);
    [[0.55, 0.07, 0.22], [0.8, 0.07, 0.45], [0.38, 0.07, 0.5]].forEach(([x, y, z]) => {
      const pep = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.035, 16),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
      );
      pep.position.set(x, y, z);
      pizzaGroup.add(pep);
    });
    spaceSceneGroup.add(pizzaGroup);

    // Floating Chilled Cola & Ice
    const glassGroup = new THREE.Group();
    glassGroup.position.set(2.0, 0.2, 0.3);
    glassGroup.rotation.set(-0.2, -0.4, 0.15);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      clearcoat: 1.0,
    });
    const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.5, 32, 1, true), glassMat);
    glassGroup.add(glassMesh);
    const colaLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.38, 1.35, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x1f0b04, transmission: 0.35, roughness: 0.1, transparent: true, opacity: 0.95 })
    );
    glassGroup.add(colaLiquid);
    spaceSceneGroup.add(glassGroup);

    // Floating Golden Fries
    const friesGroup = new THREE.Group();
    friesGroup.position.set(1.0, 1.2, -0.7);
    friesGroup.rotation.set(0.4, 0.2, -0.3);
    const fryMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    for (let i = 0; i < 8; i++) {
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), fryMat);
      const angle = (i / 8) * Math.PI * 2;
      fry.position.set(Math.cos(angle) * 0.2, (Math.random() - 0.5) * 0.18, Math.sin(angle) * 0.2);
      fry.rotation.set(Math.random() * 0.4 - 0.2, angle, Math.random() * 0.4 - 0.2);
      friesGroup.add(fry);
    }
    spaceSceneGroup.add(friesGroup);

    // ==========================================
    // 4. MOUSE DRAG & PARALLAX TRACKING
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
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
        targetRotY += deltaX * 0.009;
        targetRotX += deltaY * 0.007;
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

    // Touch support for mobile / tablets
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        mouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);

        if (isMouseDown) {
          const deltaX = touch.clientX - lastX;
          const deltaY = touch.clientY - lastY;
          targetRotY += deltaX * 0.01;
          targetRotX += deltaY * 0.008;
          lastX = touch.clientX;
          lastY = touch.clientY;
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isMouseDown = true;
        setIsInteracting(true);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    // Resize Handler
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // ==========================================
    // 5. RENDER & PHYSICS ANIMATION LOOP
    // ==========================================
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Mode visibility switch
      clocheSceneGroup.visible = st.viewMode === 'cloche';
      spaceSceneGroup.visible = st.viewMode === 'spaceFeast';

      // Smooth cloche dome lift animation
      st.currentClocheY += (st.targetClocheY - st.currentClocheY) * 0.08;
      st.currentClocheRotX += (st.targetClocheRotX - st.currentClocheRotX) * 0.08;
      clocheGroup.position.y = -0.42 + st.currentClocheY;
      clocheGroup.rotation.x = st.currentClocheRotX;

      // Dynamic light reaction when cloche is open
      innerDishGlow.intensity = THREE.MathUtils.lerp(
        innerDishGlow.intensity,
        st.isClocheOpen ? 4.5 : 0.8,
        0.08
      );

      // Auto rotation & inertia
      if (st.autoRotate && !isMouseDown) {
        targetRotY += 0.006;
      }

      // Parallax & rotation application
      universeGroup.rotation.y += (targetRotY + mouseX * 0.25 - universeGroup.rotation.y) * 0.06;
      universeGroup.rotation.x += (targetRotX - mouseY * 0.18 - universeGroup.rotation.x) * 0.06;

      // Restrict tilt so platter stays grounded
      universeGroup.rotation.x = THREE.MathUtils.clamp(universeGroup.rotation.x, -0.45, 0.45);

      // Steam particles animation
      steamParticles.forEach((sp) => {
        const isUp = st.isClocheOpen;
        sp.mesh.visible = isUp;
        if (isUp) {
          sp.mesh.position.y += sp.speed * 0.015;
          sp.mesh.position.x += Math.sin(elapsed * 2 + sp.phase) * 0.004;
          sp.mesh.scale.setScalar(THREE.MathUtils.lerp(0.8, 1.8, (sp.mesh.position.y - 0.4) / 1.8));
          if (sp.mesh.position.y > 2.2) {
            sp.mesh.position.y = 0.35 + Math.random() * 0.2;
            sp.mesh.position.x = (Math.random() - 0.5) * 0.6;
          }
        }
      });

      // Embers floating drift
      embers.forEach((em) => {
        em.angle += em.speed * 0.01;
        em.mesh.position.x = Math.cos(em.angle) * em.orbitR;
        em.mesh.position.z = Math.sin(em.angle) * em.orbitR;
        em.mesh.position.y = em.yBase + Math.sin(elapsed * 1.5 + em.angle) * 0.25;
      });

      // Space feast zero-g bobbing
      if (st.viewMode === 'spaceFeast') {
        spaceBurger.position.y = Math.sin(elapsed * 1.6) * 0.12;
        spaceBurger.rotation.y = elapsed * 0.25;
        pizzaGroup.position.y = 0.6 + Math.sin(elapsed * 1.8 + 1) * 0.14;
        pizzaGroup.rotation.y = 0.6 + Math.sin(elapsed) * 0.3;
        glassGroup.position.y = 0.2 + Math.sin(elapsed * 1.5 + 2) * 0.12;
        friesGroup.position.y = 1.2 + Math.sin(elapsed * 1.3) * 0.08;
      }

      // Orbital rings gentle sway
      orbitRing1.rotation.z = elapsed * 0.08;
      orbitRing2.rotation.z = -elapsed * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] select-none flex items-center justify-center">
      {/* Dynamic Ambient Glow Behind 3D Centerpiece */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-gradient-to-tr from-amber-600/20 via-orange-600/25 to-red-600/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className={`w-full h-full relative cursor-grab active:cursor-grabbing rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#141721]/90 via-[#0e1017]/95 to-[#090b0f]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ${
          isInteracting ? 'ring-2 ring-amber-500/50 shadow-amber-500/10' : ''
        }`}
      />

      {/* Top Floating Glass Badge: Michelin Interactive 3D */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 bg-[#161a24]/90 backdrop-blur-md border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="text-[11px] font-black tracking-wider uppercase text-amber-300 flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" />
          {viewMode === 'cloche' ? '3D Royal Serving Cloche' : '3D Zero-G Space Feast'}
        </span>
      </motion.div>

      {/* Top Right: Mode Switcher (Royal Cloche vs Zero-G Feast) */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#12151f]/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
        <button
          onClick={() => setViewMode('cloche')}
          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${
            viewMode === 'cloche'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Award size={12} />
          Royal Platter
        </button>
        <button
          onClick={() => setViewMode('spaceFeast')}
          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${
            viewMode === 'spaceFeast'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Compass size={12} />
          Zero-G Feast
        </button>
      </div>

      {/* Bottom Center: Interactive Action Ribbon */}
      <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Drag Rotation Hint */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
          <Move3d size={13} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="hidden sm:inline">Drag to rotate 360°</span>
          <span className="sm:hidden">Drag 360°</span>
        </div>

        {/* Center: Lift / Cover Cloche Trigger Button */}
        {viewMode === 'cloche' && (
          <button
            onClick={() => setIsClocheOpen((prev) => !prev)}
            className="pointer-events-auto px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 shadow-xl flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black hover:brightness-110 shadow-orange-500/30"
          >
            <Flame size={14} className={isClocheOpen ? 'text-red-900 animate-bounce' : 'text-amber-900'} />
            <span>{isClocheOpen ? 'Cover Royal Cloche' : 'Lift Cloche & Reveal Dish'}</span>
          </button>
        )}

        {/* Right: Auto-Rotate Toggle */}
        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`pointer-events-auto px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 backdrop-blur-md ${
            autoRotate
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          <RefreshCw size={12} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
          <span className="text-[10px]">{autoRotate ? 'Orbiting' : 'Paused'}</span>
        </button>
      </div>

      {/* Floating Dish Info Pill (Visible when Cloche is open or in Space Mode) */}
      <AnimatePresence>
        {(isClocheOpen || viewMode === 'spaceFeast') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 left-4 bg-[#141721]/95 backdrop-blur-xl border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto max-w-[240px]"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Flame size={16} />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[11px] font-black text-white truncate">Flame Wagyu Brioche</p>
              <p className="text-[9px] text-amber-400 font-bold tracking-wide">360° Gourmet Craft • Ready</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuxuryDining3DExperience;
