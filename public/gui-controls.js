import GUI from 'lil-gui';
import {CONFIG} from './config.js';

// ============================================================================
// GUI CONTROLS
// ============================================================================

export function setupGUI(params, generateForest, updateShadowQuality, setNightMode, generateFireflies) {
  const gui = new GUI({title: 'Controls'});

  const envFolder = gui.addFolder('Environment & Shadows');
  const shadowSettings = {
    quality: 'high'
  };
  envFolder.add(shadowSettings, 'quality', ['none', 'low', 'medium', 'high'])
    .name('Shadow Quality')
    .onChange((value) => updateShadowQuality(value));

  // Add night mode toggle
  envFolder.add(params, 'nightMode').name('Night Mode').onChange((value) => {
    setNightMode(value);
  });

  const fireflyFolder = gui.addFolder('Fireflies');
  fireflyFolder.add(params, 'firefliesEnabled').name('Enable Fireflies').onChange((value) => {
    // This will be handled in the main forest.js file
  });
  fireflyFolder.add(CONFIG, 'FIREFLY_COUNT', 10, 500, 10).name('Firefly Count');
  fireflyFolder.add(CONFIG, 'FIREFLY_SIZE', 0.1, 1.0, 0.1).name('Firefly Size');
  fireflyFolder.add(CONFIG, 'FIREFLY_BRIGHTNESS', 0.5, 2.0, 0.1).name('Brightness');

  const forestFolder = gui.addFolder('Forest');
  forestFolder.add(params, 'treeCount', 50, 2000, 50).name('Trees');
  forestFolder.add(params, 'forestRadius', 30, 200, 10).name('Forest Radius');

  const treeFolder = gui.addFolder('Tree Structure');
  treeFolder.add(CONFIG, 'BRANCH_LEVELS', 2, 6, 1).name('Branch Levels');
  treeFolder.add(CONFIG, 'BRANCH_ANGLE', 0.2, 1.0, 0.05).name('Branch Angle');
  treeFolder.add(CONFIG, 'BRANCHES_PER_NODE', 2, 5, 1).name('Branches/Node');
  treeFolder.add(CONFIG, 'LENGTH_FALLOFF', 0.5, 0.85, 0.01)
    .name('Length Falloff');
  treeFolder.add(CONFIG, 'RADIUS_FALLOFF', 0.4, 0.7, 0.01).name('Radius Falloff');

  const leafFolder = gui.addFolder('Leaves');
  leafFolder.add(CONFIG, 'LEAF_SIZE', 0.3, 1.5, 0.1).name('Leaf Size');
  leafFolder.add(CONFIG, 'LEAF_DENSITY', 2, 10, 1).name('Leaf Density');
  leafFolder.add(CONFIG, 'LEAF_SPREAD', 0.3, 1.5, 0.1).name('Leaf Spread');

  const perfFolder = gui.addFolder('Performance');
  perfFolder.add(CONFIG, 'CUSTOM_TREE_CULLING')
    .name(
        'Custom Per-Tree Culling <small style=\'opacity:0.6\'>(regenerates)</small>')
    .onChange(() => {
      generateForest();
    });

  leafFolder.add(CONFIG, 'LOD_FADE_START', 30, 250, 5)
    .name('LOD Fade Start')
    .onChange((v) => {
      // Clamp: fadeStart must be less than maxDistance
      const clamped = Math.min(v, CONFIG.LOD_MAX_DISTANCE - 5);
      if (clamped !== v) CONFIG.LOD_FADE_START = clamped;
    });
  leafFolder.add(CONFIG, 'LOD_MAX_DISTANCE', 50, 400, 10)
    .name('LOD Max Distance')
    .onChange((v) => {
      // Clamp: maxDistance must be greater than fadeStart
      const clamped = Math.max(v, CONFIG.LOD_FADE_START + 5);
      if (clamped !== v) CONFIG.LOD_MAX_DISTANCE = clamped;
    });

  gui.add(params, 'regenerate').name('↻ Regenerate');

  return gui;
}