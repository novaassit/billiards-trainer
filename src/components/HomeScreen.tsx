import { useProgressStore } from "../store";
import { LEVELS } from "../constants";

interface Props {
  onStart: () => void;
}

export default function HomeScreen({ onStart }: Props) {
  const totalScore = useProgressStore((s) => s.totalScore);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">3쿠션 길보기 트레이너</h1>
        <p className="text-gray-400 text-sm">
          경로를 예측하고, 샷을 날려 실력을 키우세요
        </p>
      </div>

      {/* Pool table illustration */}
      <div className="relative w-64 h-32 bg-[#1a6b3c] rounded-lg border-4 border-[#5a2d0c] shadow-xl">
        <div className="absolute w-4 h-4 bg-white rounded-full top-16 left-10 shadow" />
        <div className="absolute w-4 h-4 bg-yellow-400 rounded-full top-10 left-32 shadow" />
        <div className="absolute w-4 h-4 bg-red-600 rounded-full top-20 right-12 shadow" />
        {/* Dotted path */}
        <svg className="absolute inset-0 w-full h-full">
          <path
            d="M 48 68 L 128 12 L 200 12 L 200 100 L 220 88"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
          />
        </svg>
      </div>

      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-xl text-lg transition-colors shadow-lg active:scale-95 transform"
      >
        시작하기
      </button>

      {totalScore > 0 && (
        <p className="text-gray-500 text-sm">총 점수: {totalScore}점</p>
      )}

      <div className="text-gray-600 text-xs max-w-sm text-center">
        수구로 제1목적구를 맞힌 뒤, 3개 이상의 쿠션을 거쳐 제2목적구를 맞히세요
      </div>
    </div>
  );
}
