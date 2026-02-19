/**
 * Exemples d'intégration du composant RateLimitMonitor
 * 
 * Ce fichier montre différentes manières d'intégrer le monitoring
 * du rate limiting dans votre application.
 */

import RateLimitMonitor from './components/RateLimitMonitor';
import { getRateLimitStats } from './services/cryptatorApi';

// ==================== Exemple 1: Dans la barre de navigation ====================

/*
import { Menu, User, Settings } from 'lucide-react';
import RateLimitMonitor from './components/RateLimitMonitor';

export function NavigationBar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <Menu className="w-6 h-6 cursor-pointer" />
        <h1 className="text-xl font-bold">CryptoQuest</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <RateLimitMonitor compact={true} />
        <Settings className="w-5 h-5 cursor-pointer" />
        <User className="w-5 h-5 cursor-pointer" />
      </div>
    </nav>
  );
}
*/

// ==================== Exemple 2: Dans une page de paramètres ====================

/*
import RateLimitMonitor from './components/RateLimitMonitor';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Profil</h2>
        {/* Paramètres de profil... *\/}
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Utilisation de l'API</h2>
        <RateLimitMonitor />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Préférences</h2>
        {/* Autres paramètres... *\/}
      </section>
    </div>
  );
}
*/

// ==================== Exemple 3: Modal d'informations ====================

/*
import { useState } from 'react';
import { Info, X } from 'lucide-react';
import RateLimitMonitor from './components/RateLimitMonitor';

export function RateLimitInfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
      >
        <Info className="w-4 h-4" />
        Voir l'utilisation API
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Utilisation de l'API</h2>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <RateLimitMonitor />
          </div>
        </div>
      )}
    </>
  );
}
*/

// ==================== Exemple 4: Intégration dans GeneratorMode ====================

/*
Dans GeneratorMode.tsx, ajoutez:

import RateLimitMonitor from './RateLimitMonitor';

// Dans le composant, avant le bouton "Générer":
<div className="mb-6">
  <RateLimitMonitor compact={true} />
</div>

// Ou en version complète dans les options avancées:
{showAdvancedOptions && (
  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
    <RateLimitMonitor />
    {/* autres options avancées... *\/}
  </div>
)}
*/

// ==================== Exemple 5: Intégration dans SolverMode ====================

/*
Dans SolverMode.tsx, ajoutez:

import RateLimitMonitor from './RateLimitMonitor';

// Afficher avant l'historique:
<div className="mb-6">
  <RateLimitMonitor compact={true} />
</div>
*/

// ==================== Exemple 6: Utiliser programmatiquement ====================

/*
import { getRateLimitStats } from './services/cryptatorApi';
import { useEffect, useState } from 'react';

export function CustomComponent() {
  const [stats, setStats] = useState(getRateLimitStats());

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getRateLimitStats();
      setStats(newStats);
      
      // Afficher un avertissement si proche de la limite
      if (newStats.requestsLastMinute >= newStats.maxRequestsPerMinute * 0.8) {
        console.warn('Proche de la limite de requêtes !');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Requêtes: {stats.requestsLastMinute}/{stats.maxRequestsPerMinute}</p>
      {!stats.canMakeRequest && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded">
          ⚠️ Limite atteinte. Veuillez patienter {Math.ceil(stats.waitTime / 1000)}s
        </div>
      )}
    </div>
  );
}
*/

// ==================== Exemple 7: Dashboard admin ====================

/*
import RateLimitMonitor from './components/RateLimitMonitor';
import { getRateLimitStats, resetRateLimiter, clearApiCache } from './services/cryptatorApi';
import { useState, useEffect } from 'react';

export function AdminDashboard() {
  const [stats, setStats] = useState(getRateLimitStats());
  const [history, setHistory] = useState<Array<{time: string, requests: number}>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getRateLimitStats();
      setStats(newStats);
      
      // Enregistrer l'historique
      setHistory(prev => [
        ...prev.slice(-59), // Garder les 60 dernières minutes
        {
          time: new Date().toLocaleTimeString(),
          requests: newStats.requestsLastMinute
        }
      ]);
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RateLimitMonitor />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Historique</h2>
          <div className="space-y-2">
            {history.map((entry, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{entry.time}</span>
                <span className="font-medium">{entry.requests} req.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={clearApiCache}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Vider le cache
        </button>
        <button
          onClick={() => {
            if (confirm('Réinitialiser ?')) resetRateLimiter();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réinitialiser tout
        </button>
      </div>
    </div>
  );
}
*/

// ==================== Exemple 8: Hook personnalisé ====================

/*
import { useState, useEffect } from 'react';
import { getRateLimitStats } from './services/cryptatorApi';

export function useRateLimitStatus() {
  const [stats, setStats] = useState(getRateLimitStats());
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getRateLimitStats();
      setStats(newStats);
      
      // Déclencher un warning à 80%
      const percentage = (newStats.requestsLastMinute / newStats.maxRequestsPerMinute) * 100;
      setWarning(percentage >= 80);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { stats, warning };
}

// Utilisation:
function MyComponent() {
  const { stats, warning } = useRateLimitStatus();
  
  return (
    <div>
      {warning && (
        <div className="bg-yellow-100 p-2 rounded">
          ⚠️ Vous approchez de la limite !
        </div>
      )}
      
      <button
        disabled={!stats.canMakeRequest}
        onClick={handleSolve}
      >
        Résoudre {!stats.canMakeRequest && `(attendre ${stats.waitTime}ms)`}
      </button>
    </div>
  );
}
*/

export {};
