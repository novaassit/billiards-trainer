import { useState, useCallback } from "react";
import { ShotParams, Vec2 } from "../types";

interface Props {
  aimAngle: number | null;
  onShoot: (params: ShotParams) => void;
  onAimChange?: (angle: number) => void;
  disabled: boolean;
  idealShot?: ShotParams | null;
  showAnswer?: boolean;
}

export default function ShotControls({ aimAngle, onShoot, onAimChange, disabled, idealShot, showAnswer }: Props) {
  const [power, setPower] = useState(0.5);
  const [spin, setSpin] = useState<Vec2>({ x: 0, y: 0 });

  const applyAnswer = useCallback(() => {
    if (!idealShot || !onAimChange) return;
    onAimChange(idealShot.angle);
    setPower(idealShot.power);
    setSpin({ ...idealShot.spin });
  }, [idealShot, onAimChange]);

  const handleShoot = useCallback(() => {
    if (aimAngle === null || disabled) return;
    onShoot({ angle: aimAngle, power, spin });
  }, [aimAngle, power, spin, onShoot, disabled]);

  const handleSpinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setSpin({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const resetSpin = () => setSpin({ x: 0, y: 0 });

  return (
    <div className="bg-gray-900/80 rounded-xl p-3 md:p-4 backdrop-blur-sm
      flex flex-row md:flex-col items-center md:items-stretch gap-3 md:gap-4 md:min-w-[140px]">
      {/* Power */}
      <div className="flex flex-col gap-1 flex-1 md:flex-none min-w-0">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          강도
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={power}
          onChange={(e) => setPower(parseFloat(e.target.value))}
          className="accent-blue-500 w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>약</span>
          <span className="text-white font-mono">
            {Math.round(power * 100)}%
          </span>
          <span>강</span>
        </div>
      </div>

      {/* Spin Pad (타점) */}
      <div className="flex flex-col gap-1 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-400 uppercase tracking-wider">
            타점
          </label>
          <button
            onClick={resetSpin}
            className="text-[10px] text-gray-500 hover:text-white"
          >
            리셋
          </button>
        </div>
        <div
          onClick={handleSpinClick}
          className="relative w-[60px] h-[60px] md:w-[80px] md:h-[80px] cursor-crosshair"
        >
          <div className="absolute inset-0 rounded-full bg-gray-200 border-2 border-gray-400 overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400/30" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400/30" />
          </div>
          <div
            className="absolute w-3 h-3 bg-red-500 rounded-full border border-red-300 shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
            style={{
              left: `${50 + spin.x * 40}%`,
              top: `${50 + spin.y * 40}%`,
            }}
          />
        </div>
        <div className="text-center text-[10px] text-gray-500">
          {spin.x === 0 && spin.y === 0
            ? "무회전"
            : `${spin.y < -0.2 ? "밀어" : spin.y > 0.2 ? "끌어" : ""}${
                spin.x < -0.2 ? " 좌" : spin.x > 0.2 ? " 우" : ""
              }`.trim() || "약간"}
        </div>
      </div>

      {/* Shoot button */}
      <button
        onClick={handleShoot}
        disabled={aimAngle === null || disabled}
        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50
          text-white font-bold py-3 px-4 md:px-4 rounded-lg text-sm transition-colors
          active:scale-95 transform whitespace-nowrap"
      >
        {aimAngle === null ? "조준" : "샷!"}
      </button>

      {/* Apply answer button */}
      {showAnswer && idealShot && (
        <button
          onClick={applyAnswer}
          className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs py-2 px-3 rounded-lg transition-colors whitespace-nowrap"
        >
          정답 적용
        </button>
      )}

      {/* Help - desktop only */}
      {aimAngle === null && !showAnswer && (
        <p className="hidden md:block text-[10px] text-gray-500 text-center leading-tight">
          수구(흰공)를 드래그하여
          <br />
          방향을 조준하세요
        </p>
      )}
    </div>
  );
}
