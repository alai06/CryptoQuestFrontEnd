import { BookOpen, Lightbulb, Wand2, Gamepad2, Trophy, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PrimaryButton } from './ui';

interface HomeScreenProps {
  onNavigate: (screen: 'tutorial' | 'solver' | 'generator' | 'game' | 'progress') => void;
  tutorialCompleted: boolean;
}

export default function HomeScreen({ onNavigate, tutorialCompleted }: HomeScreenProps) {
  const [completedLevels, setCompletedLevels] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);

  useEffect(() => {
    const completed = localStorage.getItem('completedLevels');
    if (completed) {
      setCompletedLevels(JSON.parse(completed).length);
    }

    const score = localStorage.getItem('totalScore');
    if (score) {
      setTotalScore(Number(score));
    }
  }, []);

  return (
    <div className="min-h-screen px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-6rem)]">
          {/* Main Hero Section - 2/3 width */}
          <div className="lg:col-span-2 flex flex-col justify-center py-16">
            {/* Hero Content */}
            <div className="mb-16">
              <h1 className="text-[64px] font-bold mb-6 tracking-[-0.02em] leading-[1.1]">
                Résolvez des<br />
                <span className="text-[#0096BC]">Cryptarithmes</span>
              </h1>
              
              <p className="text-[20px] text-[#86868B] max-w-xl leading-relaxed mb-12">
                Découvrez l'art des puzzles mathématiques où chaque lettre cache un chiffre unique.
              </p>

              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-4">
                {!tutorialCompleted ? (
                  <>
                    <PrimaryButton
                      onClick={() => onNavigate('tutorial')}
                      variant="primary"
                      leftIcon={<BookOpen className="w-5 h-5" strokeWidth={1.5} />}
                      rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                    >
                      Commencer le tutoriel
                    </PrimaryButton>
                  </>
                ) : (
                  <>
                    <PrimaryButton
                      onClick={() => onNavigate('game')}
                      variant="primary"
                      leftIcon={<Gamepad2 className="w-5 h-5" strokeWidth={1.5} />}
                      rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                    >
                      Continuer à jouer
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={() => onNavigate('solver')}
                      variant="secondary"
                    >
                      Mode Résolution
                    </PrimaryButton>
                  </>
                )}
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('solver')}
                className="bg-white border border-[#E5E5E5] rounded-[16px] p-5 hover:bg-[#FBFBFD] hover:border-[#D1D1D6] transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(0, 150, 188, 0.1)' }}
                  >
                    <Lightbulb className="w-5 h-5" style={{ color: '#0096BC' }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1D1D1F] mb-1">Résolution</div>
                    <div className="text-[13px] text-[#86868B]">Aide automatique</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('generator')}
                className="bg-white border border-[#E5E5E5] rounded-[16px] p-5 hover:bg-[#FBFBFD] hover:border-[#D1D1D6] transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(0, 150, 188, 0.1)' }}
                  >
                    <Wand2 className="w-5 h-5" style={{ color: '#0096BC' }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1D1D1F] mb-1">Génération</div>
                    <div className="text-[13px] text-[#86868B]">Créez vos puzzles</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1 flex flex-col gap-6 py-16">
            {/* Stats Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-[20px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#0096BC' }}
                >
                  <Trophy className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Progression</h3>
              </div>

              <div className="space-y-4 mb-6">
                {/* Score total */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-[#86868B]">Score total</span>
                    <span className="text-[14px] font-semibold text-[#1D1D1F]">{totalScore}/1000</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(totalScore / 1000) * 100}%`,
                        backgroundColor: '#0096BC'
                      }}
                    />
                  </div>
                </div>

                {/* Niveaux */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#86868B]">Niveaux</span>
                    <span className="text-[14px] font-semibold text-[#1D1D1F]">{completedLevels}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('progress')}
                className="w-full bg-[#F5F5F7] text-[#1D1D1F] px-6 py-3 rounded-[12px] font-medium text-[15px] transition-all hover:bg-[#E8E8ED] flex items-center justify-center gap-2"
              >
                Voir les détails
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Game Mode Card */}
            <button
              onClick={() => onNavigate('game')}
              className="bg-gradient-to-br from-[#0096BC] to-[#007EA1] rounded-[16px] p-8 text-left hover:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-[8px] bg-white/20 flex items-center justify-center mb-6">
                <Gamepad2 className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-[16px] font-semibold text-white mb-2">Mode Jeu</h3>
              <p className="text-[14px] text-white/80 leading-relaxed mb-4">
                5 niveaux de difficulté croissante avec système de scoring
              </p>
              
              <div className="flex items-center gap-2 text-white">
                <span className="text-[13px] font-medium">Jouer maintenant</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}