// Updated main.js for dynamic OBJ loading based on URL hash

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ----------------------------
// Get OBJ ID from URL hash
// ----------------------------
function getObjectId() {
  return window.location.hash?.substring(1) || 'OBJ001';
}

const objectId = getObjectId();
const idLower = objectId.toLowerCase();

// ----------------------------
// Future Layer (3D Model)
// ----------------------------
function initFutureLayer() {
  const container = document.getElementById('future-layer');
  if (!container) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 0, 10);
  scene.add(camera);

  // Multiple softer lights rather than one intense light
  const frontLight = new THREE.DirectionalLight(0xffffff, 5);
  frontLight.position.set(0, 0, 10);
  scene.add(frontLight);
  
  const topLight = new THREE.DirectionalLight(0xffffff, 5);
  topLight.position.set(0, 10, 0);
  scene.add(topLight);
  
  const sideLight = new THREE.DirectionalLight(0xffffff, 5);
  sideLight.position.set(10, 0, 0);
  scene.add(sideLight);
  
  // Stronger ambient light to ensure good base visibility
  scene.add(new THREE.AmbientLight(0xbbbbbb, 3));

  const pivot = new THREE.Group();
  scene.add(pivot);

  const loader = new GLTFLoader().setPath('public/future/');
  loader.load(`${idLower}.glb`, (gltf) => {
    const model = gltf.scene;
    model.scale.set(2.5, 2.5, 2.5);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        
        // Adjust material for better balance
        if (child.material) {
          // Make it more diffuse without losing color
          if (child.material.metalness !== undefined) {
            child.material.metalness = 0.1;
          }
          if (child.material.roughness !== undefined) {
            child.material.roughness = 1;
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    pivot.add(model);
  }, undefined, console.error);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let isDragging = false;
  let prevX = 0;

  const dom = renderer.domElement;
  dom.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
  });
  dom.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const delta = e.clientX - prevX;
      pivot.rotation.y += delta * 0.01;
      prevX = e.clientX;
    }
  });
  ['mouseup', 'mouseleave'].forEach(evt =>
    dom.addEventListener(evt, () => { isDragging = false; })
  );

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
}

// ----------------------------
// Past Layer (Grain Effect and Image)
// ----------------------------
function initPastLayer() {
  const el = document.getElementById('past-layer');
  if (!el || typeof grained !== 'function') return;

  const options = {
    animate: true,
    patternWidth: 200,
    patternHeight: 200,
    grainOpacity: 0.15,
    grainDensity: 1,
    grainWidth: 1.2,
    grainHeight: 1
  };

  grained('#past-layer', options);

  const img = new Image();
  img.src = `public/past/${idLower}.jpg`;
  img.onload = () => {
    el.style.backgroundImage = `url('${img.src}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  };

  el.style.display = 'none';
  setTimeout(() => { el.style.display = ''; }, 10);
}

// ----------------------------
// Present Layer
// ----------------------------

function initPresentLayer() {
  const container = document.getElementById('present-layer');
  if (!container) return;

  const img = document.createElement('img');
  img.src = `public/present/${objectId.toLowerCase()}.png`;
  img.alt = `${objectId} Present Layer`;
  img.className = 'present-image';

  container.innerHTML = '';
  container.appendChild(img);
}

// ----------------------------
// SVG Glitch
// ----------------------------
function initMemoryLayer() {
  fetch(`public/memory/${idLower}.svg`)
    .then(res => res.text())
    .then(svgText => {
      const container = document.getElementById('memory-layer');
      container.innerHTML = svgText;

      const allPaths = container.querySelectorAll('path');

      allPaths.forEach((path, i) => {
        if (i % 3 === 0) {
          path.classList.add('glitch-path');
        }
      });
    });

  const toggle = document.getElementById('memory-toggle');
  toggle.addEventListener('change', () => {
    const paths = document.querySelectorAll('#memory-layer path');

    paths.forEach((path, index) => {
      if (toggle.checked) {
        const x = (Math.random() - 0.5) * 4 + 'px';
        const y = (Math.random() - 0.5) * 4 + 'px';

        path.classList.add('glitch-path');
        path.style.setProperty('--glitch-x', x);
        path.style.setProperty('--glitch-y', y);
      } else {
        path.classList.remove('glitch-path');
        path.style.setProperty('--glitch-x', '0');
        path.style.setProperty('--glitch-y', '0');
      }
    });
  });
}

// ----------------------------
// Layer Toggles
// ----------------------------
function setupToggleListeners() {
  const toggles = [
    { toggleId: 'future-toggle', layerId: 'future-layer' },
    { toggleId: 'present-toggle', layerId: 'present-layer' },
    { toggleId: 'past-toggle', layerId: 'past-layer' },
    { toggleId: 'memory-toggle', layerId: 'memory-layer' }
  ];

  toggles.forEach(({ toggleId, layerId }) => {
    const toggle = document.getElementById(toggleId);
    const layer = document.getElementById(layerId);
    if (!toggle || !layer) return;

    layer.classList.toggle('active', toggle.checked);
    toggle.addEventListener('click', () => {
      layer.classList.toggle('active', toggle.checked);
    });
  });
}

// ----------------------------
// Init Sequence
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initFutureLayer();
  initPastLayer();
  initMemoryLayer();
  initPresentLayer();

  // Set dynamic object ID label on page
  const label = document.getElementById('object-id-label');
  if (label) {
    label.textContent = objectId.toUpperCase();
  }

  setTimeout(() => {
    setupToggleListeners();
  }, 200);
});
