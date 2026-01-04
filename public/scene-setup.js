import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CONFIG} from './config.js';

// ============================================================================
// SCENE SETUP
// ============================================================================

export function setupScene() {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  // Sky
  const skyGeo = new THREE.SphereGeometry(500, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: {value: new THREE.Color(0x6baed6)},
      bottomColor: {value: new THREE.Color(0xddeeff)},
    },
    vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), 0.6)), 1.0);
    }
  `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const camera = new THREE.PerspectiveCamera(
      55, container.clientWidth / container.clientHeight, 0.1, 2000);
  camera.position.set(0, 12, 35);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance',
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.EXPOSURE;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.target.set(0, 6, 0);
  controls.minDistance = 0.1;
  controls.maxDistance = 800;
  controls.maxPolarAngle = Math.PI / 2;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, CONFIG.AMBIENT_INTENSITY));

  const sun = new THREE.DirectionalLight(0xfff8e7, CONFIG.SUN_INTENSITY);
  sun.position.set(50, 100, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;  // pushes shadow along surface normal
  sun.shadow.radius = 2;  // Soft shadow blur (only works with PCFSoftShadowMap)
  scene.add(sun);

  scene.add(new THREE.HemisphereLight(0xaaddff, 0x88aa66, 0.5));

  // Ground
  const groundGeo = new THREE.CircleGeometry(200, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x5a8050,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  return {scene, camera, renderer, controls, sun};
}

// ============================================================================
// SHADOW CONTROL
// ============================================================================

export function updateShadowQuality(quality, scene, sun, renderer) {
  if (!scene) return;

  let newSize;

  switch (quality) {
    case 'none':
      sun.castShadow = false;
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.needsUpdate = true;
      return;

    case 'low':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      sun.castShadow = true;
      newSize = 512;
      break;

    case 'medium':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      sun.castShadow = true;
      newSize = 1024;
      break;

    case 'high':
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      sun.castShadow = true;
      newSize = 2048;
      break;
  }

  // Only dispose and regenerate if size actually changed
  if (sun.shadow.mapSize.width !== newSize) {
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    sun.shadow.mapSize.width = newSize;
    sun.shadow.mapSize.height = newSize;
    sun.shadow.needsUpdate = true;
    renderer.shadowMap.needsUpdate = true;
  } else {
    // Even if size didn't change, still force update when re-enabling
    sun.shadow.needsUpdate = true;
    renderer.shadowMap.needsUpdate = true;
  }
}