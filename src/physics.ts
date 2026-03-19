import { Ball, SimEvent, SimulationResult, ShotParams, Vec2, CushionWall } from "./types";
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  BALL_RADIUS,
  MAX_SPEED,
  FRICTION,
  MIN_SPEED,
  CUSHION_RESTITUTION,
  SPIN_CUSHION_EFFECT,
  SPIN_DECAY,
  MAX_SIM_STEPS,
} from "./constants";
import { vec } from "./vector";

function cloneBall(b: Ball): Ball {
  return {
    id: b.id,
    pos: vec.clone(b.pos),
    vel: vec.clone(b.vel),
    spin: vec.clone(b.spin),
  };
}

function cloneBalls(balls: Ball[]): Ball[] {
  return balls.map(cloneBall);
}

function allStopped(balls: Ball[]): boolean {
  return balls.every((b) => vec.len(b.vel) < MIN_SPEED);
}

function checkCushionCollision(ball: Ball, events: SimEvent[], step: number) {
  const r = BALL_RADIUS;

  if (ball.pos.x - r < 0) {
    ball.pos.x = r;
    ball.vel.x = -ball.vel.x * CUSHION_RESTITUTION;
    // side spin effect
    const spinEffect = (ball.spin.x * SPIN_CUSHION_EFFECT * Math.PI) / 180;
    ball.vel = vec.rotate(ball.vel, spinEffect);
    events.push({
      type: "cushion",
      ballId: ball.id,
      wall: "left",
      pos: vec.clone(ball.pos),
      time: step,
    });
  }
  if (ball.pos.x + r > TABLE_WIDTH) {
    ball.pos.x = TABLE_WIDTH - r;
    ball.vel.x = -ball.vel.x * CUSHION_RESTITUTION;
    const spinEffect = (-ball.spin.x * SPIN_CUSHION_EFFECT * Math.PI) / 180;
    ball.vel = vec.rotate(ball.vel, spinEffect);
    events.push({
      type: "cushion",
      ballId: ball.id,
      wall: "right",
      pos: vec.clone(ball.pos),
      time: step,
    });
  }
  if (ball.pos.y - r < 0) {
    ball.pos.y = r;
    ball.vel.y = -ball.vel.y * CUSHION_RESTITUTION;
    const spinEffect = (ball.spin.x * SPIN_CUSHION_EFFECT * Math.PI) / 180;
    ball.vel = vec.rotate(ball.vel, spinEffect);
    events.push({
      type: "cushion",
      ballId: ball.id,
      wall: "top",
      pos: vec.clone(ball.pos),
      time: step,
    });
  }
  if (ball.pos.y + r > TABLE_HEIGHT) {
    ball.pos.y = TABLE_HEIGHT - r;
    ball.vel.y = -ball.vel.y * CUSHION_RESTITUTION;
    const spinEffect = (-ball.spin.x * SPIN_CUSHION_EFFECT * Math.PI) / 180;
    ball.vel = vec.rotate(ball.vel, spinEffect);
    events.push({
      type: "cushion",
      ballId: ball.id,
      wall: "bottom",
      pos: vec.clone(ball.pos),
      time: step,
    });
  }
}

function checkBallCollision(
  a: Ball,
  b: Ball,
  events: SimEvent[],
  step: number
) {
  const d = vec.sub(b.pos, a.pos);
  const dist = vec.len(d);
  const minDist = BALL_RADIUS * 2;

  if (dist < minDist && dist > 0) {
    const n = vec.normalize(d);
    const relVel = vec.sub(a.vel, b.vel);
    const dvn = vec.dot(relVel, n);

    if (dvn > 0) {
      // Equal mass elastic collision
      a.vel = vec.sub(a.vel, vec.scale(n, dvn));
      b.vel = vec.add(b.vel, vec.scale(n, dvn));

      // Top/back spin effect on cue ball after collision
      if (a.id === "cue") {
        const spinBoost = a.spin.y * 0.3;
        a.vel = vec.add(a.vel, vec.scale(vec.normalize(a.vel), spinBoost * vec.len(a.vel)));
      }

      // Separate balls
      const overlap = minDist - dist;
      a.pos = vec.sub(a.pos, vec.scale(n, overlap / 2));
      b.pos = vec.add(b.pos, vec.scale(n, overlap / 2));

      events.push({
        type: "ball",
        ballId: a.id,
        target: b.id,
        pos: vec.lerp(a.pos, b.pos, 0.5),
        time: step,
      });
      events.push({
        type: "ball",
        ballId: b.id,
        target: a.id,
        pos: vec.lerp(a.pos, b.pos, 0.5),
        time: step,
      });
    }
  }
}

export function simulateShot(
  initialBalls: Ball[],
  shot: ShotParams
): SimulationResult {
  const balls = cloneBalls(initialBalls);
  const frames: { balls: Ball[]; time: number }[] = [];
  const events: SimEvent[] = [];
  const cuePath: Vec2[] = [];

  // Apply shot to cue ball
  const cue = balls.find((b) => b.id === "cue")!;
  const speed = shot.power * MAX_SPEED;
  cue.vel = {
    x: Math.cos(shot.angle) * speed,
    y: Math.sin(shot.angle) * speed,
  };
  cue.spin = vec.clone(shot.spin);

  // Record initial frame
  frames.push({ balls: cloneBalls(balls), time: 0 });
  cuePath.push(vec.clone(cue.pos));

  for (let step = 1; step <= MAX_SIM_STEPS; step++) {
    // Move balls
    for (const ball of balls) {
      ball.pos = vec.add(ball.pos, ball.vel);

      // Apply friction
      ball.vel = vec.scale(ball.vel, FRICTION);
      if (vec.len(ball.vel) < MIN_SPEED) {
        ball.vel = { x: 0, y: 0 };
      }

      // Decay spin
      ball.spin = vec.scale(ball.spin, SPIN_DECAY);
    }

    // Check collisions
    checkCushionCollision(balls[0], events, step); // cue
    checkCushionCollision(balls[1], events, step); // obj1
    checkCushionCollision(balls[2], events, step); // obj2

    checkBallCollision(balls[0], balls[1], events, step);
    checkBallCollision(balls[0], balls[2], events, step);
    checkBallCollision(balls[1], balls[2], events, step);

    // Record frame (every 2 steps for performance)
    if (step % 2 === 0) {
      frames.push({ balls: cloneBalls(balls), time: step });
    }
    cuePath.push(vec.clone(cue.pos));

    if (allStopped(balls)) break;
  }

  // Check success: cue hits obj1, then 3+ cushions, then obj2
  const success = checkSuccess(events);
  const cushionHitCount = events.filter(
    (e) => e.ballId === "cue" && e.type === "cushion"
  ).length;

  return { frames, events, success, cuePath, cushionHitCount };
}

function checkSuccess(events: SimEvent[]): boolean {
  const cueEvents = events.filter((e) => e.ballId === "cue");

  let hitObj1 = false;
  let cushionCount = 0;

  for (const event of cueEvents) {
    if (!hitObj1) {
      if (event.type === "ball" && event.target === "obj1") {
        hitObj1 = true;
      }
    } else {
      if (event.type === "cushion") {
        cushionCount++;
      } else if (event.type === "ball" && event.target === "obj2") {
        if (cushionCount >= 3) return true;
      }
    }
  }

  return false;
}

export function createBalls(
  cueBall: Vec2,
  obj1: Vec2,
  obj2: Vec2
): Ball[] {
  return [
    { id: "cue", pos: vec.clone(cueBall), vel: { x: 0, y: 0 }, spin: { x: 0, y: 0 } },
    { id: "obj1", pos: vec.clone(obj1), vel: { x: 0, y: 0 }, spin: { x: 0, y: 0 } },
    { id: "obj2", pos: vec.clone(obj2), vel: { x: 0, y: 0 }, spin: { x: 0, y: 0 } },
  ];
}
