'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface OrbitalLatticeProps {
  scrollProgress: number;
  isRotating?: boolean;
  onToggleRotation?: () => void;
}

export default function OrbitalLattice({ scrollProgress, isRotating = true, onToggleRotation }: OrbitalLatticeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const latticeGroupRef = useRef<THREE.Group | null>(null);
  const satelliteRef = useRef<THREE.Group | null>(null);
  const blinkLightRef = useRef<THREE.PointLight | null>(null);
  const scrollProgressRef = useRef(scrollProgress);
  const onToggleRotationRef = useRef(onToggleRotation);
  const isRotatingRef = useRef(isRotating);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    onToggleRotationRef.current = onToggleRotation;
    isRotatingRef.current = isRotating;
  }, [onToggleRotation, isRotating]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const latticeGroup = new THREE.Group();
    scene.add(latticeGroup);
    latticeGroupRef.current = latticeGroup;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(5, 10, 7);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 1.5);
    rimLight.position.set(-5, -5, -2);
    scene.add(rimLight);

    // Load Satellite
    const loader = new GLTFLoader();
    loader.load('/ISS_stationary.glb', (gltf: any) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 4.5 / maxDim;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scaleFactor));

      model.traverse((child: any) => {
        if (child.isMesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.roughness = 0.3;
            mat.metalness = 0.8;
          }
        }
      });

      const satelliteGroup = new THREE.Group();
      satelliteGroup.add(model);

      const beacon = new THREE.PointLight(0x00ffff, 4, 15);
      beacon.position.set(1.5, 0.5, 0.5);
      satelliteGroup.add(beacon);
      blinkLightRef.current = beacon;

      const beacon2 = new THREE.PointLight(0xff0000, 3, 10);
      beacon2.position.set(-1.5, -0.5, -0.5);
      satelliteGroup.add(beacon2);

      scene.add(satelliteGroup);
      satelliteRef.current = satelliteGroup;
    });

    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 7 + (Math.sin(theta * 4) * Math.cos(phi * 3) * 2);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.8;
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, pointsMaterial);
    latticeGroup.add(points);

    const lineIndices = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 2 && Math.random() > 0.95) {
          lineIndices.push(i, j);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeometry.setIndex(lineIndices);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    latticeGroup.add(lines);

    // Add Thin Orbital HUD Rings
    const ringGeo = new THREE.TorusGeometry(11, 0.005, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.1 });
    const hudRing1 = new THREE.Mesh(ringGeo, ringMat);
    hudRing1.rotation.x = Math.PI / 2;
    scene.add(hudRing1);

    const hudRing2 = new THREE.Mesh(new THREE.TorusGeometry(13, 0.003, 16, 100), ringMat);
    hudRing2.rotation.x = Math.PI / 2.2;
    hudRing2.rotation.y = Math.PI / 8;
    scene.add(hudRing2);

    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      const currentProgress = scrollProgressRef.current;
      const time = Date.now() * 0.001;

      if (latticeGroupRef.current) {
        latticeGroupRef.current.rotation.y += 0.0003;
        const scale = 1 + currentProgress * 2;
        latticeGroupRef.current.scale.set(scale, scale, scale);

        const latticeOpacity = Math.max(0, 1 - currentProgress * 2);
        pointsMaterial.opacity = 0.8 * latticeOpacity;
        lineMaterial.opacity = 0.4 * latticeOpacity;
      }

      if (satelliteRef.current) {
        // Positions the satellite at the middle bottom
        const transitionFactor = Math.min(1, currentProgress * 1.5);
        const targetScale = 0.5 + (1 - currentProgress) * 0.5;

        // X is centered, Y is shifted down to "middle bottom", Z shifts back as we scroll
        const heroX = Math.cos(time * 0.3) * 0.1;
        const heroY = -5.8 + (currentProgress * 2.5); // Shifted lower, but still moves up slightly during scroll
        const heroZ = -4 + (currentProgress * -8); // Moves further back as globe appears

        satelliteRef.current.position.set(heroX, heroY, heroZ);
        satelliteRef.current.scale.set(targetScale, targetScale, targetScale);
        satelliteRef.current.visible = true;

        // Axial Rotation (Vertical) - only if rotating
        if (isRotatingRef.current) {
          satelliteRef.current.rotation.y += 0.005;
          satelliteRef.current.rotation.x = 0;
          satelliteRef.current.rotation.z = Math.sin(time) * 0.05; // Subtle wobble
        }

        if (blinkLightRef.current) {
          blinkLightRef.current.intensity = 2 + Math.sin(time * 4) * 2;
        }

        // Update Tooltip Position
        const vector = new THREE.Vector3();
        satelliteRef.current.getWorldPosition(vector);
        vector.project(camera);
        setTooltipPos({
          x: (vector.x * 0.5 + 0.5) * window.innerWidth,
          y: (-(vector.y * 0.5 - 0.5)) * window.innerHeight
        });
      }

      // Camera parallax
      camera.position.x = Math.sin(time * 0.2) * 0.3;
      camera.position.y = Math.cos(time * 0.2) * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      return frameId;
    };

    const animationId = animate();
    // Clean-up refs for event management in loop - better move listeners here
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleGlobalClick = (e: MouseEvent) => {
      if (!satelliteRef.current || !cameraRef.current) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(satelliteRef.current.children, true);
      if (intersects.length > 0) {
        onToggleRotationRef.current?.();
      }
    };

    const handleGlobalMove = (e: MouseEvent) => {
      if (!satelliteRef.current || !cameraRef.current) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(satelliteRef.current.children, true);
      setHovered(intersects.length > 0);
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('mousemove', handleGlobalMove);

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (rendererRef.current) rendererRef.current.dispose();
      if (geometry) geometry.dispose();
      if (lineGeometry) lineGeometry.dispose();
      if (pointsMaterial) pointsMaterial.dispose();
      if (lineMaterial) lineMaterial.dispose();
      if (containerRef.current && rendererRef.current && rendererRef.current.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 20, // Match page.tsx
          background: 'transparent',
        }}
      />
      {hovered && (
        <div
          className="fixed pointer-events-none z-[100] px-3 py-1.5 bg-cyan-500/90 text-black text-[11.5px] font-bold uppercase tracking-widest rounded shadow-[0_0_20px_rgba(34,211,238,0.4)] -translate-x-1/2 -translate-y-[150%]"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          Toggle Globe Rotation
        </div>
      )}
      {hovered && <style>{`body { cursor: pointer !important; }`}</style>}
    </>
  );
}
