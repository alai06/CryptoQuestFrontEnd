import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Award, Medal, Crown, Zap, Flame, Sparkles, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import BackButtonWithProgress from './BackButtonWithProgress';

interface ProgressDashboardProps {
  onBack: () => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  requirement: string;
  category: 'completion' | 'performance' | 'speed' | 'collection';
}

interface Level {
  id: number;
  name: string;
  xpRequired: number;
}

// Calcul de l'XP requis pour chaque niveau (progression exponentielle)
const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calcul du niveau et de l'XP actuelle basé sur le total XP
const calculateLevelFromXP = (totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number } => {
  let level = 1;
  let xpUsed = 0;
  
  while (true) {
    const xpForNextLevel = calculateXPForLevel(level + 1);
    if (xpUsed + xpForNextLevel > totalXP) {
      const currentLevelXP = totalXP - xpUsed;
      const progress = (currentLevelXP / xpForNextLevel) * 100;
      return { level, currentLevelXP, nextLevelXP: xpForNextLevel, progress };
    }
    xpUsed += xpForNextLevel;
    level++;
  }
};

export default function ProgressDashboard({ onBack, isMobile = false, onOpenSidebar }: ProgressDashboardProps) {
  const [totalXP, setTotalXP] = useState<number>(0);
  const [completedCryptos, setCompletedCryptos] = useState<number>(0);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [totalScore, setTotalScore] = useState<number>(0);
  const [generatedCount, setGeneratedCount] = useState<number>(0);

  useEffect(() => {
    // Charger les cryptarithmes complétés
    const completed = localStorage.getItem('completedCryptarithms');
    if (completed) {
      const cryptos = JSON.parse(completed);
      setCompletedCryptos(cryptos.length);
    }

    // Charger les étoiles et calculer l'XP
    const stars = localStorage.getItem('levelStars');
    if (stars) {
      const starsObj = JSON.parse(stars);
      setLevelStars(starsObj);
      
      // Calculer XP total : 1★=10, 2★=25, 3★=50, 4★=100
      let xp = 0;
      Object.values(starsObj).forEach((starCount: any) => {
        if (starCount === 1) xp += 10;
        else if (starCount === 2) xp += 25;
        else if (starCount === 3) xp += 50;
        else if (starCount === 4) xp += 100;
      });
      setTotalXP(xp);
    }

    const score = localStorage.getItem('totalScore');
    if (score) {
      setTotalScore(Number(score));
    }

    // Compter les cryptarithmes générés
    const generated = localStorage.getItem('generatedCryptarithms');
    if (generated) {
      setGeneratedCount(JSON.parse(generated).length);
    }
  }, []);

  const { level, currentLevelXP, nextLevelXP, progress } = calculateLevelFromXP(totalXP);
  
  // Statistiques des étoiles
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  Object.values(levelStars).forEach((stars: any) => {
    if (stars >= 1 && stars <= 4) {
      starCounts[stars as keyof typeof starCounts]++;
    }
  });

  const achievements: Achievement[] = [
    {
      id: 'first-crypto',
      name: 'Premier pas',
      description: 'Compléter votre premier cryptarithme',
      icon: Star,
      unlocked: completedCryptos >= 1,
      requirement: '1 cryptarithme complété',
      category: 'completion',
    },
    {
      id: 'beginner',
      name: 'Débutant',
      description: 'Compléter 5 cryptarithmes',
      icon: Target,
      unlocked: completedCryptos >= 5,
      requirement: '5 cryptarithmes complétés',
      category: 'completion',
    },
    {
      id: 'intermediate',
      name: 'Intermédiaire',
      description: 'Compléter 15 cryptarithmes',
      icon: TrendingUp,
      unlocked: completedCryptos >= 15,
      requirement: '15 cryptarithmes complétés',
      category: 'completion',
    },
    {
      id: 'expert',
      name: 'Expert',
      description: 'Compléter 30 cryptarithmes',
      icon: Award,
      unlocked: completedCryptos >= 30,
      requirement: '30 cryptarithmes complétés',
      category: 'completion',
    },
    {
      id: 'master',
      name: 'Maître',
      description: 'Compléter 50 cryptarithmes',
      icon: Crown,
      unlocked: completedCryptos >= 50,
      requirement: '50 cryptarithmes complétés',
      category: 'completion',
    },
    {
      id: 'perfect-5',
      name: 'Perfectionniste',
      description: 'Obtenir 5 cryptarithmes avec 4★',
      icon: Sparkles,
      unlocked: starCounts[4] >= 5,
      requirement: '5 cryptarithmes à 4★',
      category: 'performance',
    },
    {
      id: 'perfect-15',
      name: 'Légende',
      description: 'Obtenir 15 cryptarithmes avec 4★',
      icon: Flame,
      unlocked: starCounts[4] >= 15,
      requirement: '15 cryptarithmes à 4★',
      category: 'performance',
    },
    {
      id: 'three-stars',
      name: 'Excellent',
      description: 'Obtenir 10 cryptarithmes avec 3★',
      icon: Medal,
      unlocked: starCounts[3] >= 10,
      requirement: '10 cryptarithmes à 3★',
      category: 'performance',
    },
    {
      id: 'fast-10',
      name: 'Éclair',
      description: 'Compléter 10 cryptarithmes sans vérification',
      icon: Zap,
      unlocked: starCounts[4] >= 10,
      requirement: '10 cryptarithmes à 4★ (0 vérifications)',
      category: 'speed',
    },
    {
      id: 'generator',
      name: 'Créateur',
      description: 'Générer 10 cryptarithmes',
      icon: CheckCircle,
      unlocked: generatedCount >= 10,
      requirement: '10 cryptarithmes générés',
      category: 'collection',
    },
    {
      id: 'collector',
      name: 'Collectionneur',
      description: 'Générer 25 cryptarithmes',
      icon: Trophy,
      unlocked: generatedCount >= 25,
      requirement: '25 cryptarithmes générés',
      category: 'collection',
    },
    {
      id: 'level-10',
      name: 'Niveau X',
      description: 'Atteindre le niveau 10',
      icon: Crown,
      unlocked: level >= 10,
      requirement: 'Niveau 10 atteint',
      category: 'completion',
    },
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const categoryColors = {
    completion: { bg: 'bg-[#E8F7FB]', border: 'border-[#0096BC]', icon: 'bg-[#0096BC]' },
    performance: { bg: 'bg-[#FFFBF0]', border: 'border-[#FFD60A]', icon: 'bg-[#FFD60A]' },
    speed: { bg: 'bg-[#FFE5F0]', border: 'border-[#FF3B7C]', icon: 'bg-[#FF3B7C]' },
    collection: { bg: 'bg-[#F0E8FF]', border: 'border-[#9B51E0]', icon: 'bg-[#9B51E0]' },
  };

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Back Button - Mobile only */}
        {isMobile && <BackButtonWithProgress onBack={onBack} />}

        {/* Niveau et XP */}
        <div className="bg-gradient-to-br from-[#0096BC] to-[#007EA1] text-white rounded-[16px] p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[40px] font-bold tracking-[-0.02em] mb-2">Niveau {level}</h1>
              <p className="text-white/80 text-[16px]">{currentLevelXP} / {nextLevelXP} XP</p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          
          {/* Barre de progression XP */}
          <div className="relative">
            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-4 bg-white transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/90 text-[13px] mt-2 text-center font-medium">
              {Math.round(progress)}% vers le niveau {level + 1}
            </p>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
              <span className="text-[14px] text-[#86868B]">Cryptarithmes complétés</span>
            </div>
            <p className="text-[36px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{completedCryptos}</p>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[#FF9500]" strokeWidth={1.5} />
              <span className="text-[14px] text-[#86868B]">XP Total</span>
            </div>
            <p className="text-[36px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{totalXP}</p>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-[#FFD60A]" strokeWidth={1.5} />
              <span className="text-[14px] text-[#86868B]">Titres débloqués</span>
            </div>
            <p className="text-[36px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{unlockedAchievements} / {achievements.length}</p>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-[#34C759]" strokeWidth={1.5} />
              <span className="text-[14px] text-[#86868B]">Score Total</span>
            </div>
            <p className="text-[36px] text-[#1D1D1F] tracking-[-0.02em] font-bold">{totalScore}</p>
          </div>
        </div>

        {/* Répartition des étoiles */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8 mb-6">
          <h2 className="text-[24px] font-bold mb-6 tracking-[-0.02em]">Répartition des étoiles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#FFE5F0] to-[#FFF0F7] rounded-[12px] p-6 border border-[#FF3B7C]/20">
              <div className="text-center">
                <p className="text-[48px] mb-2">⭐</p>
                <p className="text-[32px] font-bold text-[#1D1D1F] tracking-[-0.02em]">{starCounts[1]}</p>
                <p className="text-[14px] text-[#86868B] mt-1">Complété</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#FFF5E5] to-[#FFFBF0] rounded-[12px] p-6 border border-[#FF9500]/20">
              <div className="text-center">
                <p className="text-[48px] mb-2">⭐⭐</p>
                <p className="text-[32px] font-bold text-[#1D1D1F] tracking-[-0.02em]">{starCounts[2]}</p>
                <p className="text-[14px] text-[#86868B] mt-1">Bon</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#E8F7FB] to-[#F0FAFF] rounded-[12px] p-6 border border-[#0096BC]/20">
              <div className="text-center">
                <p className="text-[48px] mb-2">⭐⭐⭐</p>
                <p className="text-[32px] font-bold text-[#1D1D1F] tracking-[-0.02em]">{starCounts[3]}</p>
                <p className="text-[14px] text-[#86868B] mt-1">Excellent</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#FFFBF0] to-[#FFFFF5] rounded-[12px] p-6 border border-[#FFD60A]/30 shadow-md">
              <div className="text-center">
                <p className="text-[48px] mb-2">🌟⭐⭐⭐</p>
                <p className="text-[32px] font-bold text-[#1D1D1F] tracking-[-0.02em]">{starCounts[4]}</p>
                <p className="text-[14px] text-[#86868B] mt-1">Parfait</p>
              </div>
            </div>
          </div>
        </div>

        {/* Titres & Achievements */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8 mb-6">
          <h2 className="text-[24px] font-bold mb-6 tracking-[-0.02em]">Titres & Récompenses</h2>
          <p className="text-[14px] text-[#86868B] mb-6">
            Débloquez des titres en accomplissant des objectifs spécifiques
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const colors = categoryColors[achievement.category];
              return (
                <div
                  key={achievement.id}
                  className={`
                    rounded-[12px] border p-6 transition-all
                    ${achievement.unlocked
                      ? `${colors.bg} ${colors.border}`
                      : 'bg-[#F5F5F7] border-[#E5E5E5] opacity-60'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0
                      ${achievement.unlocked
                        ? `${colors.icon} text-white`
                        : 'bg-[#E5E5E5] text-[#86868B]'
                      }
                    `}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-[#1D1D1F] mb-1 font-semibold text-[16px]">{achievement.name}</h3>
                      <p className="text-[#86868B] text-[13px] mb-2">{achievement.description}</p>
                      <p className="text-[12px] text-[#86868B]/80">{achievement.requirement}</p>
                      {achievement.unlocked && (
                        <div className="mt-3 inline-flex items-center gap-1 bg-[#34C759]/10 text-[#34C759] px-3 py-1 rounded-full text-[12px] font-semibold">
                          ✓ Débloqué
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message de motivation */}
        {level < 10 && (
          <div className="bg-gradient-to-r from-[#0096BC] to-[#007EA1] text-white rounded-[12px] p-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-[24px] font-bold mb-2 tracking-[-0.02em]">Continuez votre progression !</h3>
            <p className="text-white/90 text-[16px]">
              Encore {nextLevelXP - currentLevelXP} XP pour atteindre le niveau {level + 1} !
            </p>
            <p className="text-white/70 text-[14px] mt-4">
              💡 Astuce : Obtenir 4★ sur un cryptarithme vous rapporte 100 XP !
            </p>
          </div>
        )}

        {level >= 10 && (
          <div className="bg-gradient-to-r from-[#FFD60A] to-[#FFC700] text-[#1D1D1F] rounded-[12px] p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-[24px] font-bold mb-2 tracking-[-0.02em]">Félicitations, Maître !</h3>
            <p className="text-[#1D1D1F]/80 text-[16px]">
              Vous avez atteint le niveau {level}. Vous êtes un véritable expert des cryptarithmes !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}