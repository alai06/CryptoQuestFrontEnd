import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Clock, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { getRateLimitStats, resetRateLimiter, clearApiCache } from '../services/cryptatorApi';

interface RateLimitMonitorProps {
  className?: string;
  compact?: boolean;
}

export default function RateLimitMonitor({ className = '', compact = false }: RateLimitMonitorProps) {
  const [stats, setStats] = useState({
    requestsLastMinute: 0,
    requestsLastHour: 0,
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100,
    queueLength: 0,
    cacheSize: 0,
    canMakeRequest: true,
    waitTime: 0,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);

  useEffect(() => {
    // Mettre à jour les stats régulièrement
    const updateStats = () => {
      setStats(getRateLimitStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (!pendingReset) {
      // Premier clic : demande de confirmation inline
      setPendingReset(true);
      return;
    }
    // Deuxième clic : exécution confirmée
    setPendingReset(false);
    resetRateLimiter();
    setStats(getRateLimitStats());
  };

  const handleCancelReset = () => setPendingReset(false);

  const handleClearCache = () => {
    clearApiCache();
    setStats(getRateLimitStats());
  };

  const getStatusColor = () => {
    const minutePercentage = (stats.requestsLastMinute / stats.maxRequestsPerMinute) * 100;
    const hourPercentage = (stats.requestsLastHour / stats.maxRequestsPerHour) * 100;
    const maxPercentage = Math.max(minutePercentage, hourPercentage);

    if (maxPercentage >= 90) return 'text-red-600 bg-red-50 border-red-300';
    if (maxPercentage >= 70) return 'text-orange-600 bg-orange-50 border-orange-300';
    if (maxPercentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  const formatWaitTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
    return `${Math.ceil(ms / 60000)}min`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-colors ${getStatusColor()}`}
          title="Statistiques d'utilisation de l'API"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">
            {stats.requestsLastMinute}/{stats.maxRequestsPerMinute}
          </span>
        </button>

        {showDetails && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 z-50 min-w-[300px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Utilisation API</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière minute:</span>
                  <span className="font-medium">
                    {stats.requestsLastMinute}/{stats.maxRequestsPerMinute}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière heure:</span>
                  <span className="font-medium">
                    {stats.requestsLastHour}/{stats.maxRequestsPerHour}
                  </span>
                </div>
                {stats.queueLength > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>En attente:</span>
                    <span className="font-medium">{stats.queueLength}</span>
                  </div>
                )}
                {stats.waitTime > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Temps d'attente:</span>
                    <span className="font-medium">{formatWaitTime(stats.waitTime)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={handleClearCache}
                  className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  title="Vider le cache"
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Cache ({stats.cacheSize})
                </button>
                <button
                  onClick={handleReset}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${pendingReset ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  title={pendingReset ? 'Cliquez encore pour confirmer' : 'Réinitialiser'}
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  {pendingReset ? 'Confirmer ?' : 'Reset'}
                </button>
                {pendingReset && (
                  <button
                    onClick={handleCancelReset}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 ${getStatusColor()} p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6" />
        <h2 className="text-xl font-bold">Utilisation de l'API</h2>
      </div>

      <div className="space-y-4">
        {/* Statut actuel */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
          {stats.canMakeRequest ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Prêt à envoyer des requêtes</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-700 font-medium">
                Limite atteinte - Attente: {formatWaitTime(stats.waitTime)}
              </span>
            </>
          )}
        </div>

        {/* Requêtes par minute */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Requêtes / Minute</span>
            <span className="text-sm font-bold">
              {stats.requestsLastMinute} / {stats.maxRequestsPerMinute}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (stats.requestsLastMinute / stats.maxRequestsPerMinute) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Requêtes par heure */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Requêtes / Heure</span>
            <span className="text-sm font-bold">
              {stats.requestsLastHour} / {stats.maxRequestsPerHour}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (stats.requestsLastHour / stats.maxRequestsPerHour) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* File d'attente */}
        {stats.queueLength > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-orange-700">
              <span className="font-bold">{stats.queueLength}</span> requête(s) en attente
            </span>
          </div>
        )}

        {/* Cache */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-blue-700 text-sm">
            <span className="font-bold">{stats.cacheSize}</span> réponse(s) en cache
          </span>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Vider
          </button>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          {pendingReset ? (
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Confirmer la réinitialisation
              </button>
              <button
                onClick={handleCancelReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Réinitialiser les compteurs
            </button>
          )}
        </div>

        {/* Informations */}
        <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
          <p className="mb-1">
            <strong>Sécurité:</strong> Les requêtes sont limitées pour éviter la surcharge du serveur.
          </p>
          <p>
            <strong>Cache:</strong> Les requêtes identiques sont mises en cache pendant 1 minute.
          </p>
        </div>
      </div>
    </div>
  );
}
