import { useState, useEffect } from 'react';
import { Home, BookOpen, Lightbulb, Wand2, Gamepad2, Trophy } from 'lucide-react';
import NavigationMenu from './components/NavigationMenu';
import MobileHomeScreen from './components/MobileHomeScreen';
import Mobile2048Sidebar from './components/Mobile2048Sidebar';
import HomeScreen from './components/HomeScreen';
import TutorialMode from './components/TutorialMode';
import SolverMode from './components/SolverMode';
import GeneratorMode from './components/GeneratorMode';
import GameMode from './components/GameMode';
import ProgressDashboard from './components/ProgressDashboard';
import { Language } from './utils/translations';

type Screen = 'home' | 'tutorial' | 'solver' | 'generator' | 'game' | 'progress';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [generatedCryptarithms, setGeneratedCryptarithms] = useState<Array<{equation: string, solution: Record<string, string>}>>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [userStats, setUserStats] = useState({ levels: 0, stars: 0, badges: 0 });
  const [isLoading, setIsLoading] = useState(true);
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
    const saved = localStorage.getItem('generatedCryptarithms');
    if (saved) {
      try {
        setGeneratedCryptarithms(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load generated cryptarithms', e);
      }
    }

    // Load user stats from localStorage
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
      try {
        setUserStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to load user stats', e);
      }
    }

    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
    
    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 500);
    
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
          return <GameMode onBack={() => setCurrentScreen('home')} tutorialCompleted={tutorialCompleted} isMobile={true} onOpenSidebar={() => setIsSidebarExpanded(true)} />;
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
        return <GameMode onBack={() => setCurrentScreen('home')} tutorialCompleted={tutorialCompleted} />;
      case 'progress':
        return <ProgressDashboard onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} tutorialCompleted={tutorialCompleted} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#0096BC]"></div>
        </div>
      ) : (
        <>
          {/* Sidebar - Always visible on mobile when expanded */}
          {isMobile && (
            <Mobile2048Sidebar 
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
      )}
    </div>
  );
}