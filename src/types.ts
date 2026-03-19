export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  id: "cue" | "obj1" | "obj2";
  pos: Vec2;
  vel: Vec2;
  spin: Vec2;
}

export type CushionWall = "top" | "bottom" | "left" | "right";

export interface SimEvent {
  type: "cushion" | "ball";
  ballId: string;
  target?: string;
  wall?: CushionWall;
  pos: Vec2;
  time: number;
}

export interface SimulationResult {
  frames: { balls: Ball[]; time: number }[];
  events: SimEvent[];
  success: boolean;
  cuePath: Vec2[];
  cushionHitCount: number;
}

export interface ShotParams {
  angle: number; // radians
  power: number; // 0-1
  spin: Vec2; // -1 to 1
}

export interface Problem {
  id: string;
  level: number;
  title: string;
  description: string;
  cueBall: Vec2;
  objectBall1: Vec2;
  objectBall2: Vec2;
  idealPath: Vec2[];
  idealShot: ShotParams;
}

export type GamePhase =
  | "home"
  | "levelSelect"
  | "aiming"
  | "simulating"
  | "result";

export interface LevelProgress {
  scores: number[];
  bestScore: number;
  cleared: boolean;
}
