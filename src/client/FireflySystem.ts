import * as THREE from 'three';

// ============================================================================
// FIREFLY SYSTEM
// ============================================================================

export interface FireflyConfig {
  count?: number;
  size?: number;
  brightness?: number;
  color?: THREE.Color;
  speed?: number;
}

export class FireflySystem {
  private config: Required<FireflyConfig>;
  public group: THREE.Group;
  private mesh: THREE.Points | null = null;
  private positions: Float32Array | null = null;
  private colors: Float32Array | null = null;
  private sizes: Float32Array | null = null;
  private phases: Float32Array | null = null;
  private time: number = 0;
  private initialPositions: Float32Array | null = null;

  constructor(config: FireflyConfig = {}) {
    this.config = {
      count: config.count || 150,
      size: config.size || 0.5,
      brightness: config.brightness || 4.0,
      color: config.color || new THREE.Color(0xffff66),
      speed: config.speed || 0.5,
    };

    this.group = new THREE.Group();
  }

  generate() {
    // Create geometry for fireflies (simple point)
    const geometry = new THREE.BufferGeometry();

    // Create arrays
    this.positions = new Float32Array(this.config.count * 3);
    this.colors = new Float32Array(this.config.count * 3);
    this.sizes = new Float32Array(this.config.count);
    this.phases = new Float32Array(this.config.count);
    this.initialPositions = new Float32Array(this.config.count * 3);

    // Initialize fireflies with random positions
    for (let i = 0; i < this.config.count; i++) {
      const i3 = i * 3;

      // Random position within forest area
      const radius = Math.random() * 60 + 20;  // 20-80 units from center
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.random() * 10 + 2;  // 2-12 units above ground (closer to ground)

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      // Store initial positions
      this.initialPositions[i3] = x;
      this.initialPositions[i3 + 1] = y;
      this.initialPositions[i3 + 2] = z;

      // Create color variation
      const hueVariation = (Math.random() - 0.5) * 0.3;
      const tempColor = new THREE.Color();
      tempColor.setHSL(
          0.15 + hueVariation,       // Yellow-ish hue
          0.9,                       // High saturation
          0.7 + Math.random() * 0.3  // Random lightness
      );

      this.colors[i3] = tempColor.r;
      this.colors[i3 + 1] = tempColor.g;
      this.colors[i3 + 2] = tempColor.b;

      // Set size with more variation
      this.sizes[i] = this.config.size * (0.6 + Math.random() * 0.8);

      // Random phase for animation
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute(
        'position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(this.phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: {value: 0},
        u_brightness: {value: this.config.brightness},
        u_sizeMultiplier: {value: 2.0}  // Start with larger multiplier
      },
      vertexShader: `
    uniform float u_time;
    uniform float u_sizeMultiplier;
    attribute float size;
    attribute float phase;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = color;
      
      vec3 pos = position;

      // Add floating motion
      float t = u_time * 0.5;
      float vertical = sin(t + phase) * 0.3;
      float horizontalX = sin(t * 0.8 + phase * 1.2) * 0.5;
      float horizontalZ = cos(t * 0.7 + phase * 0.9) * 0.5;
      
      pos.x += horizontalX;
      pos.y += vertical;
      pos.z += horizontalZ;

      // Transform position
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Calculate distance from camera
      float dist = length(mvPosition.xyz);
      
      // Pulsing effect
      float pulse = sin(t * 3.0 + phase) * 0.15 + 0.85;
      
      // SIMPLIFIED: Larger point size
      gl_PointSize = size * u_sizeMultiplier * pulse * (900.0 / max(1.0, dist * 0.5));
      
      // Set alpha
      vAlpha = pulse * 0.9 + 0.1;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
      fragmentShader: `
    uniform float u_brightness;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Create circular point
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);

      // Discard if outside circle
      if (dist > 0.5) discard;

      // SIMPLIFIED: Linear alpha falloff
      float alpha = 1.0 - dist * 2.0;
      alpha = alpha * alpha; // Slight curve
      
      // Apply brightness and alpha
      vec3 finalColor = vColor * u_brightness;
      float finalAlpha = alpha * vAlpha * 0.9; // Slightly transparent

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `,
      transparent: true,
      depthWrite: false,
      depthTest: true,  // IMPORTANT: Set to true
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    this.mesh = new THREE.Points(geometry, material);
    this.group.add(this.mesh);

    return {group: this.group};
  }

  update(time: number) {
    if (!this.mesh) return;

    this.time = time;

    // Update shader uniforms
    const material = this.mesh.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.u_time.value = time;

      // Optional: Add subtle size pulsing
      material.uniforms.u_sizeMultiplier.value =
          0.9 + Math.sin(time * 0.5) * 0.1;
    }
  }

  // Method to adjust firefly brightness
  setBrightness(value: number) {
    if (this.mesh && (this.mesh.material as THREE.ShaderMaterial).uniforms.u_brightness) {
      (this.mesh.material as THREE.ShaderMaterial).uniforms.u_brightness.value = value;
    }
  }

  // Method to adjust firefly size
  setSizeMultiplier(value: number) {
    if (this.mesh && (this.mesh.material as THREE.ShaderMaterial).uniforms.u_sizeMultiplier) {
      (this.mesh.material as THREE.ShaderMaterial).uniforms.u_sizeMultiplier.value = value;
    }
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.ShaderMaterial).dispose();
      this.group.remove(this.mesh);
    }
    this.positions = null;
    this.colors = null;
    this.sizes = null;
    this.phases = null;
    this.initialPositions = null;
  }
}
