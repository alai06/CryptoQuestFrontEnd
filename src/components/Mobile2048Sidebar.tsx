import { Home, BookOpen, Lightbulb, Gamepad2, Wand2, Trophy, ChevronLeft, Globe } from 'lucide-react';
import { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { getTranslations } from '../utils/translations';

type SidebarScreen = 'home' | 'tutorial' | 'solver' | 'game' | 'generator' | 'progress';

interface Mobile2048SidebarProps {
  currentScreen: SidebarScreen;
  onNavigate: (screen: SidebarScreen) => void;
  tutorialCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  language: 'fr' | 'en';
  onLanguageChange: (language: 'fr' | 'en') => void;
}

export default function Mobile2048Sidebar({ 
  currentScreen, 
  onNavigate, 
  tutorialCompleted, 
  isExpanded, 
  onToggleExpand, 
  language, 
  onLanguageChange 
}: Mobile2048SidebarProps) {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const t = getTranslations(language);
  
  const tabs = [
    {
      id: 'home' as SidebarScreen,
      icon: Home,
      label: t.tabHome,
      color: '#0096BC',
    },
    {
      id: 'tutorial' as SidebarScreen,
      icon: BookOpen,
      label: t.tabTutorial,
      color: '#00AFD7',
      badge: !tutorialCompleted,
    },
    {
      id: 'solver' as SidebarScreen,
      icon: Lightbulb,
      label: t.modeSolver,
      color: '#007EA1',
    },
    {
      id: 'game' as SidebarScreen,
      icon: Gamepad2,
      label: t.tabPlay,
      color: '#0096BC',
    },
    {
      id: 'generator' as SidebarScreen,
      icon: Wand2,
      label: t.modeGenerator,
      color: '#007EA1',
    },
    {
      id: 'progress' as SidebarScreen,
      icon: Trophy,
      label: t.modeProgress,
      color: '#00AFD7',
    },
  ];

  return (
    <>
      {/* Backdrop - only visible when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={onToggleExpand}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${
          isExpanded ? 'bg-white/95 backdrop-blur-md py-6 px-4' : 'hidden'
        }`}
        style={{
          width: '240px',
          boxShadow: '2px 0 20px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Close Button - Only visible when expanded */}
        <div className="mb-8 w-full">
          <button
            onClick={onToggleExpand}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            aria-label="Réduire"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 flex flex-col gap-3 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentScreen === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onNavigate(tab.id);
                  onToggleExpand(); // Close sidebar after navigation
                }}
                className="relative flex items-center gap-4 w-full transition-all active:scale-95"
                aria-label={tab.label}
              >
                {/* Badge indicator */}
                {tab.badge && (
                  <div 
                    className="absolute -top-1 left-3 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tab.color }}
                  />
                )}

                {/* Icon Container - 2048 style tile */}
                <div 
                  className={`
                    flex items-center justify-center rounded-xl w-12 h-12
                    transition-all duration-200
                    ${isActive ? 'scale-105' : 'scale-100'}
                  `}
                  style={{ 
                    backgroundColor: isActive ? `${tab.color}` : `${tab.color}15`,
                  }}
                >
                  <Icon 
                    className="w-6 h-6 transition-all"
                    style={{ 
                      color: isActive ? '#FFFFFF' : tab.color,
                      strokeWidth: 2.5
                    }}
                  />
                </div>

                {/* Label */}
                <span 
                  className="text-base font-black transition-all flex-1 text-left"
                  style={{ 
                    color: isActive ? tab.color : '#1C1C1E'
                  }}
                >
                  {tab.label}
                </span>

                {/* Active indicator bar */}
                {isActive && (
                  <div 
                    className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Language Toggle - Only visible when expanded */}
        {isExpanded && (
          <div className="mt-8">
            <button
              onClick={() => setShowLanguageSelector(true)}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              aria-label={language === 'fr' ? 'Changer la langue' : 'Change language'}
            >
              <Globe className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Language Selector Modal */}
      <LanguageSelector
        currentLanguage={language}
        onLanguageChange={onLanguageChange}
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
}
