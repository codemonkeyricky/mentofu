import * as THREE from 'three';

// ============================================================================
// PROCEDURAL LEAF TEXTURE
// ============================================================================

export function createLeafTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  function leafPath(ctx) {
    const s = size;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.03);
    ctx.bezierCurveTo(
        s * 0.78, s * 0.18, s * 0.82, s * 0.65, s * 0.5, s * 0.97);
    ctx.bezierCurveTo(
        s * 0.18, s * 0.65, s * 0.22, s * 0.18, s * 0.5, s * 0.03);
  }

  // Brighter base gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#6ab560');
  gradient.addColorStop(0.3, '#5aa052');
  gradient.addColorStop(0.7, '#4a9045');
  gradient.addColorStop(1, '#3d8038');

  leafPath(ctx);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Noise overlay
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = Math.random() * 40 - 20;
    ctx.fillStyle = `rgba(${128 + brightness}, ${128 + brightness}, ${
        128 + brightness}, 0.04)`;
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Clip to leaf shape for veins
  ctx.save();
  leafPath(ctx);
  ctx.clip();

  // Central vein - subtle
  ctx.strokeStyle = 'rgba(35, 60, 30, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.08);
  ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.5, size * 0.92);
  ctx.stroke();

  // Highlight along center
  ctx.strokeStyle = 'rgba(140, 180, 130, 0.1)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.1);
  ctx.quadraticCurveTo(size * 0.48, size * 0.5, size * 0.5, size * 0.88);
  ctx.stroke();

  // Side veins - very subtle
  ctx.strokeStyle = 'rgba(40, 65, 35, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = size * (0.2 + i * 0.11);
    const spread = size * (0.18 + i * 0.02);
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(
        size * 0.5 - spread * 0.5, y + size * 0.04, size * 0.5 - spread,
        y + size * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(
        size * 0.5 + spread * 0.5, y + size * 0.04, size * 0.5 + spread,
        y + size * 0.06);
    ctx.stroke();
  }
  ctx.restore();

  // Soft edge darkening
  ctx.globalCompositeOperation = 'source-atop';
  const edgeGradient = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.5);
  edgeGradient.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGradient.addColorStop(0.7, 'rgba(0,0,0,0)');
  edgeGradient.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // --- Enable mipmaps ---
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  return texture;
}

// ============================================================================
// PROCEDURAL CHERRY BLOSSOM TEXTURE
// ============================================================================

export function createCherryBlossomTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  // Create a cherry blossom petal shape using bezier curves
  function petalPath(ctx) {
    const s = size;
    ctx.beginPath();
    // Petal base
    ctx.moveTo(s * 0.5, s * 0.1);
    // Petal tip with curve
    ctx.bezierCurveTo(
        s * 0.7, s * 0.2, s * 0.8, s * 0.6, s * 0.5, s * 0.9);
    // Back to base with curve
    ctx.bezierCurveTo(
        s * 0.2, s * 0.6, s * 0.3, s * 0.2, s * 0.5, s * 0.1);
  }

  // Create a soft pink gradient for cherry blossom petals
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#f8c6d0'); // Light pink at top
  gradient.addColorStop(0.3, '#f4a7b9'); // Medium pink
  gradient.addColorStop(0.7, '#f28aa1'); // Slightly darker pink
  gradient.addColorStop(1, '#e66d8a'); // Darker pink at bottom

  petalPath(ctx);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add some subtle noise for natural appearance
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = Math.random() * 30 - 15;
    ctx.fillStyle = `rgba(${255 + brightness}, ${200 + brightness}, ${
        220 + brightness}, 0.06)`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Clip to petal shape for veins
  ctx.save();
  petalPath(ctx);
  ctx.clip();

  // Central vein - subtle pink
  ctx.strokeStyle = 'rgba(240, 150, 170, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.15);
  ctx.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.5, size * 0.85);
  ctx.stroke();

  // Side veins - very subtle
  ctx.strokeStyle = 'rgba(240, 160, 180, 0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const y = size * (0.25 + i * 0.15);
    const spread = size * (0.15 + i * 0.03);
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(
        size * 0.5 - spread * 0.5, y + size * 0.03, size * 0.5 - spread,
        y + size * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.5, y);
    ctx.quadraticCurveTo(
        size * 0.5 + spread * 0.5, y + size * 0.03, size * 0.5 + spread,
        y + size * 0.05);
    ctx.stroke();
  }
  ctx.restore();

  // Add some soft highlights for translucency effect
  ctx.globalCompositeOperation = 'lighten';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.2 + 0.05;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Soft edge darkening for natural look
  ctx.globalCompositeOperation = 'source-atop';
  const edgeGradient = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.5);
  edgeGradient.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGradient.addColorStop(0.7, 'rgba(0,0,0,0)');
  edgeGradient.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // --- Enable mipmaps ---
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  return texture;
}

// ============================================================================
// BARK TEXTURE
// ============================================================================

export function createBarkTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base brown
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(0, 0, size, size);

  // Vertical streaks (bark grain)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const width = 1 + Math.random() * 4;
    const lightness = Math.random() > 0.5 ? 25 : -25;
    ctx.fillStyle =
        `rgba(${100 + lightness}, ${60 + lightness}, ${30 + lightness}, 0.4)`;
    ctx.fillRect(x, 0, width, size);
  }

  // Horizontal cracks
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 8) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
    }
    ctx.stroke();
  }

  // Light highlights (raised bark)
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 5 + Math.random() * 15;
    const h = 20 + Math.random() * 40;
    ctx.fillStyle = `rgba(160, 120, 80, ${0.1 + Math.random() * 0.15})`;
    ctx.fillRect(x, y, w, h);
  }

  // Fine noise for roughness
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const b = Math.random() > 0.5 ? 35 : -35;
    ctx.fillStyle = `rgba(${100 + b}, ${65 + b}, ${35 + b}, 0.15)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Dark knots
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(20, 10, 5, ${0.3 + Math.random() * 0.3})`;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}