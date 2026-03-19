import { Vec2, Problem, CushionWall, ShotParams } from "./types";
import { TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS, PROBLEMS_PER_LEVEL } from "./constants";
import { vec } from "./vector";
import { simulateShot, createBalls } from "./physics";

// ============================================================
// Mirror Reflection (Unfolding) Method for 3-Cushion Path Finding
// ============================================================

// Reflect a point across a cushion wall
function reflectPoint(p: Vec2, wall: CushionWall): Vec2 {
  switch (wall) {
    case "top":
      return { x: p.x, y: -p.y };
    case "bottom":
      return { x: p.x, y: 2 * TABLE_HEIGHT - p.y };
    case "left":
      return { x: -p.x, y: p.y };
    case "right":
      return { x: 2 * TABLE_WIDTH - p.x, y: p.y };
  }
}

// Find where a ray from `origin` in direction `dir` hits a cushion wall
function rayCushionIntersect(
  origin: Vec2,
  dir: Vec2,
  wall: CushionWall
): Vec2 | null {
  let t: number;
  switch (wall) {
    case "top":
      if (dir.y >= 0) return null;
      t = (BALL_RADIUS - origin.y) / dir.y;
      break;
    case "bottom":
      if (dir.y <= 0) return null;
      t = (TABLE_HEIGHT - BALL_RADIUS - origin.y) / dir.y;
      break;
    case "left":
      if (dir.x >= 0) return null;
      t = (BALL_RADIUS - origin.x) / dir.x;
      break;
    case "right":
      if (dir.x <= 0) return null;
      t = (TABLE_WIDTH - BALL_RADIUS - origin.x) / dir.x;
      break;
  }
  if (t <= 0) return null;
  return vec.add(origin, vec.scale(dir, t));
}

// Reflect direction off a cushion
function reflectDirection(dir: Vec2, wall: CushionWall): Vec2 {
  switch (wall) {
    case "top":
    case "bottom":
      return { x: dir.x, y: -dir.y };
    case "left":
    case "right":
      return { x: -dir.x, y: dir.y };
  }
}

// Calculate full path through 3 cushions using mirror reflection
function calculateMirrorPath(
  start: Vec2,
  target: Vec2,
  cushions: CushionWall[]
): Vec2[] | null {
  // Reflect target through cushions in reverse order (unfolding)
  let reflected = vec.clone(target);
  for (let i = cushions.length - 1; i >= 0; i--) {
    reflected = reflectPoint(reflected, cushions[i]);
  }

  // Direction from start to reflected target
  const dir = vec.normalize(vec.sub(reflected, start));
  if (vec.len(dir) === 0) return null;

  // Trace path through each cushion (folding back)
  const path: Vec2[] = [vec.clone(start)];
  let currentPos = vec.clone(start);
  let currentDir = vec.clone(dir);

  for (const wall of cushions) {
    const hit = rayCushionIntersect(currentPos, currentDir, wall);
    if (!hit) return null;

    // Validate hit is on the table
    if (
      hit.x < 0 ||
      hit.x > TABLE_WIDTH ||
      hit.y < 0 ||
      hit.y > TABLE_HEIGHT
    ) {
      return null;
    }

    path.push(hit);
    currentPos = hit;
    currentDir = reflectDirection(currentDir, wall);
  }

  path.push(vec.clone(target));
  return path;
}

// ============================================================
// Problem Generation
// ============================================================

// Cushion sequences organized by difficulty
const CUSHION_SEQUENCES: CushionWall[][] = [
  // Level 1-2: Common patterns
  ["top", "right", "bottom"],
  ["bottom", "right", "top"],
  ["top", "left", "bottom"],
  ["bottom", "left", "top"],
  ["right", "top", "left"],
  ["left", "top", "right"],
  ["right", "bottom", "left"],
  ["left", "bottom", "right"],
];

// Seeded random for reproducible problems
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Random position within a zone
function randomInRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number
): Vec2 {
  const margin = BALL_RADIUS * 3;
  return {
    x: Math.max(margin, Math.min(TABLE_WIDTH - margin, x1 + rng() * (x2 - x1))),
    y: Math.max(margin, Math.min(TABLE_HEIGHT - margin, y1 + rng() * (y2 - y1))),
  };
}

// Try to find a valid shot for given ball positions
function findValidShot(
  cueBall: Vec2,
  obj1: Vec2,
  obj2: Vec2,
  maxAttempts: number = 200
): { shot: ShotParams; path: Vec2[] } | null {
  const balls = createBalls(cueBall, obj1, obj2);

  // Try different angles around the direction toward obj1
  const baseAngle = vec.angle(vec.sub(obj1, cueBall));

  for (let i = 0; i < maxAttempts; i++) {
    // Vary angle around the base direction toward obj1
    const angleOffset = ((i % 40) - 20) * 0.02; // ±0.4 radians
    const angle = baseAngle + angleOffset;
    const power = 0.4 + (Math.floor(i / 40) % 5) * 0.12; // 0.4 to 0.88

    const shot: ShotParams = {
      angle,
      power,
      spin: { x: 0, y: 0 },
    };

    const result = simulateShot(balls, shot);
    if (result.success) {
      return { shot, path: result.cuePath };
    }
  }
  return null;
}

// Generate a single problem using mirror reflection for ball placement
function generateProblemForLevel(
  level: number,
  index: number
): Problem | null {
  const seed = level * 1000 + index * 137 + 42;
  const rng = seededRandom(seed);

  // Pick a cushion sequence
  const seqIndex = (level * 3 + index) % CUSHION_SEQUENCES.length;
  const cushions = CUSHION_SEQUENCES[seqIndex];

  // Try multiple configurations
  for (let attempt = 0; attempt < 30; attempt++) {
    const attemptRng = seededRandom(seed + attempt * 73);

    // Place cue ball in different zones based on level
    let cueBall: Vec2;
    let obj2Zone: { x1: number; y1: number; x2: number; y2: number };

    switch (level) {
      case 1:
        // Cue ball on left half, target on right half - easy positions
        cueBall = randomInRect(100, 100, 300, 300, attemptRng);
        obj2Zone = { x1: 500, y1: 100, x2: 700, y2: 300 };
        break;
      case 2:
        cueBall = randomInRect(80, 80, 350, 320, attemptRng);
        obj2Zone = { x1: 450, y1: 80, x2: 720, y2: 320 };
        break;
      case 3:
        cueBall = randomInRect(60, 60, 400, 340, attemptRng);
        obj2Zone = { x1: 400, y1: 60, x2: 740, y2: 340 };
        break;
      case 4:
        cueBall = randomInRect(50, 50, 500, 350, attemptRng);
        obj2Zone = { x1: 300, y1: 50, x2: 750, y2: 350 };
        break;
      default:
        cueBall = randomInRect(50, 50, 750, 350, attemptRng);
        obj2Zone = { x1: 50, y1: 50, x2: 750, y2: 350 };
        break;
    }

    const obj2 = randomInRect(
      obj2Zone.x1,
      obj2Zone.y1,
      obj2Zone.x2,
      obj2Zone.y2,
      attemptRng
    );

    // Use mirror reflection to find a path from near the cue ball to obj2
    const pathStart = {
      x: cueBall.x + (attemptRng() - 0.5) * 80 + 50,
      y: cueBall.y + (attemptRng() - 0.5) * 60,
    };
    // Clamp to table
    pathStart.x = Math.max(BALL_RADIUS * 2, Math.min(TABLE_WIDTH - BALL_RADIUS * 2, pathStart.x));
    pathStart.y = Math.max(BALL_RADIUS * 2, Math.min(TABLE_HEIGHT - BALL_RADIUS * 2, pathStart.y));

    const mirrorPath = calculateMirrorPath(pathStart, obj2, cushions);
    if (!mirrorPath || mirrorPath.length < 4) continue;

    // Place obj1 between cueBall and the first cushion contact
    // The obj1 should be along the line from cueBall toward the pathStart
    const dirToPath = vec.normalize(vec.sub(mirrorPath[1], cueBall));
    const distToFirst = vec.dist(cueBall, mirrorPath[1]);
    const obj1Dist = Math.min(distToFirst * 0.4, 120) + 30;
    const obj1: Vec2 = vec.add(cueBall, vec.scale(dirToPath, obj1Dist));

    // Validate positions
    if (
      obj1.x < BALL_RADIUS * 2 ||
      obj1.x > TABLE_WIDTH - BALL_RADIUS * 2 ||
      obj1.y < BALL_RADIUS * 2 ||
      obj1.y > TABLE_HEIGHT - BALL_RADIUS * 2
    )
      continue;
    if (vec.dist(cueBall, obj1) < BALL_RADIUS * 4) continue;
    if (vec.dist(cueBall, obj2) < BALL_RADIUS * 6) continue;
    if (vec.dist(obj1, obj2) < BALL_RADIUS * 6) continue;

    // Find a valid shot using brute-force simulation
    const result = findValidShot(cueBall, obj1, obj2);
    if (!result) continue;

    // Simplify path for display
    const simplePath = simplifyPath(result.path, 5);

    return {
      id: `lv${level}_${String(index + 1).padStart(3, "0")}`,
      level,
      title: getProblemTitle(level, index, cushions),
      description: getProblemDesc(level, cushions),
      cueBall,
      objectBall1: obj1,
      objectBall2: obj2,
      idealPath: simplePath,
      idealShot: result.shot,
    };
  }

  return null;
}

function simplifyPath(path: Vec2[], every: number): Vec2[] {
  const result: Vec2[] = [];
  for (let i = 0; i < path.length; i += every) {
    result.push(path[i]);
  }
  if (result[result.length - 1] !== path[path.length - 1]) {
    result.push(path[path.length - 1]);
  }
  return result;
}

function getProblemTitle(
  level: number,
  index: number,
  cushions: CushionWall[]
): string {
  const patterns: Record<string, string> = {
    "top,right,bottom": "앞돌리기",
    "bottom,right,top": "앞돌리기 (역)",
    "top,left,bottom": "뒤돌리기",
    "bottom,left,top": "뒤돌리기 (역)",
    "right,top,left": "옆돌리기",
    "left,top,right": "옆돌리기 (역)",
    "right,bottom,left": "횡단",
    "left,bottom,right": "횡단 (역)",
  };
  const pattern = patterns[cushions.join(",")] || "3쿠션";
  return `Level ${level}-${index + 1}: ${pattern}`;
}

function getProblemDesc(level: number, cushions: CushionWall[]): string {
  const wallNames: Record<string, string> = {
    top: "상단",
    bottom: "하단",
    left: "좌측",
    right: "우측",
  };
  const route = cushions.map((c) => wallNames[c]).join(" → ");
  return `쿠션 경로: ${route}`;
}

// ============================================================
// Generate all problems for all levels
// ============================================================

let cachedProblems: Problem[] | null = null;

export function getAllProblems(): Problem[] {
  if (cachedProblems) return cachedProblems;

  const problems: Problem[] = [];

  for (let level = 1; level <= 5; level++) {
    for (let i = 0; i < PROBLEMS_PER_LEVEL; i++) {
      const problem = generateProblemForLevel(level, i);
      if (problem) {
        problems.push(problem);
      }
    }
  }

  cachedProblems = problems;
  return problems;
}

export function getProblemsForLevel(level: number): Problem[] {
  return getAllProblems().filter((p) => p.level === level);
}

export function getProblem(level: number, index: number): Problem | null {
  const problems = getProblemsForLevel(level);
  return problems[index] || null;
}
