import { Home, BookOpen, Lightbulb, Wand2, Gamepad2, Trophy } from 'lucide-react';
import logoImage from 'figma:asset/25e7f8718e6c894ac22128cb8f9b55c07e5536c0.png';

type Screen = 'home' | 'tutorial' | 'solver' | 'generator' | 'game' | 'progress';

interface NavigationMenuProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  tutorialCompleted: boolean;
}

export default function NavigationMenu({ currentScreen, onNavigate, tutorialCompleted }: NavigationMenuProps) {
  const menuItems = [
    {
      id: 'home' as Screen,
      label: 'Accueil',
      icon: Home,
    },
    {
      id: 'tutorial' as Screen,
      label: 'Tutoriel',
      icon: BookOpen,
      badge: !tutorialCompleted,
    },
    {
      id: 'game' as Screen,
      label: 'Jeu',
      icon: Gamepad2,
    },
    {
      id: 'solver' as Screen,
      label: 'Résolution',
      icon: Lightbulb,
    },
    {
      id: 'generator' as Screen,
      label: 'Génération',
      icon: Wand2,
    },
    {
      id: 'progress' as Screen,
      label: 'Progression',
      icon: Trophy,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E5] z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center group"
          >
            <img 
              src={logoImage} 
              alt="CryptoQuest" 
              className="h-12 w-auto group-hover:opacity-80 transition-opacity"
            />
          </button>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-[8px] transition-all text-[14px] font-medium
                    ${isActive
                      ? 'bg-[#0096BC] text-white'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                  
                  {/* Badge indicator */}
                  {item.badge && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00AFD7] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}