import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Culinary3DHero: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.replaceChildren(renderer.domElement);

    // Lights
    const amb = new THREE.AmbientLight(0xffedd5, 1.2);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xffa200, 2.5);
    dir.position.set(3, 4, 3);
    scene.add(dir);

    const rim = new THREE.PointLight(0xf97316, 2.0, 10);
    rim.position.set(-3, -2, 2);
    scene.add(rim);

    // Floating Hero Group
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // 1. Central 3D Dining Cloche / Serving Dome
    const domeGeo = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xec6d13,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = -0.1;
    heroGroup.add(dome);

    // Cloche Rim
    const clocheRimGeo = new THREE.TorusGeometry(1.22, 0.06, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.15,
    });
    const clocheRim = new THREE.Mesh(clocheRimGeo, goldMat);
    clocheRim.rotation.x = Math.PI / 2;
    clocheRim.position.y = -0.1;
    heroGroup.add(clocheRim);

    // Cloche Handle / Knob
    const handleGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const handle = new THREE.Mesh(handleGeo, goldMat);
    handle.position.y = 1.25;
    heroGroup.add(handle);

    // 2. Floating Orbiting Culinary Rings & Ingredients
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.02, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 })
    );
    ring1.rotation.x = Math.PI / 3;
    heroGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.02, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.3 })
    );
    ring2.rotation.y = Math.PI / 4;
    heroGroup.add(ring2);

    // Floating Golden Cutlery (Fork & Spoon)
    const cutleryMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), cutleryMat);
    spoon.position.set(-1.8, 0.4, 0.5);
    spoon.rotation.z = 0.4;
    heroGroup.add(spoon);

    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), cutleryMat);
    fork.position.set(1.8, -0.2, -0.4);
    fork.rotation.z = -0.5;
    heroGroup.add(fork);

    // 3. Floating Sparkling Bokeh Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xfed7aa,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Touch & Pointer Parallax
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.4;
    };

    container.addEventListener('pointermove', handlePointerMove);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth floating motion
      heroGroup.position.y = Math.sin(elapsed * 1.5) * 0.12;
      heroGroup.rotation.y = elapsed * 0.4 + targetX;
      heroGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.08 + targetY;

      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.x = elapsed * -0.25;

      particles.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 220;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      domeGeo.dispose();
      domeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-[180px] sm:h-[220px] relative overflow-hidden flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
    />
  );
};

export default Culinary3DHero;
