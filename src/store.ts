import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GamePhase,
  Ball,
  Problem,
  ShotParams,
  SimulationResult,
  LevelProgress,
} from "./types";
import { getProblem, getProblemsForLevel } from "./problems";
import { simulateShot, createBalls } from "./physics";
import { BASE_SCORE, LEVELS } from "./constants";

interface GameState {
  // Game flow
  phase: GamePhase;
  currentLevel: number;
  currentProblemIndex: number;
  currentProblem: Problem | null;
  balls: Ball[];

  // Shot
  aimAngle: number | null;
  shotParams: ShotParams | null;
  simulationResult: SimulationResult | null;

  // Timing
  aimStartTime: number | null;
  attempts: number;

  // Score
  lastScore: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  selectLevel: (level: number) => void;
  loadProblem: (level: number, index: number) => void;
  setAimAngle: (angle: number | null) => void;
  executeShot: (params: ShotParams) => void;
  nextProblem: () => void;
  retryProblem: () => void;
  goHome: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  phase: "home",
  currentLevel: 1,
  currentProblemIndex: 0,
  currentProblem: null,
  balls: [],
  aimAngle: null,
  shotParams: null,
  simulationResult: null,
  aimStartTime: null,
  attempts: 0,
  lastScore: 0,

  setPhase: (phase) => set({ phase }),

  selectLevel: (level) => {
    set({ currentLevel: level, phase: "levelSelect" });
  },

  loadProblem: (level, index) => {
    const problem = getProblem(level, index);
    if (!problem) return;

    const balls = createBalls(
      problem.cueBall,
      problem.objectBall1,
      problem.objectBall2
    );

    set({
      currentLevel: level,
      currentProblemIndex: index,
      currentProblem: problem,
      balls,
      phase: "aiming",
      aimAngle: null,
      shotParams: null,
      simulationResult: null,
      aimStartTime: Date.now(),
      attempts: 0,
      lastScore: 0,
    });
  },

  setAimAngle: (angle) => set({ aimAngle: angle }),

  executeShot: (params) => {
    const { balls, currentProblem, aimStartTime, attempts } = get();
    if (!currentProblem) return;

    const result = simulateShot(balls, params);

    // Calculate score
    const elapsed = aimStartTime
      ? (Date.now() - aimStartTime) / 1000
      : 30;
    const attemptCount = attempts + 1;

    let score = 0;
    if (result.success) {
      // Base score
      score = BASE_SCORE;

      // Time bonus
      if (elapsed < 10) score *= 1.5;
      else if (elapsed < 20) score *= 1.2;

      // Attempt penalty
      if (attemptCount === 1) score *= 1.0;
      else if (attemptCount === 2) score *= 0.7;
      else score *= 0.5;

      // Cushion efficiency bonus (exactly 3 = perfect)
      if (result.cushionHitCount === 3) score *= 1.2;

      score = Math.round(score);
    }

    set({
      shotParams: params,
      simulationResult: result,
      phase: "simulating",
      attempts: attemptCount,
      lastScore: score,
    });
  },

  nextProblem: () => {
    const { currentLevel, currentProblemIndex } = get();
    const problems = getProblemsForLevel(currentLevel);

    if (currentProblemIndex + 1 < problems.length) {
      get().loadProblem(currentLevel, currentProblemIndex + 1);
    } else {
      // Level complete
      set({ phase: "levelSelect" });
    }
  },

  retryProblem: () => {
    const { currentLevel, currentProblemIndex, currentProblem } = get();
    if (!currentProblem) return;

    const balls = createBalls(
      currentProblem.cueBall,
      currentProblem.objectBall1,
      currentProblem.objectBall2
    );

    set({
      balls,
      phase: "aiming",
      aimAngle: null,
      shotParams: null,
      simulationResult: null,
    });
  },

  goHome: () => set({ phase: "home" }),
}));

// Progress store (persisted)
interface ProgressState {
  levelProgress: Record<number, LevelProgress>;
  totalScore: number;
  addScore: (level: number, problemIndex: number, score: number) => void;
  getUnlockedLevel: () => number;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levelProgress: {},
      totalScore: 0,

      addScore: (level, problemIndex, score) => {
        const progress = { ...get().levelProgress };
        if (!progress[level]) {
          progress[level] = { scores: [], bestScore: 0, cleared: false };
        }

        const lp = { ...progress[level] };
        lp.scores = [...lp.scores];
        lp.scores[problemIndex] = Math.max(
          lp.scores[problemIndex] || 0,
          score
        );
        lp.bestScore = lp.scores.reduce((a, b) => a + b, 0);
        lp.cleared = lp.scores.filter((s) => s > 0).length >= 3;
        progress[level] = lp;

        const totalScore = Object.values(progress).reduce(
          (sum, p) => sum + p.bestScore,
          0
        );

        set({ levelProgress: progress, totalScore });
      },

      getUnlockedLevel: () => {
        const { totalScore } = get();
        let unlocked = 1;
        for (const level of LEVELS) {
          if (totalScore >= level.requiredScore) unlocked = level.id;
        }
        return unlocked;
      },
    }),
    { name: "billiards-progress" }
  )
);
