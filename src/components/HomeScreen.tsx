import { BookOpen, Lightbulb, Wand2, Gamepad2, Trophy, ArrowRight, Star, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

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
                    <button
                      onClick={() => onNavigate('tutorial')}
                      className="group flex items-center gap-3 px-8 py-4 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all"
                    >
                      <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[15px] font-medium">Commencer le tutoriel</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigate('game')}
                      className="group flex items-center gap-3 px-8 py-4 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all"
                    >
                      <Gamepad2 className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[15px] font-medium">Continuer à jouer</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onNavigate('solver')}
                      className="px-8 py-4 bg-white border border-[#E5E5E5] text-[#1D1D1F] rounded-[12px] hover:border-[#0096BC] transition-all"
                    >
                      <span className="text-[15px] font-medium">Mode Résolution</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('solver')}
                className="group flex items-center gap-4 p-6 bg-white border border-[#E5E5E5] rounded-[12px] hover:border-[#0096BC] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-[8px] bg-[#E8F7FB] flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1D1D1F] mb-1">Résolution</div>
                  <div className="text-[13px] text-[#86868B]">Aide automatique</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('generator')}
                className="group flex items-center gap-4 p-6 bg-white border border-[#E5E5E5] rounded-[12px] hover:border-[#0096BC] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-[8px] bg-[#E8F7FB] flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1D1D1F] mb-1">Génération</div>
                  <div className="text-[13px] text-[#86868B]">Créez vos puzzles</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1 flex flex-col gap-6 py-16">
            {/* Stats Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[8px] bg-[#0096BC] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Progression</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-[#86868B]">Score total</span>
                    <span className="text-[18px] font-bold text-[#1D1D1F]">{totalScore}</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0096BC] rounded-full transition-all"
                      style={{ width: `${Math.min((totalScore / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-[#86868B]">Niveaux</span>
                    <span className="text-[18px] font-bold text-[#1D1D1F]">{completedLevels}</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00AFD7] rounded-full transition-all"
                      style={{ width: `${(completedLevels / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('progress')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#F5F5F7] text-[#1D1D1F] rounded-[8px] hover:bg-[#E5E5E5] transition-all text-[14px] font-medium"
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

            {/* Tutorial Badge */}
            {!tutorialCompleted && (
              <div className="bg-[#E8F7FB] border border-[#00AFD7]/20 rounded-[12px] p-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00AFD7] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1D1D1F] mb-1">
                      Tutoriel recommandé
                    </div>
                    <p className="text-[13px] text-[#86868B] leading-relaxed">
                      Apprenez les bases en 5 minutes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}