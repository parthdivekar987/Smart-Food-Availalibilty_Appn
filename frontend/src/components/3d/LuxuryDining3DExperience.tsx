import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Move3d, Flame, Eye, RefreshCw, Award, Compass } from 'lucide-react';

interface LuxuryDining3DProps {
  onExploreHall?: () => void;
  onInstantDemo?: () => void;
}

export const LuxuryDining3DExperience: React.FC<LuxuryDining3DProps> = ({
  onExploreHall,
  onInstantDemo,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClocheOpen, setIsClocheOpen] = useState(true); // Open by default to showcase the steaming burger & waiter hand
  const [viewMode, setViewMode] = useState<'cloche' | 'spaceFeast'>('cloche');
  const [isInteracting, setIsInteracting] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // References to communicate with Three.js animation loop
  const stateRef = useRef({
    isClocheOpen: true,
    viewMode: 'cloche' as 'cloche' | 'spaceFeast',
    autoRotate: true,
    targetClocheY: 2.35,
    currentClocheY: 2.35,
    targetClocheRotX: -0.28,
    currentClocheRotX: -0.28,
    aromaBurst: 1.0,
  });

  useEffect(() => {
    stateRef.current.isClocheOpen = isClocheOpen;
    stateRef.current.targetClocheY = isClocheOpen ? 2.35 : 0;
    stateRef.current.targetClocheRotX = isClocheOpen ? -0.28 : 0;
    if (isClocheOpen) {
      stateRef.current.aromaBurst = 1.0;
    }
  }, [isClocheOpen]);

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  const handleToggleCloche = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    setIsClocheOpen((prev) => !prev);
  };

  const handleToggleRotate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setAutoRotate((prev) => !prev);
  };

  const handleSwitchMode = (mode: 'cloche' | 'spaceFeast') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setViewMode(mode);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 300;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();

    const isMobile = width < 540;
    const initialCamZ = isMobile ? 6.2 : 5.4;
    const initialCamY = isMobile ? 2.1 : 1.85;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, 0.25, 0);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // 3. CINEMATIC LUXURY DINING LIGHTING
    const ambientLight = new THREE.AmbientLight(0xfff4e6, 1.3);
    scene.add(ambientLight);

    // Key Gourmet Spotlight
    const keyLight = new THREE.DirectionalLight(0xffeedd, 3.6);
    keyLight.position.set(3.5, 7.5, 4.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Warm Amber Rim Light
    const rimLight = new THREE.DirectionalLight(0xf97316, 2.8);
    rimLight.position.set(-4.5, 3, -2.5);
    scene.add(rimLight);

    // Subtle Cyan Fill
    const fillLight = new THREE.PointLight(0x38bdf8, 1.4, 12);
    fillLight.position.set(3.5, -2, 2.5);
    scene.add(fillLight);

    // Hearth Flame Glow inside the Cloche/Platter
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

    // Platter: Dark Nero Marquina Polished Serving Plate
    const platterBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0x12141a,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 0.18, 56), platterBaseMat);
    platter.position.y = -0.55;
    platter.receiveShadow = true;
    clocheSceneGroup.add(platter);

    // Platter Gold Rim Inset
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 0.9,
    });
    const outerGoldRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.05, 16, 56), goldMat);
    outerGoldRing.rotation.x = Math.PI / 2;
    outerGoldRing.position.y = -0.5;
    clocheSceneGroup.add(outerGoldRing);

    // Platter Ceramic Inlay
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.3 });
    const ceramicDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.02, 44), ceramicMat);
    ceramicDisk.position.y = -0.45;
    clocheSceneGroup.add(ceramicDisk);

    // ─── GOURMET BURGER DISH (Centerpiece) ───
    const dishGroup = new THREE.Group();
    dishGroup.position.y = -0.42;
    clocheSceneGroup.add(dishGroup);

    const bunMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.45,
    });
    const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3d1c10, roughness: 0.88 });
    const cheeseMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      clearcoat: 0.65,
    });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.15, clearcoat: 0.85 });
    const sesameMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

    // Bottom Toasted Brioche Bun
    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.78, 0.22, 28), bunMat);
    bottomBun.position.y = 0.11;
    dishGroup.add(bottomBun);

    // Fresh Ruffled Greens
    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.98, 0.06, 22), lettuceMat);
    lettuce.position.y = 0.24;
    dishGroup.add(lettuce);

    // Flame-Seared Wagyu Patty
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.26, 28), pattyMat);
    patty.position.y = 0.38;
    dishGroup.add(patty);

    // Melted Gourmet Cheddar Blanket
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.4), cheeseMat);
    cheese.position.y = 0.52;
    cheese.rotation.y = 0.4;
    dishGroup.add(cheese);

    // Ripe Heirloom Tomato Slices
    const tomato1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), tomatoMat);
    tomato1.position.set(-0.2, 0.58, 0.1);
    dishGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), tomatoMat);
    tomato2.position.set(0.25, 0.58, -0.08);
    dishGroup.add(tomato2);

    // Glazed Brioche Crown
    const topBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      bunMat
    );
    topBun.scale.set(1.0, 0.62, 1.0);
    topBun.position.y = 0.65;
    dishGroup.add(topBun);

    // Sesame Seeds on Crown
    for (let i = 0; i < 28; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * 0.75 + 0.1;
      const r = 0.92;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.62 + 0.65;
      const z = r * Math.sin(phi) * Math.sin(theta);
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 5), sesameMat);
      seed.position.set(x, y, z);
      seed.scale.set(1, 0.4, 2);
      seed.rotation.y = theta;
      dishGroup.add(seed);
    }

    // ─── AUTHENTIC CULINARY AROMA & STEAM WISPS (NO SCI-FI RINGS) ───
    const aromaCount = 42;
    const aromaGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const aromaMat = new THREE.MeshBasicMaterial({
      color: 0xfff6ea,
      transparent: true,
      opacity: 0.28,
    });
    
    interface AromaParticle {
      mesh: THREE.Mesh;
      baseX: number;
      baseZ: number;
      speedY: number;
      phase: number;
      curlRadius: number;
      baseScale: number;
    }
    const aromaParticles: AromaParticle[] = [];

    for (let i = 0; i < aromaCount; i++) {
      const p = new THREE.Mesh(aromaGeo, aromaMat.clone());
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.55;
      const baseX = Math.cos(angle) * dist;
      const baseZ = Math.sin(angle) * dist;
      const startY = 0.2 + Math.random() * 2.2;

      p.position.set(baseX, startY, baseZ);
      clocheSceneGroup.add(p);

      aromaParticles.push({
        mesh: p,
        baseX,
        baseZ,
        speedY: 0.8 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        curlRadius: 0.12 + Math.random() * 0.2,
        baseScale: 0.7 + Math.random() * 0.8,
      });
    }

    // Appetizing warm culinary vapor motes (micro-glowing aroma flecks)
    const vaporCount = 30;
    const vaporGeo = new THREE.SphereGeometry(0.016, 5, 5);
    const vaporMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.75 });
    const vaporMotes: { mesh: THREE.Mesh; speed: number; angle: number; r: number; phase: number }[] = [];

    for (let i = 0; i < vaporCount; i++) {
      const v = new THREE.Mesh(vaporGeo, vaporMat);
      const r = 0.3 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      v.position.set(Math.cos(angle) * r, 0.4 + Math.random() * 1.8, Math.sin(angle) * r);
      clocheSceneGroup.add(v);
      vaporMotes.push({
        mesh: v,
        speed: 0.4 + Math.random() * 0.6,
        angle,
        r,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ─── THE ROYAL CLOCHE DOME (Serving Cover) ───
    const clocheGroup = new THREE.Group();
    clocheGroup.position.y = -0.42;
    clocheSceneGroup.add(clocheGroup);

    // The Mirror-Polished 24K Gold Dome
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.96,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
    });
    const clocheDomeGeo = new THREE.SphereGeometry(1.58, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const clocheDome = new THREE.Mesh(clocheDomeGeo, domeMat);
    clocheDome.castShadow = true;
    clocheGroup.add(clocheDome);

    // Cloche Bottom Beveled Lip
    const clocheLipGeo = new THREE.TorusGeometry(1.61, 0.07, 14, 56);
    const clocheLip = new THREE.Mesh(clocheLipGeo, goldMat);
    clocheLip.rotation.x = Math.PI / 2;
    clocheGroup.add(clocheLip);

    // Cloche Ornamental Handle / Ring
    const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 14), goldMat);
    handleStem.position.y = 1.68;
    clocheGroup.add(handleStem);

    const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 14, 28), goldMat);
    handleRing.rotation.y = Math.PI / 4;
    handleRing.position.y = 1.95;
    clocheGroup.add(handleRing);

    // ─── WAITER'S HAND & SUITED ARM (Opening Cloche Cover for You) ───
    const waiterArmGroup = new THREE.Group();
    clocheGroup.add(waiterArmGroup);

    // Fine-Dining Server Suit Material
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x111319, // Crisp black tuxedo fabric
      roughness: 0.85,
      metalness: 0.1,
    });

    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pristine white French dress shirt cuff
      roughness: 0.4,
    });

    const cufflinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, // Golden cufflink
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.8,
    });

    const gloveMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc, // Pure white fine-dining waiter glove
      roughness: 0.55,
      clearcoat: 0.25,
    });

    // Forearm: Slanted down from upper-right toward the handle
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.2, 18), suitMat);
    forearm.position.set(0.85, 2.95, 0.35);
    forearm.rotation.set(-0.25, 0.2, -0.68);
    waiterArmGroup.add(forearm);

    // White Shirt Cuff at wrist
    const shirtCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.2, 18), cuffMat);
    shirtCuff.position.set(0.35, 2.25, 0.18);
    shirtCuff.rotation.set(-0.25, 0.2, -0.68);
    waiterArmGroup.add(shirtCuff);

    // Golden Cufflink Button
    const cufflink = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 12), cufflinkMat);
    cufflink.position.set(0.44, 2.3, 0.32);
    cufflink.rotation.z = Math.PI / 2;
    waiterArmGroup.add(cufflink);

    // Gloved Wrist
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.3, 16), gloveMat);
    wrist.position.set(0.22, 2.12, 0.12);
    wrist.rotation.set(-0.2, 0.15, -0.58);
    waiterArmGroup.add(wrist);

    // Gloved Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.24), gloveMat);
    palm.position.set(0.1, 1.98, 0.07);
    palm.rotation.set(0.1, -0.2, -0.32);
    waiterArmGroup.add(palm);

    // Thumb gripping the handle ring
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.28, 10), gloveMat);
    thumb.position.set(0.14, 1.88, -0.08);
    thumb.rotation.set(-0.6, 0.3, 0.35);
    waiterArmGroup.add(thumb);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), gloveMat);
    thumbTip.position.set(0.08, 1.82, -0.16);
    waiterArmGroup.add(thumbTip);

    // Index Finger curved over the ring
    const indexFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.28, 10), gloveMat);
    indexFinger.position.set(-0.02, 1.94, 0.12);
    indexFinger.rotation.set(0.5, -0.2, -0.4);
    waiterArmGroup.add(indexFinger);

    const indexTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), gloveMat);
    indexTip.position.set(-0.07, 1.85, 0.16);
    waiterArmGroup.add(indexTip);

    // Middle Finger looped through handle
    const middleFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.3, 10), gloveMat);
    middleFinger.position.set(0.03, 1.9, 0.17);
    middleFinger.rotation.set(0.4, 0, -0.3);
    waiterArmGroup.add(middleFinger);

    // Ring & Pinky Fingers curled gracefully
    const ringFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 10), gloveMat);
    ringFinger.position.set(0.1, 1.88, 0.18);
    ringFinger.rotation.set(0.3, 0.2, -0.2);
    waiterArmGroup.add(ringFinger);

    const pinkyFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 10), gloveMat);
    pinkyFinger.position.set(0.17, 1.87, 0.16);
    pinkyFinger.rotation.set(0.2, 0.3, -0.1);
    waiterArmGroup.add(pinkyFinger);

    // ==========================================
    // SCENE B: ZERO-G COSMIC FEAST (Optional Mode)
    // ==========================================
    const spaceSceneGroup = new THREE.Group();
    universeGroup.add(spaceSceneGroup);
    spaceSceneGroup.visible = false;

    const spaceBurger = dishGroup.clone(true);
    spaceBurger.position.set(0, 0, 0);
    spaceBurger.scale.set(1.15, 1.15, 1.15);
    spaceSceneGroup.add(spaceBurger);

    // Floating Pizza Slice
    const pizzaGroup = new THREE.Group();
    pizzaGroup.position.set(-1.9, 0.6, -0.4);
    pizzaGroup.rotation.set(0.35, 0.6, -0.25);
    const pizzaGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.09, 28, 1, false, 0, Math.PI / 3);
    const pizzaCrust = new THREE.Mesh(pizzaGeo, new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 }));
    pizzaGroup.add(pizzaCrust);
    const pizzaCheese = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.1, 28, 1, false, 0, Math.PI / 3),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 })
    );
    pizzaCheese.position.y = 0.01;
    pizzaGroup.add(pizzaCheese);
    [[0.55, 0.07, 0.22], [0.8, 0.07, 0.45], [0.38, 0.07, 0.5]].forEach(([x, y, z]) => {
      const pep = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.035, 14),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
      );
      pep.position.set(x, y, z);
      pizzaGroup.add(pep);
    });
    spaceSceneGroup.add(pizzaGroup);

    // Floating Chilled Cola & Ice
    const glassGroup = new THREE.Group();
    glassGroup.position.set(1.9, 0.2, 0.3);
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
    const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.5, 28, 1, true), glassMat);
    glassGroup.add(glassMesh);
    const colaLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.38, 1.35, 28),
      new THREE.MeshPhysicalMaterial({ color: 0x1f0b04, transmission: 0.35, roughness: 0.1, transparent: true, opacity: 0.95 })
    );
    glassGroup.add(colaLiquid);
    spaceSceneGroup.add(glassGroup);

    // Floating Golden Fries
    const friesGroup = new THREE.Group();
    friesGroup.position.set(1.0, 1.2, -0.7);
    friesGroup.rotation.set(0.4, 0.2, -0.3);
    const fryMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
    for (let i = 0; i < 7; i++) {
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), fryMat);
      const angle = (i / 7) * Math.PI * 2;
      fry.position.set(Math.cos(angle) * 0.2, (Math.random() - 0.5) * 0.18, Math.sin(angle) * 0.2);
      fry.rotation.set(Math.random() * 0.4 - 0.2, angle, Math.random() * 0.4 - 0.2);
      friesGroup.add(fry);
    }
    spaceSceneGroup.add(friesGroup);

    // ==========================================
    // 4. TOUCH & MOUSE INTERACTION
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;
    let isHorizontalGesture = false;

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
      isHorizontalGesture = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isMouseDown = true;
        setIsInteracting(true);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        isHorizontalGesture = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;

        if (!isHorizontalGesture && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
          isHorizontalGesture = true;
        }

        if (isHorizontalGesture) {
          targetRotY += deltaX * 0.012;
          targetRotX += deltaY * 0.006;
          lastX = touch.clientX;
          lastY = touch.clientY;
        }
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
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 300;
      const mob = w < 540;
      camera.aspect = w / h;
      camera.position.z = mob ? 6.2 : 5.4;
      camera.position.y = mob ? 2.1 : 1.85;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // ==========================================
    // 5. ANIMATION & GASTRONOMY SERVING LOOP
    // ==========================================
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      clocheSceneGroup.visible = st.viewMode === 'cloche';
      spaceSceneGroup.visible = st.viewMode === 'spaceFeast';

      // ── Smooth Waiter Cloche Lift & Presentation Arc ──
      st.currentClocheY += (st.targetClocheY - st.currentClocheY) * 0.075;
      st.currentClocheRotX += (st.targetClocheRotX - st.currentClocheRotX) * 0.075;

      // Natural Human Breathing / Holding Motion on Waiter's Hand
      const breath = st.isClocheOpen ? Math.sin(elapsed * 1.8) * 0.04 : 0;
      clocheGroup.position.y = -0.42 + st.currentClocheY + breath;
      clocheGroup.rotation.x = st.currentClocheRotX;

      // Forearm flexes slightly as it holds the cloche up
      waiterArmGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.015;

      // Dynamic warm hearth lighting reaction
      innerDishGlow.intensity = THREE.MathUtils.lerp(
        innerDishGlow.intensity,
        st.isClocheOpen ? 4.6 : 0.6,
        0.08
      );

      // Auto presentation rotation
      if (st.autoRotate && !isMouseDown) {
        targetRotY += 0.006;
      }

      // Parallax application
      universeGroup.rotation.y += (targetRotY + mouseX * 0.22 - universeGroup.rotation.y) * 0.06;
      universeGroup.rotation.x += (targetRotX - mouseY * 0.16 - universeGroup.rotation.x) * 0.06;
      universeGroup.rotation.x = THREE.MathUtils.clamp(universeGroup.rotation.x, -0.4, 0.4);

      // ── Billowing Authentic Aroma Wisps Animation ──
      const clocheHeight = st.currentClocheY;
      const isOpenEnough = clocheHeight > 0.4;

      aromaParticles.forEach((ap) => {
        const mat = ap.mesh.material as THREE.MeshBasicMaterial;

        if (!isOpenEnough) {
          // Aroma is sealed under cloche
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.15);
          ap.mesh.position.y = 0.25;
        } else {
          // Culinary steam rises with realistic convective turbulence & curling
          ap.mesh.position.y += ap.speedY * 0.014;

          // Realistic S-curve smoke swirl
          const yProgress = (ap.mesh.position.y - 0.25) / 2.6;
          const curlX = Math.sin(elapsed * 2.2 + ap.phase) * ap.curlRadius * (1 + yProgress * 1.4);
          const curlZ = Math.cos(elapsed * 1.9 + ap.phase) * ap.curlRadius * (1 + yProgress * 1.4);
          ap.mesh.position.x = ap.baseX + curlX;
          ap.mesh.position.z = ap.baseZ + curlZ;

          // Steam expands as it rises
          const scale = ap.baseScale * (0.6 + yProgress * 2.2);
          ap.mesh.scale.set(scale, scale * 1.3, scale);

          // Opacity curve: Faint at base -> Peak bloom in mid air -> Dissipates into atmosphere
          let targetOpacity = 0;
          if (yProgress < 0.2) {
            targetOpacity = (yProgress / 0.2) * 0.28;
          } else if (yProgress < 0.7) {
            targetOpacity = 0.28;
          } else {
            targetOpacity = Math.max(0, (1 - (yProgress - 0.7) / 0.3) * 0.28);
          }
          mat.opacity = targetOpacity;

          // Loop particle back to hot burger surface
          if (ap.mesh.position.y > 2.8) {
            ap.mesh.position.y = 0.25 + Math.random() * 0.15;
            ap.baseX = (Math.random() - 0.5) * 0.55;
            ap.baseZ = (Math.random() - 0.5) * 0.55;
          }
        }
      });

      // Warm glowing vapor motes
      vaporMotes.forEach((vm) => {
        if (isOpenEnough) {
          vm.mesh.visible = true;
          vm.mesh.position.y += vm.speed * 0.009;
          vm.angle += vm.speed * 0.008;
          vm.mesh.position.x = Math.cos(vm.angle) * vm.r;
          vm.mesh.position.z = Math.sin(vm.angle) * vm.r;
          if (vm.mesh.position.y > 2.4) {
            vm.mesh.position.y = 0.35 + Math.random() * 0.2;
          }
        } else {
          vm.mesh.visible = false;
        }
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
    <div className="relative w-full h-[290px] sm:h-[380px] md:h-[460px] lg:h-[520px] select-none flex items-center justify-center my-1 sm:my-0">
      {/* Warm Ambient Culinary Glow Behind Centerpiece */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[440px] h-[280px] sm:h-[440px] bg-gradient-to-tr from-amber-600/20 via-orange-600/25 to-red-600/15 rounded-full blur-[80px] pointer-events-none" />

      {/* 3D WebGL Canvas Viewport with touch-action pan-y */}
      <div
        ref={mountRef}
        style={{ touchAction: 'pan-y' }}
        className={`w-full h-full relative cursor-grab active:cursor-grabbing rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#141721]/90 via-[#0e1017]/95 to-[#090b0f]/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ${
          isInteracting ? 'ring-2 ring-amber-500/50 shadow-amber-500/10' : ''
        }`}
      />

      {/* Top Left: Michelin Fresh Service Badge */}
      <div className="absolute top-3 left-3 bg-[#161a24]/90 backdrop-blur-md border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 pointer-events-none">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
        </span>
        <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-amber-300 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          {isClocheOpen ? 'Fresh Aroma Unveiled' : 'Chef Cloche Sealed'}
        </span>
      </div>

      {/* Top Right: Mode Switcher */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#12151f]/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
        <button
          onClick={() => handleSwitchMode('cloche')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 ${
            viewMode === 'cloche'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Award size={11} />
          <span>Platter</span>
        </button>
        <button
          onClick={() => handleSwitchMode('spaceFeast')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 ${
            viewMode === 'spaceFeast'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Compass size={11} />
          <span>Zero-G</span>
        </button>
      </div>

      {/* Bottom Center: Interactive Action Ribbon */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-1.5 pointer-events-none">
        
        {/* Left: Drag Rotation Hint */}
        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
          <Move3d size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Swipe 360°</span>
        </div>

        {/* Center: Waiter Opening / Covering Dish Trigger Button */}
        {viewMode === 'cloche' && (
          <button
            onClick={handleToggleCloche}
            className="pointer-events-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all transform active:scale-90 shadow-xl flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black hover:brightness-110 shadow-orange-500/30"
          >
            <Flame size={13} className={isClocheOpen ? 'text-red-950 animate-bounce' : 'text-amber-950'} />
            <span>{isClocheOpen ? 'Cover Burger' : 'Unveil Hot Burger'}</span>
          </button>
        )}

        {/* Right: Auto-Rotate Toggle */}
        <button
          onClick={handleToggleRotate}
          className={`pointer-events-auto px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1 backdrop-blur-md active:scale-95 ${
            autoRotate
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          <RefreshCw size={11} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
          <span className="hidden sm:inline">{autoRotate ? 'Orbit' : 'Pause'}</span>
        </button>
      </div>

      {/* Floating Fresh Aroma Info Pill */}
      <AnimatePresence>
        {(isClocheOpen || viewMode === 'spaceFeast') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute top-12 left-3 bg-[#141721]/95 backdrop-blur-xl border border-amber-500/30 px-2.5 sm:px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2 pointer-events-none max-w-[210px]"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Flame size={13} />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-white truncate">Flame Wagyu Brioche</p>
              <p className="text-[8px] text-amber-400 font-bold tracking-wide">Fresh Hot Aroma • Ready</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuxuryDining3DExperience;
