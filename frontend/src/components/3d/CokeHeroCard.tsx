import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Volume2, VolumeX, RotateCcw, Droplets } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import toast from 'react-hot-toast';

interface CokeHeroCardProps {
  cokeItem?: MenuItem;
  onView3D?: (item: MenuItem) => void;
}

export const CokeHeroCard: React.FC<CokeHeroCardProps> = ({ cokeItem, onView3D }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const addToCart = useCartStore((state) => state.addToCart);

  const [isPouring, setIsPouring] = useState(false);
  const [pourProgress, setPourProgress] = useState(0.75); // starts partially poured
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Fallback coke item if not provided
  const item: MenuItem = cokeItem || {
    id: 'bev-coke',
    categoryId: 'cat-beverages',
    name: 'Classic Chilled Coca-Cola',
    price: 60,
    description: 'Ice-cold refreshing Coca-Cola poured over crystalline ice cubes with a fresh slice of lemon, effervescent fizz, and cold condensation.',
    prepTime: 3,
    status: 'AVAILABLE',
    isChefRecommended: true,
    photos: [{ id: 'p1', menuItemId: 'bev-coke', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80', isPrimary: true }],
    modifierGroups: [],
  };

  // Web Audio fizz synthesizer
  const startFizzSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate fizzy white/pink noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Pinkish noise
        lastOut = data[i];
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2800;
      filter.Q.value = 1.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noiseNodeRef.current = gain;
    } catch (e) {
      console.warn('Audio fizz error:', e);
    }
  };

  const stopFizzSound = () => {
    if (noiseNodeRef.current && audioContextRef.current) {
      try {
        const gain = noiseNodeRef.current as GainNode;
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.4);
        setTimeout(() => {
          try {
            gain.disconnect();
          } catch (_) {}
        }, 500);
      } catch (_) {}
    }
  };

  const triggerPour = () => {
    if (isPouring) return;
    setIsPouring(true);
    setPourProgress(0.1);
    startFizzSound();

    let start = performance.now();
    const duration = 2400; // 2.4s pour

    const animatePour = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 0.1 + 0.82 * (1 - Math.pow(1 - progress, 2));
      setPourProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animatePour);
      } else {
        setIsPouring(false);
        stopFizzSound();
        toast.success('Coca-Cola poured to icy perfection! 🥤✨', { id: 'coke-pour' });
      }
    };

    requestAnimationFrame(animatePour);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = 240;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 5.0);
    camera.lookAt(0, 0.5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.replaceChildren(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffeedd, 0.9);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimRed = new THREE.DirectionalLight(0xff1122, 3.5);
    rimRed.position.set(-4, 3, -3);
    scene.add(rimRed);

    const glowFill = new THREE.PointLight(0xff4422, 1.5, 8);
    glowFill.position.set(0, 0.5, 2);
    scene.add(glowFill);

    // Main Group
    const glassGroup = new THREE.Group();
    scene.add(glassGroup);

    // 1. Crystal Highball Glass (PBR Glass)
    const glassGeo = new THREE.CylinderGeometry(0.82, 0.72, 2.4, 36, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.88,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 0.25,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = 0.9;
    glassGroup.add(glassMesh);

    // Heavy Glass Base
    const baseGeo = new THREE.CylinderGeometry(0.72, 0.74, 0.22, 36);
    const baseMesh = new THREE.Mesh(baseGeo, glassMat);
    baseMesh.position.y = -0.2;
    glassGroup.add(baseMesh);

    // 2. Cold Cola Liquid Mesh (Dynamic height & scale)
    const liquidGeo = new THREE.CylinderGeometry(0.8, 0.7, 2.1, 32);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f0b04, // Deep rich cola amber-black
      transmission: 0.45,
      roughness: 0.12,
      transparent: true,
      opacity: 0.96,
      clearcoat: 0.8,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 0.8;
    glassGroup.add(liquidMesh);

    // 3. Fizzy Foam / Froth Top Head
    const foamGeo = new THREE.CylinderGeometry(0.81, 0.8, 0.14, 32);
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0xedd6c4,
      roughness: 0.9,
      transparent: true,
      opacity: 0.92,
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.position.y = 1.85;
    glassGroup.add(foamMesh);

    // 4. Floating Crystalline Ice Cubes (3 cubes)
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0xdff4fc,
      transmission: 0.88,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
      ior: 1.31,
    });
    const iceCubes: THREE.Mesh[] = [];
    const cubeGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);

    [
      { pos: [0.15, 1.4, 0.1], rot: [0.3, 0.4, 0.1] },
      { pos: [-0.2, 1.1, -0.15], rot: [-0.2, 0.6, 0.4] },
      { pos: [0.1, 0.7, -0.1], rot: [0.5, -0.3, 0.2] },
    ].forEach((cfg) => {
      const cube = new THREE.Mesh(cubeGeo, iceMat);
      cube.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      cube.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      glassGroup.add(cube);
      iceCubes.push(cube);
    });

    // 5. Fresh Lemon Wedge Garnish on Rim
    const lemonGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16, 1, false, 0, Math.PI);
    const lemonMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.35 });
    const lemon = new THREE.Mesh(lemonGeo, lemonMat);
    lemon.rotation.z = Math.PI / 2;
    lemon.rotation.y = 0.4;
    lemon.position.set(0.8, 2.05, 0.1);
    glassGroup.add(lemon);

    // 6. Carbonation Bubbles Rising Inside Glass
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const bubbleGeo = new THREE.SphereGeometry(0.024, 6, 6);
    const bubbles: { mesh: THREE.Mesh; speed: number; startY: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.55;
      const y = -0.1 + Math.random() * 1.8;
      b.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      glassGroup.add(b);
      bubbles.push({ mesh: b, speed: 0.015 + Math.random() * 0.025, startY: -0.1 });
    }

    // 7. Pouring Liquid Stream (Visible during pouring)
    const streamGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 16);
    const streamMat = new THREE.MeshPhysicalMaterial({
      color: 0x240802,
      transmission: 0.4,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
      clearcoat: 1.0,
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.set(0.1, 2.8, 0.1);
    streamMesh.rotation.z = -0.12;
    scene.add(streamMesh);

    // Mouse / Touch Drag Rotation
    let prevX = 0;
    let targetRotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      setIsDragging(true);
      prevX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - prevX;
      targetRotY += delta * 0.01;
      prevX = e.clientX;
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let reqId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Liquid scale according to current pourProgress
      const progress = pourProgress;
      const scaleY = Math.max(0.08, progress);
      liquidMesh.scale.set(1, scaleY, 1);
      liquidMesh.position.y = -0.2 + scaleY * 1.05;

      // Foam floats on top of liquid
      foamMesh.position.y = -0.2 + scaleY * 2.05;
      foamMesh.visible = progress > 0.15;

      // Stream visibility & pulse
      streamMesh.visible = isPouring;
      if (isPouring) {
        streamMesh.scale.x = 1 + Math.sin(elapsed * 40) * 0.15;
        streamMesh.scale.z = 1 + Math.cos(elapsed * 40) * 0.15;
      }

      // Bubbles rise
      bubbles.forEach((b) => {
        b.mesh.position.y += b.speed;
        const maxLevel = -0.2 + scaleY * 2.0;
        if (b.mesh.position.y > maxLevel) {
          b.mesh.position.y = b.startY;
        }
      });

      // Ice float bobbing
      iceCubes.forEach((cube, i) => {
        cube.position.y += Math.sin(elapsed * 3 + i) * 0.002;
        cube.rotation.x += 0.003;
      });

      // Gentle rotation & drag
      glassGroup.rotation.y += (targetRotY - glassGroup.rotation.y) * 0.1;
      if (!isDragging) {
        targetRotY += 0.005; // Idle slow spin
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      stopFizzSound();
    };
  }, [pourProgress, isPouring, isDragging]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c0808] via-[#120708] to-[#0a0405] border border-red-900/40 p-5 shadow-2xl shadow-red-950/30 text-white mb-4"
    >
      {/* Background Coca-Cola Crimson Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex justify-between items-center relative z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg shadow-red-600/30 flex items-center gap-1 tracking-wider">
            <Sparkles size={11} /> Drinks Hero Experience
          </span>
          <span className="text-xs font-semibold text-red-200/70">3°C Sub-Zero</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) toast('Fizz sound enabled! Tap Pour.', { icon: '🔊' });
          }}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-red-200 transition-colors backdrop-blur-md"
          title="Toggle Carbonation Fizz Sound"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>

      {/* Title & Tagline */}
      <div className="relative z-10">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span>The Classic</span>
          <span className="text-red-500 drop-shadow-[0_2px_12px_rgba(239,68,68,0.5)]">Coca-Cola</span>
        </h2>
        <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
          Ice-cold, effervescent fizz poured over crystal ice with fresh citrus garnish.
        </p>
      </div>

      {/* 3D Interactive Canvas */}
      <div className="relative w-full h-[220px] my-1 cursor-grab active:cursor-grabbing flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full" />

        {/* Interactive Overlay Hints */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-[10px] text-gray-400 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg pointer-events-none border border-white/5">
          <Droplets size={11} className="text-red-400" />
          <span>Drag to spin 3D glass</span>
        </div>

        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[10px] font-black text-amber-300 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg pointer-events-none border border-white/5">
          <span>{Math.round(pourProgress * 100)}% Full</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 relative z-10 pt-2 border-t border-white/10">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">Serving Price</span>
          <span className="text-xl font-black text-white">{item.price.toLocaleString()}đ</span>
        </div>

        <div className="flex gap-2">
          {/* Pour Button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={isPouring}
            onClick={triggerPour}
            className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-lg ${
              isPouring
                ? 'bg-red-800 text-white cursor-wait animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md'
            }`}
          >
            <RotateCcw size={13} className={isPouring ? 'animate-spin' : ''} />
            <span>{isPouring ? 'Pouring...' : 'Pour Coke 🥤'}</span>
          </motion.button>

          {/* Quick Add To Cart */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              addToCart(item, 1, {});
              toast.success('Coca-Cola added to order! 🥤');
            }}
            className="px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-xl shadow-red-600/40 flex items-center gap-1.5 active:scale-95"
          >
            <ShoppingBag size={14} />
            <span>Add to Cart</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CokeHeroCard;
