/**
 * Utilitaires pour la lecture/écriture sécurisée dans localStorage.
 */

/**
 * Lit et parse une valeur JSON depuis localStorage.
 * Retourne `fallback` en cas de clé absente ou de JSON invalide.
 */
export function safeParseLocalStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Convertit la chaîne d'assignation renvoyée par l'API Cryptator en
 * un objet `{ LETTRE: valeur }`.
 *
 * Formats supportés :
 *  - Tableau à deux lignes :  " E| F| N|\n 9| 7| 1|"
 *  - Liste de paires :        "E=9, F=7, N=1"
 */
export function parseSolutionAssignment(assignment: string): Record<string, number> {
  const result: Record<string, number> = {};

  if (assignment.includes('\n')) {
    const lines = assignment.split('\n');
    if (lines.length >= 2) {
      const keys = lines[0].split('|').map((s) => s.trim()).filter(Boolean);
      const values = lines[1].split('|').map((s) => s.trim()).filter(Boolean);
      keys.forEach((key, i) => {
        if (values[i] !== undefined) {
          result[key.toUpperCase()] = parseInt(values[i], 10);
        }
      });
    }
  } else if (assignment.includes('=')) {
    assignment.split(',').forEach((pair) => {
      const [letter, digit] = pair.trim().split('=');
      if (letter && digit) {
        result[letter.toUpperCase()] = parseInt(digit, 10);
      }
    });
  }

  return result;
}

// ==================== XP & Niveaux ====================

/** XP requis pour passer du niveau `level` au niveau suivant (progression exponentielle). */
export function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/** Décompose un total d'XP en niveau courant + progression vers le niveau suivant. */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  let level = 1;
  let xpUsed = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const xpForNextLevel = calculateXPForLevel(level + 1);
    if (xpUsed + xpForNextLevel > totalXP) {
      const currentLevelXP = totalXP - xpUsed;
      const progress = (currentLevelXP / xpForNextLevel) * 100;
      return { level, currentLevelXP, nextLevelXP: xpForNextLevel, progress };
    }
    xpUsed += xpForNextLevel;
    level++;
  }
}

/**
 * Calcule le total d'XP depuis un objet `{ levelId: starCount }` sauvegardé
 * dans localStorage sous la clé `levelStars`.
 * Barème : 1★=10 · 2★=25 · 3★=50 · 4★=100
 */
export function calculateTotalXPFromStars(levelStars: Record<number, number>): number {
  const xpPerStar: Record<number, number> = { 1: 10, 2: 25, 3: 50, 4: 100 };
  return Object.values(levelStars).reduce(
    (acc, stars) => acc + (xpPerStar[stars] ?? 0),
    0
  );
}

// ==================== Parsers de solution ====================

/**
 * Variante string → string (pour la compatibilité avec les solutions
 * sauvegardées dans generatedCryptarithms).
 */
export function parseSolutionAssignmentAsStrings(assignment: string): Record<string, string> {
  const numeric = parseSolutionAssignment(assignment);
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(numeric)) {
    result[k] = String(v);
  }
  return result;
}
