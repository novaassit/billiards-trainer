import { useGameStore } from "./store";
import HomeScreen from "./components/HomeScreen";
import LevelSelect from "./components/LevelSelect";
import GameScreen from "./components/GameScreen";

export default function App() {
  const { phase, setPhase, loadProblem, goHome } = useGameStore();

  const handleStart = () => setPhase("levelSelect");

  const handleSelectLevel = (level: number) => {
    loadProblem(level, 0);
  };

  const handleBack = () => goHome();

  if (phase === "home") {
    return <HomeScreen onStart={handleStart} />;
  }

  if (phase === "levelSelect") {
    return (
      <LevelSelect onSelectLevel={handleSelectLevel} onBack={handleBack} />
    );
  }

  // aiming, simulating, result
  return <GameScreen />;
}
