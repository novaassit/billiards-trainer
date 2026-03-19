import { useRef, useEffect, useCallback, useState } from "react";
import { Ball, Vec2, SimulationResult } from "../types";
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  CUSHION_THICKNESS,
  BALL_RADIUS,
  COLORS,
} from "../constants";
import { vec } from "../vector";

interface Props {
  balls: Ball[];
  aimAngle: number | null;
  simulationResult: SimulationResult | null;
  idealPath: Vec2[] | null;
  phase: "aiming" | "simulating" | "result";
  onAimChange: (angle: number | null) => void;
  onSimulationComplete: () => void;
}

const CANVAS_PADDING = CUSHION_THICKNESS;
const TOTAL_WIDTH = TABLE_WIDTH + CANVAS_PADDING * 2;
const TOTAL_HEIGHT = TABLE_HEIGHT + CANVAS_PADDING * 2;

export default function BilliardCanvas({
  balls,
  aimAngle,
  simulationResult,
  idealPath,
  phase,
  onAimChange,
  onSimulationComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const animFrameRef = useRef<number>(0);
  const frameIndexRef = useRef(0);

  // Get logical position from mouse event
  const getLogicalPos = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Vec2 => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = TOTAL_WIDTH / rect.width;
      const scaleY = TOTAL_HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX - CANVAS_PADDING,
        y: (e.clientY - rect.top) * scaleY - CANVAS_PADDING,
      };
    },
    []
  );

  // Pointer handlers for aiming
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== "aiming") return;
      const pos = getLogicalPos(e);
      const cueBall = balls.find((b) => b.id === "cue");
      if (!cueBall) return;

      const dist = vec.dist(pos, cueBall.pos);
      if (dist < BALL_RADIUS * 4) {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [phase, balls, getLogicalPos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging || phase !== "aiming") return;
      const pos = getLogicalPos(e);
      const cueBall = balls.find((b) => b.id === "cue");
      if (!cueBall) return;

      const angle = vec.angle(vec.sub(pos, cueBall.pos));
      onAimChange(angle);
    },
    [isDragging, phase, balls, getLogicalPos, onAimChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Drawing functions
  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      displayBalls: Ball[],
      showAim: boolean,
      showPlayerPath: boolean,
      showIdealPath: boolean,
      playerPath?: Vec2[]
    ) => {
      const w = TOTAL_WIDTH;
      const h = TOTAL_HEIGHT;

      ctx.clearRect(0, 0, w, h);

      // Rail background
      ctx.fillStyle = COLORS.rail;
      ctx.fillRect(0, 0, w, h);

      // Felt
      ctx.fillStyle = COLORS.felt;
      ctx.fillRect(
        CANVAS_PADDING,
        CANVAS_PADDING,
        TABLE_WIDTH,
        TABLE_HEIGHT
      );

      // Felt pattern (subtle)
      ctx.fillStyle = COLORS.feltDark;
      for (let x = 0; x < TABLE_WIDTH; x += 40) {
        for (let y = 0; y < TABLE_HEIGHT; y += 40) {
          if ((x / 40 + y / 40) % 2 === 0) {
            ctx.globalAlpha = 0.05;
            ctx.fillRect(
              CANVAS_PADDING + x,
              CANVAS_PADDING + y,
              40,
              40
            );
          }
        }
      }
      ctx.globalAlpha = 1;

      // Cushion rails (beveled look)
      const cp = CANVAS_PADDING;
      ctx.fillStyle = COLORS.cushion;
      // Top
      ctx.fillRect(cp, cp - 6, TABLE_WIDTH, 6);
      // Bottom
      ctx.fillRect(cp, cp + TABLE_HEIGHT, TABLE_WIDTH, 6);
      // Left
      ctx.fillRect(cp - 6, cp, 6, TABLE_HEIGHT);
      // Right
      ctx.fillRect(cp + TABLE_WIDTH, cp, 6, TABLE_HEIGHT);

      ctx.fillStyle = COLORS.cushionTop;
      ctx.fillRect(cp, cp - 3, TABLE_WIDTH, 3);
      ctx.fillRect(cp, cp + TABLE_HEIGHT, TABLE_WIDTH, 3);
      ctx.fillRect(cp - 3, cp, 3, TABLE_HEIGHT);
      ctx.fillRect(cp + TABLE_WIDTH, cp, 3, TABLE_HEIGHT);

      // Diamond markers
      ctx.fillStyle = COLORS.diamond;
      // Long rails (top/bottom) - 8 diamonds
      for (let i = 1; i <= 7; i++) {
        const x = cp + (TABLE_WIDTH * i) / 8;
        drawDiamond(ctx, x, cp - 12, 4);
        drawDiamond(ctx, x, cp + TABLE_HEIGHT + 12, 4);
      }
      // Short rails (left/right) - 4 diamonds
      for (let i = 1; i <= 3; i++) {
        const y = cp + (TABLE_HEIGHT * i) / 4;
        drawDiamond(ctx, cp - 12, y, 4);
        drawDiamond(ctx, cp + TABLE_WIDTH + 12, y, 4);
      }

      // Center spot
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(cp + TABLE_WIDTH / 2, cp + TABLE_HEIGHT / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ideal path (if showing)
      if (showIdealPath && idealPath && idealPath.length > 1) {
        ctx.strokeStyle = COLORS.idealPath;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(
          cp + idealPath[0].x,
          cp + idealPath[0].y
        );
        for (let i = 1; i < idealPath.length; i++) {
          ctx.lineTo(
            cp + idealPath[i].x,
            cp + idealPath[i].y
          );
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Player path (if showing)
      if (showPlayerPath && playerPath && playerPath.length > 1) {
        ctx.strokeStyle = COLORS.playerPath;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cp + playerPath[0].x, cp + playerPath[0].y);
        for (let i = 1; i < playerPath.length; i += 3) {
          ctx.lineTo(cp + playerPath[i].x, cp + playerPath[i].y);
        }
        ctx.stroke();
      }

      // Aim line
      if (showAim && aimAngle !== null) {
        const cueBall = displayBalls.find((b) => b.id === "cue");
        if (cueBall) {
          const dir = vec.fromAngle(aimAngle);
          const lineEnd = vec.add(cueBall.pos, vec.scale(dir, 600));

          ctx.strokeStyle = COLORS.aimLine;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cp + cueBall.pos.x, cp + cueBall.pos.y);
          ctx.lineTo(cp + lineEnd.x, cp + lineEnd.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Cue stick (behind the ball)
          const cueStart = vec.sub(cueBall.pos, vec.scale(dir, 20));
          const cueEnd = vec.sub(cueBall.pos, vec.scale(dir, 160));
          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cp + cueStart.x, cp + cueStart.y);
          ctx.lineTo(cp + cueEnd.x, cp + cueEnd.y);
          ctx.stroke();

          // Cue tip
          ctx.strokeStyle = "#f5f5dc";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cp + cueStart.x, cp + cueStart.y);
          ctx.lineTo(
            cp + cueStart.x - dir.x * 6,
            cp + cueStart.y - dir.y * 6
          );
          ctx.stroke();
        }
      }

      // Balls
      for (const ball of displayBalls) {
        drawBall(ctx, cp + ball.pos.x, cp + ball.pos.y, ball.id);
      }
    },
    [aimAngle, idealPath]
  );

  // Animation loop for simulation
  useEffect(() => {
    if (phase !== "simulating" || !simulationResult) return;

    frameIndexRef.current = 0;
    const totalFrames = simulationResult.frames.length;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      const idx = frameIndexRef.current;
      if (idx >= totalFrames) {
        // Simulation complete - show final frame with paths
        const finalFrame = simulationResult.frames[totalFrames - 1];
        draw(
          ctx,
          finalFrame.balls,
          false,
          true,
          true,
          simulationResult.cuePath
        );
        onSimulationComplete();
        return;
      }

      const frame = simulationResult.frames[idx];
      const pathSoFar = simulationResult.cuePath.slice(
        0,
        Math.floor((idx / totalFrames) * simulationResult.cuePath.length)
      );
      draw(ctx, frame.balls, false, true, false, pathSoFar);

      frameIndexRef.current += 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [phase, simulationResult, draw, onSimulationComplete]);

  // Static drawing for aiming/result phases
  useEffect(() => {
    if (phase === "simulating") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    draw(
      ctx,
      balls,
      phase === "aiming",
      phase === "result",
      phase === "result",
      simulationResult?.cuePath
    );
  }, [phase, balls, aimAngle, draw, simulationResult]);

  // Handle resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspect = TOTAL_WIDTH / TOTAL_HEIGHT;

      let width = containerWidth;
      let height = width / aspect;

      if (height > containerHeight) {
        height = containerHeight;
        width = height * aspect;
      }

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        width={TOTAL_WIDTH}
        height={TOTAL_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-crosshair rounded-lg shadow-2xl"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: string
) {
  const r = BALL_RADIUS;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
  ctx.fill();

  // Ball color
  let color: string;
  switch (id) {
    case "cue":
      color = COLORS.cueBall;
      break;
    case "obj1":
      color = COLORS.objectBall1;
      break;
    case "obj2":
      color = COLORS.objectBall2;
      break;
    default:
      color = "#888";
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  const gradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, r);
  gradient.addColorStop(0, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}
