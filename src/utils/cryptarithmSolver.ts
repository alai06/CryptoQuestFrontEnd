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

// Cache for game state
interface GameState {
  equation: string;
  assignments: Record<string, number>;
  lastSolved: number;
  cachedConstraints?: LetterConstraints;
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
