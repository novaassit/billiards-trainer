import { useCallback, useState } from "react";
import { useGameStore, useProgressStore } from "../store";
import BilliardCanvas from "./BilliardCanvas";
import ShotControls from "./ShotControls";
import { ShotParams } from "../types";

export default function GameScreen() {
  const {
    phase,
    currentProblem,
    balls,
    aimAngle,
    simulationResult,
    attempts,
    lastScore,
    setAimAngle,
    executeShot,
    nextProblem,
    retryProblem,
    goHome,
  } = useGameStore();

  const addScore = useProgressStore((s) => s.addScore);
  const [showResult, setShowResult] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleShoot = useCallback(
    (params: ShotParams) => {
      executeShot(params);
      setShowResult(false);
    },
    [executeShot]
  );

  const handleSimulationComplete = useCallback(() => {
    setShowResult(true);

    // Save score
    const { currentProblem, currentProblemIndex, currentLevel, lastScore } =
      useGameStore.getState();
    if (currentProblem && lastScore > 0) {
      addScore(currentLevel, currentProblemIndex, lastScore);
    }
  }, [addScore]);

  const handleNext = () => {
    setShowResult(false);
    nextProblem();
  };

  const handleRetry = () => {
    setShowResult(false);
    setShowAnswer(false);
    retryProblem();
  };

  const handleToggleAnswer = () => {
    setShowAnswer((prev) => !prev);
  };

  if (!currentProblem) return null;

  const canvasPhase =
    phase === "simulating"
      ? "simulating"
      : showResult
        ? "result"
        : "aiming";

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50">
        <button
          onClick={goHome}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← 나가기
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{currentProblem.title}</div>
          <div className="text-xs text-gray-400">
            {currentProblem.description}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAnswer}
            className={`text-xs px-2 py-1 rounded ${
              showAnswer
                ? "bg-yellow-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {showAnswer ? "정답 숨기기" : "정답 보기"}
          </button>
          <span className="text-xs text-gray-500">시도: {attempts}</span>
        </div>
      </div>

      {/* Main game area - responsive: column on mobile, row on desktop */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 min-h-0">
        <BilliardCanvas
          balls={balls}
          aimAngle={aimAngle}
          simulationResult={simulationResult}
          idealPath={showResult || showAnswer ? currentProblem.idealPath : null}
          phase={canvasPhase}
          onAimChange={setAimAngle}
          onSimulationComplete={handleSimulationComplete}
        />

        {/* Controls panel - horizontal on mobile, vertical on desktop */}
        {!showResult && (
          <div className="shrink-0">
            <ShotControls
              aimAngle={aimAngle}
              onShoot={handleShoot}
              disabled={phase === "simulating"}
            />
          </div>
        )}
      </div>

      {/* Result overlay */}
      {showResult && simulationResult && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            {simulationResult.success ? (
              <>
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">
                  성공!
                </h3>
                <p className="text-5xl font-bold text-white mb-2">
                  {lastScore}
                  <span className="text-lg text-gray-400">점</span>
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  쿠션 {simulationResult.cushionHitCount}개 |{" "}
                  {attempts}번째 시도
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">😅</div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">
                  실패
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  쿠션 {simulationResult.cushionHitCount}개 맞힘
                  {simulationResult.cushionHitCount < 3 &&
                    ` (3개 이상 필요)`}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  경로를 다시 읽고 도전해보세요
                </p>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm font-medium transition-colors"
              >
                다시하기
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
              >
                다음 문제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
