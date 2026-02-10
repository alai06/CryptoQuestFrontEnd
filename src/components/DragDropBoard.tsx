import { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getLetterConstraints, getDigitConstraints, getHintForLetter, isValidEasyModeAssignment, getGameState } from '../utils/cryptarithmSolver';

interface DragDropBoardProps {
  equation: string;
  solution: Record<string, string>;
  onSolved?: () => void;
  showHints?: boolean;
  easyMode?: boolean;
  showConstraints?: boolean;
}

export default function DragDropBoard({ equation, solution, onSolved, showHints = false, easyMode = false, showConstraints = false }: DragDropBoardProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [letterDomains, setLetterDomains] = useState<Record<string, Set<number>>>({});
  const [verifiedLetters, setVerifiedLetters] = useState<Record<string, 'correct' | 'incorrect' | null>>({});
  const [draggedDigit, setDraggedDigit] = useState<string | null>(null);
  const [usedDigits, setUsedDigits] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightedLetters, setHighlightedLetters] = useState<Set<string>>(new Set());

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

  const checkSolution = () => {
    if (Object.keys(assignments).length !== letters.length) {
      setFeedback(null);
      return;
    }

    const isCorrect = letters.every(letter => assignments[letter] === solution[letter]);
    
    if (isCorrect) {
      setFeedback('correct');
      if (onSolved) {
        setTimeout(() => onSolved(), 500);
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
    
    // Show constraints for this letter
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const hint = getHintForLetter(equation, letter, numAssignments);
    setHintMessage(hint);
  };

  const toggleLetterExpansion = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleLetterClick
    const newExpanded = new Set(expandedLetters);
    if (newExpanded.has(letter)) {
      newExpanded.delete(letter);
    } else {
      newExpanded.add(letter);
    }
    setExpandedLetters(newExpanded);
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

  const getLetterConstraintsInfo = (letter: string) => {
    if (!showConstraints) return null;
    
    const numAssignments = Object.fromEntries(
      Object.entries(assignments).map(([k, v]) => [k, Number(v)])
    );
    const constraints = getLetterConstraints(equation, letter, numAssignments);
    
    return constraints;
  };

  const renderEquation = () => {
    return equation.split('').map((char, index) => {
      if (/[A-Z]/.test(char)) {
        const hasAssignment = assignments[char];
        const isHighlighted = highlightedLetters.has(char);
        
        return (
          <span
            key={index}
            className={`inline-block relative transition-all duration-300 ${
              isHighlighted ? 'scale-110' : ''
            }`}
          >
            <span className={`text-3xl text-gray-800 font-mono ${
              isHighlighted ? 'text-purple-600 animate-pulse' : ''
            }`}>
              {char}
            </span>
            {hasAssignment && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl text-purple-600 font-mono animate-fade-in">
                {hasAssignment}
              </span>
            )}
          </span>
        );
      }
      return (
        <span key={index} className="text-3xl text-gray-800 font-mono">
          {char}
        </span>
      );
    });
  };

  const handleVerify = () => {
    if (Object.keys(assignments).length === 0) {
      setErrorMessage('Aucune attribution à vérifier');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    const newDomains = { ...letterDomains };
    const newVerified = { ...verifiedLetters };
    const newAssignments = { ...assignments };
    let correctCount = 0;
    let incorrectCount = 0;

    // Check each assignment
    Object.entries(assignments).forEach(([letter, digit]) => {
      const isCorrect = solution[letter] === digit;
      
      if (isCorrect) {
        // Mark as correct and reduce domain to only this digit
        newVerified[letter] = 'correct';
        newDomains[letter] = new Set([Number(digit)]);
        correctCount++;
      } else {
        // Mark as incorrect, remove digit from domain, and clear the assignment
        newVerified[letter] = 'incorrect';
        const domain = new Set(letterDomains[letter]);
        domain.delete(Number(digit));
        newDomains[letter] = domain;
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

    // Clear incorrect badges after showing them briefly
    setTimeout(() => {
      setVerifiedLetters(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key] === 'incorrect') {
            updated[key] = null;
          }
        });
        return updated;
      });
    }, 1500);

    setTimeout(() => setHintMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
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
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-10 text-center border border-purple-200 shadow-lg">
        <div className="mb-12">
          {renderEquation()}
        </div>
      </div>

      {/* Letter Assignment Zones */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {letters.map(letter => {
          const constraints = getLetterConstraintsInfo(letter);
          const isHighlighted = highlightedLetters.has(letter);
          const isSelected = selectedLetter === letter;
          const domain = letterDomains[letter] || new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
          const domainArray = Array.from(domain).sort((a, b) => a - b);
          const hasAssignment = !!assignments[letter];
          const verificationStatus = verifiedLetters[letter];
          
          return (
            <div
              key={letter}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(letter)}
              onClick={() => handleLetterClick(letter)}
              className={`
                relative p-6 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                ${verificationStatus === 'correct'
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg scale-105'
                  : verificationStatus === 'incorrect'
                  ? 'bg-gradient-to-br from-red-100 to-orange-100 border-red-400 shadow-lg'
                  : assignments[letter] 
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg scale-105' 
                  : isHighlighted
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 shadow-md scale-105 animate-pulse'
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

              <div className="text-center">
                <div className="text-2xl text-gray-800 mb-2">{letter}</div>
                <div className="h-10 flex items-center justify-center">
                  {assignments[letter] ? (
                    <span className={`text-3xl font-mono animate-fade-in ${
                      verificationStatus === 'correct' ? 'text-green-600' :
                      verificationStatus === 'incorrect' ? 'text-red-600' :
                      'text-purple-600'
                    }`}>
                      {assignments[letter]}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Déposez ici</span>
                  )}
                </div>
                
                {/* Domain Display */}
                {!hasAssignment && domainArray.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2 font-medium">Domaine :</div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {domainArray.map(val => (
                        <span 
                          key={val} 
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Empty Domain Warning */}
                {!hasAssignment && domainArray.length === 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="text-xs text-red-600 font-medium">Domaine vide !</div>
                  </div>
                )}
              </div>
              
              {/* Constraints Badge with Toggle Button */}
              {showConstraints && constraints && !assignments[letter] && (
                <>
                  <button
                    onClick={(e) => toggleLetterExpansion(letter, e)}
                    className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs shadow-lg transition-all duration-300 hover:scale-110 z-20"
                  >
                    {expandedLetters.has(letter) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Constraints Details - Collapsible */}
                  {expandedLetters.has(letter) && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border-2 border-blue-300 rounded-lg shadow-xl text-xs z-10 animate-fade-in">
                      <div className="mb-2">
                        <p className="text-gray-700 mb-1 font-semibold">✓ Valeurs possibles:</p>
                        <div className="flex flex-wrap gap-1">
                          {constraints.possibleValues.map(val => (
                            <span key={val} className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {constraints.impossibleValues.length > 0 && (
                        <div className="mb-2">
                          <p className="text-gray-700 mb-1 font-semibold">✗ Valeurs impossibles:</p>
                          <div className="flex flex-wrap gap-1">
                            {constraints.impossibleValues.map(val => (
                              <span key={val} className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs">
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {constraints.reason && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-gray-600 italic text-xs">{constraints.reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Available Digits */}
      <div>
        <p className="text-gray-600 mb-4 text-center">
          Glissez les chiffres vers les lettres ou cliquez pour voir les contraintes :
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
                  w-14 h-14 flex items-center justify-center rounded-xl
                  text-2xl font-mono transition-all duration-300
                  ${isUsed
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleVerify}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <Check className="w-5 h-5" />
          Vérifier
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <RotateCcw className="w-5 h-5" />
          Réinitialiser
        </button>
      </div>

      {showHints && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-5 text-center text-blue-900 shadow-lg animate-fade-in">
          <p className="mb-2">
            💡 Astuces :
          </p>
          <ul className="text-sm space-y-1">
            <li>• Les lettres en début de mot ne peuvent pas être 0</li>
            <li>• Cliquez sur une lettre pour voir ses contraintes</li>
            <li>• Cliquez sur un chiffre pour voir où il peut aller</li>
            {showConstraints && <li>• Cliquez sur les boutons ⌄/⌃ pour voir/masquer les détails des contraintes</li>}
            {easyMode && <li>• En mode facile, les mauvaises décisions sont bloquées</li>}
          </ul>
        </div>
      )}
    </div>
  );
}