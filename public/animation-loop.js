import {CONFIG} from './config.js';

// ============================================================================
// ANIMATION LOOP AND EVENT HANDLERS
// ============================================================================

export function setupAnimationLoop(forest, camera, renderer, statsGL, params, scene) {
  const statDrawCalls = document.getElementById('statDrawCalls');
  const statTris = document.getElementById('statTris');

  function updateStats() {
    const renderInfo = renderer.info.render;
    statDrawCalls.textContent = renderInfo.calls;
    statTris.textContent = renderInfo.triangles.toLocaleString();
  }

  function animate() {
    requestAnimationFrame(animate);

    // Update leaf sway animation
    if (forest.leafMat) {
      forest.leafMat.uniforms.time.value = performance.now() * 0.001;
    }

    // Frustum culling
    if (CONFIG.CUSTOM_TREE_CULLING) {
      const visibleCount = forest.updateVisibility(camera);
      document.getElementById('statVisibleTrees').textContent = visibleCount;
    }

    renderer.render(scene, camera);
    updateStats();

    // stats
    if (statsGL) statsGL.update();
  }

  animate();

  const hasMouse = matchMedia('(pointer:fine)').matches;
  const hasKeyboard =
    !!navigator.keyboard;  // only true if real Keyboard API present
  const isTouchDevice = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  const isTouchOnly = isTouchDevice && !hasMouse && !hasKeyboard;

  function resize() {
    const dpr = Math.min(
        window.devicePixelRatio,
        isTouchOnly ? 1 : 1.5);  // cap pixel ratio to prevent insane resolutions
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, true);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();
}