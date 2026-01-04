uniform float leafFadeStart;
uniform float maxLeafDistance;
uniform float rootSpreadMin;
uniform float rootSpreadMax;
uniform float rootHeightMin;
uniform float rootHeightMax;
uniform float rootBumpsMin;
uniform float rootBumpsMax;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vLeafTint;
varying vec2 vUv;
varying float vTreeRand;

void main() {
  vec3 pos = position;
  vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
  vec4 instanceCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

  float treeRand1 = fract(sin(instanceCenter.x * 12.9898 + instanceCenter.z * 78.233) * 43758.5453);
  float treeRand2 = fract(sin(instanceCenter.x * 63.7264 + instanceCenter.z * 10.873) * 43758.5453);
  float treeRand3 = fract(sin(instanceCenter.x * 36.1734 + instanceCenter.z * 91.147) * 43758.5453);

  float rootSpread = mix(rootSpreadMin, rootSpreadMax, treeRand1);
  float rootHeight = mix(rootHeightMin, rootHeightMax, treeRand2);
  float rootBumps = floor(mix(rootBumpsMin, rootBumpsMax + 1.0, treeRand3));

  if (worldPos.y < rootHeight) {
    float rootFactor = 1.0 - (worldPos.y / rootHeight);
    rootFactor = rootFactor * rootFactor;

    vec2 outwardDir = worldPos.xz - instanceCenter.xz;
    float outwardLen = length(outwardDir);
    if (outwardLen > 0.001) {
      outwardDir /= outwardLen;
    } else {
      outwardDir = vec2(1.0, 0.0);
    }

    float angle = atan(worldPos.z - instanceCenter.z, worldPos.x - instanceCenter.x);
    float treeSeed = fract(instanceCenter.x * 12.9898 + instanceCenter.z * 78.233) * 6.28;
    float bumpiness = 1.0 + 0.7 * sin(angle * rootBumps + treeSeed);

    float spreadAmount = rootFactor * rootSpread * bumpiness * outwardLen * 3.0;
    worldPos.xz += outwardDir * spreadAmount;
    worldPos.y -= rootFactor * 0.15;
  }

  vWorldPosition = worldPos.xyz;

  vec3 toVertex = worldPos.xyz - instanceCenter.xyz;
  vec3 approxNormal = normalize(vec3(toVertex.x, 0.0, toVertex.z));
  if (abs(normal.y) > 0.9) {
    approxNormal = vec3(0.0, sign(normal.y), 0.0);
  }
  vNormal = approxNormal;

  // VISUAL TRICK: As leaves disappear at distance, tint branches green
  // to compensate. vLeafTint ramps from 0 to 1 over the LOD range.
  float dist = length(cameraPosition - vWorldPosition);
  // Defensive: ensure fadeStart < maxDistance
  float safeFadeStart = min(leafFadeStart, maxLeafDistance - 1.0);
  vLeafTint = smoothstep(safeFadeStart, maxLeafDistance, dist);

  float uvAngle = atan(worldPos.z - instanceCenter.z, worldPos.x - instanceCenter.x);
  vUv = vec2(uvAngle * 1.5, worldPos.y * 0.5);
  vTreeRand = treeRand1;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}