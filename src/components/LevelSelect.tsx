import { LEVELS } from "../constants";
import { useProgressStore } from "../store";
import { getProblemsForLevel } from "../problems";

interface Props {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ onSelectLevel, onBack }: Props) {
  const { levelProgress, totalScore, getUnlockedLevel } = useProgressStore();
  const unlockedLevel = getUnlockedLevel();

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">레벨 선택</h2>
        <p className="text-gray-400 text-sm mt-1">총 점수: {totalScore}점</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        {LEVELS.map((level) => {
          const isUnlocked = level.id <= unlockedLevel;
          const progress = levelProgress[level.id];
          const problems = getProblemsForLevel(level.id);
          const completedCount = progress
            ? progress.scores.filter((s) => s > 0).length
            : 0;

          return (
            <button
              key={level.id}
              onClick={() => isUnlocked && onSelectLevel(level.id)}
              disabled={!isUnlocked}
              className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                isUnlocked
                  ? "bg-gray-800 hover:bg-gray-700 cursor-pointer"
                  : "bg-gray-900 opacity-40 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  progress?.cleared
                    ? "bg-green-600 text-white"
                    : isUnlocked
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-500"
                }`}
              >
                {isUnlocked ? level.id : "🔒"}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{level.name}</div>
                <div className="text-xs text-gray-400">
                  {level.description}
                </div>
                {progress && (
                  <div className="text-xs text-gray-500 mt-1">
                    {completedCount}/{problems.length} 완료 | 최고점:{" "}
                    {progress.bestScore}점
                  </div>
                )}
              </div>
              {!isUnlocked && (
                <div className="text-xs text-gray-500">
                  {level.requiredScore}점 필요
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white text-sm mt-4"
      >
        ← 홈으로
      </button>
    </div>
  );
}
