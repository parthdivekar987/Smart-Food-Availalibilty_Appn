import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MenuItem } from '../../types';
import { RotateCw, Flame, Sparkles, Box, Eye, X } from 'lucide-react';

interface Dish3DViewerProps {
  item: MenuItem;
  onClose?: () => void;
  inline?: boolean;
}

export const Dish3DViewer: React.FC<Dish3DViewerProps> = ({ item, onClose, inline = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [steamEnabled, setSteamEnabled] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<'warm' | 'cool' | 'dramatic'>('warm');
  const materialsRef = useRef<THREE.Material[]>([]);
  const lightsRef = useRef<{ dirLight: THREE.DirectionalLight; rimLight: THREE.PointLight } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || (inline ? 260 : 380);

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181a20);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 5.5);
    camera.lookAt(0, 0.4, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.replaceChildren(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    dirLight.position.set(4, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xff9944, 2.0, 10);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    lightsRef.current = { dirLight, rimLight };

    // 5. Dish Presentation Base: Modern Ceramic Plate
    const plateGroup = new THREE.Group();
    scene.add(plateGroup);

    // Plate geometry
    const plateGeo = new THREE.CylinderGeometry(2.2, 1.6, 0.15, 64);
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x22262d,
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.075;
    plate.receiveShadow = true;
    plateGroup.add(plate);

    // Plate rim accent (Gold / Rose rim)
    const rimGeo = new THREE.TorusGeometry(2.18, 0.025, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.15;
    plateGroup.add(rim);

    // 6. Procedural Food Generation based on dish name/category
    const foodGroup = new THREE.Group();
    plateGroup.add(foodGroup);
    const itemMaterials: THREE.Material[] = [plateMat, rimMat];

    const itemName = (item.name || '').toLowerCase();
    const itemCat = (item.category?.name || '').toLowerCase();

    if (itemName.includes('burger') || itemCat.includes('burger')) {
      // 3D BURGER MODEL
      // Bottom Bun
      const bBunGeo = new THREE.CylinderGeometry(1.05, 0.95, 0.28, 32);
      const bunMat = new THREE.MeshStandardMaterial({ color: 0xcc843d, roughness: 0.6 });
      const bBun = new THREE.Mesh(bBunGeo, bunMat);
      bBun.position.y = 0.28;
      bBun.castShadow = true;
      foodGroup.add(bBun);
      itemMaterials.push(bunMat);

      // Patty
      const pattyGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.32, 32);
      const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3d2214, roughness: 0.85, bumpScale: 0.05 });
      const patty = new THREE.Mesh(pattyGeo, pattyMat);
      patty.position.y = 0.58;
      patty.castShadow = true;
      foodGroup.add(patty);
      itemMaterials.push(pattyMat);

      // Melted Cheese
      const cheeseGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
      const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.4 });
      const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
      cheese.rotation.y = Math.PI / 4;
      cheese.position.y = 0.76;
      cheese.castShadow = true;
      foodGroup.add(cheese);
      itemMaterials.push(cheeseMat);

      // Tomato Slices (2 slices)
      const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xdf2929, roughness: 0.3, clearcoat: 0.5 });
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.09, 24), tomatoMat);
      t1.position.set(-0.25, 0.84, 0.1);
      t1.rotation.z = 0.05;
      foodGroup.add(t1);

      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.09, 24), tomatoMat);
      t2.position.set(0.3, 0.85, -0.15);
      t2.rotation.z = -0.05;
      foodGroup.add(t2);
      itemMaterials.push(tomatoMat);

      // Lettuce leaf
      const lettuceGeo = new THREE.TorusGeometry(0.9, 0.2, 12, 32, Math.PI * 1.8);
      const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x48b63b, roughness: 0.5 });
      const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
      lettuce.rotation.x = Math.PI / 2;
      lettuce.position.y = 0.94;
      foodGroup.add(lettuce);
      itemMaterials.push(lettuceMat);

      // Top Bun (Dome)
      const tBunGeo = new THREE.SphereGeometry(1.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const tBun = new THREE.Mesh(tBunGeo, bunMat);
      tBun.position.y = 0.98;
      tBun.scale.set(1, 0.72, 1);
      tBun.castShadow = true;
      foodGroup.add(tBun);

      // Sesame seeds
      const seedGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const seedMat = new THREE.MeshStandardMaterial({ color: 0xfffaea, roughness: 0.3 });
      itemMaterials.push(seedMat);
      for (let i = 0; i < 28; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * 0.8;
        const r = 1.05;
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.set(
          r * Math.sin(theta) * Math.cos(phi),
          0.98 + (r * Math.cos(theta) * 0.72),
          r * Math.sin(theta) * Math.sin(phi)
        );
        foodGroup.add(seed);
      }
    } else if (itemName.includes('pizza') || itemCat.includes('pizza')) {
      // 3D ARTISANAL PIZZA
      const crustGeo = new THREE.CylinderGeometry(1.8, 1.85, 0.16, 48);
      const crustMat = new THREE.MeshStandardMaterial({ color: 0xd99b4e, roughness: 0.8 });
      const crust = new THREE.Mesh(crustGeo, crustMat);
      crust.position.y = 0.22;
      crust.castShadow = true;
      foodGroup.add(crust);
      itemMaterials.push(crustMat);

      // Cheese topping
      const cheeseGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.08, 48);
      const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xffd269, roughness: 0.45, clearcoat: 0.3 });
      const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
      cheese.position.y = 0.31;
      foodGroup.add(cheese);
      itemMaterials.push(cheeseMat);

      // Pepperoni slices
      const pepGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.03, 20);
      const pepMat = new THREE.MeshStandardMaterial({ color: 0xa8201a, roughness: 0.5 });
      itemMaterials.push(pepMat);
      const pepPositions = [
        [0, 0], [0.65, 0.5], [-0.7, 0.4], [0.55, -0.65], [-0.6, -0.55],
        [1.0, -0.1], [-1.05, -0.05], [0.1, 0.95], [-0.15, -1.0]
      ];
      pepPositions.forEach(([x, z]) => {
        const pep = new THREE.Mesh(pepGeo, pepMat);
        pep.position.set(x, 0.36, z);
        pep.rotation.y = Math.random() * Math.PI;
        foodGroup.add(pep);
      });

      // Basil leaves
      const basilGeo = new THREE.CylinderGeometry(0.12, 0.04, 0.02, 8);
      const basilMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });
      itemMaterials.push(basilMat);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const rad = 0.75;
        const b = new THREE.Mesh(basilGeo, basilMat);
        b.position.set(Math.cos(angle) * rad, 0.37, Math.sin(angle) * rad);
        b.rotation.set(0.1, Math.random() * Math.PI, 0.2);
        foodGroup.add(b);
      }
    } else if (itemName.includes('drink') || itemCat.includes('drink') || itemName.includes('cocktail') || itemName.includes('tea') || itemName.includes('coffee')) {
      // 3D COCKTAIL / BEVERAGE GLASS
      const glassGeo = new THREE.CylinderGeometry(0.68, 0.48, 1.8, 32, 1, true);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.9,
        ior: 1.5,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = 1.05;
      glass.castShadow = true;
      foodGroup.add(glass);
      itemMaterials.push(glassMat);

      // Glass base
      const baseGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.15, 32);
      const base = new THREE.Mesh(baseGeo, glassMat);
      base.position.y = 0.22;
      foodGroup.add(base);

      // Liquid
      const liquidGeo = new THREE.CylinderGeometry(0.64, 0.47, 1.4, 32);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: itemName.includes('coffee') ? 0x4a2711 : (itemName.includes('matcha') ? 0x588157 : 0xe85d04),
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const liquid = new THREE.Mesh(liquidGeo, liquidMat);
      liquid.position.y = 0.95;
      foodGroup.add(liquid);
      itemMaterials.push(liquidMat);

      // Ice cubes (3 cubes)
      const iceGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        transmission: 0.8,
      });
      itemMaterials.push(iceMat);
      [[-0.15, 1.35, 0.1], [0.12, 1.45, -0.1], [0, 1.25, 0]].forEach(([x, y, z]) => {
        const ice = new THREE.Mesh(iceGeo, iceMat);
        ice.position.set(x, y, z);
        ice.rotation.set(0.3, 0.5, 0.2);
        foodGroup.add(ice);
      });

      // Straw
      const strawGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16);
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const straw = new THREE.Mesh(strawGeo, strawMat);
      straw.position.set(0.2, 1.4, 0.2);
      straw.rotation.z = -0.25;
      foodGroup.add(straw);
      itemMaterials.push(strawMat);
    } else if (itemName.includes('sushi') || itemCat.includes('sushi') || itemName.includes('roll')) {
      // 3D SUSHI NIGIRI & ROLLS
      // Slate plate
      plate.scale.set(1.2, 0.8, 0.8);
      
      const riceMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.85 });
      const salmonMat = new THREE.MeshPhysicalMaterial({ color: 0xfa6e43, roughness: 0.35, clearcoat: 0.6 });
      const tunaMat = new THREE.MeshPhysicalMaterial({ color: 0x9e1a2a, roughness: 0.35, clearcoat: 0.6 });
      itemMaterials.push(riceMat, salmonMat, tunaMat);

      // 3 Nigiri pieces
      const nigiriData = [
        { x: -0.8, mat: salmonMat },
        { x: 0, mat: tunaMat },
        { x: 0.8, mat: salmonMat }
      ];

      nigiriData.forEach(({ x, mat }) => {
        const riceGeo = new THREE.CapsuleGeometry(0.24, 0.48, 8, 16);
        const rice = new THREE.Mesh(riceGeo, riceMat);
        rice.rotation.z = Math.PI / 2;
        rice.position.set(x, 0.32, 0);
        rice.scale.set(1, 1, 0.7);
        rice.castShadow = true;
        foodGroup.add(rice);

        const fishGeo = new THREE.CapsuleGeometry(0.25, 0.58, 8, 16);
        const fish = new THREE.Mesh(fishGeo, mat);
        fish.rotation.z = Math.PI / 2;
        fish.position.set(x, 0.45, 0);
        fish.scale.set(1, 1, 0.75);
        fish.castShadow = true;
        foodGroup.add(fish);

        // Nori belt
        const noriGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 24);
        const noriMat = new THREE.MeshStandardMaterial({ color: 0x162016, roughness: 0.9 });
        const nori = new THREE.Mesh(noriGeo, noriMat);
        nori.position.set(x, 0.38, 0);
        nori.rotation.x = Math.PI / 2;
        foodGroup.add(nori);
      });

      // Wasabi quenelle
      const wasabiGeo = new THREE.ConeGeometry(0.2, 0.28, 16);
      const wasabiMat = new THREE.MeshStandardMaterial({ color: 0x70a340, roughness: 0.7 });
      const wasabi = new THREE.Mesh(wasabiGeo, wasabiMat);
      wasabi.position.set(-1.3, 0.28, -0.6);
      foodGroup.add(wasabi);
      itemMaterials.push(wasabiMat);
    } else {
      // 3D GOURMET STEAK & VEGETABLES (Default Fine Dining Platter)
      const steakGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.3, 32);
      const steakMat = new THREE.MeshStandardMaterial({
        color: 0x4a2818,
        roughness: 0.75,
        bumpScale: 0.08,
      });
      const steak = new THREE.Mesh(steakGeo, steakMat);
      steak.scale.set(1.3, 1, 0.9);
      steak.position.set(-0.2, 0.3, 0);
      steak.castShadow = true;
      foodGroup.add(steak);
      itemMaterials.push(steakMat);

      // Herb butter medallion
      const butterGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16);
      const butterMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
      const butter = new THREE.Mesh(butterGeo, butterMat);
      butter.position.set(-0.15, 0.48, 0);
      foodGroup.add(butter);
      itemMaterials.push(butterMat);

      // Roasted Asparagus stalks (3 spears)
      const aspGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.4, 12);
      const aspMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.6 });
      itemMaterials.push(aspMat);
      [-0.1, 0, 0.1].forEach((offset, idx) => {
        const spear = new THREE.Mesh(aspGeo, aspMat);
        spear.rotation.z = Math.PI / 2 - 0.2;
        spear.position.set(0.6 + offset, 0.25, -0.2 + (idx * 0.18));
        foodGroup.add(spear);
      });

      // Cherry tomatoes (2 roasted tomatoes)
      const tomGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const tomMat = new THREE.MeshPhysicalMaterial({ color: 0xd92626, roughness: 0.3, clearcoat: 0.6 });
      itemMaterials.push(tomMat);
      [[0.7, 0.34, 0.4], [0.95, 0.32, 0.15]].forEach(([x, y, z]) => {
        const t = new THREE.Mesh(tomGeo, tomMat);
        t.position.set(x, y, z);
        t.castShadow = true;
        foodGroup.add(t);
      });
    }

    materialsRef.current = itemMaterials;

    // 7. Dynamic Steam Particle System
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleAlphas = new Float32Array(particleCount);
    const particleVelocities: { y: number; drift: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 1.0;
      particlePositions[i * 3 + 1] = 0.6 + Math.random() * 1.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
      particleAlphas[i] = Math.random();
      particleVelocities.push({
        y: 0.012 + Math.random() * 0.015,
        drift: (Math.random() - 0.5) * 0.006,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,0.7)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.45,
      map: texture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const steamParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(steamParticles);

    // 8. Interaction Handling: Touch & Mouse Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;
    let touchDistance = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rotationVelocityY = deltaX * 0.008;
      rotationVelocityX = deltaY * 0.008;

      plateGroup.rotation.y += rotationVelocityY;
      camera.position.y = THREE.MathUtils.clamp(camera.position.y + deltaY * 0.01, 1.5, 6.0);
      camera.lookAt(0, 0.4, 0);
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    // Touch pinch to zoom on Android
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (touchDistance > 0) {
          const delta = (touchDistance - dist) * 0.015;
          camera.position.z = THREE.MathUtils.clamp(camera.position.z + delta, 3.0, 8.0);
        }
        touchDistance = dist;
      }
    };

    const handleTouchEnd = () => {
      touchDistance = 0;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    domElement.addEventListener('touchend', handleTouchEnd);

    // 9. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Auto rotation
      if (isRotating && !isDragging) {
        plateGroup.rotation.y += delta * 0.45;
      } else if (!isDragging) {
        // Inertia damping
        plateGroup.rotation.y += rotationVelocityY;
        rotationVelocityY *= 0.94;
        rotationVelocityX *= 0.94;
      }

      // Steam animation
      if (steamEnabled) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += particleVelocities[i].y;
          positions[i * 3] += particleVelocities[i].drift;

          // Reset particle if it drifts above 3 units
          if (positions[i * 3 + 1] > 2.8) {
            positions[i * 3 + 1] = 0.5;
            positions[i * 3] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
        steamParticles.visible = true;
      } else {
        steamParticles.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || (inline ? 260 : 380);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [item, isRotating, steamEnabled, inline]);

  // Handle wireframe toggle
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      (mat as any).wireframe = isWireframe;
    });
  }, [isWireframe]);

  // Handle lighting preset changes
  useEffect(() => {
    if (!lightsRef.current) return;
    const { dirLight, rimLight } = lightsRef.current;
    if (lightingPreset === 'warm') {
      dirLight.color.setHex(0xffeedd);
      rimLight.color.setHex(0xff8833);
      dirLight.intensity = 1.8;
    } else if (lightingPreset === 'cool') {
      dirLight.color.setHex(0xe0f2fe);
      rimLight.color.setHex(0x38bdf8);
      dirLight.intensity = 2.0;
    } else {
      dirLight.color.setHex(0xff5533);
      rimLight.color.setHex(0x9333ea);
      dirLight.intensity = 2.5;
    }
  }, [lightingPreset]);

  return (
    <div className={`relative flex flex-col items-center select-none ${inline ? 'w-full h-full' : 'w-full'}`}>
      {/* 3D Canvas Mounting Point */}
      <div
        ref={mountRef}
        className={`w-full relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing ${
          inline ? 'h-[260px]' : 'h-[360px] sm:h-[400px]'
        } bg-gradient-to-b from-[#181a20] via-[#121419] to-[#0c0d11] shadow-inner`}
      />

      {/* Floating 3D Badge & Instructions */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 bg-orange-600/90 backdrop-blur-md text-white text-[11px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-900/30">
          <Sparkles size={12} className="text-yellow-300 animate-spin" />
          Interactive 3D Dish
        </span>
        <span className="hidden sm:inline-block px-2 py-1 bg-black/50 backdrop-blur-sm text-gray-300 text-[10px] rounded-md font-medium">
          Drag to Rotate • Pinch to Zoom
        </span>
      </div>

      {/* Close button if modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all active:scale-95"
          title="Exit 3D View"
        >
          <X size={18} />
        </button>
      )}

      {/* Mobile-Friendly Control Toolbar */}
      <div className="w-full flex items-center justify-between px-3 py-2 mt-2 bg-gray-900/90 backdrop-blur-md rounded-xl text-white text-xs gap-2 border border-gray-800">
        {/* Turntable Auto Spin */}
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
            isRotating ? 'bg-orange-500 text-white font-bold' : 'bg-gray-800/80 text-gray-300 hover:text-white'
          }`}
          title="Toggle Turntable Rotation"
        >
          <RotateCw size={13} className={isRotating ? 'animate-spin' : ''} />
          <span>{isRotating ? 'Spinning' : 'Paused'}</span>
        </button>

        {/* Steam Simulation */}
        <button
          onClick={() => setSteamEnabled(!steamEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
            steamEnabled ? 'bg-amber-600 text-white font-bold' : 'bg-gray-800/80 text-gray-400'
          }`}
          title="Toggle Rising Steam"
        >
          <Flame size={13} />
          <span>Steam</span>
        </button>

        {/* Wireframe toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
            isWireframe ? 'bg-cyan-600 text-white font-bold' : 'bg-gray-800/80 text-gray-400'
          }`}
          title="Toggle 3D Wireframe Inspection"
        >
          <Box size={13} />
          <span>Wire</span>
        </button>

        {/* Lighting Mode Selector */}
        <div className="flex items-center gap-1 bg-gray-800/90 p-0.5 rounded-lg">
          <button
            onClick={() => setLightingPreset('warm')}
            className={`px-2 py-1 rounded text-[10px] font-bold ${
              lightingPreset === 'warm' ? 'bg-orange-500 text-white' : 'text-gray-400'
            }`}
          >
            Warm
          </button>
          <button
            onClick={() => setLightingPreset('cool')}
            className={`px-2 py-1 rounded text-[10px] font-bold ${
              lightingPreset === 'cool' ? 'bg-blue-500 text-white' : 'text-gray-400'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setLightingPreset('dramatic')}
            className={`px-2 py-1 rounded text-[10px] font-bold ${
              lightingPreset === 'dramatic' ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            Neon
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dish3DViewer;
