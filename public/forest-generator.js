import * as THREE from 'three';
import {CONFIG} from './config.js';

// Load shader files as text
async function loadShader(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading shader:', error);
    throw error;
  }
}

// Function to load all shaders
async function loadShaders() {
  try {
    const [barkVertex, barkFragment, leafVertex, leafFragment] = await Promise.all([
      loadShader('./shaders/bark-vertex.glsl'),
      loadShader('./shaders/bark-fragment.glsl'),
      loadShader('./shaders/leaf-vertex.glsl'),
      loadShader('./shaders/leaf-fragment.glsl')
    ]);

    return {
      barkVertex,
      barkFragment,
      leafVertex,
      leafFragment
    };
  } catch (error) {
    console.error('Error loading shaders:', error);
    throw error;
  }
}

// ============================================================================
// INSTANCED FOREST GENERATOR
// ============================================================================

export class InstancedForest {
  constructor(options = {}) {
    this.treeCount = options.treeCount ?? CONFIG.TREE_COUNT;
    this.forestRadius = options.forestRadius ?? CONFIG.FOREST_RADIUS;

    this.branchMatrices = [];
    this.branchTreeIds = [];  // Which tree each branch belongs to
    this.leafMatrices = [];
    this.leafTreeIds = [];  // Which tree each leaf belongs to
    this.leafColors = [];
    this.leafRandoms = [];  // Pre-computed random per leaf
    this.leafWobbleX = [];  // Pre-computed wobble offset X
    this.leafWobbleY = [];  // Pre-computed wobble offset Y
    this.leafSwayPhase =
        [];  // Pre-computed per-leaf sway phase (single sin() in shader)

    this.group = new THREE.Group();
    this.meshes = {};

    // Per-tree frustum culling with mesh.count reordering
    this.treeBounds = [];         // Array of Sphere per tree
    this.treeBranchRanges = [];   // treeBranchRanges[treeId] = {start, count}
    this.treeLeafRanges = [];     // treeLeafRanges[treeId] = {start, count}
    this.lastTreeVisible = null;  // Uint8Array for fast comparison
    this.visibleTreeCount = 0;

    // Reordering system - draw order indices
    this.branchDrawOrder = null;  // Uint32Array - indices into master arrays
    this.leafDrawOrder = null;    // Uint32Array - indices into master arrays
    this.visibleBranchCount = 0;
    this.visibleLeafCount = 0;

    // Camera movement throttling
    this._lastCamPos = new THREE.Vector3();
    this._lastCamQuat = new THREE.Quaternion();
    this._frustum = new THREE.Frustum();
    this._projScreenMatrix = new THREE.Matrix4();
    this._tempMatrix = new THREE.Matrix4();

    this._matrix = new THREE.Matrix4();
    this._quaternion = new THREE.Quaternion();
    this._scale = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._color = new THREE.Color();

    this._leafGeo = new THREE.PlaneGeometry(1, 1);
    this._leafGeo.computeBoundingBox();  // only once
    this._leafBottomY = this._leafGeo.boundingBox.min.y;
  }

  _mulberry32(seed) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async generate(leafTexture, barkTexture) {
    this.branchMatrices = [];
    this.branchTreeIds = [];
    this.leafMatrices = [];
    this.leafTreeIds = [];
    this.leafColors = [];
    this.leafRandoms = [];
    this.leafWobbleX = [];
    this.leafWobbleY = [];
    this.leafSwayPhase = [];
    this.treeBounds = [];
    this.treeBranchRanges = [];
    this.treeLeafRanges = [];

    // Tree type presets for variety
    const treeTypes = [
      {
        levels: 4,
        branchAngle: 0.5,
        lengthFalloff: 0.7,
        radiusFalloff: 0.55,
        branches: 3,
      },
      {
        levels: 5,
        branchAngle: 0.4,
        lengthFalloff: 0.65,
        radiusFalloff: 0.5,
        branches: 2,
      },
      {
        levels: 4,
        branchAngle: 0.65,
        lengthFalloff: 0.72,
        radiusFalloff: 0.6,
        branches: 4,
      },
      {
        levels: 3,
        branchAngle: 0.55,
        lengthFalloff: 0.75,
        radiusFalloff: 0.58,
        branches: 3,
      },
      {
        levels: 4,
        branchAngle: 0.48,
        lengthFalloff: 0.68,
        radiusFalloff: 0.52,
        branches: 3,
      },
    ];

    for (let i = 0; i < this.treeCount; i++) {
      const rand = this._mulberry32(i * 54321 + 11111);

      // Position
      const r = CONFIG.CLEAR_RADIUS + Math.sqrt(rand()) * this.forestRadius;
      const theta = rand() * Math.PI * 2;
      const treeX = Math.cos(theta) * r;
      const treeZ = Math.sin(theta) * r;
      const treeRotation = rand() * Math.PI * 2;

      // Pick tree type
      const typeIndex = Math.floor(rand() * treeTypes.length);
      const treeType = treeTypes[typeIndex];

      // Per-tree variation
      const treeScale = 0.6 + rand() * 0.8;
      const leafHue = CONFIG.LEAF_HUE_MIN +
          rand() * (CONFIG.LEAF_HUE_MAX - CONFIG.LEAF_HUE_MIN);
      const leafLightness = CONFIG.LEAF_LIGHTNESS_MIN +
          rand() * (CONFIG.LEAF_LIGHTNESS_MAX - CONFIG.LEAF_LIGHTNESS_MIN);
      const trunkLength =
          (CONFIG.TRUNK_LENGTH_MIN +
           rand() * (CONFIG.TRUNK_LENGTH_MAX - CONFIG.TRUNK_LENGTH_MIN)) *
          treeScale;
      const trunkRadius =
          (CONFIG.TRUNK_RADIUS_MIN +
           rand() * (CONFIG.TRUNK_RADIUS_MAX - CONFIG.TRUNK_RADIUS_MIN)) *
          treeScale;

      this._generateTree(
          i,  // tree index
          treeX, treeZ, treeRotation, treeScale, leafHue, leafLightness,
          trunkLength, trunkRadius, treeType, rand);
    }

    const shaders = await loadShaders();
    this._buildMeshes(leafTexture, barkTexture, shaders);
    this._initVisibilityAttributes();

    return {
      group: this.group,
      stats: {
        trees: this.treeCount,
        branches: this.branchMatrices.length,
        leaves: this.leafMatrices.length,
      },
    };
  }

  _generateTree(
      treeIndex, x, z, rotation, scale, leafHue, leafLightness, trunkLength,
      trunkRadius, treeType, rand) {
    const origin = new THREE.Vector3(x, 0, z);
    const direction = new THREE.Vector3(0, 1, 0);

    // Slight tilt
    direction.x += (rand() - 0.5) * 0.12;
    direction.z += (rand() - 0.5) * 0.12;
    direction.normalize();

    // Estimate tree height for bounding sphere
    const estimatedHeight = trunkLength *
        (1 + treeType.lengthFalloff +
         treeType.lengthFalloff * treeType.lengthFalloff);
    const sphereRadius = Math.max(estimatedHeight * 0.6, trunkLength) * scale;
    const sphereCenter = new THREE.Vector3(x, estimatedHeight * 0.45, z);

    this.treeBounds.push({
      sphere: new THREE.Sphere(sphereCenter, sphereRadius),
      center: sphereCenter,
    });

    this._branch(
        origin, direction, trunkLength, trunkRadius, 0, rotation, scale,
        leafHue, leafLightness, treeType, treeIndex, rand);
  }

  _branch(
      start, direction, length, radius, level, treeRotation, treeScale, leafHue,
      leafLightness, treeType, treeIndex, rand) {
    if (level > treeType.levels || radius < 0.012) return;

    const end = start.clone().addScaledVector(direction, length);
    const mid = start.clone().lerp(end, 0.5);

    // Branch matrix
    this._quaternion.setFromUnitVectors(
        this._up, direction.clone().normalize());
    const topRadius = radius * treeType.radiusFalloff;
    const avgRadius = (radius + topRadius) * 0.5;
    this._scale.set(avgRadius, length, avgRadius);
    this._matrix.compose(mid, this._quaternion, this._scale);
    this.branchMatrices.push(this._matrix.clone());
    this.branchTreeIds.push(treeIndex);

    // Leaves at terminal branches - connected to branch end
    if (level >= treeType.levels - 1) {
      this._addLeaves(
          end, direction, treeScale, leafHue, leafLightness, rand, topRadius,
          level, treeType.levels, treeIndex);
    }

    // Child branches
    if (level < treeType.levels) {
      const numChildren = level === 0 ?
          treeType.branches + Math.floor(rand() * 2) :
          Math.max(1, treeType.branches - Math.floor(level * 0.3));

      for (let i = 0; i < numChildren; i++) {
        const twistAngle = (i / numChildren) * Math.PI * 2 +
            rand() * CONFIG.TWIST + treeRotation;
        const bendAngle = treeType.branchAngle +
            (rand() - 0.5) * CONFIG.BRANCH_ANGLE_VARIANCE * 2;

        const perp = new THREE.Vector3(1, 0, 0);
        if (Math.abs(direction.y) < 0.9) {
          perp.crossVectors(this._up, direction).normalize();
        } else {
          perp.crossVectors(new THREE.Vector3(0, 0, 1), direction).normalize();
        }

        const childDir = direction.clone();
        childDir.applyAxisAngle(perp, bendAngle);
        childDir.applyAxisAngle(direction, twistAngle);
        childDir.normalize();

        const startT = 0.4 + rand() * 0.5;
        const childStart = start.clone().lerp(end, startT);
        const childLength =
            length * treeType.lengthFalloff * (0.8 + rand() * 0.4);
        const childRadius = radius * treeType.radiusFalloff;

        this._branch(
            childStart, childDir, childLength, childRadius, level + 1,
            treeRotation, treeScale, leafHue, leafLightness, treeType,
            treeIndex, rand);
      }
    }
  }

  _addLeaves(
      branchEnd, branchDir, treeScale, leafHue, leafLightness, rand, topRadius,
      level, maxLevel, treeIndex) {
    const count = CONFIG.LEAF_DENSITY + Math.floor(rand() * 3);
    const size = CONFIG.LEAF_SIZE * treeScale;
    const spread = CONFIG.LEAF_SPREAD * treeScale;

    // Compute perpendicular axes to branch direction
    const perp1 = new THREE.Vector3(1, 0, 0);
    if (Math.abs(branchDir.y) > 0.9) perp1.set(0, 0, 1);
    perp1.crossVectors(branchDir, perp1).normalize();
    const perp2 =
        new THREE.Vector3().crossVectors(branchDir, perp1).normalize();

    for (let i = 0; i < count; i++) {
      // Angle around the branchleafScale
      const aroundAngle = rand() * Math.PI * 2;

      // How far along the branch tip (negative = back on branch)
      const alongBranch = -spread * 0.4 + rand() * spread * 0.5;

      // Outward direction from branch center at this angle
      const outward = new THREE.Vector3()
                          .addScaledVector(perp1, Math.cos(aroundAngle))
                          .addScaledVector(perp2, Math.sin(aroundAngle))
                          .normalize();

      // Use the actual branch tip radius
      const branchRadius = topRadius;
      // Attach leaf directly on branch surface (no negative along-branch
      // offset)
      const attachPoint =
          branchEnd.clone().addScaledVector(outward, branchRadius);

      // Leaf stem direction: outward from branch + along branch + slight upward
      const stemDir = new THREE.Vector3()
                          .addScaledVector(outward, 0.5 + rand() * 0.3)
                          .addScaledVector(branchDir, 0.3 + rand() * 0.4)
                          .add(new THREE.Vector3(0, 0.2 + rand() * 0.3, 0))
                          .normalize();

      // Leaf orientation: tip points along stem direction (Y axis of leaf)
      const leafUp = stemDir.clone();

      // Leaf face normal: perpendicular to stem, biased upward
      let leafNormal = new THREE.Vector3(0, 1, 0).addScaledVector(
          outward, (rand() - 0.5) * 0.5);
      leafNormal.sub(leafUp.clone().multiplyScalar(leafNormal.dot(leafUp)))
          .normalize();

      if (leafNormal.lengthSq() < 0.1) {
        leafNormal.copy(outward);
        leafNormal.sub(leafUp.clone().multiplyScalar(leafNormal.dot(leafUp)))
            .normalize();
      }

      // Build rotation matrix (frame BEFORE jitter)
      const leafRight =
          new THREE.Vector3().crossVectors(leafUp, leafNormal).normalize();
      leafNormal.crossVectors(leafRight, leafUp).normalize();

      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeBasis(leafRight, leafUp, leafNormal);

      // Apply small random jitter BEFORE positioning
      const jitterQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
          (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.2));
      const leafQuat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
      leafQuat.multiply(jitterQuat);

      // PlaneGeometry is 1x1, centered at origin. Local bottom Y = -0.5
      const localBottom = new THREE.Vector3(0, this._leafBottomY, 0);

      // Rotate bottom by leaf rotation (including jitter now!)
      const rotatedBottom = localBottom.clone().applyQuaternion(leafQuat);

      // Compute leaf scale
      // subtle taper: leaves at top ~80–100% size
      const taperFactor =
          0.8 + 0.2 * (1 - level / maxLevel);  // 0.8 → 1.0 from top to base
      const leafScale = size * (0.5 + rand() * 0.5) * taperFactor;

      // Compute final leaf position so bottom lands at attachPoint
      const leafPos = attachPoint.clone().sub(
          rotatedBottom.clone().multiplyScalar(leafScale));

      // Compose final matrix
      this._scale.set(leafScale, leafScale, leafScale);
      this._matrix.compose(leafPos, leafQuat, this._scale);
      this.leafMatrices.push(this._matrix.clone());
      this.leafTreeIds.push(treeIndex);

      // Base color with small per-leaf variation
      let h = leafHue + (rand() - 0.5) * 0.05;
      let s = CONFIG.LEAF_SATURATION + rand() * 0.15;
      let l = leafLightness + (rand() - 0.5) * 0.08;

      // Small fraction of leaves get a tint (either slightly yellower or
      // slightly grayer)
      if (rand() < CONFIG.LEAF_TINGE_PERCENT) {
        if (rand() < CONFIG.LEAF_TINGE_YELLOW_CHANCE) {
          // yellowish tinge: shift hue a little toward warm
          h += CONFIG.LEAF_TINGE_HUE_SHIFT;
          l = Math.min(1.0, l + CONFIG.LEAF_TINGE_LIGHT_SHIFT);
        } else {
          // grayish tinge: reduce saturation slightly, slightly darker
          s = Math.max(0.0, s - CONFIG.LEAF_TINGE_SAT_SHIFT);
          l = Math.max(0.0, l - CONFIG.LEAF_TINGE_LIGHT_SHIFT);
        }
      }

      this._color.setHSL(h, s, l);
      this.leafColors.push(this._color.r, this._color.g, this._color.b);

      // Pre-compute random values for shader (optimization)
      const leafRand = rand();
      const wobbleX = (rand() - 0.5) * 0.12;
      const wobbleY = (rand() - 0.5) * 0.12;

      // Single per-leaf sway phase (we'll use a single sin(time + phase) in the
      // shader)
      const swayPhase = rand() * Math.PI * 2.0;

      this.leafRandoms.push(leafRand);
      this.leafWobbleX.push(wobbleX);
      this.leafWobbleY.push(wobbleY);
      this.leafSwayPhase.push(swayPhase);
    }
  }

  _buildMeshes(leafTexture, barkTexture, shaders) {
    // Clear previous
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.group.remove(child);
    }

    // Build tree ranges (contiguous spans per tree)
    this._buildTreeRanges();

    // --- BARK ---
    if (this.branchMatrices.length > 0) {
      const barkGeo =
          new THREE.CylinderGeometry(1, 1, 1, CONFIG.BARK_SEGMENTS, 1);

      // PERFORMANCE: Custom shader replaces MeshStandardMaterial to enable
      // distance-based green tinting. When leaves are culled at distance,
      // branches shift toward green to maintain visual density. This is
      // essentially free - one smoothstep in vertex, one mix in fragment.
      const barkMat = new THREE.ShaderMaterial({
        uniforms: {
          barkTexture: {value: barkTexture},
          barkColor: {value: new THREE.Color(...CONFIG.BARK_COLOR)},
          leafTintColor: {
            value: new THREE.Color(...CONFIG.BARK_DISTANT_TINT),
          },
          sunDirection: {
            value: new THREE.Vector3(0.5, 1.0, 0.3).normalize(),
          },
          sunColor: {value: new THREE.Color(1.0, 0.98, 0.9)},
          ambientLight: {value: new THREE.Color(0.5, 0.52, 0.48)},
          leafFadeStart: {value: CONFIG.LOD_FADE_START},
          maxLeafDistance: {value: CONFIG.LOD_MAX_DISTANCE},
          rootSpreadMin: {value: CONFIG.ROOT_SPREAD_MIN},
          rootSpreadMax: {value: CONFIG.ROOT_SPREAD_MAX},
          rootHeightMin: {value: CONFIG.ROOT_HEIGHT_MIN},
          rootHeightMax: {value: CONFIG.ROOT_HEIGHT_MAX},
          rootBumpsMin: {value: CONFIG.ROOT_BUMPS_MIN},
          rootBumpsMax: {value: CONFIG.ROOT_BUMPS_MAX},
        },
        vertexShader: shaders.barkVertex,
        fragmentShader: shaders.barkFragment,
      });

      const barkMesh =
          new THREE.InstancedMesh(barkGeo, barkMat, this.branchMatrices.length);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        barkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        barkMesh.frustumCulled = false;
      } else {
        barkMesh.frustumCulled = true;
      }
      barkMesh.castShadow = true;
      barkMesh.receiveShadow = true;

      // Initialize with all instances
      for (let i = 0; i < this.branchMatrices.length; i++) {
        barkMesh.setMatrixAt(i, this.branchMatrices[i]);
      }
      barkMesh.instanceMatrix.needsUpdate = true;
      barkMesh.count = this.branchMatrices.length;

      this.group.add(barkMesh);
      this.meshes.bark = barkMesh;
      this.barkMat = barkMat;
    }

    // --- LEAVES ---
    if (this.leafMatrices.length > 0) {
      const leafGeo = this._leafGeo;  // reuse the precomputed geometry

      const leafMat = new THREE.ShaderMaterial({
        uniforms: {
          leafTexture: {value: leafTexture},
          sunDirection: {
            value: new THREE.Vector3(0.5, 1.0, 0.3).normalize(),
          },
          sunColor: {value: new THREE.Color(1.0, 0.98, 0.9)},
          ambientLight: {value: new THREE.Color(0.65, 0.7, 0.6)},
          time: {value: 0.0},
          maxLeafDistance: {value: CONFIG.LOD_MAX_DISTANCE},
          leafFadeStart: {value: CONFIG.LOD_FADE_START},
        },
        vertexShader: shaders.leafVertex,
        fragmentShader: shaders.leafFragment,
        side: THREE.DoubleSide,
      });

      const leafMesh =
          new THREE.InstancedMesh(leafGeo, leafMat, this.leafMatrices.length);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        leafMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        leafMesh.frustumCulled = false;
      } else {
        leafMesh.frustumCulled = true;
      }
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = false;

      // Initialize matrices
      for (let i = 0; i < this.leafMatrices.length; i++) {
        leafMesh.setMatrixAt(i, this.leafMatrices[i]);
      }
      leafMesh.instanceMatrix.needsUpdate = true;

      // Create and populate per-instance attributes
      const colorAttr = new THREE.InstancedBufferAttribute(
          new Float32Array(this.leafColors), 3);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        colorAttr.setUsage(THREE.DynamicDrawUsage);
      }
      leafMesh.geometry.setAttribute('instanceColorAttr', colorAttr);

      const randomAttr = new THREE.InstancedBufferAttribute(
          new Float32Array(this.leafRandoms), 1);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        randomAttr.setUsage(THREE.DynamicDrawUsage);
      }
      leafMesh.geometry.setAttribute('instanceRandom', randomAttr);

      const wobbleXAttr = new THREE.InstancedBufferAttribute(
          new Float32Array(this.leafWobbleX), 1);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        wobbleXAttr.setUsage(THREE.DynamicDrawUsage);
      }
      leafMesh.geometry.setAttribute('instanceWobbleX', wobbleXAttr);

      const wobbleYAttr = new THREE.InstancedBufferAttribute(
          new Float32Array(this.leafWobbleY), 1);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        wobbleYAttr.setUsage(THREE.DynamicDrawUsage);
      }
      leafMesh.geometry.setAttribute('instanceWobbleY', wobbleYAttr);

      const swayAttr = new THREE.InstancedBufferAttribute(
          new Float32Array(this.leafSwayPhase), 1);
      if (CONFIG.CUSTOM_TREE_CULLING) {
        swayAttr.setUsage(THREE.DynamicDrawUsage);
      }
      leafMesh.geometry.setAttribute('instanceSwayPhase', swayAttr);

      leafMesh.count = this.leafMatrices.length;

      this.group.add(leafMesh);
      this.meshes.leaves = leafMesh;
      this.leafMat = leafMat;  // Store reference for time updates
    }
  }

  _buildTreeRanges() {
    // Sort instances by treeId to create contiguous ranges
    // This allows us to copy whole tree chunks efficiently

    // Build branch ranges
    const branchByTree = new Map();
    for (let i = 0; i < this.branchTreeIds.length; i++) {
      const treeId = this.branchTreeIds[i];
      if (!branchByTree.has(treeId)) branchByTree.set(treeId, []);
      branchByTree.get(treeId).push(i);
    }

    // Build leaf ranges
    const leafByTree = new Map();
    for (let i = 0; i < this.leafTreeIds.length; i++) {
      const treeId = this.leafTreeIds[i];
      if (!leafByTree.has(treeId)) leafByTree.set(treeId, []);
      leafByTree.get(treeId).push(i);
    }

    // Store ranges for each tree
    for (let t = 0; t < this.treeCount; t++) {
      this.treeBranchRanges[t] = branchByTree.get(t) || [];
      this.treeLeafRanges[t] = leafByTree.get(t) || [];
    }
  }

  _initVisibilityAttributes() {
    this.lastTreeVisible = new Uint8Array(this.treeCount);
    this.lastTreeVisible.fill(1);
    this.visibleBranchCount = this.branchMatrices.length;
    this.visibleLeafCount = this.leafMatrices.length;
    this.visibleTreeCount = this.treeCount;

    // Pre-allocate flat arrays for fast copying
    this._branchMatrixData = new Float32Array(this.branchMatrices.length * 16);
    for (let i = 0; i < this.branchMatrices.length; i++) {
      this.branchMatrices[i].toArray(this._branchMatrixData, i * 16);
    }

    this._leafMatrixData = new Float32Array(this.leafMatrices.length * 16);
    for (let i = 0; i < this.leafMatrices.length; i++) {
      this.leafMatrices[i].toArray(this._leafMatrixData, i * 16);
    }

    // Pre-convert leaf attributes to typed arrays if not already
    this._leafColorsArray = new Float32Array(this.leafColors);
    this._leafRandomsArray = new Float32Array(this.leafRandoms);
    this._leafWobbleXArray = new Float32Array(this.leafWobbleX);
    this._leafWobbleYArray = new Float32Array(this.leafWobbleY);
    this._leafSwayPhaseArray = new Float32Array(this.leafSwayPhase);
  }

  updateVisibility(camera) {
    // Throttle: only update if camera moved significantly
    const MOVE_THRESHOLD = 0.5;
    const ROTATE_THRESHOLD = 0.01;

    const moved = camera.position.distanceTo(this._lastCamPos) > MOVE_THRESHOLD;
    const rotated =
        camera.quaternion.angleTo(this._lastCamQuat) > ROTATE_THRESHOLD;

    if (!moved && !rotated) {
      return this.visibleTreeCount;
    }

    this._lastCamPos.copy(camera.position);
    this._lastCamQuat.copy(camera.quaternion);

    // Update frustum
    this._projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);

    // Check which trees are visible
    let visibleTreeCount = 0;
    let needsUpdate = false;

    for (let t = 0; t < this.treeCount; t++) {
      const visible =
          this._frustum.intersectsSphere(this.treeBounds[t].sphere) ? 1 : 0;
      if (visible) visibleTreeCount++;
      if (visible !== this.lastTreeVisible[t]) {
        needsUpdate = true;
      }
      this.lastTreeVisible[t] = visible;
      visibleTreeCount;
    }

    this.visibleTreeCount = visibleTreeCount;

    // Early exit: if all visible and was all visible, skip rebuild
    if (visibleTreeCount === this.treeCount && !needsUpdate) {
      return visibleTreeCount;
    }

    // Only rebuild if visibility changed
    if (needsUpdate) {
      this._rebuildDrawOrder();
    }

    return visibleTreeCount;
  }

  _rebuildDrawOrder() {
    const barkMesh = this.meshes.bark;
    const leafMesh = this.meshes.leaves;

    const barkMatrixArray = barkMesh.instanceMatrix.array;
    const leafMatrixArray = leafMesh.instanceMatrix.array;
    const colorArray = leafMesh.geometry.attributes.instanceColorAttr.array;
    const randomArray = leafMesh.geometry.attributes.instanceRandom.array;
    const wobbleXArray = leafMesh.geometry.attributes.instanceWobbleX.array;
    const wobbleYArray = leafMesh.geometry.attributes.instanceWobbleY.array;
    const swayArray = leafMesh.geometry.attributes.instanceSwayPhase.array;

    let branchWriteIdx = 0;
    let leafWriteIdx = 0;

    for (let t = 0; t < this.treeCount; t++) {
      if (!this.lastTreeVisible[t]) continue;

      // Copy branch matrices (16 floats each)
      const branchIndices = this.treeBranchRanges[t];
      for (let i = 0; i < branchIndices.length; i++) {
        const srcOffset = branchIndices[i] * 16;
        const dstOffset = branchWriteIdx * 16;
        barkMatrixArray.set(
            this._branchMatrixData.subarray(srcOffset, srcOffset + 16),
            dstOffset);
        branchWriteIdx++;
      }

      // Copy leaf data
      const leafIndices = this.treeLeafRanges[t];
      for (let i = 0; i < leafIndices.length; i++) {
        const srcIdx = leafIndices[i];
        const srcOffset16 = srcIdx * 16;
        const dstOffset16 = leafWriteIdx * 16;
        const srcOffset3 = srcIdx * 3;
        const dstOffset3 = leafWriteIdx * 3;

        // Copy matrix (16 floats)
        leafMatrixArray.set(
            this._leafMatrixData.subarray(srcOffset16, srcOffset16 + 16),
            dstOffset16);

        // Copy color (3 floats)
        colorArray.set(
            this._leafColorsArray.subarray(srcOffset3, srcOffset3 + 3),
            dstOffset3);

        // Copy single floats
        randomArray[leafWriteIdx] = this._leafRandomsArray[srcIdx];
        wobbleXArray[leafWriteIdx] = this._leafWobbleXArray[srcIdx];
        wobbleYArray[leafWriteIdx] = this._leafWobbleYArray[srcIdx];
        swayArray[leafWriteIdx] = this._leafSwayPhaseArray[srcIdx];

        leafWriteIdx++;
      }
    }

    this.visibleBranchCount = branchWriteIdx;
    this.visibleLeafCount = leafWriteIdx;

    barkMesh.count = branchWriteIdx;
    barkMesh.instanceMatrix.needsUpdate = true;

    leafMesh.count = leafWriteIdx;
    leafMesh.instanceMatrix.needsUpdate = true;
    leafMesh.geometry.attributes.instanceColorAttr.needsUpdate = true;
    leafMesh.geometry.attributes.instanceRandom.needsUpdate = true;
    leafMesh.geometry.attributes.instanceWobbleX.needsUpdate = true;
    leafMesh.geometry.attributes.instanceWobbleY.needsUpdate = true;
    leafMesh.geometry.attributes.instanceSwayPhase.needsUpdate = true;
  }

  dispose() {
    for (const mesh of Object.values(this.meshes)) {
      if (mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    }
  }
}