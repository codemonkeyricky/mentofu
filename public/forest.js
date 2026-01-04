import GUI from 'lil-gui';
import StatsGL from 'stats-gl';
import * as THREE from 'three';
import {InstancedForest} from './forest-generator.js';
import {createCherryBlossomTexture, createBarkTexture} from './textures.js';
import {setupScene, updateShadowQuality} from './scene-setup.js';
import {setupGUI} from './gui-controls.js';
import {setupAnimationLoop} from './animation-loop.js';
import {CONFIG} from './config.js';

// ============================================================================
// MAIN FOREST APPLICATION
// ============================================================================

// Setup scene components
const {scene, camera, renderer, controls, sun} = setupScene();

// Create textures
const leafTexture = createCherryBlossomTexture();
const barkTexture = createBarkTexture();

// Initialize forest
let forest = new InstancedForest();
let stats = {trees: 0, branches: 0, leaves: 0};

// Setup parameters for GUI
const params = {
  treeCount: CONFIG.TREE_COUNT,
  forestRadius: CONFIG.FOREST_RADIUS,
  regenerate: generateForest,
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

// Generate initial forest
generateForest();

// Setup GUI
const gui = setupGUI(params, generateForest, updateShadowQuality);

// Setup performance stats
const statsGL = new StatsGL({trackGPU: true, trackHz: true});
const statsContainer = document.getElementById('performanceStats');
statsContainer.classList.add('gl');
statsContainer.appendChild(statsGL.dom);
statsGL.init(renderer);

// Setup animation loop
setupAnimationLoop(forest, camera, renderer, statsGL, params, scene);