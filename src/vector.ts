import { Vec2 } from "./types";

export const vec = {
  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s }),
  dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,
  len: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: Vec2): Vec2 => {
    const l = vec.len(v);
    return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 };
  },
  dist: (a: Vec2, b: Vec2): number => vec.len(vec.sub(a, b)),
  rotate: (v: Vec2, angle: number): Vec2 => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  },
  fromAngle: (angle: number): Vec2 => ({
    x: Math.cos(angle),
    y: Math.sin(angle),
  }),
  angle: (v: Vec2): number => Math.atan2(v.y, v.x),
  lerp: (a: Vec2, b: Vec2, t: number): Vec2 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }),
  perp: (v: Vec2): Vec2 => ({ x: -v.y, y: v.x }),
  clone: (v: Vec2): Vec2 => ({ x: v.x, y: v.y }),
};
