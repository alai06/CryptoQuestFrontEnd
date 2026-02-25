interface SolverResult {
  solution: Record<string, number> | null;
  solutions: Array<Record<string, number>>;
  steps: string[];
}

// Cache for solver results to optimize performance
interface GameState {
  equation: string;
  assignments: Record<string, number>;
  lastSolved: number;
  cachedConstraints?: LetterConstraints;
}

interface LetterConstraints {
  letter: string;
  possibleValues: number[];
  impossibleValues: number[];
  reason: string;
}

interface DigitConstraints {
  digit: number;
  possibleLetters: string[];
  impossibleLetters: string[];
}

let gameStateCache: GameState | null = null;

// Get cached game state or create new one
export function getGameState(equation: string, assignments: Record<string, number>): GameState {
  if (gameStateCache && gameStateCache.equation === equation) {
    return gameStateCache;
  }
  
  const newState: GameState = {
    equation,
    assignments,
    lastSolved: Date.now(),
  };
  
  gameStateCache = newState;
  return newState;
}

// Clear game state cache
export function clearGameStateCache() {
  gameStateCache = null;
}

// Get constraints for a specific letter
export function getLetterConstraints(equation: string, letter: string, currentAssignments: Record<string, number>): LetterConstraints {
  // Extract all words, handling compound equations (&&, ;)
  // Only multi-character words have the no-leading-zero constraint
  const allWords: string[] = [];
  const subEquations = equation.split(/\s*(?:&&|;)\s*/).filter(e => e.length > 0);
  subEquations.forEach(subEq => {
    const words = subEq.replace(/\s/g, '').match(/[A-Z]+/g) || [];
    allWords.push(...words);
  });

  const isFirstLetter = allWords.some(word => word.length > 1 && word[0] === letter);

  // Get used digits
  const usedDigits = new Set(Object.values(currentAssignments));

  // Calculate possible values
  const possibleValues: number[] = [];
  const impossibleValues: number[] = [];

  for (let digit = 0; digit <= 9; digit++) {
    if (usedDigits.has(digit)) {
      impossibleValues.push(digit);
    } else if (digit === 0 && isFirstLetter) {
      impossibleValues.push(digit);
    } else {
      possibleValues.push(digit);
    }
  }

  let reason = '';
  if (isFirstLetter) {
    reason = `${letter} est en début de mot, donc ne peut pas être 0`;
  }

  return {
    letter,
    possibleValues,
    impossibleValues,
    reason,
  };
}

// Get constraints for a specific digit
export function getDigitConstraints(equation: string, digit: number, currentAssignments: Record<string, number>): DigitConstraints {
  const letters = Array.from(new Set(equation.match(/[A-Z]/g) || []));

  // Extract first letters of multi-character words, handling compound equations (&&, ;)
  // Only multi-character words have the no-leading-zero constraint
  const firstLetters = new Set<string>();
  const subEquations = equation.split(/\s*(?:&&|;)\s*/).filter(e => e.length > 0);
  subEquations.forEach(subEq => {
    const words = subEq.replace(/\s/g, '').match(/[A-Z]+/g) || [];
    words.forEach(word => {
      if (word.length > 1) {
        firstLetters.add(word[0]);
      }
    });
  });

  // Get assigned letters
  const assignedLetters = new Set(Object.keys(currentAssignments));

  const possibleLetters: string[] = [];
  const impossibleLetters: string[] = [];

  for (const letter of letters) {
    if (assignedLetters.has(letter)) {
      impossibleLetters.push(letter);
    } else if (digit === 0 && firstLetters.has(letter)) {
      impossibleLetters.push(letter);
    } else {
      possibleLetters.push(letter);
    }
  }

  return {
    digit,
    possibleLetters,
    impossibleLetters,
  };
}

// Get hint by excluding impossible values for a letter
export function getHintForLetter(equation: string, letter: string, currentAssignments: Record<string, number>): string {
  const constraints = getLetterConstraints(equation, letter, currentAssignments);
  
  if (constraints.impossibleValues.length === 0) {
    return `${letter} peut être n'importe quel chiffre de 0 à 9`;
  }
  
  const hint = `${letter} ne peut PAS être : ${constraints.impossibleValues.join(', ')}`;
  if (constraints.reason) {
    return `${hint} (${constraints.reason})`;
  }
  
  return hint;
}

// Check if an assignment is valid in easy mode (block obviously wrong moves)
export function isValidEasyModeAssignment(
  equation: string,
  letter: string,
  digit: number,
  currentAssignments: Record<string, number>
): { valid: boolean; reason?: string } {
  const constraints = getLetterConstraints(equation, letter, currentAssignments);
  
  if (constraints.impossibleValues.includes(digit)) {
    if (digit === 0 && constraints.reason.includes('début de mot')) {
      return { valid: false, reason: `${letter} est en début de mot et ne peut pas être 0` };
    }
    return { valid: false, reason: `Ce chiffre est déjà utilisé` };
  }
  
  return { valid: true };
}

export function solveCryptarithm(equation: string): SolverResult {
  const steps: string[] = [];
  
  // Parse the equation
  const parts = equation.replace(/\s/g, '').split(/[+=]/);
  if (parts.length < 3) {
    return { solution: null, solutions: [], steps: ['Équation invalide'] };
  }

  const operands = parts.slice(0, -1);
  const result = parts[parts.length - 1];

  // Get all unique letters
  const letters = Array.from(new Set(equation.match(/[A-Z]/g) || []));
  
  steps.push(`Lettres identifiées : ${letters.join(', ')}`);
  steps.push(`Nombre de lettres uniques : ${letters.length}`);

  if (letters.length > 10) {
    return { solution: null, solutions: [], steps: [...steps, 'Trop de lettres uniques (max 10)'] };
  }

  // Get first letters (cannot be 0)
  const firstLetters = new Set<string>();
  [...operands, result].forEach(word => {
    if (word.length > 0) {
      firstLetters.add(word[0]);
    }
  });

  steps.push(`Lettres ne pouvant être 0 : ${Array.from(firstLetters).join(', ')}`);

  // Try to solve with backtracking
  const assignment: Record<string, number> = {};
  const usedDigits = new Set<number>();

  function evaluate(word: string): number {
    let value = 0;
    for (const char of word) {
      if (assignment[char] === undefined) return -1;
      value = value * 10 + assignment[char];
    }
    return value;
  }

  function isValid(): boolean {
    // Check if all operands can be evaluated
    for (const operand of operands) {
      if (evaluate(operand) === -1) return true; // Not all assigned yet
    }
    
    if (evaluate(result) === -1) return true; // Result not assigned yet

    // Calculate sum
    const sum = operands.reduce((acc, operand) => acc + evaluate(operand), 0);
    const resultValue = evaluate(result);

    return sum === resultValue;
  }

  function solveAll(index: number): void {
    if (index === letters.length) {
      if (isValid()) {
        // Store a copy of the current assignment
        allSolutions.push({ ...assignment });
      }
      return;
    }

    const letter = letters[index];
    const startDigit = firstLetters.has(letter) ? 1 : 0;

    for (let digit = startDigit; digit <= 9; digit++) {
      if (!usedDigits.has(digit)) {
        assignment[letter] = digit;
        usedDigits.add(digit);

        solveAll(index + 1);

        delete assignment[letter];
        usedDigits.delete(digit);
      }
    }
  }

  steps.push('Début de la résolution par backtracking...');
  
  // Collect all solutions
  const allSolutions: Array<Record<string, number>> = [];

  solveAll(0);
  
  if (allSolutions.length > 0) {
    steps.push(`${allSolutions.length} solution(s) trouvée(s) !`);
    steps.push(`Vérification première solution : ${operands.map(op => {
      let val = 0;
      for (const c of op) val = val * 10 + allSolutions[0][c];
      return val;
    }).join(' + ')} = ${(() => {
      let val = 0;
      for (const c of result) val = val * 10 + allSolutions[0][c];
      return val;
    })()}`);
    return { solution: allSolutions[0], solutions: allSolutions, steps };
  }

  return { solution: null, solutions: [], steps: [...steps, 'Aucune solution trouvée'] };
}

/**
 * Validate if a given assignment satisfies the cryptarithm equation
 * @param equation - The cryptarithm equation (e.g., "A + A = B")
 * @param assignments - The letter-to-digit assignments (e.g., { A: '1', B: '2' })
 * @returns true if the equation is mathematically correct with the given assignments
 */
export function validateSolution(equation: string, assignments: Record<string, string>): boolean {
  // Split into sub-equations for compound equations (&&, ;)
  const subEquations = equation.split(/\s*(?:&&|;)\s*/).filter(e => e.length > 0);

  // Convert assignments to numbers
  const numAssignments: Record<string, number> = {};
  for (const [letter, digit] of Object.entries(assignments)) {
    numAssignments[letter] = Number(digit);
  }

  // Get all letters used in this equation
  const allLetters = Array.from(new Set(equation.match(/[A-Z]/g) || []));

  // Check if all letters are assigned
  for (const letter of allLetters) {
    if (numAssignments[letter] === undefined) {
      return false; // Not all letters assigned
    }
  }

  // Check for duplicate digits across all letters in the equation
  const usedDigitsInEq: Record<number, string> = {};
  for (const letter of allLetters) {
    const digit = numAssignments[letter];
    if (usedDigitsInEq[digit] !== undefined) {
      return false; // Duplicate use of a digit
    }
    usedDigitsInEq[digit] = letter;
  }

  // Evaluate function
  function evaluate(word: string): number {
    let value = 0;
    for (const char of word) {
      if (numAssignments[char] === undefined) return -1;
      value = value * 10 + numAssignments[char];
    }
    return value;
  }

  // Validate each sub-equation arithmetically
  for (const subEq of subEquations) {
    const parts = subEq.replace(/\s/g, '').split(/[+=]/);
    if (parts.length < 2) continue;
    const operands = parts.slice(0, -1);
    const result = parts[parts.length - 1];

    // Check leading zeros (only multi-char words)
    const allWords = [...operands, result];
    for (const word of allWords) {
      if (word.length > 1 && numAssignments[word[0]] === 0) {
        return false; // Leading zero not allowed
      }
    }

    // Sum of operands must equal result
    const sum = operands.reduce((acc, operand) => acc + evaluate(operand), 0);
    const resultValue = evaluate(result);
    if (sum !== resultValue) {
      return false;
    }
  }

  return true;
}

export function generateCryptarithm(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'crossed' | 'long-multiplication',
  numTerms: number,
  difficulty: 'easy' | 'medium' | 'hard',
  customWords?: string[]
): string {
  // Word pools for different difficulties
  const easyWords = ['A', 'AB', 'ABC', 'CAT', 'DOG', 'FOX', 'BAT'];
  const mediumWords = ['TWO', 'SIX', 'TEN', 'ONE', 'FIVE', 'NINE', 'FOUR', 'SEVEN'];
  const hardWords = ['SEND', 'MORE', 'MONEY', 'HAPPY', 'GREAT', 'WORLD'];

  let wordPool: string[];
  
  // Use custom words if provided, otherwise use default pools
  if (customWords && customWords.length > 0) {
    wordPool = customWords;
  } else {
    switch (difficulty) {
      case 'easy':
        wordPool = easyWords;
        break;
      case 'medium':
        wordPool = mediumWords;
        break;
      case 'hard':
        wordPool = hardWords;
        break;
    }
  }

  // Handle crossed cryptarithm (grid format)
  if (operation === 'crossed') {
    // Generate a 3x3 grid where each row and column forms an equation
    // Format: "A + B = C | D + E = F | G + H = I"
    // This means:
    // Row 1: A + B = C
    // Row 2: D + E = F  
    // Row 3: G + H = I
    // Col 1: A + D = G
    // Col 2: B + E = H
    // Col 3: C + F = I
    
    if (difficulty === 'easy') {
      return 'A + B = C | D + E = F | G + H = I';
    } else if (difficulty === 'medium') {
      return 'A + B = C | D + E = F | G + H = I';
    } else {
      return 'AB + CD = EF | GH + IJ = KL | MN + OP = QR';
    }
  }

  // Handle long multiplication with detailed steps
  if (operation === 'long-multiplication') {
    // Generate format showing partial products
    // Example:   ABC
    //          ×  DE
    //          ----
    //          FGHI  (ABC × E)
    //        JKLM   (ABC × D)
    //        ------
    //        NOPQR
    
    const multiplicand = difficulty === 'easy' ? 'AB' : difficulty === 'medium' ? 'ABC' : 'ABC';
    const multiplier = difficulty === 'easy' ? 'C' : difficulty === 'medium' ? 'DE' : 'DE';
    
    if (difficulty === 'easy') {
      return `${multiplicand} × ${multiplier} = FGH`;
    } else {
      const partial1 = difficulty === 'medium' ? 'FGHI' : 'FGHI';
      const partial2 = difficulty === 'medium' ? 'JKLM' : 'JKLM';
      const finalResult = difficulty === 'medium' ? 'NOPQR' : 'NOPQRS';
      return `${multiplicand} × ${multiplier} | ${partial1} + ${partial2} = ${finalResult}`;
    }
  }

  // Original logic for other operations
  // Generate random cryptarithm
  const selectedWords: string[] = [];
  for (let i = 0; i < numTerms; i++) {
    const word = wordPool[Math.floor(Math.random() * wordPool.length)];
    selectedWords.push(word);
  }

  // Result word should be longer for addition
  const resultWord = operation === 'addition' 
    ? hardWords[Math.floor(Math.random() * hardWords.length)]
    : mediumWords[Math.floor(Math.random() * mediumWords.length)];

  const operatorSymbol = operation === 'addition' ? '+' : operation === 'subtraction' ? '-' : '×';
  
  return `${selectedWords.join(` ${operatorSymbol} `)} = ${resultWord}`;
}