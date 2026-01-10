attribute vec3 instanceColorAttr;
attribute float instanceRandom;
attribute float instanceWobbleX;
attribute float instanceWobbleY;
attribute float instanceSwayPhase;
uniform float time;
uniform float maxLeafDistance;
uniform float leafFadeStart;

varying vec2 vUv;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vRandom;

void main() {
  // PERFORMANCE: Vertex-shader LOD culling
  // Extract instance world position from the 4th column of instanceMatrix
  vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float dist = length(cameraPosition - instancePos);

  // PERFORMANCE: Collapse distant leaves to degenerate triangles.
  // Unlike fragment discard, this skips rasterization entirely.
  // GPU detects zero-area triangles and culls them before fragment stage.
  if (dist > maxLeafDistance) {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // PERFORMANCE: Gradual size reduction reduces overdraw in mid-distance.
  // Leaves shrink up to 50% between fadeStart and maxDistance.
  // Combined with bark green-tinting, this makes LOD transitions invisible.
  // Defensive: ensure fadeStart < maxDistance to avoid smoothstep artifacts
  float safeFadeStart = min(leafFadeStart, maxLeafDistance - 1.0);
  float lodScale = 1.0 - smoothstep(safeFadeStart, maxLeafDistance, dist) * 0.5;

  vUv = uv;
  vColor = instanceColorAttr;
  vRandom = instanceRandom;

  vec3 pos = position * lodScale;

  // Shape wobble - using pre-computed values
  float edgeDist = max(abs(pos.x), abs(pos.y)) * 2.0;
  pos.x += instanceWobbleX * edgeDist;
  pos.y += instanceWobbleY * edgeDist;
  pos.x += pos.y * 0.08 * instanceWobbleX;
  pos *= 0.94 + instanceRandom * 0.12;

  // PERFORMANCE: Skip sway animation for distant leaves.
  // sin() is expensive; skipping it for 80%+ of leaves saves ALU cycles.
  if (dist < 35.0) {
    // Smooth fade-out prevents popping when crossing threshold
    float swayFactor = clamp(1.0 - (dist - 25.0) / 10.0, 0.0, 1.0);

    // PERFORMANCE: Single sin() per vertex instead of multiple trig calls.
    // instanceSwayPhase is pre-computed on CPU - no hash() in shader.
    float s = sin(time * 1.2 + instanceSwayPhase);

    // Apply sway in world space for more visible effect
    pos.x += s * 0.08 * swayFactor;
    pos.z += s * 0.05 * swayFactor;
  }

  vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize((instanceMatrix * vec4(normal, 0.0)).xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}