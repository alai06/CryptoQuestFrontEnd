import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Lightbulb, AlertCircle } from 'lucide-react';
import { getLetterConstraints, getDigitConstraints, getHintForLetter, isValidEasyModeAssignment, getGameState, validateSolution } from '../utils/cryptarithmSolver';

interface DragDropBoardProps {
  equation: string;
  solution?: Record<string, string>; // Make solution optional
  onSolved?: () => void;
  onVerification?: () => void;
  showHints?: boolean;
  easyMode?: boolean;
}

export default function DragDropBoard({ equation, solution, onSolved, onVerification, showHints = false, easyMode = false }: DragDropBoardProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [letterDomains, setLetterDomains] = useState<Record<string, Set<number>>>({});
  const [verifiedLetters, setVerifiedLetters] = useState<Record<string, 'correct' | 'incorrect' | null>>({});
  const [draggedDigit, setDraggedDigit] = useState<string | null>(null);
  const [usedDigits, setUsedDigits] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedLetters, setHighlightedLetters] = useState<Set<string>>(new Set());
  const [eliminatedValues, setEliminatedValues] = useState<Record<string, Set<number>>>({});
  
  // États pour le support tactile mobile
  const [touchDraggedDigit, setTouchDraggedDigit] = useState<string | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [touchTargetLetter, setTouchTargetLetter] = useState<string | null>(null);

  const letters = Array.from(new Set(equation.match(/[A-Z]/g) || []));
  const availableDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Get leading letters (first letter of each word)
  const getLeadingLetters = (eq: string): Set<string> => {
    const leadingLetters = new Set<string>();
    // Match all words (sequences of letters)
    const words = eq.match(/[A-Z]+/g) || [];
    words.forEach(word => {
      if (word.length > 0) {
        leadingLetters.add(word[0]);
      }
    });
    return leadingLetters;
  };

  // Initialize letter domains
  useEffect(() => {
    const leadingLetters = getLeadingLetters(equation);
    const initialDomains: Record<string, Set<number>> = {};
    letters.forEach(letter => {
      // Leading letters cannot be 0, so their domain is 1-9
      if (leadingLetters.has(letter)) {
        initialDomains[letter] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      } else {
        initialDomains[letter] = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    });
    setLetterDomains(initialDomains);
    
    // Réinitialiser les assignations quand l'équation change
    setAssignments({});
    setVerifiedLetters({});
    setEliminatedValues({});
    setSelectedLetter(null);
    setSelectedDigit(null);
    setFeedback(null);
    setHintMessage(null);
    setErrorMessage(null);
    setHighlightedLetters(new Set());
  }, [equation]);

  // Use cached game state
  useEffect(() => {
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    getGameState(equation, numAssignments);
  }, [equation, assignments]);

  useEffect(() => {
    const used = new Set(Object.values(assignments));
    setUsedDigits(used);
    checkSolution();
  }, [assignments]);

  // Note: On ne bloque plus le scroll pour permettre une navigation normale
  // La barre de chiffres reste sticky en bas

  // Gérer les événements touch globaux pour le drag-and-drop mobile
  useEffect(() => {
    if (!touchDraggedDigit) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
      
      // Détecter la lettre sous le doigt en cherchant dans tous les éléments
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      let letter = null;
      
      for (const element of elements) {
        const letterElement = element.closest('[data-letter]');
        if (letterElement) {
          letter = letterElement.getAttribute('data-letter');
          break;
        }
      }
      
      if (letter && verifiedLetters[letter] !== 'correct') {
        setTouchTargetLetter(letter);
      } else {
        setTouchTargetLetter(null);
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      
      // Détecter la lettre sous le doigt en cherchant dans tous les éléments
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      let letter = null;
      
      for (const element of elements) {
        const letterElement = element.closest('[data-letter]');
        if (letterElement) {
          letter = letterElement.getAttribute('data-letter');
          break;
        }
      }
      
      if (letter && verifiedLetters[letter] !== 'correct') {
        // Utiliser la même logique que handleDrop
        const numAssignments = Object.fromEntries(
          Object.entries(assignments).map(([k, v]) => [k, Number(v)])
        );

        // Check if valid in easy mode
        if (easyMode) {
          const validation = isValidEasyModeAssignment(equation, letter, Number(touchDraggedDigit), numAssignments);
          if (!validation.valid) {
            setErrorMessage(validation.reason || 'Attribution invalide');
            setTimeout(() => setErrorMessage(null), 3000);
            setTouchDraggedDigit(null);
            setTouchPosition(null);
            setTouchTargetLetter(null);
            setHighlightedLetters(new Set());
            return;
          }
        }

        // Remove old assignment if exists
        const oldAssignment = { ...assignments };
        if (oldAssignment[letter]) {
          delete oldAssignment[letter];
        }
        
        // Remove touchDraggedDigit from any other letter
        Object.keys(oldAssignment).forEach(key => {
          if (oldAssignment[key] === touchDraggedDigit) {
            delete oldAssignment[key];
          }
        });

        const newAssignments = { ...oldAssignment, [letter]: touchDraggedDigit };
        setAssignments(newAssignments);

        // Reset verification status when changing assignment
        const newVerified = { ...verifiedLetters };
        newVerified[letter] = null;
        setVerifiedLetters(newVerified);
      }
      
      setTouchDraggedDigit(null);
      setTouchPosition(null);
      setTouchTargetLetter(null);
      setHighlightedLetters(new Set());
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [touchDraggedDigit, verifiedLetters, assignments, easyMode, equation]);

  const checkSolution = () => {
    if (Object.keys(assignments).length !== letters.length) {
      setFeedback(null);
      return;
    }

    // Use mathematical validation instead of comparing with hardcoded solution
    const isCorrect = validateSolution(equation, assignments);
    
    if (isCorrect) {
      setFeedback('correct');
      
      // Marquer toutes les lettres comme correctes (en vert)
      const allCorrect: Record<string, 'correct' | 'incorrect' | null> = {};
      letters.forEach(letter => {
        if (assignments[letter]) {
          allCorrect[letter] = 'correct';
        }
      });
      setVerifiedLetters(allCorrect);
      
      // Afficher un message de succès
      setHintMessage('🎉 Félicitations ! Vous avez résolu le cryptarithme !');
      
      if (onSolved) {
        setTimeout(() => onSolved(), 2000);
      }
    } else {
      setFeedback('incorrect');
    }
  };

  const handleDragStart = (digit: string) => {
    setDraggedDigit(digit);
    setSelectedDigit(digit);
    setErrorMessage(null);
    
    // Highlight which letters this digit can be assigned to
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getDigitConstraints(equation, Number(digit), numAssignments);
    setHighlightedLetters(new Set(constraints.possibleLetters));
  };

  const handleDrop = (letter: string) => {
    if (draggedDigit) {
      // Prevent modifying a letter that has been verified as correct
      if (verifiedLetters[letter] === 'correct') {
        setErrorMessage(`La lettre ${letter} est déjà correctement assignée et ne peut pas être modifiée`);
        setTimeout(() => setErrorMessage(null), 3000);
        setDraggedDigit(null);
        setHighlightedLetters(new Set());
        return;
      }

      const numAssignments = Object.fromEntries(
        Object.entries(assignments).map(([k, v]) => [k, Number(v)])
      );

      // Check if valid in easy mode
      if (easyMode) {
        const validation = isValidEasyModeAssignment(equation, letter, Number(draggedDigit), numAssignments);
        if (!validation.valid) {
          setErrorMessage(validation.reason || 'Attribution invalide');
          setTimeout(() => setErrorMessage(null), 3000);
          setDraggedDigit(null);
          setHighlightedLetters(new Set());
          return;
        }
      }

      // Remove old assignment if exists
      const oldAssignment = { ...assignments };
      if (oldAssignment[letter]) {
        delete oldAssignment[letter];
      }
      
      // Remove draggedDigit from any other letter
      Object.keys(oldAssignment).forEach(key => {
        if (oldAssignment[key] === draggedDigit) {
          delete oldAssignment[key];
        }
      });

      const newAssignments = { ...oldAssignment, [letter]: draggedDigit };
      setAssignments(newAssignments);

      // Reset verification status when changing assignment
      const newVerified = { ...verifiedLetters };
      newVerified[letter] = null;
      setVerifiedLetters(newVerified);
      
      setDraggedDigit(null);
      setHighlightedLetters(new Set());
    }
  };

  const handleReset = () => {
    setAssignments({});
    setVerifiedLetters({});
    setFeedback(null);
    setSelectedLetter(null);
    setSelectedDigit(null);
    setHintMessage(null);
    setErrorMessage(null);
    setHighlightedLetters(new Set());
    setEliminatedValues({});
    
    // Reset all letter domains with proper leading letter handling
    const leadingLetters = getLeadingLetters(equation);
    const resetDomains: Record<string, Set<number>> = {};
    letters.forEach(letter => {
      if (leadingLetters.has(letter)) {
        resetDomains[letter] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      } else {
        resetDomains[letter] = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    });
    setLetterDomains(resetDomains);
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    setSelectedDigit(null);
  };
  
  const toggleEliminatedValue = (letter: string, value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newEliminated = { ...eliminatedValues };
    if (!newEliminated[letter]) {
      newEliminated[letter] = new Set();
    }
    
    if (newEliminated[letter].has(value)) {
      newEliminated[letter].delete(value);
    } else {
      newEliminated[letter].add(value);
    }
    
    setEliminatedValues(newEliminated);
  };

  const handleDigitClick = (digit: string) => {
    setSelectedDigit(digit);
    setSelectedLetter(null);
    
    // Highlight which letters this digit can be assigned to
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getDigitConstraints(equation, Number(digit), numAssignments);
    setHighlightedLetters(new Set(constraints.possibleLetters));
    
    if (constraints.possibleLetters.length === 0) {
      setHintMessage(`Le chiffre ${digit} est déjà utilisé ou ne peut être attribué à aucune lettre`);
    } else {
      setHintMessage(`Le chiffre ${digit} peut être attribué à : ${constraints.possibleLetters.join(', ')}`);
    }
  };

  // Gestion du touch pour mobile
  const handleTouchStart = (digit: string, e: React.TouchEvent) => {
    if (usedDigits.has(digit)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    setTouchDraggedDigit(digit);
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
    setErrorMessage(null);
    
    // Highlight which letters this digit can be assigned to
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getDigitConstraints(equation, Number(digit), numAssignments);
    setHighlightedLetters(new Set(constraints.possibleLetters));
  };

  const getLetterConstraintsInfo = (letter: string) => {
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getLetterConstraints(equation, letter, numAssignments);
    
    return constraints;
  };

  const renderEquation = () => {
    const parts: JSX.Element[] = [];
    let currentWord: JSX.Element[] = [];
    let wordIndex = 0;

    equation.split('').forEach((char, index) => {
      if (/[A-Z]/.test(char)) {
        const hasAssignment = assignments[char];
        const isHighlighted = highlightedLetters.has(char);
        
        currentWord.push(
          <span
            key={`${wordIndex}-${index}`}
            className={`inline-block relative transition-all duration-300 px-0.5 ${
              isHighlighted ? 'scale-110' : ''
            }`}
          >
            <span className={`text-base md:text-2xl lg:text-3xl text-gray-800 font-mono ${
              isHighlighted ? 'text-purple-600 animate-pulse' : ''
            }`}>
              {char}
            </span>
            {hasAssignment && (
              <span className="absolute -bottom-5 md:-bottom-7 lg:-bottom-8 left-1/2 -translate-x-1/2 text-sm md:text-xl lg:text-2xl text-purple-600 font-mono animate-fade-in">
                {hasAssignment}
              </span>
            )}
          </span>
        );
      } else {
        // Si on a accumulé des lettres, les ajouter comme un groupe (mot)
        if (currentWord.length > 0) {
          parts.push(
            <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
              {currentWord}
            </span>
          );
          currentWord = [];
          wordIndex++;
        }
        
        // Ajouter l'espace ou l'opérateur
        parts.push(
          <span key={`op-${index}`} className="text-base md:text-2xl lg:text-3xl text-gray-800 font-mono px-0.5">
            {char}
          </span>
        );
      }
    });

    // Ajouter le dernier mot s'il existe
    if (currentWord.length > 0) {
      parts.push(
        <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap">
          {currentWord}
        </span>
      );
    }

    return parts;
  };

  const handleVerify = () => {
    if (Object.keys(assignments).length === 0) {
      setErrorMessage('Aucune attribution à vérifier');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    // Créer une copie profonde des domaines (copier tous les Sets)
    const newDomains: Record<string, Set<number>> = {};
    Object.keys(letterDomains).forEach(key => {
      newDomains[key] = new Set(letterDomains[key]);
    });
    
    const newVerified = { ...verifiedLetters };
    const newAssignments = { ...assignments };
    let correctCount = 0;
    let incorrectCount = 0;

    // Only verify individual letters if solution is provided
    if (!solution) {
      setHintMessage('Mode vérification désactivé : aucune solution de référence fournie');
      setTimeout(() => setHintMessage(null), 3000);
      return;
    }

    // Debug logging
    console.log('=== VERIFICATION DEBUG ===');
    console.log('Solution complète:', solution);
    console.log('Assignments actuels:', assignments);

    // Check each assignment
    Object.entries(assignments).forEach(([letter, digit]) => {
      // Check if solution exists for this letter
      if (!(letter in solution)) {
        console.warn(`Lettre ${letter} non trouvée dans la solution!`);
        return;
      }

      // Convert both to string for comparison to ensure type consistency
      const correctValue = String(solution[letter]);
      const assignedValue = String(digit);
      
      console.log(`Lettre ${letter}: correct=${correctValue}, assigné=${assignedValue}, match=${correctValue === assignedValue}`);
      
      const isCorrect = correctValue === assignedValue;
      
      if (isCorrect) {
        // Mark as correct and reduce domain to only this digit
        newVerified[letter] = 'correct';
        newDomains[letter] = new Set([Number(digit)]);
        correctCount++;
        
        // IMPORTANT: Enlever ce chiffre du domaine de toutes les autres lettres
        Object.keys(newDomains).forEach(otherLetter => {
          if (otherLetter !== letter) {
            newDomains[otherLetter].delete(Number(digit));
          }
        });
      } else {
        // Mark as incorrect, remove digit from domain, and clear the assignment
        newVerified[letter] = 'incorrect';
        newDomains[letter].delete(Number(digit));
        incorrectCount++;
        
        // Remove the incorrect assignment
        delete newAssignments[letter];
      }
    });

    setLetterDomains(newDomains);
    setVerifiedLetters(newVerified);
    setAssignments(newAssignments);

    // Show feedback message
    if (incorrectCount === 0 && correctCount > 0) {
      setHintMessage(`✓ Toutes les attributions sont correctes ! (${correctCount})`);
    } else if (incorrectCount > 0 && correctCount > 0) {
      setHintMessage(`${correctCount} correct(s), ${incorrectCount} incorrect(s). Les chiffres incorrects ont été retirés.`);
    } else if (incorrectCount > 0) {
      setHintMessage(`✗ Aucune attribution correcte. Les chiffres incorrects ont été retirés et les domaines mis à jour.`);
    }

    // Notifier le parent qu'une vérification a été effectuée
    if (onVerification) {
      onVerification();
    }
    // Clear ONLY incorrect badges after showing them briefly (keep correct badges)
    setTimeout(() => {
      setVerifiedLetters(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key] === 'incorrect') {
            updated[key] = null;
          }
          // Keep 'correct' badges permanently
        });
        return updated;
      });
    }, 1500);

    setTimeout(() => setHintMessage(null), 4000);
  };

  return (
    <div className="space-y-8 relative pb-[40rem] md:pb-56">
      {/* Élément visuel qui suit le doigt pendant le drag tactile */}
      {touchDraggedDigit && touchPosition && (
        <>
          {/* Cercle de feedback derrière le doigt */}
          <div
            className="fixed pointer-events-none z-[99] w-24 h-24 rounded-full bg-purple-400/30 blur-xl"
            style={{
              left: touchPosition.x - 48,
              top: touchPosition.y - 48,
            }}
          />
          {/* Chiffre visible au-dessus du doigt */}
          <div
            className="fixed pointer-events-none z-[100] w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl font-bold font-mono shadow-2xl ring-4 ring-purple-300"
            style={{
              left: touchPosition.x - 40,
              top: touchPosition.y - 90, // Positionné au-dessus du doigt pour être visible
              transform: 'scale(1.2)',
              animation: 'bounce 0.5s ease-in-out infinite',
            }}
          >
            {touchDraggedDigit}
          </div>
        </>
      )}
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-lg">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <span className="text-red-900">{errorMessage}</span>
        </div>
      )}

      {/* Hint Message */}
      {hintMessage && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-lg">
          <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <span className="text-blue-900">{hintMessage}</span>
        </div>
      )}

      {/* Equation Display */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 md:p-8 lg:p-10 text-center border border-purple-200 shadow-lg overflow-hidden">
        <div className="mb-8 md:mb-10 lg:mb-12 break-words overflow-x-auto">
          <div className="inline-block min-w-0 max-w-full">
            {renderEquation()}
          </div>
        </div>
      </div>

      {/* Letter Assignment Zones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {letters.map(letter => {
          const isHighlighted = highlightedLetters.has(letter);
          const isSelected = selectedLetter === letter;
          const hasAssignment = !!assignments[letter];
          const verificationStatus = verifiedLetters[letter];
          const isLocked = verificationStatus === 'correct';
          const isTouchTarget = touchTargetLetter === letter;
          
          // Utiliser uniquement les lettres vérifiées comme correctes pour les contraintes
          const verifiedAssignments: Record<string, number> = {};
          Object.entries(assignments).forEach(([l, v]) => {
            if (verifiedLetters[l] === 'correct') {
              verifiedAssignments[l] = Number(v);
            }
          });
          const constraints = getLetterConstraints(equation, letter, verifiedAssignments);
          
          // Filtrer avec les domaines stockés (qui sont réduits lors de la vérification)
          const storedDomain = letterDomains[letter] || new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
          const possibleValues = constraints.possibleValues.filter(val => storedDomain.has(val));
          
          return (
            <div
              key={letter}
              data-letter={letter}
              onDragOver={(e) => {
                if (!isLocked) {
                  e.preventDefault();
                }
              }}
              onDrop={() => {
                if (!isLocked) {
                  handleDrop(letter);
                }
              }}
              onClick={() => {
                if (!isLocked) {
                  handleLetterClick(letter);
                }
              }}
              className={`
                relative p-3 md:p-4 lg:p-6 rounded-xl md:rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
                ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${verificationStatus === 'correct'
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105'
                  : verificationStatus === 'incorrect'
                  ? 'bg-gradient-to-br from-red-100 to-orange-100 border-red-400 shadow-lg'
                  : assignments[letter] 
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg scale-105' 
                  : isTouchTarget
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-xl scale-110 animate-pulse'
                  : isSelected
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400 shadow-md'
                  : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
                }
              `}
            >
              {/* Verification Badge */}
              {verificationStatus === 'correct' && (
                <div className="absolute -top-2 -left-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center z-20">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {verificationStatus === 'incorrect' && (
                <div className="absolute -top-2 -left-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center z-20">
                  <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}

              <div className="text-center min-w-0">
                <div className="text-xl md:text-2xl text-gray-800 mb-1 md:mb-2 font-semibold truncate">{letter}</div>
                <div className="h-8 md:h-10 flex items-center justify-center">
                  {assignments[letter] ? (
                    <span className={`text-2xl md:text-3xl font-mono animate-fade-in ${
                      verificationStatus === 'correct' ? 'text-green-600' :
                      verificationStatus === 'incorrect' ? 'text-red-600' :
                      'text-purple-600'
                    }`}>
                      {assignments[letter]}
                    </span>
                  ) : (
                    <span className="text-xs md:text-sm text-gray-400">Déposez ici</span>
                  )}
                </div>
                
                {/* Domain Display - Toujours affiché sauf si la lettre est verrouillée */}
                {!isLocked && possibleValues.length > 0 && (
                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200 min-w-0">
                    <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 font-medium flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1">
                      <span>Domaine</span>
                      <span className="hidden md:inline text-[10px] text-gray-400">(clic pour éliminer)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center overflow-hidden">
                      {possibleValues.map(val => {
                        const isEliminated = eliminatedValues[letter]?.has(val);
                        const isCurrent = hasAssignment && Number(assignments[letter]) === val;
                        
                        return (
                          <button
                            key={val}
                            onClick={(e) => toggleEliminatedValue(letter, val, e)}
                            className={`px-1 md:px-1.5 py-0.5 rounded text-[10px] md:text-xs font-mono transition-all cursor-pointer hover:scale-110 flex-shrink-0 ${
                              isCurrent
                                ? 'bg-purple-200 text-purple-800 font-semibold'
                                : isEliminated
                                ? 'bg-red-100 text-red-400 line-through opacity-50'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Empty Domain Warning */}
                {!isLocked && possibleValues.length === 0 && (
                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-red-200">
                    <div className="text-[10px] md:text-xs text-red-600 font-medium truncate">Domaine vide !</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Espace tampon blanc pour mobile (permet de voir le domaine complet) */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 md:hidden">
        <p className="text-center text-gray-400 text-sm">
          ⬆️ Scrollez pour voir tous les domaines
        </p>
      </div>

      {/* Sticky Bar en bas (comme un "add to cart") */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-5xl mx-auto px-3 py-2 md:px-4 md:py-4 space-y-2 md:space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-row justify-center gap-2 md:gap-3">
            <button
              onClick={handleVerify}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-8 py-1.5 md:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 text-xs md:text-base font-medium"
            >
              <Check className="w-3.5 h-3.5 md:w-5 md:h-5" />
              Vérifier
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 text-xs md:text-base font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-5 md:h-5" />
              Réinitialiser
            </button>
          </div>

          {/* Available Digits */}
          <div>
            <p className="text-[10px] md:text-sm text-gray-700 mb-1.5 md:mb-2 text-center font-medium">
              {selectedDigit 
                ? '👆 Appuyez sur une lettre pour assigner' 
                : touchDraggedDigit
                ? '👉 Maintenez et déposez sur une lettre'
                : '✋ Maintenez un chiffre ou cliquez pour sélectionner'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {availableDigits.map(digit => {
                const isSelected = selectedDigit === digit;
                const isUsed = usedDigits.has(digit);
                const isTouchDragged = touchDraggedDigit === digit;
                
                return (
                  <div
                    key={digit}
                    draggable={!isUsed}
                    onDragStart={() => handleDragStart(digit)}
                    onTouchStart={(e) => handleTouchStart(digit, e)}
                    onClick={() => !isUsed && handleDigitClick(digit)}
                    className={`
                      w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg md:rounded-xl flex-shrink-0
                      text-xl md:text-2xl font-mono transition-all duration-300
                      ${isUsed
                        ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                        : isTouchDragged
                        ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white shadow-2xl scale-75 opacity-50'
                        : isSelected
                        ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-xl scale-110'
                        : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-800 hover:border-purple-400 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer cursor-move'
                      }
                    `}
                    style={{ touchAction: 'none' }}
                  >
                    {digit}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showHints && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl md:rounded-2xl p-4 md:p-5 text-center text-blue-900 shadow-lg animate-fade-in mx-2">
          <p className="mb-2 text-sm md:text-base font-medium">
            💡 Astuces :
          </p>
          <ul className="text-xs md:text-sm space-y-1 text-left max-w-2xl mx-auto">
            <li>• Les lettres en début de mot ne peuvent pas être 0</li>
            <li className="hidden md:list-item">• Cliquez sur une valeur du domaine pour l'éliminer manuellement (comme les drapeaux du démineur)</li>
            <li className="md:hidden">• Cliquez sur une valeur du domaine pour l'éliminer</li>
            <li>• Cliquez sur un chiffre pour voir où il peut aller</li>
            {easyMode && <li>• En mode facile, les mauvaises décisions sont bloquées</li>}
          </ul>
        </div>
      )}
    </div>
  );
}