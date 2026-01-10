uniform sampler2D barkTexture;
uniform vec3 barkColor;
uniform vec3 leafTintColor;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vLeafTint;
varying vec2 vUv;
varying float vTreeRand;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(0.5, 1.0, 0.3));
  float NdotL = max(dot(N, L), 0.0);

  vec2 wrappedUV = fract(vUv);
  vec3 texColor = texture2D(barkTexture, wrappedUV).rgb;

  float brightness = 0.85 + vTreeRand * 0.3;
  // Blend bark toward leafy green at distance (max 70% blend)
  // This hides the fact that leaves are being culled
  vec3 baseColor = mix(barkColor, texColor, 0.7) * 1.8 * brightness;
  baseColor *= vec3(1.0 + (vTreeRand - 0.5) * 0.1, 1.0, 1.0 - (vTreeRand - 0.5) * 0.1);
  baseColor = mix(baseColor, leafTintColor, vLeafTint * 0.7);
  vec3 litColor = baseColor * (0.3 + NdotL * 0.7);

  gl_FragColor = vec4(litColor, 1.0);
}