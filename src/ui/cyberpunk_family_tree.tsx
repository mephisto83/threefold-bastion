import React, { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from '../game/config/gameConfig';

/**
 * CyberpunkFamilyTree
 * - Reads a JSON object of `subjects[]` and renders a neon, interactive family graph.
 * - Supports: parent/child links (mother/father), spouse links, pan/zoom, search, focus, and a details HUD.
 *
 * Drop-in usage:
 *   <CyberpunkFamilyTree data={familyJson} assetBaseUrl="/" />
 */

export type Subject = {
  name: string;
  images?: {
    "head-shot"?: {
      path: string;
    };
  };
  sex?: "male" | "female" | "other" | string;
  adult?: boolean;
  "character-description"?: string;
  mother?: string | null;
  father?: string | null;
  spouse?: string | null;
};

export type FamilyData = {
  subjects: Subject[];
};

type Node = {
  id: string;
  subject: Subject;
  generation: number;
  x: number;
  y: number;
  isGhost?: boolean;
};

type Edge = {
  id: string;
  from: string;
  to: string;
  kind: "parent" | "spouse";
  role?: "mother" | "father";
};

type LayoutBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxGen: number;
};

export type CyberpunkFamilyTreeProps = {
  data: FamilyData;

  /** If your image paths are relative (e.g. "images\\aunt.png"), provide a base like "/" or "/assets/" */
  assetBaseUrl?: string;

  /** When true, missing referenced names (parents/spouses not listed) are rendered as ghost nodes */
  includeUnknowns?: boolean;

  /** Name to focus on initially */
  initialFocusName?: string;

  /** Called when a node is selected */
  onSelect?: (subject: Subject) => void;

  /** Visual tuning */
  rowGap?: number;
  colGap?: number;
  nodeWidth?: number;
  nodeHeight?: number;

  /** Minimum center-to-center spacing between nodes (prevents overlaps) */
  minNodeDistance?: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function titleize(raw: string) {
  const s = raw.replace(/_/g, " ").trim();
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizePath(path?: string, base = "") {
  if (!path) return "";
  const p = path.replace(/\\/g, "/");
  if (!base) return p;
  // Avoid double slashes
  if (base.endsWith("/") && p.startsWith("/")) return base + p.slice(1);
  if (!base.endsWith("/") && !p.startsWith("/")) return base + "/" + p;
  return base + p;
}

function initials(name: string) {
  const parts = titleize(name).split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function useResizeObserver<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [size, setSize] = useState({ width: 800, height: 500 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: Math.max(1, cr.width), height: Math.max(1, cr.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}

function computeGenerations(subjects: Subject[], byId: Map<string, Subject>) {
  // generations ignore spouse links; we only consider mother/father.
  const gen = new Map<string, number>();

  const getParents = (s: Subject) => {
    const m = s.mother ? byId.get(s.mother) : undefined;
    const f = s.father ? byId.get(s.father) : undefined;
    return [m, f].filter(Boolean) as Subject[];
  };

  // Seed roots (no parents present or null)
  for (const s of subjects) {
    const hasMother = !!(s.mother && byId.has(s.mother));
    const hasFather = !!(s.father && byId.has(s.father));
    if (!hasMother && !hasFather) gen.set(s.name, 0);
  }

  // Relax until stable or max iterations
  const maxIters = subjects.length * 5 + 10;
  for (let iter = 0; iter < maxIters; iter++) {
    let changed = false;
    for (const s of subjects) {
      const parents = getParents(s);
      if (parents.length === 0) continue;
      const parentGens = parents
        .map((p) => gen.get(p.name))
        .filter((g): g is number => typeof g === "number");
      if (parentGens.length === 0) continue;
      const next = Math.max(...parentGens) + 1;
      const cur = gen.get(s.name);
      if (cur === undefined || next > cur) {
        gen.set(s.name, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Any remaining undefined => treat as root-ish
  for (const s of subjects) {
    if (!gen.has(s.name)) gen.set(s.name, 0);
  }

  // Normalize to start at 0
  const min = Math.min(...Array.from(gen.values()));
  if (min !== 0) {
    for (const [k, v] of gen.entries()) gen.set(k, v - min);
  }

  return gen;
}

function computeLayout(
  subjects: Subject[],
  edges: Edge[],
  opts: { rowGap: number; colGap: number; minNodeDistance: number }
) {
  const byId = new Map(subjects.map((s) => [s.name, s] as const));
  const gens = computeGenerations(subjects, byId);

  // Spouse links should be treated as undirected; some data has spouse only on one side.
  const spouseOf = new Map<string, string>();
  for (const e of edges) {
    if (e.kind !== 'spouse') continue;
    spouseOf.set(e.from, e.to);
    spouseOf.set(e.to, e.from);
  }

  // Group by generation
  const groups = new Map<number, Subject[]>();
  for (const s of subjects) {
    const g = gens.get(s.name) ?? 0;
    const arr = groups.get(g) ?? [];
    arr.push(s);
    groups.set(g, arr);
  }

  const maxGen = Math.max(...Array.from(groups.keys()));

  // Ordering goal:
  // - Spouses should be adjacent (treat a couple as a unit)
  // - Children should appear under their parents (order gen g by parent-unit position in gen g-1)

  type Unit = { key: string; members: Subject[] };

  const makeUnitsForGen = (arr: Subject[], genIndex: number) => {
    const units: Unit[] = [];
    const used = new Set<string>();

    const addUnit = (members: Subject[]) => {
      const key = members
        .map((m) => m.name)
        .slice()
        .sort()
        .join("|");
      units.push({ key, members });
      for (const m of members) used.add(m.name);
    };

    for (const s of arr) {
      if (used.has(s.name)) continue;
      const spouseName = s.spouse ?? spouseOf.get(s.name) ?? null;
      const spouse = spouseName ? byId.get(spouseName) : undefined;
      const spouseInSameGen = spouse && (gens.get(spouse.name) ?? 0) === genIndex;
      if (spouseInSameGen && !used.has(spouse.name)) {
        // Deterministic ordering inside the unit
        const members = [s, spouse].sort((a, b) => a.name.localeCompare(b.name));
        addUnit(members);
      } else {
        addUnit([s]);
      }
    }

    // Deterministic baseline
    units.sort((a, b) => a.key.localeCompare(b.key));
    return units;
  };

  // Re-order each generation without enforcing parent->child alignment.
  // Primary: keep spouse units intact. Secondary: lightly group siblings by parent signature.
  for (let g = 0; g <= maxGen; g++) {
    const arr = groups.get(g) ?? [];
    const units = makeUnitsForGen(arr, g);

    const unitParentKey = (u: Unit) => {
      const keys = u.members.map((m) => `${m.mother ?? ''}|${m.father ?? ''}`).filter((k) => k !== '|');
      if (keys.length === 0) return '~~~~';
      keys.sort();
      return keys[0];
    };

    units.sort((a, b) => {
      const pa = unitParentKey(a);
      const pb = unitParentKey(b);
      if (pa < pb) return -1;
      if (pa > pb) return 1;
      return a.key.localeCompare(b.key);
    });

    groups.set(g, units.flatMap((u) => u.members));
  }

  // Place nodes
  const nodes: Node[] = [];
  for (let g = 0; g <= maxGen; g++) {
    const arr = groups.get(g) ?? [];
    for (let i = 0; i < arr.length; i++) {
      nodes.push({
        id: arr[i].name,
        subject: arr[i],
        generation: g,
        x: 0,
        y: 0,
      });
    }
  }

  // Random initial placement (spread out + minimum spacing) so the force sim
  // has a good chance of untangling without starting as a grid.
  randomizeInitialPositions(nodes, opts.minNodeDistance);

  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  return {
    nodes,
    nodeById,
    maxGen,
  };
}

function randomizeInitialPositions(nodes: Node[], minNodeDistance: number) {
  const minDist = Math.max(1, minNodeDistance);
  const n = nodes.length;
  if (n === 0) return;

  // Choose a radius that scales with n so the initial state isn't overly dense.
  const radius = Math.max(minDist * 3, Math.sqrt(n) * minDist * 1.8);
  const cellSize = minDist;

  const cellKey = (x: number, y: number) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return `${cx},${cy}`;
  };

  const grid = new Map<string, Array<{ x: number; y: number }>>();
  const canPlace = (x: number, y: number) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const minD2 = minDist * minDist;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const bucket = grid.get(`${cx + ox},${cy + oy}`);
        if (!bucket) continue;
        for (const p of bucket) {
          const dx = x - p.x;
          const dy = y - p.y;
          if (dx * dx + dy * dy < minD2) return false;
        }
      }
    }
    return true;
  };

  const addPoint = (x: number, y: number) => {
    const key = cellKey(x, y);
    const arr = grid.get(key) ?? [];
    arr.push({ x, y });
    grid.set(key, arr);
  };

  for (const node of nodes) {
    let placed = false;
    // Try a bunch of samples; fall back to dense placement if needed.
    for (let tries = 0; tries < 60; tries++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (!canPlace(x, y)) continue;
      node.x = x;
      node.y = y;
      addPoint(x, y);
      placed = true;
      break;
    }

    if (!placed) {
      // Fallback: still random, but allow overlaps if crowded
      const a = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      node.x = Math.cos(a) * r;
      node.y = Math.sin(a) * r;
      addPoint(node.x, node.y);
    }
  }
}


type ForceSim = {
  allNodes: Node[];
  allNodeById: Map<string, Node>;
  activeIds: Set<string>;
  activeNodes: Node[];
  edges: Edge[];
  maxGen: number;
  neighbors: Map<string, Set<string>>;
  vx: Map<string, number>;
  vy: Map<string, number>;
  initial: Map<string, { x: number; y: number }>;
  minDist: number;
  cellSize: number;
  repelRadius: number;
  repelStrength: number;
  springK: number;
  spouseSpringK: number;
  springRest: number;
  spouseRest: number;
  gravity: number;
  maxAbs: number;
  maxV: number;
  dt: number;
  damping: number;
  velocityBleed: number;

  // incremental spawning
  pendingIds: Set<string>;
  spawnEveryTicks: number;
  tick: number;
};

function computeBounds(nodes: Node[], maxGen: number): LayoutBounds {
  const pad = 1;
  const finiteX = nodes.map((n) => n.x).filter((x) => Number.isFinite(x));
  const finiteY = nodes.map((n) => n.y).filter((y) => Number.isFinite(y));
  const minX = (finiteX.length ? Math.min(...finiteX) : 0) - pad;
  const maxX = (finiteX.length ? Math.max(...finiteX) : 0) + pad;
  const minY = (finiteY.length ? Math.min(...finiteY) : 0) - pad;
  const maxY = (finiteY.length ? Math.max(...finiteY) : 0) + pad;
  return { minX, maxX, minY, maxY, maxGen };
}

function createForceSim(args: {
  nodes: Node[];
  nodeById: Map<string, Node>;
  edges: Edge[];
  maxGen: number;
  opts: { colGap: number; minNodeDistance: number };
  seedId?: string;
}): ForceSim {
  const minDist = Math.max(1, args.opts.minNodeDistance);
  const cellSize = Math.max(minDist, Math.max(40, Math.min(args.opts.colGap, 220)));

  const neighbors = new Map<string, Set<string>>();
  const addNeighbor = (a: string, b: string) => {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    neighbors.get(a)!.add(b);
  };
  for (const e of args.edges) {
    addNeighbor(e.from, e.to);
    addNeighbor(e.to, e.from);
  }

  const vx = new Map<string, number>();
  const vy = new Map<string, number>();
  const initial = new Map<string, { x: number; y: number }>();
  for (const n of args.nodes) {
    vx.set(n.id, 0);
    vy.set(n.id, 0);
    initial.set(n.id, {
      x: Number.isFinite(n.x) ? n.x : 0,
      y: Number.isFinite(n.y) ? n.y : 0,
    });
  }

  // Start with nothing active; caller will seed.
  const activeIds = new Set<string>();
  const pendingIds = new Set(args.nodes.map((n) => n.id));
  const activeNodes: Node[] = [];

  const sim: ForceSim = {
    allNodes: args.nodes,
    allNodeById: args.nodeById,
    activeIds,
    activeNodes,
    edges: args.edges,
    maxGen: args.maxGen,
    neighbors,
    vx,
    vy,
    initial,
    minDist,
    cellSize,
    repelRadius: cellSize * 2.2,
    repelStrength: 5800,
    springK: 0.06,
    spouseSpringK: 0.12,
    springRest: cellSize * 1.05,
    spouseRest: cellSize * 0.9,
    gravity: 0.009,
    maxAbs: cellSize * 180,
    maxV: 60,
    dt: 0.12,
    damping: 0.86,
    velocityBleed: 0.25,
    pendingIds,
    spawnEveryTicks: 10,
    tick: 0,
  };

  // Seed: prefer provided seed, otherwise first node.
  const seed =
    args.seedId && sim.allNodeById.has(args.seedId)
      ? args.seedId
      : sim.allNodes[0]?.id;
  if (seed) activateNode(sim, seed);

  return sim;
}

function activateNode(sim: ForceSim, id: string) {
  if (sim.activeIds.has(id)) return;
  const node = sim.allNodeById.get(id);
  if (!node) return;

  // Place new node near its active neighbors when possible; otherwise keep its current random position.
  const neigh = sim.neighbors.get(id);
  const activeNeighbors: Node[] = [];
  if (neigh) {
    for (const nId of neigh.values()) {
      if (!sim.activeIds.has(nId)) continue;
      const n = sim.allNodeById.get(nId);
      if (n) activeNeighbors.push(n);
    }
  }

  if (activeNeighbors.length > 0) {
    const cx = activeNeighbors.reduce((s, n) => s + n.x, 0) / activeNeighbors.length;
    const cy = activeNeighbors.reduce((s, n) => s + n.y, 0) / activeNeighbors.length;

    const canPlace = (x: number, y: number) => {
      const minD2 = sim.minDist * sim.minDist;
      for (const other of sim.activeNodes) {
        const dx = x - other.x;
        const dy = y - other.y;
        if (dx * dx + dy * dy < minD2) return false;
      }
      return true;
    };

    let placed = false;
    // Sample ring around centroid, expanding outward if crowded.
    for (let ring = 1; ring <= 8 && !placed; ring++) {
      const r0 = sim.minDist * 0.9 * ring;
      for (let tries = 0; tries < 18; tries++) {
        const a = Math.random() * Math.PI * 2;
        const r = r0 * (0.7 + 0.6 * Math.random());
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (!canPlace(x, y)) continue;
        node.x = clamp(x, -sim.maxAbs, sim.maxAbs);
        node.y = clamp(y, -sim.maxAbs, sim.maxAbs);
        placed = true;
        break;
      }
    }
  }

  sim.activeIds.add(id);
  sim.pendingIds.delete(id);
  sim.activeNodes.push(node);
  sim.vx.set(id, 0);
  sim.vy.set(id, 0);
}

function pickNextSpawn(sim: ForceSim) {
  if (sim.pendingIds.size === 0) return;

  // Prefer any pending node connected to the active set.
  let bestId: string | null = null;
  let bestScore = -1;
  for (const id of sim.pendingIds) {
    const neigh = sim.neighbors.get(id);
    if (!neigh) continue;
    let score = 0;
    for (const nId of neigh.values()) if (sim.activeIds.has(nId)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  if (bestId && bestScore > 0) {
    activateNode(sim, bestId);
    return;
  }

  // No connected candidates: pick a random remaining node.
  const arr = Array.from(sim.pendingIds);
  const pick = arr[Math.floor(Math.random() * arr.length)];
  if (pick) activateNode(sim, pick);
}

function stepForceSim(sim: ForceSim) {
  sim.tick++;
  if (sim.tick % sim.spawnEveryTicks === 0) {
    pickNextSpawn(sim);
  }

  const apply = (id: string, fx: number, fy: number) => {
    if (!Number.isFinite(fx) || !Number.isFinite(fy)) return;
    sim.vx.set(id, clamp((sim.vx.get(id) ?? 0) + fx, -sim.maxV, sim.maxV));
    sim.vy.set(id, clamp((sim.vy.get(id) ?? 0) + fy, -sim.maxV, sim.maxV));
  };

  const cellKey = (x: number, y: number) => {
    const cx = Math.floor(x / sim.cellSize);
    const cy = Math.floor(y / sim.cellSize);
    return `${cx},${cy}`;
  };

  const buildGrid = () => {
    const grid = new Map<string, Node[]>();
    for (const n of sim.activeNodes) {
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
        const base = sim.initial.get(n.id) ?? { x: 0, y: 0 };
        n.x = base.x;
        n.y = base.y;
      }
      const key = cellKey(n.x, n.y);
      const arr = grid.get(key) ?? [];
      arr.push(n);
      grid.set(key, arr);
    }
    return grid;
  };

  const resolveCollisions = (grid: Map<string, Node[]>) => {
    for (const a of sim.activeNodes) {
      const cx = Math.floor(a.x / sim.cellSize);
      const cy = Math.floor(a.y / sim.cellSize);

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = `${cx + ox},${cy + oy}`;
          const bucket = grid.get(key);
          if (!bucket) continue;

          for (const b of bucket) {
            if (b.id === a.id) continue;
            if (b.id < a.id) continue;

            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;

            if (d2 <= 1e-10) {
              dx = a.id < b.id ? 1e-3 : -1e-3;
              dy = a.id < b.id ? -1e-3 : 1e-3;
              d2 = dx * dx + dy * dy;
            }

            const d = Math.sqrt(d2);
            if (d >= sim.minDist) continue;

            const overlap = (sim.minDist - d) / 2;
            const nx = dx / d;
            const ny = dy / d;

            a.x = clamp(a.x - nx * overlap, -sim.maxAbs, sim.maxAbs);
            a.y = clamp(a.y - ny * overlap, -sim.maxAbs, sim.maxAbs);
            b.x = clamp(b.x + nx * overlap, -sim.maxAbs, sim.maxAbs);
            b.y = clamp(b.y + ny * overlap, -sim.maxAbs, sim.maxAbs);
          }
        }
      }
    }
  };

  const grid = buildGrid();

  for (const n of sim.activeNodes) {
    sim.vx.set(n.id, (sim.vx.get(n.id) ?? 0) * sim.velocityBleed);
    sim.vy.set(n.id, (sim.vy.get(n.id) ?? 0) * sim.velocityBleed);
  }

  // Repulsion — skip directly connected nodes
  for (const n of sim.activeNodes) {
    const cx = Math.floor(n.x / sim.cellSize);
    const cy = Math.floor(n.y / sim.cellSize);
    const neigh = sim.neighbors.get(n.id) ?? new Set<string>();

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const key = `${cx + ox},${cy + oy}`;
        const bucket = grid.get(key);
        if (!bucket) continue;
        for (const m of bucket) {
          if (m.id === n.id) continue;
          if (neigh.has(m.id)) continue;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 1e-6) continue;
          const d = Math.sqrt(d2);
          if (d > sim.repelRadius) continue;
          const s = (sim.repelStrength / d2) * (1 - d / sim.repelRadius);
          apply(n.id, (dx / d) * s, (dy / d) * s);
        }
      }
    }
  }

  // Springs
  for (const e of sim.edges) {
    if (!sim.activeIds.has(e.from) || !sim.activeIds.has(e.to)) continue;
    const a = sim.allNodeById.get(e.from);
    const b = sim.allNodeById.get(e.to);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(Math.max(1e-6, d2));

    const k = e.kind === 'spouse' ? sim.spouseSpringK : sim.springK;
    const rest = e.kind === 'spouse' ? sim.spouseRest : sim.springRest;
    const err = d - rest;
    const f = k * err;
    const fx = (dx / d) * f;
    const fy = (dy / d) * f;

    apply(a.id, fx, fy);
    apply(b.id, -fx, -fy);
  }

  // Gravity
  for (const n of sim.activeNodes) {
    apply(n.id, -sim.gravity * n.x, -sim.gravity * n.y);
  }

  // Integrate
  for (const n of sim.activeNodes) {
    let nx = n.x + (sim.vx.get(n.id) ?? 0) * sim.dt;
    let ny = n.y + (sim.vy.get(n.id) ?? 0) * sim.dt;

    if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
      const base = sim.initial.get(n.id) ?? { x: 0, y: 0 };
      nx = base.x;
      ny = base.y;
    }

    n.x = clamp(nx, -sim.maxAbs, sim.maxAbs);
    n.y = clamp(ny, -sim.maxAbs, sim.maxAbs);

    sim.vx.set(n.id, (sim.vx.get(n.id) ?? 0) * sim.damping);
    sim.vy.set(n.id, (sim.vy.get(n.id) ?? 0) * sim.damping);
  }

  // Collisions (hard min distance)
  const gridAfter = buildGrid();
  resolveCollisions(gridAfter);
}

function curvedLink(
  a: { x: number; y: number },
  b: { x: number; y: number },
  curvature = 0.5
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c1 = { x: a.x + dx * 0.25, y: a.y + dy * curvature };
  const c2 = { x: a.x + dx * 0.75, y: b.y - dy * curvature };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

export default function CyberpunkFamilyTree({
  data,
  assetBaseUrl = "",
  includeUnknowns = true,
  initialFocusName,
  onSelect,
  rowGap = 190,
  colGap = 190,
  nodeWidth = 200,
  nodeHeight = 78,
  minNodeDistance,
}: CyberpunkFamilyTreeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const size = useResizeObserver(wrapRef);

  const simRef = useRef<ForceSim | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);

  const baseGraph = useMemo(() => {
    const subjects = [...(data?.subjects ?? [])];
    const byId = new Map(subjects.map((s) => [s.name, s] as const));

    // Build edges
    const allEdges: Edge[] = [];

    const ensureGhost = (name: string) => {
      if (!includeUnknowns) return;
      if (!byId.has(name)) {
        byId.set(name, {
          name,
          adult: true,
          sex: "other",
          "character-description": "(Unknown)",
          mother: null,
          father: null,
        });
        subjects.push(byId.get(name)!);
      }
    };

    for (const s of subjects) {
      if (s.mother) {
        ensureGhost(s.mother);
        allEdges.push({
          id: `m:${s.mother}->${s.name}`,
          from: s.mother,
          to: s.name,
          kind: "parent",
          role: "mother",
        });
      }
      if (s.father) {
        ensureGhost(s.father);
        allEdges.push({
          id: `f:${s.father}->${s.name}`,
          from: s.father,
          to: s.name,
          kind: "parent",
          role: "father",
        });
      }
      if (s.spouse) {
        ensureGhost(s.spouse);
        // de-dupe spouse edges (treat as undirected)
        const a = s.name;
        const b = s.spouse;
        const key = a < b ? `${a}<->${b}` : `${b}<->${a}`;
        if (!allEdges.some((e) => e.kind === "spouse" && e.id === key)) {
          allEdges.push({ id: key, from: a, to: b, kind: "spouse" });
        }
      }
    }

    // Final subjects list (with ghosts possibly)
    const finalSubjects = Array.from(byId.values());

    const resolvedMinNodeDistance =
      typeof minNodeDistance === 'number' && Number.isFinite(minNodeDistance)
        ? Math.max(1, minNodeDistance)
        : Math.max(nodeWidth, nodeHeight) + 24;

    const layout = computeLayout(finalSubjects, allEdges, {
      rowGap,
      colGap,
      minNodeDistance: resolvedMinNodeDistance,
    });

    // Mark ghost nodes for styling
    for (const n of layout.nodes) {
      const s = byId.get(n.id);
      const isGhost = !!s && s["character-description"] === "(Unknown)";
      if (isGhost) n.isGhost = true;
    }

    return {
      nodes: layout.nodes,
      nodeById: layout.nodeById,
      edges: allEdges,
      maxGen: layout.maxGen,
      resolvedMinNodeDistance,
    };
  }, [data, includeUnknowns, rowGap, colGap, minNodeDistance, nodeWidth, nodeHeight]);

  // (Re)initialize sim when data/options change
  useEffect(() => {
    simRef.current = createForceSim({
      nodes: baseGraph.nodes,
      nodeById: baseGraph.nodeById,
      edges: baseGraph.edges,
      maxGen: baseGraph.maxGen,
      opts: { colGap, minNodeDistance: baseGraph.resolvedMinNodeDistance },
      seedId: initialFocusName,
    });

    // Minimal warm-up: keep the "untangling" animation visible.
    // Minimal warm-up
    stepForceSim(simRef.current);
    setLayoutTick((t) => t + 1);
  }, [baseGraph, colGap, initialFocusName]);

  // Continuous solving loop
  useEffect(() => {
    let raf = 0;
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      const sim = simRef.current;
      if (sim) {
        // a couple sub-steps per frame keeps it responsive
        stepForceSim(sim);
        stepForceSim(sim);
        setLayoutTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const nodes = simRef.current?.activeNodes ?? baseGraph.nodes.slice(0, 1);
  const edges = baseGraph.edges;
  const nodeById = simRef.current?.allNodeById ?? baseGraph.nodeById;
  const bounds = useMemo(() => computeBounds(nodes, baseGraph.maxGen), [nodes, baseGraph.maxGen, layoutTick]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Pan/Zoom
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ active: boolean; x: number; y: number; vx: number; vy: number }>(
    { active: false, x: 0, y: 0, vx: 0, vy: 0 }
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set<string>();
    const hits = nodes
      .filter((n) => titleize(n.id).toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
      .map((n) => n.id);
    return new Set(hits);
  }, [nodes, query]);

  const selectedNode = selectedId ? nodeById.get(selectedId) : null;

  const connectedSet = useMemo(() => {
    const set = new Set<string>();
    if (!selectedId) return set;
    set.add(selectedId);
    for (const e of edges) {
      if (e.from === selectedId) set.add(e.to);
      if (e.to === selectedId) set.add(e.from);
    }
    return set;
  }, [edges, selectedId]);

  // Initial selection/focus
  useEffect(() => {
    if (!nodes.length) return;
    const initial = initialFocusName && nodeById.get(initialFocusName) ? initialFocusName : nodes[0].id;
    setSelectedId((prev) => prev ?? initial);
  }, [initialFocusName, nodes, nodeById]);

  // Fit to screen (or focus)
  const fitTo = (targetId?: string) => {
    const w = size.width;
    const h = size.height;
    if (w <= 1 || h <= 1) return;

    let minX = bounds.minX;
    let maxX = bounds.maxX;
    let minY = bounds.minY;
    let maxY = bounds.maxY;

    if (targetId && nodeById.has(targetId)) {
      const n = nodeById.get(targetId)!;
      // focus window around node + its neighborhood
      const neigh: Node[] = [n];
      for (const e of edges) {
        if (e.from === targetId && nodeById.get(e.to)) neigh.push(nodeById.get(e.to)!);
        if (e.to === targetId && nodeById.get(e.from)) neigh.push(nodeById.get(e.from)!);
      }
      minX = Math.min(...neigh.map((x) => x.x)) - colGap;
      maxX = Math.max(...neigh.map((x) => x.x)) + colGap;
      minY = Math.min(...neigh.map((x) => x.y)) - rowGap * 0.75;
      maxY = Math.max(...neigh.map((x) => x.y)) + rowGap * 0.75;
    }

    const contentW = Math.max(1, maxX - minX + nodeWidth);
    const contentH = Math.max(1, maxY - minY + nodeHeight);

    const pad = 80;
    const k = clamp(Math.min((w - pad) / contentW, (h - pad) / contentH), 0.35, 1.6);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Place center into viewport center
    const x = w / 2 - cx * k;
    const y = h / 2 - cy * k;

    setView({ x, y, k });
  };

  useEffect(() => {
    // Fit when size or data changes
    fitTo(initialFocusName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, nodes.length]);

  const screenToWorld = (sx: number, sy: number) => {
    const { x, y, k } = view;
    return { x: (sx - x) / k, y: (sy - y) / k };
  };

  const onWheel: React.WheelEventHandler = (e) => {
    if (!wrapRef.current) return;
    e.preventDefault();

    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = -e.deltaY;
    const zoom = delta > 0 ? 1.08 : 0.92;

    setView((v) => {
      const nextK = clamp(v.k * zoom, 0.28, 2.25);
      const before = screenToWorld(mx, my);
      // new translation so that `before` stays under mouse
      const nextX = mx - before.x * nextK;
      const nextY = my - before.y * nextK;
      return { x: nextX, y: nextY, k: nextK };
    });
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current.active = true;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.vx = 0;
    drag.current.vy = 0;
  };

  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.vx = dx;
    drag.current.vy = dy;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp: React.PointerEventHandler = () => {
    drag.current.active = false;
  };

  const select = (id: string) => {
    setSelectedId(id);
    const subj = nodeById.get(id)?.subject;
    if (subj) onSelect?.(subj);
  };

  const miniMap = useMemo(() => {
    // Mini-map bounds use layout bounds
    const w = 160;
    const h = 100;
    const bw = Math.max(1, bounds.maxX - bounds.minX + nodeWidth);
    const bh = Math.max(1, bounds.maxY - bounds.minY + nodeHeight);
    const k = Math.min(w / bw, h / bh);

    const worldToMini = (p: { x: number; y: number }) => {
      return {
        x: (p.x - bounds.minX) * k,
        y: (p.y - bounds.minY) * k,
      };
    };

    // Viewport rect in world coords
    const vLeft = screenToWorld(0, 0).x;
    const vTop = screenToWorld(0, 0).y;
    const vRight = screenToWorld(size.width, size.height).x;
    const vBottom = screenToWorld(size.width, size.height).y;

    const tl = worldToMini({ x: vLeft, y: vTop });
    const br = worldToMini({ x: vRight, y: vBottom });

    return { w, h, k, worldToMini, viewport: { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y } };
  }, [bounds, nodeWidth, nodeHeight, size.width, size.height, view]);

  const selectedImage = selectedNode
    ? normalizePath(selectedNode.subject.images?.["head-shot"]?.path, assetBaseUrl)
    : "";

  const selectedVideo = selectedNode && CHARACTERS[selectedNode.id]?.videos?.intro?.[0];

  return (
    <div ref={wrapRef} className="cpTreeRoot" onWheel={onWheel}>
      <div className="cpGrid" aria-hidden />
      <div className="cpNoise" aria-hidden />
      <div className="cpScan" aria-hidden />

      {/* Top HUD */}
      <div className="cpHudTop">
        <div className="cpBrand">
          <div className="cpBrandMark" />
          <div>
            <div className="cpBrandTitle">FAMILY GRAPH</div>
            <div className="cpBrandSub">CYBERLINE / RELATIONSHIP MAP</div>
          </div>
        </div>

        <div className="cpSearch">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subject…"
            className="cpInput"
          />
          <button className="cpBtn" onClick={() => setQuery("")}>Clear</button>
          <button className="cpBtn" onClick={() => fitTo(selectedId ?? undefined)}>Focus</button>
          <button className="cpBtn" onClick={() => fitTo(undefined)}>Fit</button>
        </div>
      </div>

      {/* Right HUD (details) */}
      <div className="cpHudRight">
        <div className="cpPanel">
          <div className="cpPanelHeader">
            <div className="cpPanelTitle">NEURAL DOSSIER</div>
            <div className="cpPanelTag">v2.077</div>
          </div>

          {selectedNode ? (
            <>
              <div className="cpProfile">
                <div className="cpAvatarWrap">
                  {selectedVideo ? (
                    <video 
                      className="cpAvatar" 
                      src={selectedVideo} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      style={{ objectFit: 'cover' }}
                    />
                  ) : selectedImage ? (
                    <img className="cpAvatar" src={selectedImage} alt={selectedNode.id} />
                  ) : (
                    <div className="cpAvatarFallback">{initials(selectedNode.id)}</div>
                  )}
                  <div className="cpAvatarGlow" />
                </div>
                <div className="cpProfileMeta">
                  <div className="cpName">{titleize(selectedNode.id)}</div>
                  <div className="cpMetaRow">
                    <span className="cpPill">{String(selectedNode.subject.sex ?? "unknown")}</span>
                    <span className="cpPill">{selectedNode.subject.adult ? "adult" : "child"}</span>
                    <span className="cpPill">gen {selectedNode.generation}</span>
                    {selectedNode.isGhost && <span className="cpPillWarn">unknown</span>}
                  </div>
                </div>
              </div>

              {/* <div className="cpDesc">
                {selectedNode.subject["character-description"]?.trim()
                  ? selectedNode.subject["character-description"]
                  : "No dossier text available."}
              </div> */}

              <div className="cpRel">
                <div className="cpRelTitle">LINKS</div>
                <div className="cpRelGrid">
                  <RelChip label="Mother" id={selectedNode.subject.mother} onPick={select} />
                  <RelChip label="Father" id={selectedNode.subject.father} onPick={select} />
                  <RelChip label="Spouse" id={selectedNode.subject.spouse} onPick={select} />
                </div>
              </div>

              <div className="cpHint">
                <div className="cpHintDot" />
                Drag to pan • Scroll to zoom • Click a node to jack in
              </div>
            </>
          ) : (
            <div className="cpEmpty">Select a subject to view details.</div>
          )}
        </div>

        {/* Mini-map */}
        <div className="cpMini">
          <div className="cpMiniTitle">MAP</div>
          <svg width={miniMap.w} height={miniMap.h} className="cpMiniSvg">
            <rect x={0} y={0} width={miniMap.w} height={miniMap.h} rx={10} className="cpMiniBg" />
            {nodes.slice(0, 250).map((n) => {
              const p = miniMap.worldToMini({ x: n.x, y: n.y });
              const isSel = n.id === selectedId;
              return (
                <rect
                  key={n.id}
                  x={p.x + miniMap.w * 0.02}
                  y={p.y + miniMap.h * 0.04}
                  width={4}
                  height={3}
                  rx={1}
                  className={isSel ? "cpMiniDotSel" : "cpMiniDot"}
                />
              );
            })}
            <rect
              x={miniMap.viewport.x}
              y={miniMap.viewport.y}
              width={miniMap.viewport.w}
              height={miniMap.viewport.h}
              rx={6}
              className="cpMiniView"
            />
          </svg>
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={svgRef}
        className="cpSvg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <filter id="cpGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 2 0 0  0 0 0 0.9 0"
              result="c"
            />
            <feMerge>
              <feMergeNode in="c" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="cpEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(0,240,255,0.15)" />
            <stop offset="0.5" stopColor="rgba(252,238,10,0.55)" />
            <stop offset="1" stopColor="rgba(255,43,214,0.25)" />
          </linearGradient>

          <linearGradient id="cpEdgeHot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(0,240,255,0.35)" />
            <stop offset="0.5" stopColor="rgba(252,238,10,0.95)" />
            <stop offset="1" stopColor="rgba(255,43,214,0.45)" />
          </linearGradient>

          <pattern id="cpDots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(0,240,255,0.15)" />
          </pattern>
        </defs>

        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
          {/* Background texture in world space */}
          <rect
            x={bounds.minX - 800}
            y={bounds.minY - 800}
            width={(bounds.maxX - bounds.minX) + 1600}
            height={(bounds.maxY - bounds.minY) + 1600}
            fill="url(#cpDots)"
            opacity={0.55}
          />

          {/* Edges */}
          {edges.map((e) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;

            const aPt = { x: a.x, y: a.y };
            const bPt = { x: b.x, y: b.y };

            const aOut = {
              x: aPt.x,
              y: aPt.y + (e.kind === "parent" ? nodeHeight * 0.55 : 0),
            };
            const bIn = {
              x: bPt.x,
              y: bPt.y + (e.kind === "parent" ? -nodeHeight * 0.55 : 0),
            };

            const d =
              e.kind === "parent"
                ? curvedLink(aOut, bIn, 0.45)
                : curvedLink(
                    { x: aPt.x + nodeWidth * 0.45, y: aPt.y },
                    { x: bPt.x - nodeWidth * 0.45, y: bPt.y },
                    0.12
                  );

            const hot = selectedId && (e.from === selectedId || e.to === selectedId);
            const fade =
              query.trim() &&
              filtered.size > 0 &&
              !(filtered.has(e.from) || filtered.has(e.to));

            return (
              <g key={e.id} opacity={fade ? 0.12 : 1}>
                {/* soft glow */}
                <path
                  d={d}
                  stroke={hot ? "url(#cpEdgeHot)" : "url(#cpEdge)"}
                  strokeWidth={hot ? 6 : 4}
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#cpGlow)"
                  opacity={e.kind === "spouse" ? 0.65 : 0.85}
                />
                {/* animated data stream */}
                <path
                  d={d}
                  className={e.kind === "spouse" ? "cpEdgeDashSpouse" : "cpEdgeDash"}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const img = normalizePath(n.subject.images?.["head-shot"]?.path, assetBaseUrl);
            const videoUrl = CHARACTERS[n.id]?.videos?.intro?.[0];
            const isSel = n.id === selectedId;
            const isHit = filtered.size > 0 && filtered.has(n.id);
            const fade = query.trim() && filtered.size > 0 && !isHit;
            const isConn = selectedId ? connectedSet.has(n.id) : false;

            const hueClass = n.subject.sex === "female" ? "cpNodeFemale" : n.subject.sex === "male" ? "cpNodeMale" : "cpNodeOther";

            return (
              <g
                key={n.id}
                transform={`translate(${n.x - nodeWidth / 2}, ${n.y - nodeHeight / 2})`}
                className={`cpNode ${hueClass} ${isSel ? "isSel" : ""} ${n.isGhost ? "isGhost" : ""}`}
                opacity={fade ? 0.18 : selectedId && !isConn ? 0.55 : 1}
                onClick={(ev) => {
                  ev.stopPropagation();
                  select(n.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {/* backplate */}
                <rect
                  x={0}
                  y={0}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={14}
                  className="cpNodePlate"
                />

                {/* outer glow */}
                <rect
                  x={0}
                  y={0}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={14}
                  className="cpNodeGlow"
                  filter="url(#cpGlow)"
                />

                {/* avatar */}
                <g transform={`translate(${12}, ${12})`}>
                  <rect x={0} y={0} width={54} height={54} rx={12} className="cpAvatarFrame" />
                  {videoUrl ? (
                    <foreignObject x={2} y={2} width={50} height={50}>
                      <video
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                      />
                    </foreignObject>
                  ) : img ? (
                    <image
                      href={img}
                      x={2}
                      y={2}
                      width={50}
                      height={50}
                      preserveAspectRatio="xMidYMid slice"
                      className="cpAvatarImg"
                    />
                  ) : (
                    <g>
                      <rect x={2} y={2} width={50} height={50} rx={10} className="cpAvatarImg" />
                      <text x={27} y={34} textAnchor="middle" className="cpAvatarInit">
                        {initials(n.id)}
                      </text>
                    </g>
                  )}
                </g>

                {/* text */}
                <text x={78} y={28} className="cpNodeName">
                  {titleize(n.id)}
                </text>
                <text x={78} y={48} className="cpNodeMeta">
                  {n.subject.adult ? "ADULT" : "CHILD"} • GEN {n.generation}
                </text>

                {/* corner tag */}
                <text x={nodeWidth - 12} y={16} textAnchor="end" className="cpNodeTag">
                  {n.isGhost ? "UNK" : (n.subject.sex ?? "?").toString().slice(0, 1).toUpperCase()}
                </text>

                {/* selection ring */}
                {isSel && (
                  <rect
                    x={-3}
                    y={-3}
                    width={nodeWidth + 6}
                    height={nodeHeight + 6}
                    rx={16}
                    className="cpNodeRing"
                  />
                )}

                {/* search hit ping */}
                {isHit && !isSel && <rect x={-2} y={-2} width={nodeWidth + 4} height={nodeHeight + 4} rx={16} className="cpNodeHit" />}
              </g>
            );
          })}
        </g>
      </svg>

      <style>{`
        .cpTreeRoot{
          position:relative;
          width:100%;
          height:100%;
          overflow:hidden;
          border-radius:18px;
          background: radial-gradient(1200px 600px at 30% 0%, rgba(0,240,255,0.18), rgba(0,0,0,0) 55%),
                      radial-gradient(900px 700px at 85% 25%, rgba(255,43,214,0.12), rgba(0,0,0,0) 60%),
                      linear-gradient(180deg, rgba(10,10,14,1), rgba(6,6,9,1));
          box-shadow: 0 0 0 1px rgba(0,240,255,0.10), 0 20px 60px rgba(0,0,0,0.65);
          user-select:none;
          -webkit-user-select:none;
          touch-action:none;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .cpGrid{
          position:absolute; inset:0;
          background:
            linear-gradient(rgba(0,240,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
          opacity:0.55;
          mix-blend-mode: screen;
          mask-image: radial-gradient(closest-side at 30% 20%, black 30%, transparent 88%);
          pointer-events:none;
        }

        .cpNoise{
          position:absolute; inset:-40px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E");
          opacity:0.08;
          mix-blend-mode: overlay;
          pointer-events:none;
          animation: cpNoiseMove 6s linear infinite;
        }
        @keyframes cpNoiseMove{ 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-40px,30px,0)} }

        .cpScan{
          position:absolute; inset:0;
          background: linear-gradient(180deg, transparent 0%, rgba(252,238,10,0.06) 45%, transparent 70%);
          opacity:0.35;
          mix-blend-mode: screen;
          pointer-events:none;
          animation: cpScan 5.5s linear infinite;
        }
        @keyframes cpScan{
          0%{ transform:translateY(-120%); }
          100%{ transform:translateY(120%); }
        }

        .cpSvg{ position:absolute; inset:0; width:100%; height:100%; }

        .cpHudTop{
          position:absolute;
          left:14px; right:14px; top:12px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          pointer-events:none;
          z-index:5;
        }
        .cpBrand{ display:flex; gap:10px; align-items:center; pointer-events:auto; }
        .cpBrandMark{
          width:14px; height:14px;
          border-radius:4px;
          background: linear-gradient(135deg, rgba(0,240,255,0.9), rgba(252,238,10,0.9));
          box-shadow: 0 0 18px rgba(0,240,255,0.35);
        }
        .cpBrandTitle{ font-weight:800; letter-spacing:0.18em; font-size:12px; color:rgba(252,238,10,0.95); }
        .cpBrandSub{ font-weight:600; letter-spacing:0.12em; font-size:10px; color:rgba(0,240,255,0.75); margin-top:2px; }

        .cpSearch{ display:flex; gap:8px; align-items:center; pointer-events:auto; }
        .cpInput{
          width: 240px;
          padding:10px 12px;
          border-radius: 12px;
          background: rgba(0,0,0,0.42);
          border: 1px solid rgba(0,240,255,0.22);
          color: rgba(255,255,255,0.92);
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(255,43,214,0.08);
        }
        .cpInput::placeholder{ color: rgba(255,255,255,0.35); }
        .cpBtn{
          padding:10px 12px;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(252,238,10,0.12), rgba(0,0,0,0.12));
          border: 1px solid rgba(252,238,10,0.22);
          color: rgba(252,238,10,0.88);
          font-weight: 800;
          letter-spacing: 0.08em;
          font-size: 11px;
          cursor:pointer;
          transition: transform .08s ease, filter .2s ease;
        }
        .cpBtn:hover{ filter: brightness(1.15); }
        .cpBtn:active{ transform: translateY(1px) scale(0.99); }

        .cpHudRight{
          position:absolute;
          top: 72px;
          right: 14px;
          bottom: 14px;
          width: 380px;
          display:flex;
          flex-direction:column;
          gap:10px;
          z-index:6;
          pointer-events:none;
        }

        .cpPanel{
          pointer-events:auto;
          flex: 1;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(0,0,0,0.52), rgba(0,0,0,0.34));
          border: 1px solid rgba(0,240,255,0.14);
          box-shadow: 0 0 0 1px rgba(255,43,214,0.07), 0 18px 60px rgba(0,0,0,0.55);
          padding: 14px;
          overflow:hidden;
        }
        .cpPanelHeader{ display:flex; justify-content:space-between; align-items:center; }
        .cpPanelTitle{ font-weight:900; letter-spacing:0.16em; font-size:12px; color: rgba(0,240,255,0.85); }
        .cpPanelTag{
          font-weight:900; letter-spacing:0.14em; font-size:10px;
          color: rgba(252,238,10,0.85);
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(252,238,10,0.22);
          background: rgba(252,238,10,0.08);
        }

        .cpProfile{ display:flex; gap:12px; align-items:center; margin-top:14px; }
        .cpAvatarWrap{ position:relative; width:68px; height:68px; }
        .cpAvatar{
          width:68px; height:68px; object-fit:cover;
          border-radius: 18px;
          border: 1px solid rgba(0,240,255,0.20);
          box-shadow: 0 0 24px rgba(0,240,255,0.18);
        }
        .cpAvatarFallback{
          width:68px; height:68px;
          border-radius: 18px;
          display:flex; align-items:center; justify-content:center;
          font-weight: 1000;
          letter-spacing: 0.08em;
          color: rgba(252,238,10,0.90);
          background: linear-gradient(135deg, rgba(0,240,255,0.14), rgba(255,43,214,0.10));
          border: 1px solid rgba(0,240,255,0.20);
        }
        .cpAvatarGlow{
          position:absolute; inset:-10px;
          border-radius: 24px;
          background: radial-gradient(circle at 30% 30%, rgba(252,238,10,0.22), transparent 60%),
                      radial-gradient(circle at 70% 70%, rgba(0,240,255,0.20), transparent 58%);
          filter: blur(8px);
          opacity: 0.9;
          pointer-events:none;
        }

        .cpProfileMeta{ flex:1; }
        .cpName{ font-weight: 1000; font-size: 16px; letter-spacing: 0.04em; color: rgba(255,255,255,0.92); }
        .cpMetaRow{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .cpPill{
          font-size:10px;
          font-weight:900;
          letter-spacing:0.12em;
          padding: 6px 10px;
          border-radius: 999px;
          color: rgba(0,240,255,0.85);
          background: rgba(0,240,255,0.08);
          border: 1px solid rgba(0,240,255,0.16);
        }
        .cpPillWarn{
          font-size:10px;
          font-weight:900;
          letter-spacing:0.12em;
          padding: 6px 10px;
          border-radius: 999px;
          color: rgba(252,238,10,0.92);
          background: rgba(252,238,10,0.08);
          border: 1px solid rgba(252,238,10,0.18);
        }

        .cpDesc{
          margin-top:12px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.78);
          font-size: 12px;
          line-height: 1.45;
          max-height: 140px;
          overflow:auto;
        }

        .cpRel{ margin-top: 12px; }
        .cpRelTitle{ font-weight: 1000; letter-spacing:0.14em; font-size: 11px; color: rgba(255,43,214,0.85); margin-bottom:8px; }
        .cpRelGrid{ display:grid; grid-template-columns: 1fr; gap:8px; }

        .cpHint{
          margin-top: 12px;
          display:flex; align-items:center; gap:8px;
          color: rgba(255,255,255,0.58);
          font-size: 11px;
          letter-spacing: 0.02em;
        }
        .cpHintDot{
          width:8px; height:8px; border-radius: 99px;
          background: rgba(0,240,255,0.8);
          box-shadow: 0 0 16px rgba(0,240,255,0.35);
          animation: cpBlink 1.6s ease-in-out infinite;
        }
        @keyframes cpBlink{ 0%,100%{opacity:0.25} 50%{opacity:1} }

        .cpMini{ pointer-events:auto; border-radius: 18px; padding: 12px; background: rgba(0,0,0,0.42);
          border: 1px solid rgba(0,240,255,0.14);
        }
        .cpMiniTitle{ font-weight: 1000; letter-spacing:0.14em; font-size: 11px; color: rgba(252,238,10,0.85); margin-bottom: 8px; }
        .cpMiniSvg{ display:block; }
        .cpMiniBg{ fill: rgba(0,0,0,0.32); stroke: rgba(255,255,255,0.06); }
        .cpMiniDot{ fill: rgba(0,240,255,0.35); }
        .cpMiniDotSel{ fill: rgba(252,238,10,0.95); }
        .cpMiniView{ fill: rgba(252,238,10,0.06); stroke: rgba(252,238,10,0.45); stroke-width: 1.2; }

        /* Node styling */
        .cpNodePlate{ fill: rgba(0,0,0,0.36); stroke: rgba(255,255,255,0.08); stroke-width: 1; }
        .cpNodeGlow{ fill: rgba(0,240,255,0.04); stroke: rgba(0,240,255,0.22); stroke-width: 1.4; }
        .cpNode.isSel .cpNodeGlow{ stroke: rgba(252,238,10,0.80); fill: rgba(252,238,10,0.06); }
        .cpNode.isGhost .cpNodeGlow{ stroke-dasharray: 6 5; opacity:0.7; }

        .cpNodeFemale .cpNodeGlow{ stroke: rgba(255,43,214,0.55); fill: rgba(255,43,214,0.05); }
        .cpNodeMale .cpNodeGlow{ stroke: rgba(0,240,255,0.55); fill: rgba(0,240,255,0.05); }
        .cpNodeOther .cpNodeGlow{ stroke: rgba(252,238,10,0.42); fill: rgba(252,238,10,0.04); }

        .cpNodeName{
          fill: rgba(255,255,255,0.92);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.03em;
        }
        .cpNodeMeta{
          fill: rgba(0,240,255,0.72);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .cpNodeTag{
          fill: rgba(252,238,10,0.9);
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.14em;
        }

        .cpAvatarFrame{ fill: rgba(0,0,0,0.22); stroke: rgba(0,240,255,0.22); }
        .cpAvatarImg{ opacity: 0.98; }
        .cpAvatarInit{ fill: rgba(252,238,10,0.90); font-size: 14px; font-weight: 1000; letter-spacing: 0.10em; }

        .cpNodeRing{ fill: none; stroke: rgba(252,238,10,0.85); stroke-width: 2.2; filter: url(#cpGlow);
          animation: cpRingFlicker 2.4s ease-in-out infinite;
        }
        @keyframes cpRingFlicker{
          0%,100%{opacity:0.75}
          50%{opacity:1}
          62%{opacity:0.55}
          70%{opacity:1}
        }

        .cpNodeHit{ fill: none; stroke: rgba(255,43,214,0.55); stroke-width: 2; filter: url(#cpGlow);
          animation: cpPing 1.4s ease-in-out infinite;
        }
        @keyframes cpPing{ 0%{opacity:0.15} 50%{opacity:0.85} 100%{opacity:0.15} }

        /* Edges */
        .cpEdgeDash{ stroke: rgba(0,240,255,0.55); stroke-dasharray: 6 12; animation: cpDash 2.2s linear infinite; }
        .cpEdgeDashSpouse{ stroke: rgba(255,43,214,0.45); stroke-dasharray: 2 8; animation: cpDash 1.7s linear infinite; }
        @keyframes cpDash{ to{ stroke-dashoffset: -160; } }

        /* Responsive: collapse right HUD on small screens */
        @media (max-width: 900px){
          .cpHudRight{ display:none; }
          .cpInput{ width: 200px; }
        }
      `}</style>
    </div>
  );
}

function RelChip({
  label,
  id,
  onPick,
}: {
  label: string;
  id?: string | null;
  onPick: (id: string) => void;
}) {
  if (!id) {
    return (
      <div className="cpRelChip isEmpty">
        <div className="cpRelLabel">{label}</div>
        <div className="cpRelValue">—</div>
        <style>{relStyles}</style>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cpRelChip"
      onClick={() => onPick(id)}
      title={`Select ${label}: ${titleize(id)}`}
    >
      <div className="cpRelLabel">{label}</div>
      <div className="cpRelValue">{titleize(id)}</div>
      <style>{relStyles}</style>
    </button>
  );
}

const relStyles = `
  .cpRelChip{
    width:100%;
    text-align:left;
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:center;
    padding:10px 12px;
    border-radius: 14px;
    background: rgba(0,0,0,0.28);
    border: 1px solid rgba(0,240,255,0.14);
    overflow:hidden;
    cursor:pointer;
    transition: transform .08s ease, filter .2s ease;
  }
  .cpRelChip:hover{ filter: brightness(1.12); }
  .cpRelChip:active{ transform: translateY(1px) scale(0.99); }
  .cpRelChip.isEmpty{ cursor: default; opacity: 0.65; }
  .cpRelLabel{
    font-weight: 1000;
    letter-spacing: 0.14em;
    font-size: 10px;
    color: rgba(0,240,255,0.78);
    flex: 0 0 auto;
  }
  .cpRelValue{
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.02em;
    color: rgba(255,255,255,0.86);
    min-width: 0;
    flex: 1 1 auto;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
