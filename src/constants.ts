// Table dimensions (logical units)
export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 400;
export const CUSHION_THICKNESS = 24;
export const BALL_RADIUS = 10;

// Physics
export const MAX_SPEED = 18;
export const FRICTION = 0.993;
export const MIN_SPEED = 0.15;
export const CUSHION_RESTITUTION = 0.92;
export const SPIN_CUSHION_EFFECT = 12; // max degrees deviation from spin
export const SPIN_DECAY = 0.998;

// Simulation
export const MAX_SIM_STEPS = 2000;
export const STEPS_PER_FRAME = 2; // physics steps per render frame

// Scoring
export const BASE_SCORE = 100;
export const TIME_BONUS_THRESHOLD_FAST = 10; // seconds
export const TIME_BONUS_THRESHOLD_MED = 20;

// Colors
export const COLORS = {
  felt: "#1a6b3c",
  feltDark: "#145a30",
  cushion: "#5a2d0c",
  cushionTop: "#7a3d1c",
  rail: "#3d1a00",
  diamond: "#d4af37",
  cueBall: "#f5f5f5",
  objectBall1: "#ffd700",
  objectBall2: "#dc2626",
  aimLine: "rgba(255,255,255,0.5)",
  playerPath: "rgba(100,180,255,0.7)",
  idealPath: "rgba(100,255,100,0.5)",
} as const;

// Levels
export const LEVELS = [
  { id: 1, name: "기본 앞돌리기", description: "기본적인 3쿠션 경로 익히기", requiredScore: 0 },
  { id: 2, name: "두께 조절", description: "정확한 두께로 방향 제어하기", requiredScore: 200 },
  { id: 3, name: "강도 조절", description: "적절한 힘 조절 연습", requiredScore: 500 },
  { id: 4, name: "회전 활용", description: "스핀을 활용한 경로 변경", requiredScore: 900 },
  { id: 5, name: "복합 샷", description: "모든 기술의 조합", requiredScore: 1400 },
];

export const PROBLEMS_PER_LEVEL = 5;
