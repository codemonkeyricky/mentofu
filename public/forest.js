import GUI from 'lil-gui';
import StatsGL from 'stats-gl';
import * as THREE from 'three';

import {setupAnimationLoop} from './animation-loop.js';
import {CONFIG} from './config.js';
import {FireflySystem} from './firefly-system.js';
import {InstancedForest} from './forest-generator.js';
import {setupGUI} from './gui-controls.js';
import {setupScene, updateShadowQuality} from './scene-setup.js';
import {createBarkTexture, createCherryBlossomTexture} from './textures.js';

// ============================================================================
// MAIN FOREST APPLICATION
// ============================================================================

// Setup scene components
const {scene, camera, renderer, controls, sun, setNightMode} = setupScene();

// Create textures
const leafTexture = createCherryBlossomTexture();
const barkTexture = createBarkTexture();

// Initialize forest
let forest = new InstancedForest();
let stats = {trees: 0, branches: 0, leaves: 0};

// Initialize firefly system
let fireflies = null;

// Setup parameters for GUI
const params = {
  treeCount: CONFIG.TREE_COUNT,
  forestRadius: CONFIG.FOREST_RADIUS,
  regenerate: generateForest,
  nightMode: true,
  firefliesEnabled: true,
};

async function generateForest() {
  if (forest.group.parent) scene.remove(forest.group);
  forest.dispose();

  forest = new InstancedForest({
    treeCount: params.treeCount,
    forestRadius: params.forestRadius,
  });

  const result = await forest.generate(leafTexture, barkTexture);
  stats = result.stats;
  scene.add(result.group);

  document.getElementById('statTrees').textContent = stats.trees;
  document.getElementById('statBranches').textContent =
      stats.branches.toLocaleString();
  document.getElementById('statLeaves').textContent =
      stats.leaves.toLocaleString();

  // Reset visible trees display
  document.getElementById('statVisibleTrees').textContent =
      CONFIG.CUSTOM_TREE_CULLING ? forest.visibleTreeCount : stats.trees;
}

// In forest.js, update the generateFireflies function:
async function generateFireflies() {
  if (fireflies && fireflies.group.parent) {
    scene.remove(fireflies.group);
    fireflies.dispose();
  }

  fireflies = new FireflySystem({
    count: CONFIG.FIREFLY_COUNT,
    size: CONFIG.FIREFLY_SIZE,
    brightness: CONFIG.FIREFLY_BRIGHTNESS,
    color: new THREE.Color(
        CONFIG.FIREFLY_COLOR[0], CONFIG.FIREFLY_COLOR[1],
        CONFIG.FIREFLY_COLOR[2]),
    speed: CONFIG.FIREFLY_SPEED
  });

  // Wait for the fireflies to generate
  await fireflies.generate();

  // Debug: check if mesh was created
  console.log('Firefly mesh created:', fireflies.mesh);
  console.log('Firefly group children:', fireflies.group.children.length);

  // Add to scene
  scene.add(fireflies.group);

  return fireflies;
}

// Update the initialization to wait for fireflies:
async function initializeFireflies() {
  if (params.firefliesEnabled) {
    await generateFireflies();
    console.log('Fireflies initialized');
  }
}

generateForest().then(async () => {
  // Generate initial fireflies if enabled by default
  if (params.firefliesEnabled) {
    await generateFireflies();
    console.log('Fireflies ready');
  }

  // Setup GUI
  const gui = setupGUI(
      params, generateForest, updateShadowQuality, setNightMode,
      generateFireflies);

  // Enable night mode by default
  setNightMode(true);

  // Setup performance stats
  const statsGL = new StatsGL({trackGPU: true, trackHz: true});
  const statsContainer = document.getElementById('performanceStats');
  statsContainer.classList.add('gl');
  statsContainer.appendChild(statsGL.dom);
  statsGL.init(renderer);

  // Setup animation loop AFTER everything is loaded
  setupAnimationLoop(
      forest, camera, renderer, statsGL, params, scene, fireflies);
});
