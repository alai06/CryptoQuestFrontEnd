export type Language = 'fr' | 'en';

interface Translations {
  // Navigation
  tabHome: string;
  tabTutorial: string;
  tabPlay: string;
  
  // Modes
  modeGame: string;
  modeTutorial: string;
  modeSolver: string;
  modeGenerator: string;
  modeProgress: string;
  modeProgressSubtitle: string;
  
  // Help
  helpTitle: string;
  helpContent: string;
  helpExample: string;
  helpButton: string;
  
  // Language
  languageTitle: string;
  languageFrench: string;
  languageEnglish: string;
}

const translations: Record<Language, Translations> = {
  fr: {
    // Navigation
    tabHome: 'Accueil',
    tabTutorial: 'Tutoriel',
    tabPlay: 'Jouer',
    
    // Modes
    modeGame: 'Jouer',
    modeTutorial: 'Tutoriel',
    modeSolver: 'Résolution',
    modeGenerator: 'Génération',
    modeProgress: 'Ma progression',
    modeProgressSubtitle: 'Statistiques détaillées et badges',
    
    // Help
    helpTitle: 'Comment jouer ?',
    helpContent: 'Dans un cryptarithme, chaque lettre représente un chiffre unique. Votre objectif est de trouver quelle lettre correspond à quel chiffre pour que l\'équation soit correcte.',
    helpExample: 'SEND + MORE = MONEY',
    helpButton: 'Compris !',
    
    // Language
    languageTitle: 'Choisir la langue',
    languageFrench: 'Français',
    languageEnglish: 'English',
  },
  en: {
    // Navigation
    tabHome: 'Home',
    tabTutorial: 'Tutorial',
    tabPlay: 'Play',
    
    // Modes
    modeGame: 'Play',
    modeTutorial: 'Tutorial',
    modeSolver: 'Solver',
    modeGenerator: 'Generator',
    modeProgress: 'My Progress',
    modeProgressSubtitle: 'Detailed statistics and badges',
    
    // Help
    helpTitle: 'How to play?',
    helpContent: 'In a cryptarithm, each letter represents a unique digit. Your goal is to find which letter corresponds to which digit to make the equation correct.',
    helpExample: 'SEND + MORE = MONEY',
    helpButton: 'Got it!',
    
    // Language
    languageTitle: 'Choose Language',
    languageFrench: 'Français',
    languageEnglish: 'English',
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}
