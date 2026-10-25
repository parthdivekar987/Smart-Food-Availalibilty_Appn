import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MenuItem } from '../../types';
import { RotateCw, Flame, Sparkles, Box, Eye, X, Camera, Image as ImageIcon } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photoUrl';

interface Dish3DViewerProps {
  item: MenuItem;
  onClose?: () => void;
  inline?: boolean;
}

export const Dish3DViewer: React.FC<Dish3DViewerProps> = ({ item, onClose, inline = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Extract real photo URL if available
  const rawPhoto = item.photos?.find(p => p.isPrimary)?.url || item.photos?.[0]?.url;
  const photoUrl = getPhotoUrl(rawPhoto);

  const [displayMode, setDisplayMode] = useState<'photo' | 'model'>(photoUrl ? 'photo' : 'model');
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

    if (displayMode === 'photo' && photoUrl) {
      // 3D REAL DISH PHOTO PRESENTATION (Actual food image rotating in 3D with luxury turntable platter)
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');

      const photoTexture = textureLoader.load(photoUrl);
      photoTexture.colorSpace = THREE.SRGBColorSpace;
      photoTexture.generateMipmaps = true;
      photoTexture.minFilter = THREE.LinearMipmapLinearFilter;

      // Outer gold bevel accent on plate
      const goldBevelGeo = new THREE.TorusGeometry(1.9, 0.04, 16, 64);
      const goldBevelMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.92,
        roughness: 0.15,
      });
      const goldBevel = new THREE.Mesh(goldBevelGeo, goldBevelMat);
      goldBevel.rotation.x = Math.PI / 2;
      goldBevel.position.y = 0.16;
      foodGroup.add(goldBevel);
      itemMaterials.push(goldBevelMat);

      // Elevated turntable food disc with the actual dish photograph
      const discRadius = 1.75;
      const discHeight = 0.12;
      const discGeo = new THREE.CylinderGeometry(discRadius, discRadius * 0.95, discHeight, 64);

      // Cylinder materials: [0: sides, 1: top photo, 2: bottom]
      const discSideMat = new THREE.MeshStandardMaterial({
        color: 0xc49b38,
        metalness: 0.85,
        roughness: 0.25,
      });

      const photoTopMat = new THREE.MeshPhysicalMaterial({
        map: photoTexture,
        roughness: 0.15,
        metalness: 0.02,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
        reflectivity: 0.85,
      });

      const discBottomMat = new THREE.MeshStandardMaterial({
        color: 0x181a20,
        roughness: 0.6,
      });

      const photoDisc = new THREE.Mesh(discGeo, [discSideMat, photoTopMat, discBottomMat]);
      photoDisc.position.y = 0.22;
      photoDisc.castShadow = true;
      photoDisc.receiveShadow = true;
      foodGroup.add(photoDisc);
      itemMaterials.push(discSideMat, photoTopMat, discBottomMat);

      // Warm amber under-glow ring beneath the platter
      const glowRingGeo = new THREE.TorusGeometry(1.6, 0.025, 16, 64);
      const glowRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
      });
      const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.y = 0.155;
      foodGroup.add(glowRing);

      // Subtle curved gourmet protective glass dome
      const glassDomeGeo = new THREE.SphereGeometry(discRadius * 0.99, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.12);
      const glassDomeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.05,
        transmission: 0.92,
        ior: 1.48,
        clearcoat: 1.0,
      });
      const glassDome = new THREE.Mesh(glassDomeGeo, glassDomeMat);
      glassDome.position.y = 0.25;
      foodGroup.add(glassDome);
      itemMaterials.push(glassDomeMat);

    } else if (itemName.includes('burger') || itemCat.includes('burger')) {
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
    } else if (itemName.includes('biryani') || itemName.includes('rice') || itemName.includes('pulao')) {
      // 3D DUM BIRYANI - Iconic layered rice
      // Handi / Deg base
      const handiGeo = new THREE.CylinderGeometry(1.4, 1.0, 1.1, 32);
      const handiMat = new THREE.MeshPhysicalMaterial({ color: 0x8B4513, roughness: 0.6, metalness: 0.15 });
      const handi = new THREE.Mesh(handiGeo, handiMat);
      handi.position.y = 0.75;
      handi.castShadow = true;
      foodGroup.add(handi);
      itemMaterials.push(handiMat);

      // Saffron rice mound
      const riceMoundGeo = new THREE.SphereGeometry(1.38, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const riceMat = new THREE.MeshStandardMaterial({ color: 0xF5A623, roughness: 0.9 });
      const riceMound = new THREE.Mesh(riceMoundGeo, riceMat);
      riceMound.position.y = 1.32;
      riceMound.scale.set(1, 0.55, 1);
      foodGroup.add(riceMound);
      itemMaterials.push(riceMat);

      // Dark saffron streaks on top
      const streakMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.7 });
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const streakGeo = new THREE.SphereGeometry(0.22, 8, 6);
        const streak = new THREE.Mesh(streakGeo, streakMat);
        streak.position.set(Math.cos(angle) * 0.7, 1.52, Math.sin(angle) * 0.7);
        streak.scale.set(1.2, 0.3, 0.8);
        foodGroup.add(streak);
      }
      itemMaterials.push(streakMat);

      // Fried onion garnish (golden rings)
      const onionMat = new THREE.MeshStandardMaterial({ color: 0xD4A017, roughness: 0.5 });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.4;
        const onionGeo = new THREE.TorusGeometry(0.14, 0.04, 6, 16);
        const onion = new THREE.Mesh(onionGeo, onionMat);
        onion.position.set(Math.cos(angle) * 0.55, 1.57, Math.sin(angle) * 0.55);
        onion.rotation.x = 0.8;
        foodGroup.add(onion);
      }
      itemMaterials.push(onionMat);

      // Mint leaves
      const mintMat = new THREE.MeshStandardMaterial({ color: 0x2ECC71, roughness: 0.6 });
      const mintGeo = new THREE.CylinderGeometry(0.1, 0.05, 0.04, 8);
      [[0.3, 1.6, 0.3], [-0.4, 1.61, 0.1], [0.1, 1.62, -0.5]].forEach(([x, y, z]) => {
        const m = new THREE.Mesh(mintGeo, mintMat);
        m.position.set(x, y, z);
        foodGroup.add(m);
      });
      itemMaterials.push(mintMat);

    } else if (itemName.includes('curry') || itemName.includes('masala') || itemName.includes('gravy') || itemName.includes('paneer') || itemName.includes('chicken') || itemName.includes('dal') || itemName.includes('sabzi') || itemCat.includes('curry')) {
      // 3D INDIAN CURRY / KARAHI
      // Karahi bowl
      const karGeo = new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const karMat = new THREE.MeshPhysicalMaterial({ color: 0x2C2C2C, metalness: 0.7, roughness: 0.3, clearcoat: 0.4 });
      const karahi = new THREE.Mesh(karGeo, karMat);
      karahi.position.y = 0.55;
      karahi.rotation.x = Math.PI;
      karahi.scale.set(1, 0.6, 1);
      karahi.castShadow = true;
      foodGroup.add(karahi);
      itemMaterials.push(karMat);

      // Curry sauce
      const sauceGeo = new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
      const sauceMat = new THREE.MeshPhysicalMaterial({ color: 0xCC4400, roughness: 0.3, clearcoat: 0.5 });
      const sauce = new THREE.Mesh(sauceGeo, sauceMat);
      sauce.position.y = 0.58;
      sauce.rotation.x = Math.PI;
      sauce.scale.set(1, 0.55, 1);
      foodGroup.add(sauce);
      itemMaterials.push(sauceMat);

      // Paneer/meat cubes
      const cubeMat = new THREE.MeshStandardMaterial({ color: itemName.includes('paneer') ? 0xFFF8E7 : 0x8B2500, roughness: 0.6 });
      itemMaterials.push(cubeMat);
      [[0.3, 0.72, 0.2], [-0.25, 0.74, -0.3], [0.5, 0.71, -0.4], [-0.5, 0.7, 0.4]].forEach(([x, y, z]) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), cubeMat);
        c.position.set(x, y, z);
        c.rotation.set(0.1, Math.random() * 0.6, 0.1);
        c.castShadow = true;
        foodGroup.add(c);
      });

      // Cream swirl on top
      const creamGeo = new THREE.TorusGeometry(0.45, 0.07, 8, 24, Math.PI * 1.4);
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.4 });
      const cream = new THREE.Mesh(creamGeo, creamMat);
      cream.position.y = 0.8;
      cream.rotation.x = -Math.PI / 2;
      foodGroup.add(cream);
      itemMaterials.push(creamMat);

      // Cilantro
      const coriMat = new THREE.MeshStandardMaterial({ color: 0x27AE60, roughness: 0.7 });
      [[0, 0.82, 0.2], [0.3, 0.8, -0.1]].forEach(([x, y, z]) => {
        const coriGeo = new THREE.SphereGeometry(0.1, 8, 6);
        const c = new THREE.Mesh(coriGeo, coriMat);
        c.position.set(x, y, z);
        c.scale.set(1.5, 0.3, 1);
        foodGroup.add(c);
      });
      itemMaterials.push(coriMat);

    } else if (itemName.includes('naan') || itemName.includes('roti') || itemName.includes('paratha') || itemName.includes('chapati') || itemName.includes('bread') || itemCat.includes('bread')) {
      // 3D NAAN / ROTI - flatbread with char marks
      // Flatbread
      const nBlobs: number[] = [];
      const nBlobCount = 40;
      const nBase = new THREE.BufferGeometry();
      const nPositions = new Float32Array(nBlobCount * 3);
      for (let i = 0; i < nBlobCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * 1.55;
        nPositions[i * 3] = Math.cos(theta) * r;
        nPositions[i * 3 + 1] = 0.18 + Math.random() * 0.08;
        nPositions[i * 3 + 2] = Math.sin(theta) * r * 0.7;
      }
      nBase.setAttribute('position', new THREE.BufferAttribute(nPositions, 3));

      // Naan body
      const naanGeo = new THREE.CylinderGeometry(1.7, 1.72, 0.14, 32);
      const naanMat = new THREE.MeshStandardMaterial({ color: 0xD4974A, roughness: 0.85 });
      const naan = new THREE.Mesh(naanGeo, naanMat);
      naan.position.y = 0.18;
      naan.scale.set(1, 1, 0.65);
      naan.castShadow = true;
      foodGroup.add(naan);
      itemMaterials.push(naanMat);

      // Char spots (brown marks from tandoor)
      const charMat = new THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.9 });
      itemMaterials.push(charMat);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        const rad = 0.5 + Math.random() * 0.8;
        const charGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.09, 8, 6);
        const c = new THREE.Mesh(charGeo, charMat);
        c.position.set(Math.cos(angle) * rad, 0.27, Math.sin(angle) * rad * 0.65);
        c.scale.set(1.2, 0.2, 0.9);
        foodGroup.add(c);
      }

      // Butter / ghee on top (golden sheen)
      const butterGeo2 = new THREE.SphereGeometry(0.6, 16, 8);
      const butterMat2 = new THREE.MeshPhysicalMaterial({ color: 0xFFE766, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.7 });
      const butter2 = new THREE.Mesh(butterGeo2, butterMat2);
      butter2.position.set(-0.2, 0.27, 0);
      butter2.scale.set(1.2, 0.12, 0.9);
      foodGroup.add(butter2);
      itemMaterials.push(butterMat2);

    } else if (itemName.includes('kathi') || itemName.includes('roll') || itemName.includes('wrap') || itemCat.includes('roll')) {
      // 3D KATHI ROLL - wrapped street food
      // Main roll body
      const rollGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.8, 20);
      const rollMat = new THREE.MeshStandardMaterial({ color: 0xD4974A, roughness: 0.8 });
      const roll = new THREE.Mesh(rollGeo, rollMat);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(0, 0.65, 0);
      roll.scale.set(1, 1, 0.95);
      roll.castShadow = true;
      foodGroup.add(roll);
      itemMaterials.push(rollMat);

      // Char lines on flatbread
      const charM = new THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.9 });
      itemMaterials.push(charM);
      [-0.5, 0, 0.5].forEach((z) => {
        const lineGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.82, 6);
        const line = new THREE.Mesh(lineGeo, charM);
        line.rotation.z = Math.PI / 2;
        line.position.set(0, 0.65 + z * 0.25, z * 0.3);
        foodGroup.add(line);
      });

      // Filling visible at ends - colorful vegetables
      const fillingColors = [0xFF4500, 0xFFD700, 0x32CD32];
      fillingColors.forEach((color, i) => {
        const fGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.18, 16);
        const fMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const filling = new THREE.Mesh(fGeo, fMat);
        filling.rotation.z = Math.PI / 2;
        filling.position.set(-1.38, 0.65, (i - 1) * 0.15);
        foodGroup.add(filling);
        itemMaterials.push(fMat);
      });

      // Paper wrap around middle
      const paperGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.0, 20, 1, true);
      const paperMat = new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.9, side: THREE.DoubleSide });
      const paper = new THREE.Mesh(paperGeo, paperMat);
      paper.rotation.z = Math.PI / 2;
      paper.position.set(0.2, 0.65, 0);
      foodGroup.add(paper);
      itemMaterials.push(paperMat);

    } else if (itemName.includes('coke') || itemName.includes('cola') || itemName.includes('pepsi') || itemName.includes('soft drink') || itemName.includes('soda')) {
      // 3D ICONIC COKE CAN with animated pour effect
      // Can body
      const canGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.0, 32);
      const canMat = new THREE.MeshPhysicalMaterial({ color: 0xCC0000, roughness: 0.3, metalness: 0.85, clearcoat: 0.5 });
      const can = new THREE.Mesh(canGeo, canMat);
      can.position.y = 1.15;
      can.castShadow = true;
      foodGroup.add(can);
      itemMaterials.push(canMat);

      // Can top
      const canTopGeo = new THREE.CylinderGeometry(0.58, 0.65, 0.1, 32);
      const canTop = new THREE.Mesh(canTopGeo, canMat);
      canTop.position.y = 2.2;
      foodGroup.add(canTop);

      // Pull tab
      const tabGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI);
      const tabMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.9, roughness: 0.2 });
      const tab = new THREE.Mesh(tabGeo, tabMat);
      tab.position.set(0.2, 2.3, 0);
      tab.rotation.x = -0.3;
      foodGroup.add(tab);
      itemMaterials.push(tabMat);

      // White logo stripe band
      const bandGeo = new THREE.CylinderGeometry(0.67, 0.67, 0.5, 32, 1, true);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 1.1;
      foodGroup.add(band);
      itemMaterials.push(bandMat);

      // Bubbles rising (cola carbonation)
      const bubbleMat = new THREE.MeshPhysicalMaterial({ color: 0xCCEEFF, transparent: true, opacity: 0.5, roughness: 0.05, transmission: 0.8 });
      itemMaterials.push(bubbleMat);
      for (let i = 0; i < 12; i++) {
        const r = 0.3 + Math.random() * 0.2;
        const angle = Math.random() * Math.PI * 2;
        const bGeo = new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 8, 8);
        const b = new THREE.Mesh(bGeo, bubbleMat);
        b.position.set(Math.cos(angle) * r, 0.18 + Math.random() * 0.4, Math.sin(angle) * r);
        foodGroup.add(b);
      }

    } else if (itemName.includes('lassi') || itemName.includes('chaas') || itemName.includes('buttermilk') || itemName.includes('milkshake') || itemName.includes('shake')) {
      // 3D LASSI / MILKSHAKE in clay kulhar
      const kulharGeo = new THREE.CylinderGeometry(0.9, 0.68, 1.4, 32);
      const kulharMat = new THREE.MeshStandardMaterial({ color: 0xC4825A, roughness: 0.85 });
      const kulhar = new THREE.Mesh(kulharGeo, kulharMat);
      kulhar.position.y = 0.85;
      kulhar.castShadow = true;
      foodGroup.add(kulhar);
      itemMaterials.push(kulharMat);

      // Lassi liquid
      const lassiMat = new THREE.MeshPhysicalMaterial({ 
        color: itemName.includes('mango') ? 0xFFB347 : (itemName.includes('rose') ? 0xFFB6C1 : 0xFFF8DC), 
        roughness: 0.2, clearcoat: 0.4, transparent: true, opacity: 0.9 
      });
      const lassiGeo = new THREE.CylinderGeometry(0.84, 0.63, 1.1, 32);
      const lassi = new THREE.Mesh(lassiGeo, lassiMat);
      lassi.position.y = 0.85;
      foodGroup.add(lassi);
      itemMaterials.push(lassiMat);

      // Cream / froth on top
      const frothGeo = new THREE.SphereGeometry(0.88, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4);
      const frothMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF0, roughness: 0.6 });
      const froth = new THREE.Mesh(frothGeo, frothMat);
      froth.position.y = 1.55;
      froth.rotation.x = Math.PI;
      froth.scale.set(1, 0.4, 1);
      foodGroup.add(froth);
      itemMaterials.push(frothMat);

      // Rose petal garnish
      const petalMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.5 });
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const pGeo = new THREE.SphereGeometry(0.1, 8, 6);
        const p = new THREE.Mesh(pGeo, petalMat);
        p.position.set(Math.cos(angle) * 0.5, 1.62, Math.sin(angle) * 0.5);
        p.scale.set(1.2, 0.2, 0.8);
        foodGroup.add(p);
      }
      itemMaterials.push(petalMat);

    } else if (itemName.includes('drink') || itemCat.includes('drink') || itemName.includes('cocktail') || itemName.includes('tea') || itemName.includes('coffee') || itemName.includes('juice') || itemName.includes('water') || itemCat.includes('beverage')) {
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
    } else if (itemName.includes('starter') || itemName.includes('chaat') || itemName.includes('samosa') || itemName.includes('tikka') || itemName.includes('kebab') || itemCat.includes('starter') || itemCat.includes('chaat')) {
      // 3D SAMOSA / STARTER - triangular pastry
      const samosaMat = new THREE.MeshStandardMaterial({ color: 0xD4974A, roughness: 0.7 });
      itemMaterials.push(samosaMat);
      
      // 3 samosa triangles
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const coneGeo = new THREE.ConeGeometry(0.6, 1.0, 3);
        const samosa = new THREE.Mesh(coneGeo, samosaMat);
        samosa.position.set(Math.cos(angle) * 0.7, 0.5, Math.sin(angle) * 0.7);
        samosa.rotation.y = angle + Math.PI / 6;
        samosa.rotation.z = 0.5;
        samosa.castShadow = true;
        foodGroup.add(samosa);
      }

      // Green chutney pool
      const chutneyGeo = new THREE.CylinderGeometry(1.8, 1.85, 0.06, 32);
      const chutneyMat = new THREE.MeshPhysicalMaterial({ color: 0x228B22, roughness: 0.25, clearcoat: 0.6 });
      const chutney = new THREE.Mesh(chutneyGeo, chutneyMat);
      chutney.position.y = 0.25;
      foodGroup.add(chutney);
      itemMaterials.push(chutneyMat);

      // Tamarind drizzle
      const tamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
      const tamMat = new THREE.MeshStandardMaterial({ color: 0x6B2B00, roughness: 0.5 });
      [[0.3, 0.48, -0.5], [-0.5, 0.46, 0.3]].forEach(([x, y, z]) => {
        const t = new THREE.Mesh(tamGeo, tamMat);
        t.position.set(x, y, z);
        t.rotation.set(0.4, Math.random(), 0.2);
        foodGroup.add(t);
      });
      itemMaterials.push(tamMat);

    } else if (itemName.includes('rasmalai') || itemName.includes('ras malai')) {
      // 3D CHILLED RASMALAI - Porcelain bowl with chilled saffron cream & soft white patties
      const bowlGeo = new THREE.SphereGeometry(1.4, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const bowlMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.2, metalness: 0.1 });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.rotation.x = Math.PI;
      bowl.position.y = 0.62;
      bowl.scale.set(1, 0.5, 1);
      bowl.castShadow = true;
      foodGroup.add(bowl);
      itemMaterials.push(bowlMat);

      // Golden saffron milk (Rabdi)
      const saffronMat = new THREE.MeshPhysicalMaterial({ color: 0xFFD24C, roughness: 0.15, clearcoat: 0.8, transparent: true, opacity: 0.9 });
      const saffronGeo = new THREE.SphereGeometry(1.32, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
      const saffron = new THREE.Mesh(saffronGeo, saffronMat);
      saffron.rotation.x = Math.PI;
      saffron.position.y = 0.64;
      saffron.scale.set(1, 0.47, 1);
      foodGroup.add(saffron);
      itemMaterials.push(saffronMat);

      // Soft white Rasmalai patties (flattened disks)
      const rasmalaiMat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFF2, roughness: 0.5, clearcoat: 0.3 });
      itemMaterials.push(rasmalaiMat);
      [[-0.35, 0.76, 0.1], [0.35, 0.77, -0.1]].forEach(([x, y, z]) => {
        const rGeo = new THREE.CylinderGeometry(0.55, 0.52, 0.22, 24);
        const rPatty = new THREE.Mesh(rGeo, rasmalaiMat);
        rPatty.position.set(x, y, z);
        rPatty.rotation.set(0.1, Math.random(), 0.05);
        rPatty.castShadow = true;
        foodGroup.add(rPatty);
      });

      // Saffron strands & pistachio flakes
      const pistachioMat = new THREE.MeshStandardMaterial({ color: 0x76B947, roughness: 0.4 });
      const saffronStrandMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.3 });
      itemMaterials.push(pistachioMat, saffronStrandMat);
      for (let i = 0; i < 6; i++) {
        const flake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.08), pistachioMat);
        flake.position.set((Math.random() - 0.5) * 0.8, 0.88, (Math.random() - 0.5) * 0.8);
        foodGroup.add(flake);
      }

    } else if (itemName.includes('dessert') || itemName.includes('gulab') || itemName.includes('kheer') || itemName.includes('halwa') || itemName.includes('barfi') || itemName.includes('ladoo') || itemName.includes('ice cream') || itemCat.includes('dessert')) {
      // 3D INDIAN DESSERT - Gulab Jamun in a bowl
      const bowlGeo = new THREE.SphereGeometry(1.4, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const bowlMat = new THREE.MeshStandardMaterial({ color: 0xF0E6D3, roughness: 0.4 });
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.rotation.x = Math.PI;
      bowl.position.y = 0.62;
      bowl.scale.set(1, 0.5, 1);
      bowl.castShadow = true;
      foodGroup.add(bowl);
      itemMaterials.push(bowlMat);

      // Sugar syrup
      const syrupMat = new THREE.MeshPhysicalMaterial({ color: 0xAA6600, roughness: 0.15, clearcoat: 0.7, transparent: true, opacity: 0.85 });
      const syrupGeo = new THREE.SphereGeometry(1.3, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
      const syrup = new THREE.Mesh(syrupGeo, syrupMat);
      syrup.rotation.x = Math.PI;
      syrup.position.y = 0.64;
      syrup.scale.set(1, 0.47, 1);
      foodGroup.add(syrup);
      itemMaterials.push(syrupMat);

      // Gulab Jamun balls
      const gjMat = new THREE.MeshPhysicalMaterial({ color: 0x7B3F00, roughness: 0.45, clearcoat: 0.5 });
      itemMaterials.push(gjMat);
      [[0, 0.78, 0], [0.55, 0.7, 0.4], [-0.5, 0.72, -0.35], [0.4, 0.72, -0.5]].forEach(([x, y, z]) => {
        const gjGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const gj = new THREE.Mesh(gjGeo, gjMat);
        gj.position.set(x, y, z);
        gj.castShadow = true;
        foodGroup.add(gj);
      });

      // Rose petal garnish
      const petalMat2 = new THREE.MeshStandardMaterial({ color: 0xFF9999, roughness: 0.5 });
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const pGeo = new THREE.SphereGeometry(0.09, 8, 6);
        const p = new THREE.Mesh(pGeo, petalMat2);
        p.position.set(Math.cos(angle) * 0.4, 0.98, Math.sin(angle) * 0.4);
        p.scale.set(1.3, 0.2, 0.9);
        foodGroup.add(p);
      }
      itemMaterials.push(petalMat2);

    } else {
      // 3D DEFAULT INDIAN THALI PLATTER
      // Large thali plate
      const thaliGeo = new THREE.CylinderGeometry(2.0, 1.9, 0.1, 40);
      const thaliMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.7, roughness: 0.3 });
      const thali = new THREE.Mesh(thaliGeo, thaliMat);
      thali.position.y = 0.22;
      thali.castShadow = true;
      foodGroup.add(thali);
      itemMaterials.push(thaliMat);

      // Small katoris (bowls) around the plate
      const katoriGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const katoriMat = new THREE.MeshStandardMaterial({ color: 0xD0D0D0, metalness: 0.6, roughness: 0.4 });
      const katoriColors = [0xCC4400, 0xFFD700, 0x228B22, 0xF5A623, 0xB22222];
      itemMaterials.push(katoriMat);
      katoriColors.forEach((color, i) => {
        const angle = (i / katoriColors.length) * Math.PI * 2;
        const rad = 1.3;
        const katori = new THREE.Mesh(katoriGeo, katoriMat);
        katori.rotation.x = Math.PI;
        katori.position.set(Math.cos(angle) * rad, 0.32, Math.sin(angle) * rad);
        katori.scale.set(1, 0.5, 1);
        foodGroup.add(katori);

        // Fill each katori with food
        const fillMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
        const fillGeo = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const fill = new THREE.Mesh(fillGeo, fillMat);
        fill.rotation.x = Math.PI;
        fill.position.set(Math.cos(angle) * rad, 0.37, Math.sin(angle) * rad);
        fill.scale.set(1, 0.38, 1);
        foodGroup.add(fill);
        itemMaterials.push(fillMat);
      });

      // Rice mound in center
      const riceGeo2 = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const riceMat2 = new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.85 });
      const riceCenter = new THREE.Mesh(riceGeo2, riceMat2);
      riceCenter.rotation.x = Math.PI;
      riceCenter.position.y = 0.4;
      riceCenter.scale.set(1, 0.6, 1);
      foodGroup.add(riceCenter);
      itemMaterials.push(riceMat2);

      // Papad (crispy round bread)
      const papadGeo = new THREE.CylinderGeometry(0.38, 0.4, 0.03, 20);
      const papadMat = new THREE.MeshStandardMaterial({ color: 0xE8C99A, roughness: 0.9 });
      const papad = new THREE.Mesh(papadGeo, papadMat);
      papad.position.set(0.65, 0.29, 0.65);
      papad.rotation.y = 0.3;
      papad.castShadow = true;
      foodGroup.add(papad);
      itemMaterials.push(papadMat);
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
  }, [item, isRotating, steamEnabled, inline, displayMode]);

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
          {displayMode === 'photo' ? 'Photoreal 3D Dish' : 'Interactive 3D Mesh'}
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
      <div className="w-full flex items-center justify-between px-3 py-2 mt-2 bg-gray-900/90 backdrop-blur-md rounded-xl text-white text-xs gap-2 border border-gray-800 flex-wrap">
        {/* Toggle Real Photo vs 3D Mesh */}
        {photoUrl && (
          <button
            onClick={() => setDisplayMode(displayMode === 'photo' ? 'model' : 'photo')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
              displayMode === 'photo'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                : 'bg-gray-800/80 text-gray-300 hover:text-white'
            }`}
            title="Toggle between Real Food Photo 3D and Geometric Model"
          >
            <Camera size={13} />
            <span>{displayMode === 'photo' ? 'Photo 3D' : 'Mesh 3D'}</span>
          </button>
        )}

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
