import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Move3d, Flame, RefreshCw, Award, Compass } from 'lucide-react';

interface LuxuryDining3DProps {
  onExploreHall?: () => void;
  onInstantDemo?: () => void;
}

/**
 * Cinematic cloche-reveal animation phases:
 *   0 = CLOSED       – cloche covers the burger, hand is off-screen
 *   1 = HAND_ENTER   – waiter hand slides in from upper-right toward handle
 *   2 = GRIP         – hand settles on handle ring, brief pause
 *   3 = LIFT         – hand lifts cloche upward with a slight tilt
 *   4 = REVEALED     – cloche is fully raised, aroma burst, burger on display
 *   5 = HOLD         – idle hold with subtle breathing sway
 */
type AnimPhase = 0 | 1 | 2 | 3 | 4 | 5;

export const LuxuryDining3DExperience: React.FC<LuxuryDining3DProps> = ({
  onExploreHall,
  onInstantDemo,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'cloche' | 'spaceFeast'>('cloche');
  const [isInteracting, setIsInteracting] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [animPhase, setAnimPhase] = useState<AnimPhase>(0);
  const [animStarted, setAnimStarted] = useState(false);

  const stateRef = useRef({
    viewMode: 'cloche' as 'cloche' | 'spaceFeast',
    autoRotate: true,
    // Animation timeline state
    phase: 0 as AnimPhase,
    phaseTime: 0,       // seconds spent in current phase
    clocheY: 0,          // current cloche vertical offset
    clocheTiltX: 0,      // slight tilt when being lifted
    handProgress: 0,     // 0→1 how far the hand has entered (0 = off-screen, 1 = gripping handle)
    aromaIntensity: 0,   // 0→1 aroma/steam visibility
    revealComplete: false,
  });

  // Start the animation (can be re-triggered)
  const startRevealAnimation = useCallback(() => {
    const st = stateRef.current;
    st.phase = 1;
    st.phaseTime = 0;
    st.clocheY = 0;
    st.clocheTiltX = 0;
    st.handProgress = 0;
    st.aromaIntensity = 0;
    st.revealComplete = false;
    setAnimPhase(1);
    setAnimStarted(true);
  }, []);

  // Auto-start after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      startRevealAnimation();
    }, 1200);
    return () => clearTimeout(timer);
  }, [startRevealAnimation]);

  const handleReplay = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    startRevealAnimation();
  };

  const handleToggleRotate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    setAutoRotate((prev) => {
      stateRef.current.autoRotate = !prev;
      return !prev;
    });
  };

  const handleSwitchMode = (mode: 'cloche' | 'spaceFeast') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
    stateRef.current.viewMode = mode;
    setViewMode(mode);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 300;

    // ── SCENE & CAMERA ──
    const scene = new THREE.Scene();
    const isMobile = width < 540;
    const initialCamZ = isMobile ? 6.2 : 5.4;
    const initialCamY = isMobile ? 2.1 : 1.85;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, 0.25, 0);

    // ── RENDERER ──
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

    // ── LIGHTING ──
    scene.add(new THREE.AmbientLight(0xfff4e6, 1.3));

    const keyLight = new THREE.DirectionalLight(0xffeedd, 3.6);
    keyLight.position.set(3.5, 7.5, 4.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf97316, 2.8);
    rimLight.position.set(-4.5, 3, -2.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.4, 12);
    fillLight.position.set(3.5, -2, 2.5);
    scene.add(fillLight);

    // Inner dish glow — starts dim (cloche is closed), brightens on reveal
    const innerDishGlow = new THREE.PointLight(0xff7700, 0.6, 5);
    innerDishGlow.position.set(0, 0.8, 0);
    scene.add(innerDishGlow);

    // ROOT GROUP
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // ════════════════════════════════════════════
    // SCENE A: CLOCHE & DISH
    // ════════════════════════════════════════════
    const clocheSceneGroup = new THREE.Group();
    universeGroup.add(clocheSceneGroup);

    // ─── PLATTER ───
    const platterBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0x12141a, roughness: 0.15, metalness: 0.85, clearcoat: 1.0, clearcoatRoughness: 0.1,
    });
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 0.18, 56), platterBaseMat);
    platter.position.y = -0.55;
    platter.receiveShadow = true;
    clocheSceneGroup.add(platter);

    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, metalness: 0.95, roughness: 0.12, clearcoat: 0.9,
    });
    const outerGoldRing = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.05, 16, 56), goldMat);
    outerGoldRing.rotation.x = Math.PI / 2;
    outerGoldRing.position.y = -0.5;
    clocheSceneGroup.add(outerGoldRing);

    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.3 });
    const ceramicDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.02, 44), ceramicMat);
    ceramicDisk.position.y = -0.45;
    clocheSceneGroup.add(ceramicDisk);

    // ─── GOURMET BURGER ───
    const dishGroup = new THREE.Group();
    dishGroup.position.y = -0.42;
    clocheSceneGroup.add(dishGroup);

    const bunMat = new THREE.MeshPhysicalMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.05, clearcoat: 0.45 });
    const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3d1c10, roughness: 0.88 });
    const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.25, clearcoat: 0.65 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.15, clearcoat: 0.85 });
    const sesameMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.78, 0.22, 28), bunMat);
    bottomBun.position.y = 0.11;
    dishGroup.add(bottomBun);

    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.98, 0.06, 22), lettuceMat);
    lettuce.position.y = 0.24;
    dishGroup.add(lettuce);

    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.26, 28), pattyMat);
    patty.position.y = 0.38;
    dishGroup.add(patty);

    const cheese = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.4), cheeseMat);
    cheese.position.y = 0.52;
    cheese.rotation.y = 0.4;
    dishGroup.add(cheese);

    const tomato1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), tomatoMat);
    tomato1.position.set(-0.2, 0.58, 0.1);
    dishGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 18), tomatoMat);
    tomato2.position.set(0.25, 0.58, -0.08);
    dishGroup.add(tomato2);

    const topBun = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      bunMat
    );
    topBun.scale.set(1.0, 0.62, 1.0);
    topBun.position.y = 0.65;
    dishGroup.add(topBun);

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

    // ─── AROMA STEAM PARTICLES ───
    const aromaCount = 42;
    const aromaGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const aromaMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea, transparent: true, opacity: 0 });

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
      p.position.set(baseX, 0.25, baseZ);
      p.visible = false; // hidden until reveal
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

    // Warm vapor motes
    const vaporCount = 30;
    const vaporGeo = new THREE.SphereGeometry(0.016, 5, 5);
    const vaporMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.75 });
    const vaporMotes: { mesh: THREE.Mesh; speed: number; angle: number; r: number; phase: number }[] = [];

    for (let i = 0; i < vaporCount; i++) {
      const v = new THREE.Mesh(vaporGeo, vaporMat);
      const r = 0.3 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      v.position.set(Math.cos(angle) * r, 0.4 + Math.random() * 1.8, Math.sin(angle) * r);
      v.visible = false;
      clocheSceneGroup.add(v);
      vaporMotes.push({ mesh: v, speed: 0.4 + Math.random() * 0.6, angle, r, phase: Math.random() * Math.PI * 2 });
    }

    // ─── CLOCHE DOME + HANDLE ───
    const clocheGroup = new THREE.Group();
    clocheGroup.position.y = -0.42; // resting on platter
    clocheSceneGroup.add(clocheGroup);

    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b, metalness: 0.96, roughness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.08, reflectivity: 0.95,
    });
    const clocheDome = new THREE.Mesh(new THREE.SphereGeometry(1.58, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    clocheDome.castShadow = true;
    clocheGroup.add(clocheDome);

    const clocheLip = new THREE.Mesh(new THREE.TorusGeometry(1.61, 0.07, 14, 56), goldMat);
    clocheLip.rotation.x = Math.PI / 2;
    clocheGroup.add(clocheLip);

    const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 14), goldMat);
    handleStem.position.y = 1.68;
    clocheGroup.add(handleStem);

    const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 14, 28), goldMat);
    handleRing.rotation.y = Math.PI / 4;
    handleRing.position.y = 1.95;
    clocheGroup.add(handleRing);

    // ─── WAITER ARM GROUP ───
    // This whole group starts OFF-SCREEN (translated far right + up) and slides in
    const waiterArmGroup = new THREE.Group();
    clocheGroup.add(waiterArmGroup);

    // Starting position: off-screen to upper-right
    // These are the "rest" (gripping) positions — we offset the whole group
    const ARM_OFFSCREEN_X = 5.0;
    const ARM_OFFSCREEN_Y = 3.0;
    const ARM_ONSCREEN_X = 0;
    const ARM_ONSCREEN_Y = 0;

    // Start off-screen
    waiterArmGroup.position.set(ARM_OFFSCREEN_X, ARM_OFFSCREEN_Y, 0);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0x111319, roughness: 0.85, metalness: 0.1 });
    const cuffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const cufflinkMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15, clearcoat: 0.8 });
    const gloveMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.55, clearcoat: 0.25 });

    // Forearm
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.2, 18), suitMat);
    forearm.position.set(0.85, 2.95, 0.35);
    forearm.rotation.set(-0.25, 0.2, -0.68);
    waiterArmGroup.add(forearm);

    // White shirt cuff
    const shirtCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.2, 18), cuffMat);
    shirtCuff.position.set(0.35, 2.25, 0.18);
    shirtCuff.rotation.set(-0.25, 0.2, -0.68);
    waiterArmGroup.add(shirtCuff);

    // Golden cufflink
    const cufflink = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 12), cufflinkMat);
    cufflink.position.set(0.44, 2.3, 0.32);
    cufflink.rotation.z = Math.PI / 2;
    waiterArmGroup.add(cufflink);

    // Gloved wrist
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.3, 16), gloveMat);
    wrist.position.set(0.22, 2.12, 0.12);
    wrist.rotation.set(-0.2, 0.15, -0.58);
    waiterArmGroup.add(wrist);

    // Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.24), gloveMat);
    palm.position.set(0.1, 1.98, 0.07);
    palm.rotation.set(0.1, -0.2, -0.32);
    waiterArmGroup.add(palm);

    // Thumb
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.28, 10), gloveMat);
    thumb.position.set(0.14, 1.88, -0.08);
    thumb.rotation.set(-0.6, 0.3, 0.35);
    waiterArmGroup.add(thumb);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), gloveMat);
    thumbTip.position.set(0.08, 1.82, -0.16);
    waiterArmGroup.add(thumbTip);

    // Index finger
    const indexFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.28, 10), gloveMat);
    indexFinger.position.set(-0.02, 1.94, 0.12);
    indexFinger.rotation.set(0.5, -0.2, -0.4);
    waiterArmGroup.add(indexFinger);

    const indexTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), gloveMat);
    indexTip.position.set(-0.07, 1.85, 0.16);
    waiterArmGroup.add(indexTip);

    // Middle finger
    const middleFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.3, 10), gloveMat);
    middleFinger.position.set(0.03, 1.9, 0.17);
    middleFinger.rotation.set(0.4, 0, -0.3);
    waiterArmGroup.add(middleFinger);

    // Ring & pinky
    const ringFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 10), gloveMat);
    ringFinger.position.set(0.1, 1.88, 0.18);
    ringFinger.rotation.set(0.3, 0.2, -0.2);
    waiterArmGroup.add(ringFinger);

    const pinkyFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 10), gloveMat);
    pinkyFinger.position.set(0.17, 1.87, 0.16);
    pinkyFinger.rotation.set(0.2, 0.3, -0.1);
    waiterArmGroup.add(pinkyFinger);

    // ════════════════════════════════════════════
    // SCENE B: ZERO-G COSMIC FEAST
    // ════════════════════════════════════════════
    const spaceSceneGroup = new THREE.Group();
    universeGroup.add(spaceSceneGroup);
    spaceSceneGroup.visible = false;

    const spaceBurger = dishGroup.clone(true);
    spaceBurger.position.set(0, 0, 0);
    spaceBurger.scale.set(1.15, 1.15, 1.15);
    spaceSceneGroup.add(spaceBurger);

    // Pizza slice
    const pizzaGroup = new THREE.Group();
    pizzaGroup.position.set(-1.9, 0.6, -0.4);
    pizzaGroup.rotation.set(0.35, 0.6, -0.25);
    const pizzaCrust = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.09, 28, 1, false, 0, Math.PI / 3),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 })
    );
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

    // Cola glass
    const glassGroup = new THREE.Group();
    glassGroup.position.set(1.9, 0.2, 0.3);
    glassGroup.rotation.set(-0.2, -0.4, 0.15);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 0.94, opacity: 0.85, transparent: true, roughness: 0.05, ior: 1.5, clearcoat: 1.0,
    });
    glassGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.5, 28, 1, true), glassMat));
    glassGroup.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.38, 1.35, 28),
      new THREE.MeshPhysicalMaterial({ color: 0x1f0b04, transmission: 0.35, roughness: 0.1, transparent: true, opacity: 0.95 })
    ));
    spaceSceneGroup.add(glassGroup);

    // Fries
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

    // ════════════════════════════════════════════
    // TOUCH & MOUSE INTERACTION
    // ════════════════════════════════════════════
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
        targetRotY += (e.clientX - lastX) * 0.009;
        targetRotX += (e.clientY - lastY) * 0.007;
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

    // Resize
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

    // ════════════════════════════════════════════
    // ANIMATION LOOP — CINEMATIC CLOCHE REVEAL
    // ════════════════════════════════════════════
    const clock = new THREE.Clock();
    let animId = 0;
    let lastTime = 0;

    // Smooth easing functions
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Phase durations (seconds)
    const PHASE_DURATIONS = {
      1: 1.4,   // HAND_ENTER: hand slides in smoothly
      2: 0.5,   // GRIP: brief pause as hand settles on handle
      3: 1.8,   // LIFT: dramatic slow lift of the cloche
      4: 0.6,   // REVEALED: aroma burst moment
    };

    // Final cloche lift position
    const CLOCHE_LIFT_Y = 2.35;
    const CLOCHE_LIFT_TILT_X = -0.28;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = elapsed - lastTime;
      lastTime = elapsed;
      const st = stateRef.current;

      // Scene visibility
      clocheSceneGroup.visible = st.viewMode === 'cloche';
      spaceSceneGroup.visible = st.viewMode === 'spaceFeast';

      // ── CINEMATIC PHASE STATE MACHINE ──
      if (st.phase > 0 && st.phase < 5) {
        st.phaseTime += delta;
      }

      const phase = st.phase;

      if (phase === 0) {
        // CLOSED: cloche rests on platter, hand is off-screen
        waiterArmGroup.position.x = ARM_OFFSCREEN_X;
        waiterArmGroup.position.y = ARM_OFFSCREEN_Y;
        st.clocheY = 0;
        st.clocheTiltX = 0;
        st.aromaIntensity = 0;

      } else if (phase === 1) {
        // HAND_ENTER: waiter hand slides in from upper-right toward handle
        const dur = PHASE_DURATIONS[1];
        const t = Math.min(st.phaseTime / dur, 1);
        const eased = easeInOutCubic(t);

        waiterArmGroup.position.x = THREE.MathUtils.lerp(ARM_OFFSCREEN_X, ARM_ONSCREEN_X, eased);
        waiterArmGroup.position.y = THREE.MathUtils.lerp(ARM_OFFSCREEN_Y, ARM_ONSCREEN_Y, eased);

        // Cloche stays closed
        st.clocheY = 0;
        st.clocheTiltX = 0;
        st.aromaIntensity = 0;

        if (t >= 1) {
          st.phase = 2;
          st.phaseTime = 0;
          setAnimPhase(2);
        }

      } else if (phase === 2) {
        // GRIP: hand has reached handle, brief settling pause
        const dur = PHASE_DURATIONS[2];
        const t = Math.min(st.phaseTime / dur, 1);

        waiterArmGroup.position.x = ARM_ONSCREEN_X;
        waiterArmGroup.position.y = ARM_ONSCREEN_Y;

        // Subtle grip "squeeze" — tiny downward micro-movement then settle
        const squeezeY = Math.sin(t * Math.PI) * -0.03;
        waiterArmGroup.position.y = ARM_ONSCREEN_Y + squeezeY;

        st.clocheY = 0;
        st.clocheTiltX = 0;

        if (t >= 1) {
          st.phase = 3;
          st.phaseTime = 0;
          setAnimPhase(3);
        }

      } else if (phase === 3) {
        // LIFT: dramatic cloche lift!
        const dur = PHASE_DURATIONS[3];
        const t = Math.min(st.phaseTime / dur, 1);
        const eased = easeOutQuart(t);

        waiterArmGroup.position.x = ARM_ONSCREEN_X;
        waiterArmGroup.position.y = ARM_ONSCREEN_Y;

        // Cloche rises smoothly
        st.clocheY = eased * CLOCHE_LIFT_Y;

        // Slight tilt backward as it lifts (like a real waiter would do)
        // Tilt increases in first half, settles in second half
        const tiltProgress = easeInOutQuad(t);
        st.clocheTiltX = tiltProgress * CLOCHE_LIFT_TILT_X;

        // Aroma starts appearing mid-lift
        if (t > 0.3) {
          st.aromaIntensity = Math.min((t - 0.3) / 0.4, 1);
        }

        if (t >= 1) {
          st.phase = 4;
          st.phaseTime = 0;
          setAnimPhase(4);
        }

      } else if (phase === 4) {
        // REVEALED: aroma burst, full reveal
        const dur = PHASE_DURATIONS[4];
        const t = Math.min(st.phaseTime / dur, 1);

        st.clocheY = CLOCHE_LIFT_Y;
        st.clocheTiltX = CLOCHE_LIFT_TILT_X;
        st.aromaIntensity = 1;

        if (t >= 1) {
          st.phase = 5;
          st.phaseTime = 0;
          st.revealComplete = true;
          setAnimPhase(5);
        }

      } else if (phase === 5) {
        // HOLD: idle state, gentle breathing sway
        st.clocheY = CLOCHE_LIFT_Y;
        st.clocheTiltX = CLOCHE_LIFT_TILT_X;
        st.aromaIntensity = 1;

        // Gentle waiter arm breathing motion
        const breath = Math.sin(elapsed * 1.8) * 0.04;
        waiterArmGroup.position.y = ARM_ONSCREEN_Y;
        st.clocheY = CLOCHE_LIFT_Y + breath;

        // Subtle arm flex
        waiterArmGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.015;
      }

      // ── Apply cloche position ──
      clocheGroup.position.y = -0.42 + st.clocheY;
      clocheGroup.rotation.x = st.clocheTiltX;

      // ── Inner dish glow reacts to reveal ──
      const targetGlow = st.aromaIntensity > 0.1 ? 4.6 : 0.6;
      innerDishGlow.intensity = THREE.MathUtils.lerp(innerDishGlow.intensity, targetGlow, 0.08);

      // ── Auto rotation ──
      if (st.autoRotate && !isMouseDown) {
        targetRotY += 0.006;
      }

      // ── Parallax ──
      universeGroup.rotation.y += (targetRotY + mouseX * 0.22 - universeGroup.rotation.y) * 0.06;
      universeGroup.rotation.x += (targetRotX - mouseY * 0.16 - universeGroup.rotation.x) * 0.06;
      universeGroup.rotation.x = THREE.MathUtils.clamp(universeGroup.rotation.x, -0.4, 0.4);

      // ── AROMA STEAM (only visible when aromaIntensity > 0) ──
      const showAroma = st.aromaIntensity > 0.05;

      aromaParticles.forEach((ap) => {
        const mat = ap.mesh.material as THREE.MeshBasicMaterial;

        if (!showAroma) {
          ap.mesh.visible = false;
          mat.opacity = 0;
          ap.mesh.position.y = 0.25;
        } else {
          ap.mesh.visible = true;

          // Culinary steam rises
          ap.mesh.position.y += ap.speedY * 0.014;

          // Realistic S-curve swirl
          const yProgress = (ap.mesh.position.y - 0.25) / 2.6;
          const curlX = Math.sin(elapsed * 2.2 + ap.phase) * ap.curlRadius * (1 + yProgress * 1.4);
          const curlZ = Math.cos(elapsed * 1.9 + ap.phase) * ap.curlRadius * (1 + yProgress * 1.4);
          ap.mesh.position.x = ap.baseX + curlX;
          ap.mesh.position.z = ap.baseZ + curlZ;

          // Scale up as steam rises
          const scale = ap.baseScale * (0.6 + yProgress * 2.2);
          ap.mesh.scale.set(scale, scale * 1.3, scale);

          // Opacity curve modulated by aromaIntensity
          let targetOpacity = 0;
          if (yProgress < 0.2) {
            targetOpacity = (yProgress / 0.2) * 0.28;
          } else if (yProgress < 0.7) {
            targetOpacity = 0.28;
          } else {
            targetOpacity = Math.max(0, (1 - (yProgress - 0.7) / 0.3) * 0.28);
          }
          mat.opacity = targetOpacity * st.aromaIntensity;

          // Loop particle
          if (ap.mesh.position.y > 2.8) {
            ap.mesh.position.y = 0.25 + Math.random() * 0.15;
            ap.baseX = (Math.random() - 0.5) * 0.55;
            ap.baseZ = (Math.random() - 0.5) * 0.55;
          }
        }
      });

      // Warm vapor motes
      vaporMotes.forEach((vm) => {
        if (showAroma) {
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

      // Space feast bobbing
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

  // Phase label for the badge
  const phaseLabel = (() => {
    switch (animPhase) {
      case 0: return 'Chef Cloche Sealed';
      case 1: return 'Waiter Approaching…';
      case 2: return 'Gripping Handle…';
      case 3: return 'Lifting Cloche…';
      case 4: return 'Aroma Released!';
      case 5: return 'Fresh Aroma Unveiled';
      default: return '';
    }
  })();

  return (
    <div className="relative w-full h-[290px] sm:h-[380px] md:h-[460px] lg:h-[520px] select-none flex items-center justify-center my-1 sm:my-0">
      {/* Warm Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[440px] h-[280px] sm:h-[440px] bg-gradient-to-tr from-amber-600/20 via-orange-600/25 to-red-600/15 rounded-full blur-[80px] pointer-events-none" />

      {/* 3D Canvas */}
      <div
        ref={mountRef}
        style={{ touchAction: 'pan-y' }}
        className={`w-full h-full relative cursor-grab active:cursor-grabbing rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#141721]/90 via-[#0e1017]/95 to-[#090b0f]/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ${
          isInteracting ? 'ring-2 ring-amber-500/50 shadow-amber-500/10' : ''
        }`}
      />

      {/* Top Left: Status Badge with animated phase label */}
      <div className="absolute top-3 left-3 bg-[#161a24]/90 backdrop-blur-md border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 pointer-events-none">
        <span className="flex h-1.5 w-1.5 relative">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${animPhase >= 3 ? 'animate-ping bg-amber-400' : 'bg-gray-500'}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${animPhase >= 3 ? 'bg-amber-500' : 'bg-gray-500'}`}></span>
        </span>
        <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-amber-300 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          {phaseLabel}
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

      {/* Bottom Center: Controls */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-1.5 pointer-events-none">
        {/* Left: Drag hint */}
        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
          <Move3d size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Swipe 360°</span>
        </div>

        {/* Center: Replay button (only shows after reveal is complete) */}
        {viewMode === 'cloche' && (
          <button
            onClick={handleReplay}
            className="pointer-events-auto px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all transform active:scale-90 shadow-xl flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black hover:brightness-110 shadow-orange-500/30"
          >
            <Flame size={13} className={animPhase === 5 ? 'text-red-950 animate-bounce' : 'text-amber-950'} />
            <span>{animPhase === 5 ? 'Replay Reveal' : animPhase === 0 ? 'Unveil Dish' : 'Revealing…'}</span>
          </button>
        )}

        {/* Right: Auto-rotate */}
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

      {/* Floating dish info pill — appears after reveal */}
      <AnimatePresence>
        {(animPhase >= 4 || viewMode === 'spaceFeast') && (
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
