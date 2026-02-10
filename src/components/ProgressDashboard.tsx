import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Target, Award, Medal, Crown, Menu } from 'lucide-react';

interface ProgressDashboardProps {
  onBack: () => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  requirement: string;
}

export default function ProgressDashboard({ onBack, isMobile = false, onOpenSidebar }: ProgressDashboardProps) {
  const [completedLevels, setCompletedLevels] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('completedLevels');
    if (completed) {
      setCompletedLevels(JSON.parse(completed).length);
    }

    const score = localStorage.getItem('totalScore');
    if (score) {
      setTotalScore(Number(score));
    }

    const stars = localStorage.getItem('levelStars');
    if (stars) {
      setLevelStars(JSON.parse(stars));
    }

    const tutorial = localStorage.getItem('tutorialCompleted');
    setTutorialCompleted(tutorial === 'true');
  }, []);

  const totalStars = Object.values(levelStars).reduce((sum, stars) => sum + stars, 0);
  const totalPossibleStars = 15; // 5 levels × 3 stars

  const badges: Badge[] = [
    {
      id: 'first-steps',
      name: 'Premiers pas',
      description: 'Terminer le tutoriel',
      icon: Award,
      unlocked: tutorialCompleted,
      requirement: 'Tutoriel terminé',
    },
    {
      id: 'novice',
      name: 'Novice',
      description: 'Terminer le premier niveau',
      icon: Medal,
      unlocked: completedLevels >= 1,
      requirement: 'Niveau 1 complété',
    },
    {
      id: 'apprentice',
      name: 'Apprenti',
      description: 'Terminer 3 niveaux',
      icon: Star,
      unlocked: completedLevels >= 3,
      requirement: '3 niveaux complétés',
    },
    {
      id: 'expert',
      name: 'Expert',
      description: 'Terminer tous les niveaux',
      icon: Trophy,
      unlocked: completedLevels >= 5,
      requirement: 'Tous les niveaux complétés',
    },
    {
      id: 'perfectionist',
      name: 'Perfectionniste',
      description: 'Obtenir 3 étoiles sur tous les niveaux',
      icon: Crown,
      unlocked: totalStars === totalPossibleStars,
      requirement: '15 étoiles au total',
    },
    {
      id: 'scorer',
      name: 'Chasseur de points',
      description: 'Atteindre 1000 points',
      icon: Target,
      unlocked: totalScore >= 1000,
      requirement: '1000 points',
    },
  ];

  const unlockedBadges = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Main Stats Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8 mb-6">
          {/* Back Button - Mobile only */}
          {isMobile && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-8 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              <span className="text-[14px] font-medium">Retour</span>
            </button>
          )}

          <h1 className="text-[32px] font-bold mb-8 tracking-[-0.02em]">Votre Progression</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#F5F5F7] rounded-[12px] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className="text-[14px] text-[#86868B]">Score Total</span>
              </div>
              <p className="text-[32px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{totalScore}</p>
            </div>

            <div className="bg-[#F5F5F7] rounded-[12px] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className="text-[14px] text-[#86868B]">Niveaux complétés</span>
              </div>
              <p className="text-[32px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{completedLevels} / 5</p>
            </div>

            <div className="bg-[#F5F5F7] rounded-[12px] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className="text-[14px] text-[#86868B]">Étoiles</span>
              </div>
              <p className="text-[32px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{totalStars} / {totalPossibleStars}</p>
            </div>

            <div className="bg-[#F5F5F7] rounded-[12px] p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className="text-[14px] text-[#86868B]">Badges</span>
              </div>
              <p className="text-[32px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{unlockedBadges} / {badges.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-medium text-[#1D1D1F]">Progression globale</span>
              <span className="text-[14px] text-[#86868B]">{Math.round((completedLevels / 5) * 100)}%</span>
            </div>
            <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
              <div
                className="h-2 bg-[#0096BC] transition-all duration-500 rounded-full"
                style={{ width: `${(completedLevels / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Level Details */}
          <div>
            <h2 className="text-[20px] font-semibold mb-4 tracking-[-0.01em]">Détails des niveaux</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((level) => {
                const stars = levelStars[level] || 0;
                const completed = stars > 0;

                return (
                  <div
                    key={level}
                    className={`
                      p-4 rounded-[12px] border transition-all
                      ${completed
                        ? 'bg-[#E8F7FB] border-[#0096BC]'
                        : 'bg-[#F5F5F7] border-[#E5E5E5]'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className={`
                        w-12 h-12 mx-auto mb-3 rounded-[12px] flex items-center justify-center text-[18px] font-semibold
                        ${completed ? 'bg-[#0096BC] text-white' : 'bg-[#E5E5E5] text-[#86868B]'}
                      `}>
                        {level}
                      </div>
                      <p className="text-[#1D1D1F] text-[14px] font-medium mb-2">Niveau {level}</p>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= stars ? 'fill-[#FF9500] text-[#FF9500]' : 'text-[#E5E5E5]'
                              }`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8 mb-6">
          <h2 className="text-[20px] font-semibold mb-6 tracking-[-0.01em]">Badges & Récompenses</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`
                    p-6 rounded-[12px] border transition-all
                    ${badge.unlocked
                      ? 'bg-[#FFFBF0] border-[#FFD60A]'
                      : 'bg-[#F5F5F7] border-[#E5E5E5] opacity-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0
                      ${badge.unlocked
                        ? 'bg-[#FFD60A] text-[#1D1D1F]'
                        : 'bg-[#E5E5E5] text-[#86868B]'
                      }
                    `}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-[#1D1D1F] mb-1 font-semibold text-[16px]">{badge.name}</h3>
                      <p className="text-[#86868B] text-[14px] mb-2">{badge.description}</p>
                      <p className="text-[12px] text-[#86868B]">{badge.requirement}</p>
                      {badge.unlocked && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-[#D4F4DD] text-[#1D1D1F] px-2 py-1 rounded-full text-[12px] font-medium">
                          Débloqué
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Message */}
        {completedLevels < 5 && (
          <div className="bg-[#0096BC] text-white rounded-[12px] p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-[20px] font-semibold mb-2 tracking-[-0.01em]">Continuez comme ça !</h3>
            <p className="text-white/80 text-[14px]">
              Vous avez complété {completedLevels} niveau{completedLevels > 1 ? 's' : ''}.
              Encore {5 - completedLevels} à terminer pour devenir un expert !
            </p>
          </div>
        )}

        {completedLevels === 5 && totalStars === totalPossibleStars && (
          <div className="bg-[#FFD60A] text-[#1D1D1F] rounded-[12px] p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-[20px] font-semibold mb-2 tracking-[-0.01em]">Félicitations, Champion !</h3>
            <p className="text-[#1D1D1F]/80 text-[14px]">
              Vous avez complété tous les niveaux avec 3 étoiles chacun. Vous êtes un maître des cryptarithmes !
            </p>
          </div>
        )}
      </div>
    </div >
  );
}