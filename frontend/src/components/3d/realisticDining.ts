/**
 * Realistic dining furniture for the Three.js floor plan.
 * Everything is procedural (canvas textures + lathe/extrude geometry), so no image assets are needed.
 *
 * Units: ~1 unit ≈ 0.65 m. Tabletop sits at y = 1.15, chair seat at y = 0.68.
 */
import * as THREE from 'three';

const TABLE_TOP_Y = 1.15;

// ─────────────────────────── Procedural textures ───────────────────────────

const canvasTexture = (size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
};

/** Walnut with flowing grain lines and pores */
export const createWalnutTexture = () =>
  canvasTexture(512, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, 0);
    grad.addColorStop(0, '#5a3722');
    grad.addColorStop(0.5, '#6b4329');
    grad.addColorStop(1, '#553320');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const y0 = Math.random() * s;
      const amp = 4 + Math.random() * 10;
      const freq = 0.004 + Math.random() * 0.01;
      const phase = Math.random() * Math.PI * 2;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(40,22,12,0.35)' : 'rgba(140,95,60,0.18)';
      ctx.lineWidth = 0.6 + Math.random() * 1.8;
      ctx.beginPath();
      for (let x = 0; x <= s; x += 4) {
        const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = `rgba(30,15,8,${Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1);
    }
  });

/** Off-white linen with a fine weave */
export const createLinenTexture = () =>
  canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#f3efe6';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) {
      ctx.fillStyle = `rgba(150,140,120,${0.04 + Math.random() * 0.05})`;
      ctx.fillRect(0, i, s, 1);
      ctx.fillStyle = `rgba(150,140,120,${0.03 + Math.random() * 0.04})`;
      ctx.fillRect(i, 0, 1, s);
    }
  }, 3);

/** Velvet-like upholstery in the given base colour */
export const createFabricTexture = (base: string) =>
  canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1800; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${v * 0.06})` : `rgba(0,0,0,${v * 0.18})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  }, 2);

// ─────────────────────────── Shared materials ───────────────────────────

let shared: ReturnType<typeof createMaterials> | null = null;

const createMaterials = () => ({
  walnut: new THREE.MeshStandardMaterial({ map: createWalnutTexture(), roughness: 0.38, metalness: 0.05 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x2b1a10, roughness: 0.5 }),
  linen: new THREE.MeshStandardMaterial({ map: createLinenTexture(), roughness: 0.92, side: THREE.DoubleSide }),
  fabric: new THREE.MeshStandardMaterial({ map: createFabricTexture('#5b2333'), roughness: 0.85, side: THREE.DoubleSide }),
  fabricAlt: new THREE.MeshStandardMaterial({ map: createFabricTexture('#2f4a3a'), roughness: 0.85, side: THREE.DoubleSide }),
  porcelain: new THREE.MeshPhysicalMaterial({ color: 0xfbfaf7, roughness: 0.15, clearcoat: 0.6, side: THREE.DoubleSide }),
  charger: new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.85, roughness: 0.3 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 0.95, thickness: 0.05, roughness: 0.03, ior: 1.5,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  }),
  redWine: new THREE.MeshPhysicalMaterial({ color: 0x5a0a16, roughness: 0.1, transmission: 0.3, transparent: true, opacity: 0.9 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transmission: 0.9, roughness: 0.02, transparent: true, opacity: 0.4 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.18 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.25 }),
  napkin: new THREE.MeshStandardMaterial({ color: 0x7a1f2b, roughness: 0.9 }),
  wax: new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.6 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffc46b }),
  shade: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffd9a0, emissiveIntensity: 2.2 }),
  cord: new THREE.MeshBasicMaterial({ color: 0x111111 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2f6b34, roughness: 0.7 }),
  flowers: [0xe94f64, 0xf4c95d, 0xffffff].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })),
  food: [
    new THREE.MeshStandardMaterial({ color: 0xc8641e, roughness: 0.7 }), // curry
    new THREE.MeshStandardMaterial({ color: 0xe9d9a6, roughness: 0.8 }), // rice
    new THREE.MeshStandardMaterial({ color: 0x4f8a2b, roughness: 0.7 }), // greens
  ],
});

const mats = () => (shared ??= createMaterials());

// ─────────────────────────── Geometry helpers ───────────────────────────

const lathe = (pts: [number, number][], segments = 40) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);

/** Box with soft rounded edges (for cushions and backrests) */
const roundedBox = (w: number, h: number, d: number, r: number) => {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + d - r);
  shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  shape.lineTo(x + r, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const bevel = Math.min(r, h / 2) * 0.9;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, h - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
};

// Cached geometries
let geos: ReturnType<typeof createGeometries> | null = null;
const createGeometries = () => ({
  plate: lathe([[0, 0], [0.17, 0], [0.19, 0.012], [0.25, 0.03], [0.27, 0.034], [0.27, 0.04]]),
  charger: new THREE.CylinderGeometry(0.31, 0.31, 0.012, 40),
  wineGlass: lathe([[0, 0], [0.07, 0], [0.07, 0.006], [0.012, 0.014], [0.01, 0.15], [0.03, 0.17], [0.07, 0.22], [0.075, 0.28], [0.06, 0.34]], 28),
  wine: lathe([[0, 0.172], [0.035, 0.172], [0.064, 0.21], [0.069, 0.235], [0, 0.235]], 24),
  tumbler: lathe([[0, 0], [0.05, 0], [0.058, 0.2], [0.056, 0.2], [0.048, 0.01], [0, 0.01]], 24),
  waterFill: new THREE.CylinderGeometry(0.051, 0.047, 0.12, 20),
  forkTines: new THREE.BoxGeometry(0.03, 0.006, 0.07),
  handle: new THREE.BoxGeometry(0.016, 0.008, 0.17),
  knifeBlade: new THREE.BoxGeometry(0.024, 0.004, 0.1),
  napkin: new THREE.BoxGeometry(0.14, 0.025, 0.2),
  foodMound: new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  candle: new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16),
  holder: lathe([[0, 0], [0.07, 0], [0.075, 0.03], [0.05, 0.05], [0.045, 0.05]], 24),
  flame: new THREE.SphereGeometry(0.018, 8, 8),
  vase: lathe([[0, 0], [0.06, 0], [0.08, 0.06], [0.05, 0.16], [0.035, 0.22], [0.045, 0.24]], 24),
  bloom: new THREE.SphereGeometry(0.045, 10, 8),
  leaf: new THREE.ConeGeometry(0.025, 0.12, 5),
  shade: lathe([[0.04, 0.32], [0.08, 0.3], [0.32, 0.02], [0.34, 0]], 36),
  bulb: new THREE.SphereGeometry(0.07, 16, 12),
  cord: new THREE.CylinderGeometry(0.008, 0.008, 1, 6),
});
const g = () => (geos ??= createGeometries());

const shadowAll = (obj: THREE.Object3D) =>
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

// ─────────────────────────── Pieces ───────────────────────────

/** One guest's place setting, facing +Z (towards the guest) at the origin of the returned group */
const buildPlaceSetting = (withFood: boolean) => {
  const m = mats();
  const G = g();
  const set = new THREE.Group();

  const charger = new THREE.Mesh(G.charger, m.charger);
  charger.position.y = 0.006;
  set.add(charger);
  const plate = new THREE.Mesh(G.plate, m.porcelain);
  plate.position.y = 0.012;
  set.add(plate);

  if (withFood) {
    const main = new THREE.Mesh(G.foodMound, m.food[Math.floor(Math.random() * 2)]);
    main.scale.set(1, 0.45, 1);
    main.position.set(-0.04, 0.035, 0);
    set.add(main);
    const side = new THREE.Mesh(G.foodMound, m.food[2]);
    side.scale.set(0.5, 0.35, 0.5);
    side.position.set(0.09, 0.035, 0.03);
    set.add(side);
  } else {
    // Folded napkin on an unused plate
    const napkin = new THREE.Mesh(G.napkin, m.napkin);
    napkin.position.y = 0.05;
    napkin.rotation.y = 0.15;
    set.add(napkin);
  }

  // Fork (left)
  const fork = new THREE.Group();
  const fh = new THREE.Mesh(G.handle, m.silver);
  const ft = new THREE.Mesh(G.forkTines, m.silver);
  ft.position.z = -0.12;
  fork.add(fh, ft);
  fork.position.set(-0.36, 0.006, 0);
  set.add(fork);

  // Knife (right)
  const knife = new THREE.Group();
  const kh = new THREE.Mesh(G.handle, m.silver);
  const kb = new THREE.Mesh(G.knifeBlade, m.silver);
  kb.position.z = -0.13;
  knife.add(kh, kb);
  knife.position.set(0.36, 0.006, 0);
  set.add(knife);

  // Wine glass + water tumbler (top right)
  const wine = new THREE.Group();
  wine.add(new THREE.Mesh(G.wineGlass, m.glass));
  if (withFood) wine.add(new THREE.Mesh(G.wine, m.redWine));
  wine.position.set(0.3, 0, -0.32);
  set.add(wine);

  const water = new THREE.Group();
  water.add(new THREE.Mesh(G.tumbler, m.glass));
  const fill = new THREE.Mesh(G.waterFill, m.water);
  fill.position.y = 0.07;
  water.add(fill);
  water.position.set(0.12, 0, -0.38);
  set.add(water);

  return set;
};

const buildCenterpiece = () => {
  const m = mats();
  const G = g();
  const c = new THREE.Group();

  const vase = new THREE.Mesh(G.vase, m.porcelain);
  c.add(vase);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const bloom = new THREE.Mesh(G.bloom, m.flowers[i % m.flowers.length]);
    bloom.position.set(Math.cos(a) * 0.05, 0.29 + (i % 2) * 0.04, Math.sin(a) * 0.05);
    c.add(bloom);
    const leaf = new THREE.Mesh(G.leaf, m.leaf);
    leaf.position.set(Math.cos(a + 0.6) * 0.07, 0.25, Math.sin(a + 0.6) * 0.07);
    leaf.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8);
    c.add(leaf);
  }

  // Tealights either side
  [-0.22, 0.22].forEach((x) => {
    const holder = new THREE.Mesh(G.holder, m.glass);
    holder.position.x = x;
    const candle = new THREE.Mesh(G.candle, m.wax);
    candle.position.set(x, 0.04, 0);
    const flame = new THREE.Mesh(G.flame, m.flame);
    flame.scale.set(0.8, 1.8, 0.8);
    flame.position.set(x, 0.11, 0);
    flame.userData.flicker = true;
    c.add(holder, candle, flame);
  });
  return c;
};

/** Upholstered dining chair facing +Z, origin at floor centre of the seat */
const buildChair = (fabric: THREE.Material) => {
  const m = mats();
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(roundedBox(0.56, 0.1, 0.54, 0.05), fabric);
  seat.position.y = 0.68;
  chair.add(seat);

  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.52), m.darkWood);
  apron.position.y = 0.6;
  chair.add(apron);

  // Slightly splayed, tapered legs
  const legGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.6, 10);
  [[-0.23, 0.22], [0.23, 0.22], [-0.23, -0.22], [0.23, -0.22]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, m.darkWood);
    leg.position.set(x * 1.03, 0.3, z * 1.03);
    leg.rotation.set(z > 0 ? -0.04 : 0.04, 0, x > 0 ? 0.04 : -0.04);
    chair.add(leg);
  });

  // Rear uprights + curved, padded backrest
  const postGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.62, 10);
  [-0.24, 0.24].forEach((x) => {
    const post = new THREE.Mesh(postGeo, m.darkWood);
    post.position.set(x, 0.98, -0.25);
    post.rotation.x = -0.12;
    chair.add(post);
  });
  const backGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.36, 24, 1, true, Math.PI - 0.3, 0.6);
  const back = new THREE.Mesh(backGeo, fabric);
  back.position.set(0, 1.08, 0.62);
  back.rotation.x = -0.12;
  chair.add(back);

  return chair;
};

const buildPendant = (dropTo: number) => {
  const m = mats();
  const G = g();
  const lamp = new THREE.Group();
  const shade = new THREE.Mesh(G.shade, m.shade);
  lamp.add(shade);
  const bulb = new THREE.Mesh(G.bulb, m.bulb);
  bulb.position.y = 0.05;
  lamp.add(bulb);
  const cordLen = 9 - dropTo;
  const cord = new THREE.Mesh(G.cord, m.cord);
  cord.scale.y = cordLen;
  cord.position.y = 0.32 + cordLen / 2;
  lamp.add(cord);
  lamp.position.y = dropTo;

  // Warm pool of light on the table (no shadow map to keep it fast)
  const light = new THREE.PointLight(0xffc98a, 2.2, 4.2, 1.6);
  light.position.y = -0.05;
  lamp.add(light);
  return lamp;
};

// ─────────────────────────── Table ───────────────────────────

export interface DiningTableOptions {
  capacity: number;
  occupied: boolean;
  selected: boolean;
}

export interface DiningTableResult {
  group: THREE.Group;
  /** Meshes to raycast against for hover/selection */
  hitTargets: THREE.Object3D[];
}

/**
 * Builds a complete dining table: furniture, chairs, place settings, centrepiece,
 * pendant lamp, and a soft floor status halo (green = free, amber = occupied).
 */
export function buildDiningTable({ capacity, occupied, selected }: DiningTableOptions): DiningTableResult {
  const m = mats();
  const group = new THREE.Group();
  const hitTargets: THREE.Object3D[] = [];
  const seats = Math.max(2, capacity || 4);
  const round = seats >= 6;
  const fabric = round ? m.fabricAlt : m.fabric;

  // Seat positions: [x, z, facingAngle] where the guest looks towards the table centre
  const seatSpots: [number, number, number][] = [];

  if (round) {
    const R = 1.45;
    // Tablecloth: flat top + draped skirt
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.04, 64), m.linen);
    top.position.y = TABLE_TOP_Y - 0.02;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.02, R + 0.1, 0.55, 64, 1, true), m.linen);
    skirt.position.y = TABLE_TOP_Y - 0.29;
    group.add(top, skirt);
    hitTargets.push(top, skirt);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.6, 16), m.darkWood);
    pedestal.position.y = 0.3;
    group.add(pedestal);

    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2;
      seatSpots.push([Math.sin(a), Math.cos(a), a]);
    }
    seatSpots.forEach(([sx, sz, a], i) => {
      const setting = buildPlaceSetting(occupied && i % 3 !== 2);
      setting.position.set(sx * (R - 0.42), TABLE_TOP_Y, sz * (R - 0.42));
      setting.rotation.y = a;
      group.add(setting);

      const chair = buildChair(fabric);
      chair.position.set(sx * (R + 0.5), 0, sz * (R + 0.5));
      chair.rotation.y = a + Math.PI;
      group.add(chair);
    });
  } else {
    // Solid walnut square/rectangular table with tapered legs
    const W = seats > 4 ? 2.6 : 1.7;
    const D = 1.7;
    const topMesh = new THREE.Mesh(roundedBox(W, 0.08, D, 0.04), m.walnut);
    topMesh.position.y = TABLE_TOP_Y - 0.04;
    group.add(topMesh);
    hitTargets.push(topMesh);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.12, D - 0.2), m.darkWood);
    apron.position.y = TABLE_TOP_Y - 0.14;
    group.add(apron);

    const legGeo = new THREE.BoxGeometry(0.09, TABLE_TOP_Y - 0.08, 0.09);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, m.walnut);
      leg.position.set(x * (W / 2 - 0.12), (TABLE_TOP_Y - 0.08) / 2, z * (D / 2 - 0.12));
      group.add(leg);
    });

    // Table runner
    const runner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.004, 0.42), m.linen);
    runner.position.y = TABLE_TOP_Y + 0.002;
    group.add(runner);

    // Guests sit on the two long sides (2 per side for 4, 1 per side for 2)
    const perSide = Math.ceil(seats / 2);
    for (let i = 0; i < seats; i++) {
      const side = i < perSide ? 1 : -1;
      const idx = i < perSide ? i : i - perSide;
      const count = side === 1 ? perSide : seats - perSide;
      const x = count === 1 ? 0 : -W / 2 + (W / count) * (idx + 0.5);
      seatSpots.push([x, side, side === 1 ? 0 : Math.PI]);
    }
    seatSpots.forEach(([x, side, a], i) => {
      const setting = buildPlaceSetting(occupied && i % 3 !== 2);
      setting.position.set(x, TABLE_TOP_Y, side * (D / 2 - 0.42));
      setting.rotation.y = a;
      group.add(setting);

      const chair = buildChair(fabric);
      chair.position.set(x, 0, side * (D / 2 + 0.45));
      chair.rotation.y = a + Math.PI;
      group.add(chair);
    });
  }

  const centre = buildCenterpiece();
  centre.position.y = TABLE_TOP_Y;
  group.add(centre);

  group.add(buildPendant(TABLE_TOP_Y + 2.1));

  shadowAll(group);

  // Soft availability halo on the floor (not a shadow caster)
  const haloColor = selected ? 0xff7a1a : occupied ? 0xf59e0b : 0x10b981;
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(round ? 2.25 : 1.9, round ? 2.4 : 2.02, 64),
    new THREE.MeshBasicMaterial({ color: haloColor, transparent: true, opacity: selected ? 0.9 : 0.45, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.015;
  group.add(halo);

  return { group, hitTargets };
}

/** Candle flicker: call every frame with elapsed seconds */
export function animateDiningScene(scene: THREE.Object3D, elapsed: number) {
  scene.traverse((o) => {
    if (o.userData.flicker) {
      const f = 1 + Math.sin(elapsed * 13 + o.id) * 0.08 + Math.sin(elapsed * 23 + o.id * 0.7) * 0.05;
      o.scale.set(0.8 * f, 1.8 * f, 0.8 * f);
    }
  });
}
