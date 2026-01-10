precision mediump float;  // PERFORMANCE: highp not needed for color math
uniform sampler2D leafTexture;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform vec3 ambientLight;

varying vec2 vUv;
varying vec3 vColor;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vRandom;

void main() {
  vec4 texColor = texture2D(leafTexture, vUv);

  // For cherry blossom effect, we want to preserve transparency
  // We'll use a lower threshold for transparency to allow soft edges
  if (texColor.a < 0.1) {
    discard;
  }

  vec3 N = normalize(vNormal);
  vec3 L = normalize(sunDirection);
  vec3 V = normalize(cameraPosition - vWorldPosition);
  if (!gl_FrontFacing) N = -N;

  float NdotL = max(dot(N, L), 0.0);

  // Cheap top-down shadow approximation
  float leafShadow = smoothstep(0.0, 1.0, dot(N, L) * 0.5 + 0.5);
  float diffuse = NdotL * 0.8 * leafShadow;
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.1;
  float sss = pow(max(dot(-N, L), 0.0), 2.0) * 0.35;

  vec3 baseColor = vColor * texColor.rgb;
  baseColor *= 0.92 + vRandom * 0.16;

  // Simple AO: darken leaves lower in the tree slightly
  float ao = exp(-vWorldPosition.y * 0.1);
  baseColor *= 0.85 + 0.15 * ao;

  vec3 litColor = baseColor * (ambientLight + sunColor * (diffuse + sss)) + fresnel * vec3(0.7, 0.8, 0.6);

  // Use the alpha from texture for cherry blossom translucency
  gl_FragColor = vec4(litColor, texColor.a);
}