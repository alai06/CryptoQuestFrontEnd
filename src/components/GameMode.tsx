import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Timer, HelpCircle, ChevronRight, Lock, Eye, EyeOff, Menu } from 'lucide-react';
import DragDropBoard from './DragDropBoard';

interface GameModeProps {
  onBack: () => void;
  tutorialCompleted: boolean;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface Level {
  id: number;
  name: string;
  equation: string;
  solution: Record<string, string>;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const gameLevels: Level[] = [
  {
    id: 1,
    name: 'Niveau 1 : Premiers pas',
    equation: 'A + B = C',
    solution: { A: '1', B: '2', C: '3' },
    timeLimit: 120,
    difficulty: 'easy',
  },
  {
    id: 2,
    name: 'Niveau 2 : Double lettre',
    equation: 'A + A = B',
    solution: { A: '5', B: '10' },
    timeLimit: 120,
    difficulty: 'easy',
  },
  {
    id: 3,
    name: 'Niveau 3 : Trois lettres',
    equation: 'AB + BA = CDC',
    solution: { A: '5', B: '6', C: '1', D: '1' },
    timeLimit: 180,
    difficulty: 'medium',
  },
  {
    id: 4,
    name: 'Niveau 4 : Classique',
    equation: 'TWO + TWO = FOUR',
    solution: { T: '7', W: '6', O: '5', F: '1', U: '3', R: '0' },
    timeLimit: 240,
    difficulty: 'medium',
  },
  {
    id: 5,
    name: 'Niveau 5 : Expert',
    equation: 'SEND + MORE = MONEY',
    solution: { S: '9', E: '5', N: '6', D: '7', M: '1', O: '0', R: '8', Y: '2' },
    timeLimit: 300,
    difficulty: 'hard',
  },
];

export default function GameMode({ onBack, tutorialCompleted, isMobile = false, onOpenSidebar }: GameModeProps) {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});

  const isEasyMode = selectedLevel?.difficulty === 'easy';

  useEffect(() => {
    const saved = localStorage.getItem('completedLevels');
    if (saved) {
      setCompletedLevels(new Set(JSON.parse(saved)));
    }

    const savedStars = localStorage.getItem('levelStars');
    if (savedStars) {
      setLevelStars(JSON.parse(savedStars));
    }

    const savedScore = localStorage.getItem('totalScore');
    if (savedScore) {
      setScore(Number(savedScore));
    }
  }, []);

  useEffect(() => {
    if (selectedLevel && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedLevel, timeRemaining]);

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setTimeRemaining(level.timeLimit);
    setShowHint(false);
    setShowConstraints(false);
  };

  const handleLevelComplete = () => {
    if (!selectedLevel) return;

    const newCompleted = new Set(completedLevels);
    newCompleted.add(selectedLevel.id);
    setCompletedLevels(newCompleted);
    localStorage.setItem('completedLevels', JSON.stringify(Array.from(newCompleted)));

    const timeUsed = selectedLevel.timeLimit - timeRemaining;
    const percentage = (timeRemaining / selectedLevel.timeLimit) * 100;
    let stars = 1;
    if (percentage > 66) stars = 3;
    else if (percentage > 33) stars = 2;

    const newStars = { ...levelStars, [selectedLevel.id]: Math.max(stars, levelStars[selectedLevel.id] || 0) };
    setLevelStars(newStars);
    localStorage.setItem('levelStars', JSON.stringify(newStars));

    const points = stars * 100;
    const newScore = score + points;
    setScore(newScore);
    localStorage.setItem('totalScore', newScore.toString());

    setTimeout(() => {
      setSelectedLevel(null);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLevelUnlocked = (levelId: number) => {
    return true;
  };

  if (selectedLevel) {
    return (
      <div className="min-h-screen px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedLevel(null)}
              className={`flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors ${isMobile ? 'text-[16px] p-2' : ''
                }`}
            >
              <ArrowLeft className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={1.5} />
              <span className="text-[14px] font-medium">Niveaux</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-[12px]">
                <Timer className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className={`font-mono text-[14px] font-medium ${timeRemaining < 30 ? 'text-[#FF3B30]' : 'text-[#1D1D1F]'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Constraints Button */}
              <button
                onClick={() => setShowConstraints(!showConstraints)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] transition-colors text-[14px] font-medium ${showConstraints
                  ? 'bg-[#0096BC] text-white'
                  : 'bg-white border border-[#E5E5E5] text-[#1D1D1F] hover:border-[#0096BC]'
                  }`}
              >
                {showConstraints ? <Eye className="w-5 h-5" strokeWidth={1.5} /> : <EyeOff className="w-5 h-5" strokeWidth={1.5} />}
                <span>Contraintes</span>
              </button>

              {/* Help Button */}
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-[12px] hover:border-[#0096BC] transition-colors text-[14px] font-medium"
              >
                <HelpCircle className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span>Aide</span>
              </button>
            </div>
          </div>

          {/* Game Board */}
          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8">
            <div className="mb-8">
              <h2 className="text-[24px] font-bold mb-2 tracking-[-0.02em]">{selectedLevel.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`
                  px-3 py-1 rounded-full text-[14px] font-medium
                  ${selectedLevel.difficulty === 'easy' ? 'bg-[#D4F4DD] text-[#1D1D1F]' : ''}
                  ${selectedLevel.difficulty === 'medium' ? 'bg-[#FFF5E5] text-[#1D1D1F]' : ''}
                  ${selectedLevel.difficulty === 'hard' ? 'bg-[#FFE5E5] text-[#1D1D1F]' : ''}
                `}>
                  {selectedLevel.difficulty === 'easy' && 'Facile'}
                  {selectedLevel.difficulty === 'medium' && 'Moyen'}
                  {selectedLevel.difficulty === 'hard' && 'Difficile'}
                </span>
              </div>
            </div>

            <DragDropBoard
              equation={selectedLevel.equation}
              solution={selectedLevel.solution}
              onSolved={handleLevelComplete}
              showHints={showHint}
              easyMode={isEasyMode}
              showConstraints={showConstraints}
            />

            {timeRemaining === 0 && (
              <div className="mt-8 p-4 bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] text-center">
                <p className="text-[#FF3B30] text-[14px]">
                  Temps écoulé ! Vous pouvez continuer sans limite de temps.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-5xl mx-auto">
        {/* Mobile Header - Only on mobile */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-[#1D1D1F]" strokeWidth={2} />
              </button>
              <h1 className="text-[18px] font-bold text-[#1D1D1F]">Mode Aventure</h1>
              <button
                onClick={onOpenSidebar}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-end mb-16">
          <div className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-6 py-3 rounded-[12px]">
            <Trophy className="w-6 h-6 text-[#FF9500]" strokeWidth={1.5} />
            <span className="text-[#1D1D1F] font-medium">Score: {score}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-10">
          <h1 className="text-[32px] font-bold mb-2 tracking-[-0.02em]">Mode Aventure</h1>
          <p className="text-[14px] text-[#86868B] mb-10">
            Progressez à travers les niveaux et gagnez des étoiles !
          </p>

          <div className="space-y-4">
            {gameLevels.map((level) => {
              const isUnlocked = isLevelUnlocked(level.id);
              const isCompleted = completedLevels.has(level.id);
              const stars = levelStars[level.id] || 0;

              return (
                <button
                  key={level.id}
                  onClick={() => isUnlocked && handleLevelSelect(level)}
                  disabled={!isUnlocked}
                  className={`
                    w-full p-6 rounded-[12px] transition-all text-left border
                    ${isUnlocked
                      ? 'bg-white border-[#E5E5E5] hover:border-[#0096BC] active:scale-[0.99]'
                      : 'bg-[#F5F5F7] border-[#E5E5E5] opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-[12px] flex items-center justify-center font-semibold
                        ${isUnlocked ? 'bg-[#0096BC] text-white' : 'bg-[#E5E5E5] text-[#86868B]'}
                      `}>
                        {isUnlocked ? level.id : <Lock className="w-6 h-6" strokeWidth={1.5} />}
                      </div>

                      <div>
                        <h3 className="text-[#1D1D1F] mb-1 font-semibold text-[16px] tracking-[-0.01em]">{level.name}</h3>
                        <p className="text-[#86868B] text-[14px] font-mono">{level.equation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isCompleted && (
                        <div className="flex gap-1">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= stars ? 'fill-[#FF9500] text-[#FF9500]' : 'text-[#E5E5E5]'
                                }`}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      )}

                      {isUnlocked && <ChevronRight className="w-6 h-6 text-[#0096BC]" strokeWidth={1.5} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}