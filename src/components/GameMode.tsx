import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Timer, HelpCircle, ChevronRight, ChevronDown, Lock, Menu, Plus, X, Loader, Check } from 'lucide-react';
import DragDropBoard from './DragDropBoard';
import { solveCryptarithm } from '../services/cryptatorApi';

interface GameModeProps {
  onBack: () => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface Level {
  id: number;
  name: string;
  equation: string;
  solution: Record<string, string>;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SavedCryptarithm {
  id: string;
  equation: string;
  solution: string;
  timestamp: string;
}

export default function GameMode({ onBack, isMobile = false, onOpenSidebar }: GameModeProps) {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [totalVerifications, setTotalVerifications] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [gameLevels, setGameLevels] = useState<Level[]>([]);
  const [completedCryptarithms, setCompletedCryptarithms] = useState<Level[]>([]);
  
  // États pour le cryptarithme personnalisé
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCryptarithm, setCustomCryptarithm] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // État pour la section des cryptarithmes terminés
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  
  // État pour le modal de résumé
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState<{
    stars: number;
    time: number;
    verifications: number;
    points: number;
  } | null>(null);

  const isEasyMode = selectedLevel?.difficulty === 'easy';

  // Calcul des étoiles en temps réel
  const calculateCurrentStars = () => {
    const timeInMinutes = timeElapsed / 60;
    
    // 4 étoiles spéciales : 0 vérifications ET moins de 10 minutes
    if (totalVerifications === 0 && timeInMinutes < 10) {
      return 4;
    }
    
    // 3 étoiles : 0-3 vérifications
    if (totalVerifications <= 3) {
      return 3;
    }
    
    // 2 étoiles : 4-6 vérifications
    if (totalVerifications <= 6) {
      return 2;
    }
    
    // 1 étoile : 7+ vérifications
    return 1;
  };

  // Calcul des vérifications restantes avant de perdre une étoile
  const getVerificationsUntilStarLoss = () => {
    const timeInMinutes = timeElapsed / 60;
    
    // Si on vise les 4 étoiles
    if (totalVerifications === 0 && timeInMinutes < 10) {
      return null; // Déjà au maximum, mais attention au temps !
    }
    
    if (totalVerifications < 4) {
      return 4 - totalVerifications; // Avant de passer à 2 étoiles
    } else if (totalVerifications < 7) {
      return 7 - totalVerifications; // Avant de passer à 1 étoile
    }
    return 0; // Déjà à 1 étoile
  };

  // Noms originaux pour les cryptarithmes générés
  const cryptarithmNames = [
    'Énigme Divine', 'Puzzle Mystique', 'Défi Céleste', 'Casse-tête Magique',
    'Mystère Numérique', 'Équation Cosmique', 'Rébus Astral', 'Énigme Lunaire',
    'Puzzle Stellaire', 'Défi des Sages', 'Mystère Sacré', 'Énigme Éternelle',
    'Puzzle d\'Hermès', 'Défi d\'Archimède', 'Mystère d\'Euclide', 'Énigme de Pythagore',
    'Puzzle de Gauss', 'Défi de Fermat', 'Mystère de Pascal', 'Énigme de Fibonacci',
    'Puzzle Ancestral', 'Défi Légendaire', 'Mystère Millénaire', 'Énigme Antique',
    'Puzzle Impérial', 'Défi Royal', 'Mystère du Sphinx', 'Énigme d\'Alexandrie',
    'Puzzle de Babel', 'Défi Olympien', 'Mystère d\'Atlantis', 'Énigme de Thulé',
    'Puzzle Runique', 'Défi des Druides', 'Mystère Celtique', 'Énigme Nordique',
    'Puzzle du Dragon', 'Défi du Phénix', 'Mystère du Griffon', 'Énigme de la Licorne',
    'Puzzle Alchimique', 'Défi Hermétique', 'Mystère Ésotérique', 'Énigme Cabalistique',
    'Puzzle Zen', 'Défi du Lotus', 'Mystère du Mandala', 'Énigme du Tao',
    'Puzzle Stellaire', 'Défi Galactique', 'Mystère Cosmique', 'Énigme Sidérale'
  ];

  // Charger les cryptarithmes générés depuis localStorage
  useEffect(() => {
    const loadGeneratedCryptarithms = () => {
      const saved = localStorage.getItem('generatedCryptarithms');
      if (saved) {
        try {
          const parsed: SavedCryptarithm[] = JSON.parse(saved);
          
          // Convertir les cryptarithmes sauvegardés en niveaux
          const levels: Level[] = parsed
            .filter(crypto => {
              // Filtrer seulement ceux qui ont une solution (format tableau)
              return crypto.solution && crypto.solution.includes('|');
            })
            .map((crypto, index) => {
              // Parser la solution (format: " E| F| N|\n 9| 7| 1|")
              const solutionMap: Record<string, string> = {};
              const lines = crypto.solution.split('\n').map(l => l.trim());
              
              if (lines.length === 2) {
                const letters = lines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
                const values = lines[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
                
                for (let i = 0; i < letters.length && i < values.length; i++) {
                  if (letters[i] && values[i]) {
                    solutionMap[letters[i]] = values[i];
                  }
                }
              }
              
              // Vérifier que la solution a bien été parsée (au moins une lettre)
              if (Object.keys(solutionMap).length === 0) {
                return null;
              }
              
              return {
                id: 1000 + index, // ID unique pour les niveaux générés
                name: cryptarithmNames[index % cryptarithmNames.length],
                equation: crypto.equation,
                solution: solutionMap,
                timeLimit: 300,
                difficulty: 'medium',
              } as Level;
            })
            .filter((level): level is Level => level !== null);
          
          setGameLevels(levels);
        } catch (error) {
          console.error('Erreur lors du chargement des cryptarithmes:', error);
          setGameLevels([]);
        }
      } else {
        setGameLevels([]);
      }
    };
    
    loadGeneratedCryptarithms();
    
    // Charger les cryptarithmes terminés
    const savedCompleted = localStorage.getItem('completedCryptarithms');
    if (savedCompleted) {
      try {
        setCompletedCryptarithms(JSON.parse(savedCompleted));
      } catch (error) {
        console.error('Erreur lors du chargement des cryptarithmes terminés:', error);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('completedLevels');
    if (saved) {
      setCompletedLevels(new Set(JSON.parse(saved)));
    }

    const savedStars = localStorage.getItem('levelStars');
    if (savedStars) {
      setLevelStars(JSON.parse(savedStars));
    }

    const savedScore = localStorage.getItem('totalScore');
    if (savedScore) {
      setScore(Number(savedScore));
    }
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedLevel]);

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setTimeElapsed(0);
    setTotalVerifications(0);
    setShowHint(false);
  };

  const handleVerification = () => {
    setTotalVerifications(prev => prev + 1);
  };

  const handleLevelComplete = () => {
    if (!selectedLevel) return;

    const newCompleted = new Set(completedLevels);
    newCompleted.add(selectedLevel.id);
    setCompletedLevels(newCompleted);
    localStorage.setItem('completedLevels', JSON.stringify(Array.from(newCompleted)));
    
    // Ajouter aux cryptarithmes terminés si ce n'est pas déjà fait
    if (!completedCryptarithms.some(c => c.id === selectedLevel.id)) {
      const newCompletedCryptos = [...completedCryptarithms, selectedLevel];
      setCompletedCryptarithms(newCompletedCryptos);
      localStorage.setItem('completedCryptarithms', JSON.stringify(newCompletedCryptos));
    }

    const stars = calculateCurrentStars();

    const newStars = { ...levelStars, [selectedLevel.id]: Math.max(stars, levelStars[selectedLevel.id] || 0) };
    setLevelStars(newStars);
    localStorage.setItem('levelStars', JSON.stringify(newStars));

    const points = stars * 100;
    const newScore = score + points;
    setScore(newScore);
    localStorage.setItem('totalScore', newScore.toString());

    // Afficher le modal de résumé au lieu de revenir immédiatement
    setSummaryStats({
      stars,
      time: timeElapsed,
      verifications: totalVerifications,
      points,
    });
    setShowSummaryModal(true);
  };
  
  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    setSummaryStats(null);
    setSelectedLevel(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomCryptarithmSubmit = async () => {
    if (!customCryptarithm.trim()) {
      setValidationError('Veuillez entrer un cryptarithme');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Appel à l'API pour vérifier le nombre de solutions
      const response = await solveCryptarithm({
        cryptarithm: customCryptarithm.trim(),
        solverType: 'SCALAR',
        solutionLimit: 2, // On cherche maximum 2 solutions pour vérifier qu'il y en a exactement 1
        timeLimit: 10000,
      });

      if (!response.success) {
        setValidationError(response.error || 'Erreur lors de la validation du cryptarithme');
        setIsValidating(false);
        return;
      }

      if (response.solutionCount === 0) {
        setValidationError('Ce cryptarithme n\'a aucune solution');
        setIsValidating(false);
        return;
      }

      if (response.solutionCount > 1) {
        setValidationError(`Ce cryptarithme a ${response.solutionCount} solutions. Il doit avoir exactement une solution unique.`);
        setIsValidating(false);
        return;
      }

      // Si on arrive ici, le cryptarithme a exactement 1 solution
      const solution = response.solutions[0];
      const solutionMap: Record<string, string> = {};
      
      console.log('=== PARSING SOLUTION FROM API ===');
      console.log('Response complète:', response);
      console.log('Solution brute:', solution);
      console.log('Assignment string:', solution.assignment);
      
      // Parser la solution (format de l'API: " E| F| N|\n 9| 7| 1|")
      // La première ligne contient les lettres, la deuxième ligne les valeurs
      const lines = solution.assignment.split('\n').map(l => l.trim());
      console.log('Lignes après split:', lines);
      
      if (lines.length === 2) {
        // Extraire les lettres et valeurs en utilisant le séparateur "|"
        const letters = lines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        const values = lines[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
        
        console.log('Lettres extraites:', letters);
        console.log('Valeurs extraites:', values);
        
        // Créer le mapping lettre -> valeur
        for (let i = 0; i < letters.length && i < values.length; i++) {
          if (letters[i] && values[i]) {
            solutionMap[letters[i]] = values[i];
            console.log(`Ajout dans solutionMap: ${letters[i]} = ${values[i]}`);
          }
        }
      }
      
      console.log('SolutionMap final:', solutionMap);

      // Créer un niveau personnalisé
      const customLevel: Level = {
        id: 999, // ID spécial pour les niveaux personnalisés
        name: 'Cryptarithme personnalisé',
        equation: customCryptarithm.trim(),
        solution: solutionMap,
        timeLimit: 300, // 5 minutes par défaut
        difficulty: 'medium',
      };
      
      console.log('CustomLevel créé:', customLevel);

      // Lancer le jeu avec ce niveau
      setShowCustomModal(false);
      setCustomCryptarithm('');
      handleLevelSelect(customLevel);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteCryptarithm = (levelId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Retirer de la liste des niveaux
    const updatedLevels = gameLevels.filter(level => level.id !== levelId);
    setGameLevels(updatedLevels);
    
    // Retirer du localStorage generatedCryptarithms
    const saved = localStorage.getItem('generatedCryptarithms');
    if (saved) {
      try {
        const parsed: SavedCryptarithm[] = JSON.parse(saved);
        // Trouver l'index correspondant (levelId format: 1000 + index)
        const index = levelId - 1000;
        const updated = parsed.filter((_, i) => i !== index);
        localStorage.setItem('generatedCryptarithms', JSON.stringify(updated));
      } catch (error) {
        console.error('Erreur lors de la suppression du cryptarithme:', error);
      }
    }
    
    // Retirer des cryptarithmes terminés si présent
    const updatedCompleted = completedCryptarithms.filter(c => c.id !== levelId);
    setCompletedCryptarithms(updatedCompleted);
    localStorage.setItem('completedCryptarithms', JSON.stringify(updatedCompleted));
    
    // Retirer des niveaux complétés
    const newCompletedLevels = new Set(completedLevels);
    newCompletedLevels.delete(levelId);
    setCompletedLevels(newCompletedLevels);
    localStorage.setItem('completedLevels', JSON.stringify(Array.from(newCompletedLevels)));
    
    // Retirer des étoiles
    const newStars = { ...levelStars };
    delete newStars[levelId];
    setLevelStars(newStars);
    localStorage.setItem('levelStars', JSON.stringify(newStars));
  };

  if (selectedLevel) {
    return (
      <>
      <div className={isMobile ? "h-screen flex flex-col" : "min-h-screen px-8 py-16"}>
        <div className={isMobile ? "flex-shrink-0 px-4 py-4" : "max-w-4xl mx-auto"}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedLevel(null)}
              className={`flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors ${isMobile ? 'text-[16px] p-2' : ''
                }`}
            >
              <ArrowLeft className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={1.5} />
              <span className="text-[14px] font-medium">Niveaux</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-[12px]">
                <Timer className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span className="font-mono text-[14px] font-medium text-[#1D1D1F]">
                  {formatTime(timeElapsed)}
                </span>
              </div>

              {/* Help Button */}
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-4 py-2 rounded-[12px] hover:border-[#0096BC] transition-colors text-[14px] font-medium"
              >
                <HelpCircle className="w-5 h-5 text-[#0096BC]" strokeWidth={1.5} />
                <span>Aide</span>
              </button>
            </div>
          </div>

          {/* Game Info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className={`
                px-3 py-1 rounded-full text-[14px] font-medium
                ${selectedLevel.difficulty === 'easy' ? 'bg-[#D4F4DD] text-[#1D1D1F]' : ''}
                ${selectedLevel.difficulty === 'medium' ? 'bg-[#FFF5E5] text-[#1D1D1F]' : ''}
                ${selectedLevel.difficulty === 'hard' ? 'bg-[#FFE5E5] text-[#1D1D1F]' : ''}
              `}>
                {selectedLevel.difficulty === 'easy' && 'Facile'}
                {selectedLevel.difficulty === 'medium' && 'Moyen'}
                {selectedLevel.difficulty === 'hard' && 'Difficile'}
              </span>
            </div>
            
            {/* Score actuel avec étoiles */}
            <div className="bg-gradient-to-r from-[#F5F5F7] to-white border border-[#E5E5E5] rounded-[12px] p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-[14px] font-semibold text-[#86868B] mb-1">Score actuel</p>
                  <p className="text-xl md:text-[24px]">
                    {calculateCurrentStars() === 4 ? '🌟⭐⭐⭐' : '⭐'.repeat(calculateCurrentStars()) + '☆'.repeat(3 - calculateCurrentStars())}
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E5E5E5] mb-2 md:mb-0">
                    <span className="text-xs md:text-[13px] text-[#86868B]">Vérifications</span>
                    <span className="text-sm md:text-base font-bold text-[#1D1D1F]">{totalVerifications}</span>
                  </div>
                  {calculateCurrentStars() === 4 && (
                    <p className="text-xs md:text-[13px] text-[#34C759] font-medium mt-2">
                      🌟 Parfait ! Continuez !
                    </p>
                  )}
                  {calculateCurrentStars() < 4 && getVerificationsUntilStarLoss() !== null && getVerificationsUntilStarLoss()! > 0 && (
                    <p className="text-xs md:text-[13px] text-[#FF9500] font-medium mt-2">
                      ⚠️ Encore {getVerificationsUntilStarLoss()} avant -1★
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board - Takes remaining space on mobile */}
        <div className={isMobile ? "flex-1 min-h-0 overflow-hidden" : "max-w-4xl mx-auto bg-white rounded-[12px] border border-[#E5E5E5] p-8"}>
          <DragDropBoard
            equation={selectedLevel.equation}
            solution={selectedLevel.solution}
            onSolved={handleLevelComplete}
            onVerification={handleVerification}
            showHints={showHint}
            easyMode={isEasyMode}
            isMobile={isMobile}
          />
        </div>
      </div>

        {/* Modal de résumé après résolution */}
        {showSummaryModal && summaryStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-[20px] p-6 md:p-8 max-w-md w-full border-2 border-[#E5E5E5] shadow-2xl animate-scale-in">
              {/* Header avec fermeture */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[#1D1D1F]"> Bravo !</h2>
                <button
                  onClick={handleCloseSummary}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F5F7] flex items-center justify-center transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-[#86868B]" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-[16px] text-[#86868B] mb-8">
                Cryptarithme résolu avec succès !
              </p>

              {/* Étoiles visuelles */}
              <div className="mb-8 text-center">
                <p className="text-[48px] leading-tight">
                  {summaryStats.stars === 4 
                    ? '🌟⭐⭐⭐' 
                    : '⭐'.repeat(summaryStats.stars) + '☆'.repeat(3 - summaryStats.stars)}
                </p>
              </div>

              {/* Statistiques */}
              <div className="space-y-4 mb-8">
                {/* Étoiles obtenues */}
                <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#FFD700] flex items-center justify-center">
                      <Star className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px] font-medium text-[#1D1D1F]">Étoiles</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#1D1D1F]">{summaryStats.stars}/4</span>
                </div>

                {/* Temps écoulé */}
                <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#0096BC] flex items-center justify-center">
                      <Timer className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px] font-medium text-[#1D1D1F]">Temps</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#1D1D1F]">{formatTime(summaryStats.time)}</span>
                </div>

                {/* Vérifications */}
                <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#00AFD7] flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px] font-medium text-[#1D1D1F]">Vérifications</span>
                  </div>
                  <span className="text-[18px] font-bold text-[#1D1D1F]">{summaryStats.verifications}</span>
                </div>

                {/* Score gagné */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0096BC] to-[#007EA1] rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-white/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px] font-medium text-white">Points gagnés</span>
                  </div>
                  <span className="text-[20px] font-bold text-white">+{summaryStats.points}</span>
                </div>
              </div>

              {/* Bouton continuer */}
              <button
                onClick={handleCloseSummary}
                className="w-full px-6 py-4 rounded-[12px] bg-[#0096BC] text-white font-semibold text-[16px] hover:bg-[#007EA1] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continuer
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-5xl mx-auto">
        {/* Mobile Header - Only on mobile */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onOpenSidebar}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
              <h1 className="text-[18px] font-bold text-[#1D1D1F]">Mode Aventure</h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-end mb-16">
          <div className="flex items-center gap-2 bg-white border border-[#E5E5E5] px-6 py-3 rounded-[12px]">
            <Trophy className="w-6 h-6 text-[#FF9500]" strokeWidth={1.5} />
            <span className="text-[#1D1D1F] font-medium">Score: {score}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className={isMobile ? "" : "bg-white rounded-[12px] border border-[#E5E5E5] p-10"}>
          {/* Back Button - Mobile only */}
          {isMobile && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors group mb-6"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              <span className="text-[14px] font-medium">Retour</span>
            </button>
          )}
          
          <h1 className="text-[32px] font-bold mb-2 tracking-[-0.02em]">Mode Aventure</h1>
          <p className="text-[14px] text-[#86868B] mb-10">
            Résolvez un maximum de cryptarithmes pour gagner de l'XP et débloquer des titres ! Générez-en de nouveaux dans l'onglet <span className="font-semibold text-[#0096BC]">Génération</span> pour enrichir votre collection.
          </p>

          {/* Bouton Cryptarithme personnalisé */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="w-full p-6 mb-6 rounded-[12px] transition-all text-left border bg-gradient-to-r from-[#0096BC] to-[#007EA1] border-transparent hover:shadow-lg active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white mb-1 font-semibold text-[16px] tracking-[-0.01em]">Cryptarithme personnalisé</h3>
                  <p className="text-white/80 text-[14px]">Créez votre propre défi !</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
          </button>

          {/* Section Cryptarithmes terminés (dépliable) */}
          {completedCryptarithms.length > 0 && (
            <div className={isMobile ? "mb-6" : "bg-white rounded-[12px] border border-[#E5E5E5] mb-6"}>
              <button
                onClick={() => setShowCompletedSection(!showCompletedSection)}
                className={isMobile ? "w-full p-4 rounded-[12px] transition-all text-left" : "w-full p-6 rounded-[12px] transition-all text-left hover:bg-[#F5F5F7]"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-green-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-[#1D1D1F] mb-1 font-semibold text-[16px] tracking-[-0.01em]">Cryptarithmes terminés</h3>
                      <p className="text-[#86868B] text-[14px]">
                        {completedCryptarithms.length} cryptarithme{completedCryptarithms.length > 1 ? 's' : ''} résolu{completedCryptarithms.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-[#86868B] transition-transform duration-200 ${showCompletedSection ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                  />
                </div>
              </button>
              
              {showCompletedSection && (
                <div className="px-6 pb-6 space-y-3">
                  {completedCryptarithms.map((crypto) => (
                    <div
                      key={crypto.id}
                      className="p-3 md:p-4 rounded-[12px] bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-[8px] md:rounded-[10px] bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1D1D1F] text-[13px] md:text-[14px] font-mono truncate font-semibold">{crypto.equation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                          {levelStars[crypto.id] && (
                            <div className="flex gap-0.5 md:gap-1 items-center">
                              {levelStars[crypto.id] === 4 ? (
                                <span className="text-[14px] md:text-[18px]">🌟</span>
                              ) : null}
                              {[1, 2, 3].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 md:w-4 md:h-4 ${
                                    star <= (levelStars[crypto.id] === 4 ? 3 : levelStars[crypto.id] || 0)
                                      ? 'fill-[#FF9500] text-[#FF9500]'
                                      : 'text-[#E5E5E5]'
                                  }`}
                                  strokeWidth={1.5}
                                />
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => handleLevelSelect(crypto)}
                            className="px-3 py-1.5 md:px-4 md:py-2 rounded-[8px] bg-white border border-green-300 text-green-600 text-[11px] md:text-[13px] font-medium hover:bg-green-50 active:scale-95 transition-all whitespace-nowrap"
                          >
                            Rejouer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {gameLevels.filter(level => !completedCryptarithms.some(c => c.id === level.id)).length === 0 ? (
              <div className="bg-[#F5F5F7] border border-[#E5E5E5] rounded-[12px] p-8 text-center">
                <p className="text-[#86868B] text-[14px] mb-4">
                  Aucun cryptarithme disponible pour le moment.
                </p>
                <p className="text-[#86868B] text-[14px]">
                  Rendez-vous dans le mode <span className="font-semibold text-[#0096BC]">Génération</span> pour créer des cryptarithmes, puis revenez ici pour les jouer !
                </p>
              </div>
            ) : (
              gameLevels.filter(level => !completedCryptarithms.some(c => c.id === level.id)).map((level, index) => {
              const isUnlocked = true;
              const isCompleted = completedLevels.has(level.id);
              const stars = levelStars[level.id] || 0;

              return (
                <button
                  key={level.id}
                  onClick={() => isUnlocked && handleLevelSelect(level)}
                  disabled={!isUnlocked}
                  className={`
                    w-full p-3 md:p-6 rounded-[12px] transition-all text-left border
                    ${isUnlocked
                      ? 'bg-white border-[#E5E5E5] hover:border-[#0096BC] active:scale-[0.99]'
                      : 'bg-[#F5F5F7] border-[#E5E5E5] opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <div className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-[10px] md:rounded-[12px] flex items-center justify-center font-semibold text-[12px] md:text-[14px] flex-shrink-0
                        ${isUnlocked ? 'bg-[#0096BC] text-white' : 'bg-[#E5E5E5] text-[#86868B]'}
                      `}>
                        {isUnlocked ? `#${index + 1}` : <Lock className="w-4 h-4 md:w-6 md:h-6" strokeWidth={1.5} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[#1D1D1F] text-[14px] md:text-[16px] font-mono truncate font-semibold">{level.equation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
                      {isCompleted && (
                        <div className="flex gap-0.5 md:gap-1 items-center">
                          {stars === 4 ? (
                            <span className="text-[16px] md:text-[20px]">🌟</span>
                          ) : null}
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 md:w-5 md:h-5 ${star <= (stars === 4 ? 3 : stars) ? 'fill-[#FF9500] text-[#FF9500]' : 'text-[#E5E5E5]'
                                }`}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      )}

                      {/* Bouton de suppression */}
                      <button
                        onClick={(e) => handleDeleteCryptarithm(level.id, e)}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0096BC]/10 hover:bg-[#0096BC]/20 flex items-center justify-center transition-colors group flex-shrink-0"
                        aria-label="Supprimer ce cryptarithme"
                      >
                        <X className="w-5 h-5 md:w-6 md:h-6 text-[#0096BC] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                      </button>

                      {isUnlocked && <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#0096BC] flex-shrink-0" strokeWidth={1.5} />}
                    </div>
                  </div>
                </button>
              );
            }))}
          </div>
        </div>

        {/* Modal Cryptarithme personnalisé */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[16px] p-10 max-w-xl w-full border-2 border-[#E5E5E5] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-bold tracking-[-0.02em]">Cryptarithme personnalisé</h2>
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomCryptarithm('');
                    setValidationError(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-[#F5F5F7] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[#86868B]" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-[14px] text-[#86868B] mb-6">
                Entrez un cryptarithme qui a une et une seule solution. Exemple : <span className="font-mono">SEND + MORE = MONEY</span>
              </p>

              <div className="mb-6">
                <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">
                  Cryptarithme
                </label>
                <input
                  type="text"
                  value={customCryptarithm}
                  onChange={(e) => {
                    setCustomCryptarithm(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="ex: ABC + DEF = GHIJ"
                  className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-[12px] text-[14px] font-mono focus:border-[#0096BC] focus:outline-none transition-colors"
                  disabled={isValidating}
                />
              </div>

              {validationError && (
                <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px]">
                  <p className="text-[#FF3B30] text-[14px]">{validationError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomCryptarithm('');
                    setValidationError(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-[12px] border border-[#E5E5E5] text-[#1D1D1F] font-medium text-[14px] hover:bg-[#F5F5F7] transition-colors"
                  disabled={isValidating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCustomCryptarithmSubmit}
                  disabled={isValidating || !customCryptarithm.trim()}
                  className="flex-1 px-4 py-3 rounded-[12px] bg-[#0096BC] text-white font-medium text-[14px] hover:bg-[#007EA1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" strokeWidth={2} />
                      Validation...
                    </>
                  ) : (
                    'Valider et jouer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}