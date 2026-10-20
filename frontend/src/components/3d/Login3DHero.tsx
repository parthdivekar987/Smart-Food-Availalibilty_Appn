import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Login3DHero: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.replaceChildren(renderer.domElement);

    // Warm Lighting
    const amb = new THREE.AmbientLight(0xfff7ed, 1.4);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xf97316, 2.8);
    dir.position.set(3, 4, 3);
    scene.add(dir);

    const rim = new THREE.PointLight(0xfbbf24, 2.2, 10);
    rim.position.set(-3, -2, 2);
    scene.add(rim);

    // Main 3D Model Group
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // 1. Gourmet Serving Cloche (Dome)
    const domeGeo = new THREE.SphereGeometry(1.25, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xec6d13,
      metalness: 0.88,
      roughness: 0.18,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = -0.15;
    heroGroup.add(dome);

    // 2. Golden Metallic Rim
    const clocheRimGeo = new THREE.TorusGeometry(1.27, 0.07, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.96,
      roughness: 0.12,
    });
    const clocheRim = new THREE.Mesh(clocheRimGeo, goldMat);
    clocheRim.rotation.x = Math.PI / 2;
    clocheRim.position.y = -0.15;
    heroGroup.add(clocheRim);

    // 3. Cloche Handle / Knob
    const knobGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const knob = new THREE.Mesh(knobGeo, goldMat);
    knob.position.y = 1.15;
    heroGroup.add(knob);

    // 4. Serving Platter (Base Plate)
    const plateGeo = new THREE.CylinderGeometry(1.5, 1.25, 0.1, 48);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.35,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -0.23;
    heroGroup.add(plate);

    // 5. Dual Orbiting Golden Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.02, 12, 64), ringMat);
    ring1.rotation.x = 1.1;
    heroGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.015, 12, 64), ringMat);
    ring2.rotation.x = 0.5;
    ring2.rotation.y = 0.9;
    heroGroup.add(ring2);

    // 6. Floating Sparkle Particles
    const particleCount = 28;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 5;
      positions[i + 1] = (Math.random() - 0.5) * 3.5;
      positions[i + 2] = (Math.random() - 0.5) * 3;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Interactive pointer response
    let mouseX = 0;
    let mouseY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    container.addEventListener('pointermove', onPointerMove);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating bob
      heroGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

      // Smooth rotation with pointer tracking
      heroGroup.rotation.y = elapsedTime * 0.45 + mouseX * 0.4;
      heroGroup.rotation.x = 0.15 + Math.sin(elapsedTime * 1.2) * 0.05 + mouseY * 0.2;

      ring1.rotation.z += 0.012;
      ring2.rotation.z -= 0.009;
      particles.rotation.y = elapsedTime * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[220px] max-h-[300px] flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing select-none"
    />
  );
};

export default Login3DHero;
