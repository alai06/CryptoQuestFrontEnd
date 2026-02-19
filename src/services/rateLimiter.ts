/**
 * Rate Limiter Service
 * Protège l'API contre le bombardement de requêtes
 * Implémente des limites côté client et gère les quotas
 */

// ==================== Configuration ====================

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  minDelayBetweenRequests: number; // en ms
  maxRetries: number;
  retryDelayBase: number; // en ms pour backoff exponentiel
  cacheEnabled: boolean;
  cacheDurationMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 5,        // 5 requêtes par minute (plus strict)
  maxRequestsPerHour: 50,         // 50 requêtes par heure (plus strict)
  minDelayBetweenRequests: 2000,  // 2 secondes minimum entre requêtes
  maxRetries: 3,
  retryDelayBase: 2000,           // 2 secondes de base
  cacheEnabled: true,
  cacheDurationMs: 60000,         // 1 minute
};

// ==================== Types ====================

interface RequestRecord {
  timestamp: number;
  endpoint: string;
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
}

// ==================== Rate Limiter Class ====================

export class RateLimiter {
  private config: RateLimitConfig;
  private requestHistory: RequestRecord[] = [];
  private lastRequestTime: number = 0;
  private requestQueue: QueuedRequest<any>[] = [];
  private isProcessingQueue: boolean = false;
  private cache: Map<string, CachedResponse<any>> = new Map();

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadHistoryFromStorage();
  }

  // ==================== Public Methods ====================

  /**
   * Vérifie si une requête peut être effectuée maintenant
   */
  canMakeRequest(): boolean {
    this.cleanOldRequests();
    const now = Date.now();

    // Vérifier le délai minimum entre les requêtes
    if (now - this.lastRequestTime < this.config.minDelayBetweenRequests) {
      return false;
    }

    // Vérifier la limite par minute
    const requestsLastMinute = this.getRequestsInWindow(60000);
    if (requestsLastMinute >= this.config.maxRequestsPerMinute) {
      return false;
    }

    // Vérifier la limite par heure
    const requestsLastHour = this.getRequestsInWindow(3600000);
    if (requestsLastHour >= this.config.maxRequestsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Obtient le temps d'attente avant la prochaine requête autorisée
   */
  getWaitTime(): number {
    const now = Date.now();
    
    // Délai minimum entre requêtes
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.minDelayBetweenRequests) {
      return this.config.minDelayBetweenRequests - timeSinceLastRequest;
    }

    // Vérifier la limite par minute
    const oldestInMinute = this.findOldestInWindow(60000);
    if (oldestInMinute && this.getRequestsInWindow(60000) >= this.config.maxRequestsPerMinute) {
      return 60000 - (now - oldestInMinute);
    }

    // Vérifier la limite par heure
    const oldestInHour = this.findOldestInWindow(3600000);
    if (oldestInHour && this.getRequestsInWindow(3600000) >= this.config.maxRequestsPerHour) {
      return 3600000 - (now - oldestInHour);
    }

    return 0;
  }

  /**
   * Enregistre une requête effectuée
   */
  recordRequest(endpoint: string): void {
    const now = Date.now();
    this.requestHistory.push({
      timestamp: now,
      endpoint,
    });
    this.lastRequestTime = now;
    this.saveHistoryToStorage();
  }

  /**
   * Exécute une requête avec rate limiting
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    endpoint: string,
    cacheKey?: string,
    priority: number = 0
  ): Promise<T> {
    // Vérifier le cache si activé
    if (this.config.cacheEnabled && cacheKey) {
      const cached = this.getCached<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Vérifier si on peut faire la requête immédiatement
    if (this.canMakeRequest()) {
      return this.executeRequest(requestFn, endpoint, cacheKey);
    }

    // Sinon, mettre en file d'attente
    return this.enqueueRequest(requestFn, endpoint, cacheKey, priority);
  }

  /**
   * Obtient les statistiques d'utilisation
   */
  getUsageStats() {
    this.cleanOldRequests();
    return {
      requestsLastMinute: this.getRequestsInWindow(60000),
      requestsLastHour: this.getRequestsInWindow(3600000),
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
      maxRequestsPerHour: this.config.maxRequestsPerHour,
      queueLength: this.requestQueue.length,
      cacheSize: this.cache.size,
      canMakeRequest: this.canMakeRequest(),
      waitTime: this.getWaitTime(),
    };
  }

  /**
   * Réinitialise l'historique des requêtes
   */
  reset(): void {
    this.requestHistory = [];
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.cache.clear();
    localStorage.removeItem('rateLimiter_history');
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ==================== Private Methods ====================

  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    endpoint: string,
    cacheKey?: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      this.recordRequest(endpoint);
      const result = await requestFn();

      // Mettre en cache si activé
      if (this.config.cacheEnabled && cacheKey) {
        this.setCached(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      // Gérer les erreurs 429 (Too Many Requests) avec retry
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        if (retryCount < this.config.maxRetries) {
          const delay = this.config.retryDelayBase * Math.pow(2, retryCount);
          await this.sleep(delay);
          return this.executeRequest(requestFn, endpoint, cacheKey, retryCount + 1);
        }
      }
      throw error;
    }
  }

  private enqueueRequest<T>(
    requestFn: () => Promise<T>,
    endpoint: string,
    cacheKey?: string,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        execute: () => this.executeRequest(requestFn, endpoint, cacheKey),
        resolve,
        reject,
        priority,
      });

      // Trier par priorité (plus haute d'abord)
      this.requestQueue.sort((a, b) => b.priority - a.priority);

      // Démarrer le traitement de la file si pas déjà en cours
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Attendre si nécessaire
      const waitTime = this.getWaitTime();
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }

      // Prendre la prochaine requête
      const request = this.requestQueue.shift();
      if (!request) break;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error: any) {
        request.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheDurationMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });

    // Limiter la taille du cache à 100 entrées
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  private getRequestsInWindow(windowMs: number): number {
    const now = Date.now();
    return this.requestHistory.filter(req => now - req.timestamp < windowMs).length;
  }

  private findOldestInWindow(windowMs: number): number | null {
    const now = Date.now();
    const requestsInWindow = this.requestHistory.filter(req => now - req.timestamp < windowMs);
    if (requestsInWindow.length === 0) return null;
    return Math.min(...requestsInWindow.map(req => req.timestamp));
  }

  private cleanOldRequests(): void {
    const now = Date.now();
    // Garder seulement les requêtes de la dernière heure
    this.requestHistory = this.requestHistory.filter(req => now - req.timestamp < 3600000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem('rateLimiter_history');
      if (stored) {
        const data = JSON.parse(stored);
        this.requestHistory = data.history || [];
        this.lastRequestTime = data.lastRequestTime || 0;
        // Nettoyer les anciennes requêtes au chargement
        this.cleanOldRequests();
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de l\'historique du rate limiter:', error);
    }
  }

  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem('rateLimiter_history', JSON.stringify({
        history: this.requestHistory.slice(-100), // Garder seulement les 100 dernières
        lastRequestTime: this.lastRequestTime,
      }));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de l\'historique du rate limiter:', error);
    }
  }
}

// ==================== Singleton Instance ====================

export const rateLimiter = new RateLimiter();

// ==================== Utilitaires ====================

/**
 * Crée une clé de cache pour une requête
 */
export function createCacheKey(endpoint: string, params: any): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}
