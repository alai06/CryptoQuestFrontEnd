import { useState, useEffect } from 'react';
import NavigationMenu from './components/NavigationMenu';
import MobileHomeScreen from './components/MobileHomeScreen';
import MobileSidebar from './components/MobileSidebar';
import HomeScreen from './components/HomeScreen';
import TutorialMode from './components/TutorialMode';
import SolverMode from './components/SolverMode';
import GeneratorMode from './components/GeneratorMode';
import GameMode from './components/GameMode';
import ProgressDashboard from './components/ProgressDashboard';
import { Language } from './utils/translations';
import type { Screen } from './types';
import { safeParseLocalStorage } from './utils/storageUtils';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [generatedCryptarithms, setGeneratedCryptarithms] = useState<Array<{equation: string, solution: Record<string, string>}>>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [userStats, setUserStats] = useState({ levels: 0, stars: 0, badges: 0 });
  const [language, setLanguage] = useState<Language>('fr');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const completed = localStorage.getItem('tutorialCompleted') === 'true';
    setTutorialCompleted(completed);
    
    // Load generated cryptarithms from localStorage
    setGeneratedCryptarithms(
      safeParseLocalStorage<Array<{equation: string, solution: Record<string, string>}>>('generatedCryptarithms', [])
    );

    // Load user stats from localStorage
    setUserStats(
      safeParseLocalStorage('userStats', { levels: 0, stars: 0, badges: 0 })
    );

    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTutorialComplete = () => {
    setTutorialCompleted(true);
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const handleCryptarithmGenerated = (equation: string, solution: Record<string, string>) => {
    const newCrypto = { equation, solution };
    const updated = [...generatedCryptarithms, newCrypto];
    setGeneratedCryptarithms(updated);
    localStorage.setItem('generatedCryptarithms', JSON.stringify(updated));
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const renderScreen = () => {
    // Mobile version
    if (isMobile) {
      switch (currentScreen) {
        case 'home':
          return (
            <MobileHomeScreen 
              onNavigate={setCurrentScreen} 
              tutorialCompleted={tutorialCompleted}
              stats={userStats}
              language={language}
              onLanguageChange={handleLanguageChange}
              onOpenSidebar={() => setIsSidebarExpanded(true)}
            />
          );
        case 'tutorial':
          return <TutorialMode onComplete={handleTutorialComplete} onBack={() => setCurrentScreen('home')} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
        case 'solver':
          return <SolverMode onBack={() => setCurrentScreen('home')} generatedCryptarithms={generatedCryptarithms} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
        case 'generator':
          return <GeneratorMode onBack={() => setCurrentScreen('home')} onCryptarithmGenerated={handleCryptarithmGenerated} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
        case 'game':
          return <GameMode onBack={() => setCurrentScreen('home')} onNavigate={setCurrentScreen} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
        case 'progress':
          return <ProgressDashboard onBack={() => setCurrentScreen('home')} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
        default:
          return (
            <MobileHomeScreen 
              onNavigate={setCurrentScreen} 
              tutorialCompleted={tutorialCompleted}
              stats={userStats}
              language={language}
              onLanguageChange={handleLanguageChange}
              onOpenSidebar={() => setIsSidebarExpanded(true)}
            />
          );
      }
    }
    
    // Desktop version (original)
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} tutorialCompleted={tutorialCompleted} />;
      case 'tutorial':
        return <TutorialMode onComplete={handleTutorialComplete} onBack={() => setCurrentScreen('home')} />;
      case 'solver':
        return <SolverMode onBack={() => setCurrentScreen('home')} generatedCryptarithms={generatedCryptarithms} />;
      case 'generator':
        return <GeneratorMode onBack={() => setCurrentScreen('home')} onCryptarithmGenerated={handleCryptarithmGenerated} />;
      case 'game':
        return <GameMode onBack={() => setCurrentScreen('home')} onNavigate={setCurrentScreen} />;
      case 'progress':
        return <ProgressDashboard onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} tutorialCompleted={tutorialCompleted} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <>
          {/* Sidebar - Always visible on mobile when expanded */}
          {isMobile && (
            <MobileSidebar 
              currentScreen={currentScreen} 
              onNavigate={setCurrentScreen}
              tutorialCompleted={tutorialCompleted}
              isExpanded={isSidebarExpanded}
              onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
              language={language}
              onLanguageChange={handleLanguageChange}
            />
          )}
          
          {/* Desktop Navigation Menu */}
          {!isMobile && (
            <NavigationMenu 
              currentScreen={currentScreen}
              onNavigate={setCurrentScreen}
              tutorialCompleted={tutorialCompleted}
            />
          )}
          
          {/* Main Content */}
          <div>
            {renderScreen()}
          </div>
        </>
    </div>
  );
}