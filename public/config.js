// ============================================================================
// CONFIG - All tweakable parameters
// ============================================================================

export const CONFIG = {
  // Forest
  TREE_COUNT: 50,
  FOREST_RADIUS: 80,
  CLEAR_RADIUS: 5,
  CUSTOM_TREE_CULLING: false,

  // Tree structure
  TRUNK_LENGTH_MIN: 4,
  TRUNK_LENGTH_MAX: 7,
  TRUNK_RADIUS_MIN: 0.18,
  TRUNK_RADIUS_MAX: 0.35,
  BRANCH_LEVELS: 4,
  BRANCH_ANGLE: 0.55,
  BRANCH_ANGLE_VARIANCE: 0.25,
  LENGTH_FALLOFF: 0.68,
  RADIUS_FALLOFF: 0.55,
  BRANCHES_PER_NODE: 3,
  TWIST: 0.5,

  // Leaves
  LEAF_SIZE: 0.8,
  LEAF_DENSITY: 4,
  LEAF_SPREAD: 0.8,

  // Colors
  BARK_COLOR: [0.24, 0.16, 0.09],
  BARK_DISTANT_TINT: [
    0.29, 0.52, 0.27
  ],  // Green tint for distant branches when leaves are culled
  LEAF_HUE_MIN: 0.0,
  LEAF_HUE_MAX: 0.1,
  LEAF_SATURATION: 0.6,
  LEAF_LIGHTNESS_MIN: 0.7,
  LEAF_LIGHTNESS_MAX: 0.9,

  // Leaf tinge (small percentage of leaves slightly pinkish or lighter)
  LEAF_TINGE_PERCENT: 0.15,  // fraction of leaves that get a tinge (15%)
  LEAF_TINGE_YELLOW_CHANCE:
      0.5,  // of those tinged leaves, chance to be pinkish vs lighter
  LEAF_TINGE_HUE_SHIFT: 0.02,    // pinkish: shift hue slightly toward pink
  LEAF_TINGE_SAT_SHIFT: 0.15,    // lighter: reduce saturation slightly, increase lightness
  LEAF_TINGE_LIGHT_SHIFT: 0.1,  // subtle lightness tweak for tinges

  // LOD (Level of Detail)
  LOD_FADE_START: 120,      // Distance where leaves begin shrinking
  LOD_MAX_DISTANCE: 200,    // Distance where leaves are fully culled
  LOD_SWAY_DISTANCE: 50,    // Distance within which leaves animate
  LOD_SWAY_FADE_START: 30,  // Distance where sway animation begins fading

  // Roots
  ROOT_SPREAD_MIN: 0.2,
  ROOT_SPREAD_MAX: 0.6,
  ROOT_HEIGHT_MIN: 0.3,
  ROOT_HEIGHT_MAX: 0.6,
  ROOT_BUMPS_MIN: 2,
  ROOT_BUMPS_MAX: 5,

  // Rendering
  BARK_SEGMENTS: 8,
  SUN_INTENSITY: 2.0,
  AMBIENT_INTENSITY: 0.9,
  EXPOSURE: 1.6,
};