import React, { useState, useEffect } from 'react';
import { Check, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getLetterConstraints, getDigitConstraints, isValidEasyModeAssignment, validateSolution } from '../utils/cryptarithmSolver';
import { PrimaryButton, AlertBanner } from './ui';

// ===== TAILLE FIXE DES CARTES LETTRES (PC) =====
const CARD_WIDTH = 135; // px — modifier ce nombre pour changer la largeur des cartes
// ================================================

interface DragDropBoardProps {
  equation: string;
  solution?: Record<string, string>; // Make solution optional
  onSolved?: () => void;
  onVerification?: () => void;
  showHints?: boolean;
  easyMode?: boolean;
  isMobile?: boolean;
}

export default function DragDropBoard({ equation, solution, onSolved, onVerification, showHints = false, easyMode = false, isMobile = false }: DragDropBoardProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [letterDomains, setLetterDomains] = useState<Record<string, Set<number>>>({});
  const [verifiedLetters, setVerifiedLetters] = useState<Record<string, 'correct' | 'incorrect' | null>>({});
  const [draggedDigit, setDraggedDigit] = useState<string | null>(null);
  const [draggedFromLetter, setDraggedFromLetter] = useState<string | null>(null);
  const [usedDigits, setUsedDigits] = useState<Set<string>>(new Set());
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedLetters, setHighlightedLetters] = useState<Set<string>>(new Set());
  const [eliminatedValues, setEliminatedValues] = useState<Record<string, Set<number>>>({}); // État pour afficher/masquer les domaines par lettre
  const [verificationEliminated, setVerificationEliminated] = useState<Record<string, Set<number>>>({}); // Chiffres définitivement éliminés après vérification incorrecte
  const [expandedLetters, setExpandedLetters] = useState<Record<string, boolean>>({}); // État pour afficher/masquer les domaines par lettre
  
  // États pour le support tactile mobile
  const [touchDraggedDigit, setTouchDraggedDigit] = useState<string | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [touchTargetLetter, setTouchTargetLetter] = useState<string | null>(null);

  const letters = Array.from(new Set(equation.match(/[A-Z]/g) || []));
  const availableDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Get leading letters (first letter of each word)
  // Only multi-character words cannot start with 0; single-letter variables can be 0
  const getLeadingLetters = (eq: string): Set<string> => {
    const leadingLetters = new Set<string>();
    // Match all words (sequences of letters)
    const words = eq.match(/[A-Z]+/g) || [];
    words.forEach(word => {
      if (word.length > 1) {
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
  }, [equation]);

  // Update letter domains dynamically when assignments change
  useEffect(() => {
    const leadingLetters = getLeadingLetters(equation);
    const newDomains: Record<string, Set<number>> = {};
    
    // Initialize domains for all letters
    letters.forEach(letter => {
      if (leadingLetters.has(letter)) {
        newDomains[letter] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      } else {
        newDomains[letter] = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    });

    // Remove assigned values from domains of unassigned letters
    Object.entries(assignments).forEach(([assignedLetter, assignedValue]) => {
      const numValue = Number(assignedValue);
      
      // For the assigned letter, reduce its domain to only the assigned value
      newDomains[assignedLetter] = new Set([numValue]);
      
      // Remove this value from all other letters' domains
      letters.forEach(letter => {
        if (letter !== assignedLetter && !assignments[letter]) {
          newDomains[letter].delete(numValue);
        }
      });
    });

    // Apply verification-eliminated values (permanently remove from domain display)
    Object.entries(verificationEliminated).forEach(([letter, eliminated]) => {
      if (newDomains[letter] && !assignments[letter]) {
        eliminated.forEach(val => {
          newDomains[letter].delete(val);
        });
      }
    });

    // Note: Eliminated values (manually marked by player) are NOT removed from domains
    // They are only visually marked as eliminated but remain in the domain

    setLetterDomains(newDomains);
  }, [assignments, equation, verificationEliminated]);

  useEffect(() => {
    const used = new Set(Object.values(assignments));
    setUsedDigits(used);
  }, [assignments]);

  // Note: On ne bloque plus le scroll pour permettre une navigation normale
  // La barre de chiffres reste sticky en bas

  // Gérer les événements touch globaux pour le drag-and-drop mobile
  useEffect(() => {
    if (!touchDraggedDigit) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
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
        // Empêcher le scroll seulement quand on est au-dessus d'une zone de drop valide
        e.preventDefault();
      } else {
        setTouchTargetLetter(null);
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
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
            setDraggedFromLetter(null);
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
        
        // Remove touchDraggedDigit from any other letter (including source letter if re-dragging)
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
        // Also reset the source letter if we're moving from another letter
        if (draggedFromLetter) {
          newVerified[draggedFromLetter] = null;
        }
        setVerifiedLetters(newVerified);
      } else if (draggedFromLetter) {
        // Si on n'a pas droppé sur une lettre valide mais qu'on vient d'une lettre,
        // désassigner le chiffre de la lettre source
        const newAssignments = { ...assignments };
        delete newAssignments[draggedFromLetter];
        setAssignments(newAssignments);
        
        // Réinitialiser le statut de vérification
        const newVerified = { ...verifiedLetters };
        newVerified[draggedFromLetter] = null;
        setVerifiedLetters(newVerified);
      }
      
      setTouchDraggedDigit(null);
      setDraggedFromLetter(null);
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
      return;
    }

    // Use mathematical validation instead of comparing with hardcoded solution
    const isCorrect = validateSolution(equation, assignments);
    
    if (isCorrect) {
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
        setTimeout(() => onSolved(), 1000);
      }
    }
  };

  const handleDragStart = (digit: string) => {
    setDraggedDigit(digit);
    setSelectedDigit(digit);
    
    // Highlight which letters this digit can be assigned to
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getDigitConstraints(equation, Number(digit), numAssignments);
    setHighlightedLetters(new Set(constraints.possibleLetters));
  };

  const handleDrop = (letter: string) => {
    const digitToDrop = draggedDigit || (draggedFromLetter ? assignments[draggedFromLetter] : null);
    
    if (digitToDrop) {
      // Prevent modifying a letter that has been verified as correct
      if (verifiedLetters[letter] === 'correct') {
        setErrorMessage(`La lettre ${letter} est déjà correctement assignée et ne peut pas être modifiée`);
        setTimeout(() => setErrorMessage(null), 3000);
        setDraggedDigit(null);
        setDraggedFromLetter(null);
        setHighlightedLetters(new Set());
        return;
      }

      const numAssignments = Object.fromEntries(
        Object.entries(assignments).map(([k, v]) => [k, Number(v)])
      );

      // Check if valid in easy mode
      if (easyMode) {
        const validation = isValidEasyModeAssignment(equation, letter, Number(digitToDrop), numAssignments);
        if (!validation.valid) {
          setErrorMessage(validation.reason || 'Attribution invalide');
          setTimeout(() => setErrorMessage(null), 3000);
          setDraggedDigit(null);
          setDraggedFromLetter(null);
          setHighlightedLetters(new Set());
          return;
        }
      }

      // Remove old assignment if exists
      const oldAssignment = { ...assignments };
      if (oldAssignment[letter]) {
        delete oldAssignment[letter];
      }
      
      // Remove digitToDrop from any other letter (including draggedFromLetter)
      Object.keys(oldAssignment).forEach(key => {
        if (oldAssignment[key] === digitToDrop) {
          delete oldAssignment[key];
        }
      });

      const newAssignments = { ...oldAssignment, [letter]: digitToDrop };
      setAssignments(newAssignments);

      // Reset verification status when changing assignment
      const newVerified = { ...verifiedLetters };
      newVerified[letter] = null;
      // Also reset the source letter if we're moving from another letter
      if (draggedFromLetter) {
        newVerified[draggedFromLetter] = null;
      }
      setVerifiedLetters(newVerified);
      
      setDraggedDigit(null);
      setDraggedFromLetter(null);
      setHighlightedLetters(new Set());
    }
  };

  const handleReset = () => {
    // Préserver les lettres vérifiées comme correctes
    const correctAssignments: Record<string, string> = {};
    const correctVerified: Record<string, 'correct' | 'incorrect' | null> = {};
    
    Object.entries(verifiedLetters).forEach(([letter, status]) => {
      if (status === 'correct' && assignments[letter]) {
        correctAssignments[letter] = assignments[letter];
        correctVerified[letter] = 'correct';
      }
    });
    
    setAssignments(correctAssignments);
    setVerifiedLetters(correctVerified);
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
    
    // Réduire les domaines pour les lettres correctes conservées
    Object.entries(correctAssignments).forEach(([letter, value]) => {
      const numValue = Number(value);
      resetDomains[letter] = new Set([numValue]);
      
      // Retirer cette valeur des autres domaines
      letters.forEach(otherLetter => {
        if (otherLetter !== letter) {
          resetDomains[otherLetter].delete(numValue);
        }
      });
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

  const handleTouchStartFromLetter = (letter: string, e: React.TouchEvent) => {
    if (verifiedLetters[letter] === 'correct' || !assignments[letter]) return;
    
    e.stopPropagation();
    
    const touch = e.touches[0];
    const digit = assignments[letter];
    setTouchDraggedDigit(digit);
    setDraggedFromLetter(letter);
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
    setErrorMessage(null);
    
    // Highlight which letters this digit can be assigned to
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getDigitConstraints(equation, Number(digit), numAssignments);
    setHighlightedLetters(new Set(constraints.possibleLetters));
  };



  const renderEquation = () => {
    const parts: React.ReactNode[] = [];
    let currentWord: React.ReactNode[] = [];
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
            <span className={`text-2xl md:text-5xl lg:text-9xl text-gray-800 font-mono font-bold ${
              isHighlighted ? 'text-purple-600 animate-pulse' : ''
            }`}>
              {char}
            </span>
            {hasAssignment && (
              <span className="absolute -bottom-6 md:-bottom-16 lg:-bottom-24 left-1/2 -translate-x-1/2 text-xl md:text-4xl lg:text-6xl text-purple-600 font-mono font-bold animate-fade-in">
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
          <span key={`op-${index}`} className="text-2xl md:text-5xl lg:text-9xl text-gray-800 font-mono font-bold px-0.5">
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
    const newVerificationEliminated: Record<string, Set<number>> = {};
    Object.entries(verificationEliminated).forEach(([k, v]) => {
      newVerificationEliminated[k] = new Set(v);
    });
    let correctCount = 0;
    let incorrectCount = 0;

    // If no solution provided, use mathematical validation
    if (!solution) {
      checkSolution();
      return;
    }

    // Check each assignment
    Object.entries(assignments).forEach(([letter, digit]) => {
      // Check if solution exists for this letter
      if (!(letter in solution)) {
        return;
      }

      // Convert both to string for comparison to ensure type consistency
      const correctValue = String(solution[letter]);
      const assignedValue = String(digit);
      
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

        // Permanently mark this digit as eliminated for this letter
        if (!newVerificationEliminated[letter]) {
          newVerificationEliminated[letter] = new Set();
        }
        newVerificationEliminated[letter].add(Number(digit));
      }
    });

    setLetterDomains(newDomains);
    setVerifiedLetters(newVerified);
    setAssignments(newAssignments);
    setVerificationEliminated(newVerificationEliminated);

    // Show feedback message
    if (incorrectCount === 0 && correctCount > 0) {
      // Vérifier si TOUTES les lettres sont assignées correctement
      if (correctCount === letters.length) {
        setHintMessage('🎉 Félicitations ! Vous avez résolu le cryptarithme !');
        
        // Marquer toutes les lettres comme correctes
        const allCorrect: Record<string, 'correct' | 'incorrect' | null> = {};
        letters.forEach(letter => {
          if (newAssignments[letter]) {
            allCorrect[letter] = 'correct';
          }
        });
        setVerifiedLetters(allCorrect);
        
        // Déclencher la résolution
        if (onSolved) {
          setTimeout(() => onSolved(), 1000);
        }
      } else {
        setHintMessage(`✓ Toutes les attributions sont correctes ! (${correctCount}/${letters.length})`);
      }
    } else if (incorrectCount > 0 && correctCount > 0) {
      setHintMessage(`${correctCount} correct(s), ${incorrectCount} incorrect(s). Les chiffres incorrects ont été retirés.`);
    } else if (incorrectCount > 0) {
      setHintMessage(`✗ Aucune attribution correcte. Les chiffres incorrects ont été retirés et les valeurs possibles mises à jour.`);
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

  // Spacer fantôme pour mobile - prend la même hauteur que le panneau fixe
  const mobileControlsSpacer = isMobile && (
    <div className="bg-transparent border-t-2 border-transparent">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 px-2">
          <div className="h-12 sm:w-auto sm:min-w-[180px]"></div>
          <div className="h-12 sm:w-auto sm:min-w-[200px]"></div>
        </div>

        {/* Available Digits */}
        <div>
          <p className="text-xs md:text-sm mb-2 text-center font-medium invisible">Spacer</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {availableDigits.map(digit => (
              <div
                key={digit}
                className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0"
              >
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render mobile controls separately - fixed at bottom
  const mobileControls = isMobile && (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-gray-200 shadow-2xl z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 px-2">
          <PrimaryButton
            onClick={handleVerify}
            variant="primary"
            leftIcon={<Check className="w-6 h-6" />}
            className="sm:w-auto sm:min-w-[180px]"
          >
            Vérifier
          </PrimaryButton>
          
          <PrimaryButton
            onClick={handleReset}
            variant="secondary"
            leftIcon={<RotateCcw className="w-6 h-6" />}
            className="sm:w-auto sm:min-w-[200px]"
          >
            Réinitialiser
          </PrimaryButton>
        </div>

        {/* Available Digits */}
        <div>
          <p className="text-xs md:text-sm text-gray-700 mb-2 text-center font-medium">
            {selectedDigit 
              ? '👆 Appuyez sur une lettre pour assigner' 
              : touchDraggedDigit
              ? '👉 Maintenez et déposez sur une lettre'
              : '✋ Glissez un chiffre sur une lettre'
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
  );

  return (
    <div className={isMobile ? 'h-full overflow-y-auto space-y-8 sm:space-y-5 md:space-y-6 px-4' : 'space-y-8 sm:space-y-5 md:space-y-6 relative'}>
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
        <AlertBanner
          variant="error"
          message={errorMessage}
          className="animate-fade-in shadow-lg"
        />
      )}

      {/* Hint Message */}
      {hintMessage && (
        <AlertBanner
          variant="info"
          message={hintMessage}
          className="animate-fade-in shadow-lg"
        />
      )}

      {/* Equation Display */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-xl p-6 sm:p-4 md:p-5 text-center border border-purple-200 shadow-lg overflow-hidden">
        <div className="mb-8 sm:mb-5 md:mb-6 break-words overflow-x-auto">
          <div className="inline-block min-w-0 max-w-full">
            {renderEquation()}
          </div>
        </div>
      </div>

      {/* Letter Assignment Zones */}
      <div className={`${isMobile ? 'grid grid-cols-2' : 'flex flex-wrap justify-center'} gap-3 sm:gap-2.5 md:gap-3`}>
        {letters.map(letter => {
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
          const isExpanded = expandedLetters[letter] ?? false;
          
          return (
            <div
              key={letter}
              data-letter={letter}
              draggable={hasAssignment && !isLocked}
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
              onDragStart={(e) => {
                if (hasAssignment && !isLocked) {
                  setDraggedDigit(assignments[letter]);
                  setDraggedFromLetter(letter);
                  e.dataTransfer.effectAllowed = 'move';
                  
                  // Créer une image de drag personnalisée pour afficher juste le chiffre
                  const dragImage = document.createElement('div');
                  dragImage.style.cssText = `
                    position: absolute;
                    top: -1000px;
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(to bottom right, rgb(216, 180, 254), rgb(251, 207, 232));
                    border-radius: 12px;
                    font-size: 24px;
                    font-family: monospace;
                    font-weight: bold;
                    color: rgb(147, 51, 234);
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                  `;
                  dragImage.textContent = assignments[letter];
                  document.body.appendChild(dragImage);
                  
                  e.dataTransfer.setDragImage(dragImage, 28, 28);
                  
                  // Nettoyer après un court délai
                  setTimeout(() => {
                    document.body.removeChild(dragImage);
                  }, 0);
                }
              }}
              onDragEnd={() => {
                // Si draggedFromLetter existe encore, cela signifie que le drop n'a pas réussi
                // donc on désassigne le chiffre de la lettre source
                if (draggedFromLetter) {
                  const newAssignments = { ...assignments };
                  delete newAssignments[draggedFromLetter];
                  setAssignments(newAssignments);
                  
                  // Réinitialiser le statut de vérification
                  const newVerified = { ...verifiedLetters };
                  newVerified[draggedFromLetter] = null;
                  setVerifiedLetters(newVerified);
                }
                
                setDraggedDigit(null);
                setDraggedFromLetter(null);
                setHighlightedLetters(new Set());
              }}
              onClick={() => {
                if (!isLocked && !hasAssignment) {
                  handleLetterClick(letter);
                }
              }}
              onTouchStart={(e) => {
                if (hasAssignment && !isLocked) {
                  handleTouchStartFromLetter(letter, e);
                }
              }}
              style={!isMobile ? { width: CARD_WIDTH, flexShrink: 0 } : undefined}
              className={`
                relative p-3 sm:p-1.5 md:p-2 rounded-xl sm:rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden
                ${isLocked ? 'cursor-not-allowed' : hasAssignment ? 'cursor-move' : 'cursor-pointer'}
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
                <div className="absolute -top-2 -left-2 bg-green-500 rounded-full w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center z-20">
                  <Check className="w-3 h-3 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" strokeWidth={2.5} />
                </div>
              )}
              {verificationStatus === 'incorrect' && (
                <div className="absolute -top-2 -left-2 bg-red-500 rounded-full w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex items-center justify-center z-20">
                  <X className="w-3 h-3 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" strokeWidth={2.5} />
                </div>
              )}

              <div className="text-center min-w-0">
                <div className="text-2xl sm:text-lg md:text-xl text-gray-800 mb-1 sm:mb-0.5 font-semibold truncate">{letter}</div>
                <div className="h-9 sm:h-7 md:h-8 flex items-center justify-center">
                  {assignments[letter] && (
                    <span 
                      className={`text-3xl sm:text-xl md:text-2xl font-mono animate-fade-in font-bold ${
                        verificationStatus === 'correct' ? 'text-green-600' :
                        verificationStatus === 'incorrect' ? 'text-red-600' :
                        'text-purple-600'
                      }`}
                    >
                      {assignments[letter]}
                    </span>
                  )}
                </div>
                
                {/* Domain Toggle Button & Display */}
                {!isLocked && possibleValues.length > 0 && (
                  <div className={`mt-2 pt-2 border-t border-gray-200 min-w-0 ${isMobile ? 'sm:mt-1 sm:pt-1 md:mt-1.5 md:pt-1.5' : ''}`}>
                    {/* Toggle button - Mobile only */}
                    {isMobile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLetters(prev => ({ ...prev, [letter]: !isExpanded }));
                        }}
                        className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors mb-1.5"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    
                    {/* Domain values - Always shown on PC, toggle on mobile */}
                    {(!isMobile || isExpanded) && (
                      <div className={`flex flex-wrap justify-center ${isMobile ? 'gap-2 sm:gap-1.5 md:gap-2 leading-relaxed' : 'gap-1 leading-relaxed'}`}>
                      {possibleValues.map(val => {
                        const isEliminated = eliminatedValues[letter]?.has(val);
                        const isCurrent = hasAssignment && Number(assignments[letter]) === val;
                        
                        return (
                          <button
                            key={val}
                            onClick={(e) => toggleEliminatedValue(letter, val, e)}
                            className={`font-mono transition-all cursor-pointer flex-shrink-0 ${
                              isMobile
                                ? `px-5 py-2 rounded text-[20px] sm:text-[20px] md:text-[30px] hover:scale-105 min-w-[60px]`
                                : `px-3 py-1 rounded-lg text-[20px] hover:scale-105 shadow-sm border min-w-[35px]`
                            } ${
                              isCurrent
                                ? isMobile
                                  ? 'bg-purple-200 text-purple-800 font-semibold'
                                  : 'bg-purple-100 text-purple-700 font-bold border-purple-300 ring-2 ring-purple-300'
                                : isEliminated
                                ? isMobile
                                  ? 'bg-gray-200 text-gray-400 line-through opacity-60'
                                  : 'bg-gray-100 text-gray-400 line-through opacity-50 border-gray-300'
                                : isMobile
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 hover:border-blue-400 hover:shadow-md'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Empty Domain Warning */}
                {!isLocked && possibleValues.length === 0 && (
                  <div className={`mt-2 pt-2 border-t border-red-200 ${isMobile ? 'sm:mt-1 sm:pt-1 md:mt-1.5 md:pt-1.5' : ''}`}>
                    <div className={`text-center text-red-600 font-medium ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>
                      ⚠️ Aucune valeur
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boutons et chiffres pour PC - intégré au bloc */}
      {!isMobile && <div className="mt-6 space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-row justify-center gap-3">
          <PrimaryButton
            onClick={handleVerify}
            variant="primary"
            leftIcon={<Check className="w-5 h-5" />}
            className="hover:scale-105"
          >
            Vérifier
          </PrimaryButton>
          
          <PrimaryButton
            onClick={handleReset}
            variant="secondary"
            leftIcon={<RotateCcw className="w-5 h-5" />}
            className="hover:scale-105"
          >
            Réinitialiser
          </PrimaryButton>
        </div>

        {/* Available Digits */}
        <div>
          <p className="text-sm text-gray-700 mb-2 text-center font-medium">
            {selectedDigit 
              ? '👆 Cliquez sur une lettre pour assigner' 
              : '✋ Glissez-déposez un chiffre sur une lettre'
            }
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {availableDigits.map(digit => {
              const isSelected = selectedDigit === digit;
              const isUsed = usedDigits.has(digit);
              
              return (
                <div
                  key={digit}
                  draggable={!isUsed}
                  onDragStart={() => handleDragStart(digit)}
                  onClick={() => !isUsed && handleDigitClick(digit)}
                  className={`
                    w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0
                    text-2xl font-mono transition-all duration-300
                    ${
                      isUsed
                        ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-xl scale-110'
                        : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-800 hover:border-purple-400 hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer cursor-move'
                    }
                  `}
                >
                  {digit}
                </div>
              );
            })}
          </div>
        </div>
      </div>}

      {showHints && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl md:rounded-2xl p-4 md:p-5 text-center text-blue-900 shadow-lg animate-fade-in mx-2">
          <p className="mb-2 text-sm md:text-base font-medium">
            💡 Astuces :
          </p>
          <ul className="text-xs md:text-sm space-y-1 text-left max-w-2xl mx-auto">
            <li>• Les lettres en début de mot ne peuvent pas être 0</li>
            <li className="hidden md:list-item">• Cliquez sur une valeur possible pour l'éliminer manuellement (comme les drapeaux du démineur)</li>
            <li className="md:hidden">• Cliquez sur une valeur possible pour l'éliminer</li>
            <li>• Cliquez sur un chiffre pour voir où il peut aller</li>
            {easyMode && <li>• En mode facile, les mauvaises décisions sont bloquées</li>}
          </ul>
        </div>
      )}
      
      {/* Spacer fantôme - caché par le panneau fixe mais permet le scroll */}
      {mobileControlsSpacer}
      
      {/* Mobile controls - Fixed at bottom */}
      {mobileControls}
    </div>
  );
}