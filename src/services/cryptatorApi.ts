/**
 * Cryptator API Service
 * Handles communication with the external cryptator-api server
 * API URL is configured via VITE_API_URL environment variable
 * Falls back to http://localhost:8090 for local development
 */

import { rateLimiter, createCacheKey } from './rateLimiter';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api/v1';

// ==================== Type Definitions ====================

// Types acceptés par le backend
export type SolverType = 'SCALAR' | 'BIGNUM' | 'CRYPT' | 'ADAPT' | 'ADAPTC';
export type RightMemberType = 'FREE' | 'UNIQUE' | 'FIXED';

export interface Solution {
    assignment: string;
    evaluation: string;
    valid: boolean;
}

export interface SolveRequest {
    cryptarithm: string;
    taskId?: string;
    solverType?: SolverType;
    solutionLimit?: number;
    timeLimit?: number;
    arithmeticBase?: number;
    checkSolution?: boolean;
    exportGraphviz?: boolean;
    allowLeadingZeros?: boolean;
    hornerScheme?: boolean;
    assignments?: Record<string, number>;
}

export interface SolveResponse {
    success: boolean;
    cryptarithm: string;
    solutions: Solution[];
    solutionCount: number;
    executionTimeMs: number;
    error?: string;
    taskId?: string;
}

export interface GeneratedCryptarithm {
    cryptarithm: string;
    solution: string;
}

export interface GenerateRequest {
    words: string[];
    taskId?: string;
    operatorSymbol?: string;
    solutionLimit?: number;
    timeLimit?: number;
    shuffle?: boolean;
    countryCode?: string;
    langCode?: string;
    lowerBound?: number;
    upperBound?: number;
    dryRun?: boolean;
    rightMemberType?: RightMemberType;
    minWords?: number;
    maxWords?: number;
    lightPropagation?: boolean;
    threads?: number;
    crossGridSize?: number;
    allowLeadingZeros?: boolean;
}

export interface GenerateResponse {
    success: boolean;
    cryptarithms: GeneratedCryptarithm[];
    executionTimeMs: number;
    error?: string;
    taskId?: string;
}

// ==================== Configuration ====================

const MAX_SOLUTIONS_PER_REQUEST = 10;
const MAX_TIME_LIMIT = 120; // 2 minutes max

// ==================== API Functions ====================

/**
 * Solve a cryptarithm using the external API
 * @param request - Solve request parameters
 * @returns Promise with solve response
 * @throws Error if API is unreachable or returns an error
 */
export async function solveCryptarithm(request: SolveRequest): Promise<SolveResponse> {
    // Validation des limites
    if (request.solutionLimit && request.solutionLimit > MAX_SOLUTIONS_PER_REQUEST) {
        throw new Error(`Limite de solutions dépassée. Maximum: ${MAX_SOLUTIONS_PER_REQUEST} solutions par requête.`);
    }
    if (request.timeLimit && request.timeLimit > MAX_TIME_LIMIT) {
        throw new Error(`Limite de temps dépassée. Maximum: ${MAX_TIME_LIMIT} secondes par requête.`);
    }
    const endpoint = '/cryptator/solve';
    const cacheKey = createCacheKey(endpoint, request);

    return rateLimiter.execute(
        async () => {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cryptarithm: request.cryptarithm,
                        taskId: request.taskId,
                        solverType: request.solverType || 'SCALAR',
                        solutionLimit: request.solutionLimit ?? 0,
                        timeLimit: request.timeLimit ?? 0,
                        arithmeticBase: request.arithmeticBase ?? 10,
                        checkSolution: request.checkSolution ?? false,
                        exportGraphviz: request.exportGraphviz ?? false,
                        allowLeadingZeros: request.allowLeadingZeros ?? false,
                        hornerScheme: request.hornerScheme ?? false,
                        assignments: request.assignments,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
                }

                const data: SolveResponse = await response.json();
                return data;
            } catch (error) {
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    throw new Error(
                        "Impossible de se connecter à l'API. Assurez-vous que le serveur cryptator-api est démarré sur le port 8090."
                    );
                }
                throw error;
            }
        },
        endpoint,
        cacheKey
    );
}

/**
 * Generate cryptarithms from a list of words using the external API
 * @param request - Generate request parameters
 * @returns Promise with generate response
 * @throws Error if API is unreachable or returns an error
 */
export async function generateCryptarithms(request: GenerateRequest): Promise<GenerateResponse> {
    // Validation des limites
    if (request.solutionLimit && request.solutionLimit > MAX_SOLUTIONS_PER_REQUEST) {
        throw new Error(`Limite de génération dépassée. Maximum: ${MAX_SOLUTIONS_PER_REQUEST} cryptarithmes par requête.`);
    }
    if (request.timeLimit && request.timeLimit > MAX_TIME_LIMIT) {
        throw new Error(`Limite de temps dépassée. Maximum: ${MAX_TIME_LIMIT} secondes par requête.`);
    }
    const endpoint = '/cryptagen/generate';
    const cacheKey = createCacheKey(endpoint, request);

    return rateLimiter.execute(
        async () => {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        words: request.words,
                        taskId: request.taskId,
                        operatorSymbol: request.operatorSymbol || '+',
                        solutionLimit: request.solutionLimit ?? 5,
                        timeLimit: request.timeLimit ?? 60,
                        shuffle: request.shuffle ?? false,
                        countryCode: request.countryCode,
                        langCode: request.langCode,
                        lowerBound: request.lowerBound,
                        upperBound: request.upperBound,
                        dryRun: request.dryRun ?? false,
                        rightMemberType: request.rightMemberType || 'UNIQUE',
                        minWords: request.minWords,
                        maxWords: request.maxWords,
                        lightPropagation: request.lightPropagation ?? false,
                        threads: request.threads ?? 1,
                        crossGridSize: request.crossGridSize,
                        allowLeadingZeros: request.allowLeadingZeros ?? false,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
                }

                const data: GenerateResponse = await response.json();
                return data;
            } catch (error) {
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    throw new Error(
                        "Impossible de se connecter à l'API. Assurez-vous que le serveur cryptator-api est démarré sur le port 8090."
                    );
                }
                throw error;
            }
        },
        endpoint,
        cacheKey,
        1 // Priorité plus haute pour la génération
    );
}

/**
 * Cancel a running task by its ID
 * @param taskId - The task ID to cancel
 */
export async function cancelTask(taskId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.success === true;
    } catch {
        return false;
    }
}

/**
 * Check if the cryptator API is running
 * @returns Promise<boolean> - true if API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/cryptator/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ==================== Rate Limiting Functions ====================

/**
 * Get current rate limiting statistics
 */
export function getRateLimitStats() {
    return rateLimiter.getUsageStats();
}

/**
 * Reset rate limiter (clears history and cache)
 */
export function resetRateLimiter() {
    rateLimiter.reset();
}

/**
 * Clear only the cache
 */
export function clearApiCache() {
    rateLimiter.clearCache();
}

/**
 * Get API limits
 */
export function getApiLimits() {
    return {
        maxSolutionsPerRequest: MAX_SOLUTIONS_PER_REQUEST,
        maxTimeLimit: MAX_TIME_LIMIT,
    };
}

/**
 * Export the rate limiter instance for advanced usage
 */
export { rateLimiter };
