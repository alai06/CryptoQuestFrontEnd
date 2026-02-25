import { BookOpen, Lightbulb, Wand2, Gamepad2, Trophy, Menu } from 'lucide-react';
import { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { Language, getTranslations } from '../utils/translations';

interface MobileHomeScreenProps {
  onNavigate: (screen: 'tutorial' | 'solver' | 'generator' | 'game' | 'progress') => void;
  tutorialCompleted: boolean;
  stats?: {
    levels: number;
    stars: number;
    badges: number;
  };
  language: Language;
  onLanguageChange: (language: Language) => void;
  onOpenSidebar: () => void;
}

export default function MobileHomeScreen({ 
  onNavigate, 
  tutorialCompleted,
  stats = { levels: 0, stars: 0, badges: 0 },
  language,
  onLanguageChange,
  onOpenSidebar
}: MobileHomeScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const t = getTranslations(language);

  const modes = [
    {
      id: 'game' as const,
      title: t.modeGame,
      icon: Gamepad2,
      color: '#0096BC',
      featured: true,
    },
    {
      id: 'tutorial' as const,
      title: t.modeTutorial,
      icon: BookOpen,
      color: '#00AFD7',
      badge: !tutorialCompleted,
    },
    {
      id: 'solver' as const,
      title: t.modeSolver,
      icon: Lightbulb,
      color: '#007EA1',
    },
    {
      id: 'generator' as const,
      title: t.modeGenerator,
      icon: Wand2,
      color: '#0096BC',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col">
      {/* Top Bar - 2048 style simple */}
      <div className="px-3 pt-8 pb-6">
        {/* Top Row with Menu Button and Logo */}
        <div className="flex items-center justify-between mb-8">
          {/* Menu Button */}
          <button
            onClick={onOpenSidebar}
            className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center shadow-md"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>

          {/* Logo Text - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-[28px] font-black text-[#0096BC] tracking-[-0.02em]">
              CryptoQuest
            </h1>
          </div>

          {/* Spacer for balance */}
          <div className="w-12" />
        </div>

        {/* Stats Grid - 2048 style */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2 text-center">
            <div 
              className="text-[32px] font-black leading-none mb-1"
              style={{ color: stats.levels > 0 ? '#0096BC' : '#C7C7CC' }}
            >
              {stats.levels > 0 ? stats.levels : '0'}
            </div>
            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-wide">
              {language === 'fr' ? 'Niveaux' : 'Levels'}
            </div>
          </div>

          <div className="rounded-xl p-2 text-center">
            <div 
              className="text-[32px] font-black leading-none mb-1"
              style={{ color: stats.stars > 0 ? '#00AFD7' : '#C7C7CC' }}
            >
              {stats.stars > 0 ? stats.stars : '0'}
            </div>
            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-wide">
              {language === 'fr' ? 'Étoiles' : 'Stars'}
            </div>
          </div>

          <div className="rounded-xl p-2 text-center">
            <div 
              className="text-[32px] font-black leading-none mb-1"
              style={{ color: stats.badges > 0 ? '#007EA1' : '#C7C7CC' }}
            >
              {stats.badges > 0 ? stats.badges : '0'}
            </div>
            <div className="text-[10px] text-[#86868B] font-bold uppercase tracking-wide">
              Badges
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Grid - 2048 style centered */}
      <div className="flex-1 px-3 pb-24">
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onNavigate(mode.id)}
                className="relative rounded-2xl p-3 flex flex-col items-center justify-center gap-2 aspect-square active:scale-95 transition-transform"
                style={{ 
                  backgroundColor: `${mode.color}15`
                }}
              >
                {/* Badge if needed */}
                {mode.badge && (
                  <div 
                    className="absolute top-2 right-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: mode.color }}
                  />
                )}

                {/* Icon */}
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${mode.color}20` }}
                >
                  <Icon 
                    className="w-7 h-7"
                    style={{ color: mode.color }}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Title */}
                <h3 
                  className="text-[16px] font-black text-center leading-tight"
                  style={{ color: mode.color }}
                >
                  {mode.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Progress Button - Full width like 2048's "New Game" */}
        <button
          onClick={() => onNavigate('progress')}
          className="w-full mt-2 bg-gradient-to-r from-[#00AFD7] to-[#007EA1] rounded-2xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ 
            boxShadow: '0 4px 12px rgba(0, 150, 188, 0.3)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="text-[18px] font-black text-white leading-none mb-1">
                {t.modeProgress}
              </h3>
              <p className="text-[11px] text-white/80 font-semibold">
                {t.modeProgressSubtitle}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-lg font-black">›</span>
          </div>
        </button>
      </div>

      {/* Help Overlay - 2048 style */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[24px] font-black mb-3 text-[#1D1D1F]">
              {t.helpTitle}
            </h3>
            <p className="text-[15px] text-[#86868B] leading-relaxed mb-4">
              {t.helpContent}
            </p>
            <div className="bg-[#FBFBFD] rounded-2xl p-4 mb-6">
              <p className="text-[13px] text-[#0096BC] font-bold text-center">
                {t.helpExample}
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full bg-gradient-to-r from-[#00AFD7] to-[#007EA1] text-white py-4 rounded-2xl font-black text-[17px] active:scale-[0.98] transition-transform"
            >
              {t.helpButton}
            </button>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      <LanguageSelector
        currentLanguage={language}
        onLanguageChange={onLanguageChange}
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </div>
  );
}
