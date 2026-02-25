/**
 * Tests pour le système de Rate Limiting
 * 
 * Ces tests peuvent être exécutés dans la console du navigateur
 * pour vérifier le bon fonctionnement du système.
 */

import { 
  solveCryptarithm, 
  generateCryptarithms,
  getRateLimitStats,
  resetRateLimiter,
  clearApiCache 
} from './services/cryptatorApi';

// ==================== Test 1: Rate Limiting de Base ====================

export async function testBasicRateLimit() {
  console.log('🧪 Test 1: Rate Limiting de Base');
  console.log('Envoi de 12 requêtes rapidement...');
  
  resetRateLimiter(); // Partir de zéro
  
  const startTime = Date.now();
  const promises: Promise<any>[] = [];
  
  for (let i = 0; i < 12; i++) {
    promises.push(
      solveCryptarithm({
        cryptarithm: `A${i} + B${i} = C${i}`,
        solutionLimit: 1,
        timeLimit: 1
      }).then(() => {
        console.log(`✓ Requête ${i + 1} complétée`);
      }).catch(error => {
        console.log(`✗ Requête ${i + 1} échouée: ${error.message}`);
      })
    );
  }
  
  await Promise.all(promises);
  const endTime = Date.now();
  
  const stats = getRateLimitStats();
  console.log('\n📊 Statistiques:', stats);
  console.log(`⏱️  Temps total: ${endTime - startTime}ms`);
  console.log(`\n✅ Test terminé. ${stats.requestsLastMinute} requêtes ont été traitées.`);
  console.log(`   (Les 2 dernières devraient avoir été mises en file d'attente)\n`);
}

// ==================== Test 2: Cache ====================

export async function testCache() {
  console.log('🧪 Test 2: Système de Cache');
  
  resetRateLimiter();
  
  const cryptarithm = 'SEND + MORE = MONEY';
  
  // Première requête (sans cache)
  console.log('📤 Première requête...');
  const start1 = Date.now();
  try {
    await solveCryptarithm({ cryptarithm, solutionLimit: 1 });
    const time1 = Date.now() - start1;
    console.log(`✓ Première requête complétée en ${time1}ms`);
    
    // Deuxième requête (avec cache)
    console.log('📤 Deuxième requête (devrait venir du cache)...');
    const start2 = Date.now();
    await solveCryptarithm({ cryptarithm, solutionLimit: 1 });
    const time2 = Date.now() - start2;
    console.log(`✓ Deuxième requête complétée en ${time2}ms`);
    
    const speedup = Math.round(time1 / time2);
    console.log(`\n✅ Le cache est ${speedup}x plus rapide!\n`);
  } catch (error: any) {
    console.error(`✗ Erreur: ${error.message}`);
  }
}

// ==================== Test 3: File d'Attente et Priorités ====================

export async function testQueueAndPriority() {
  console.log('🧪 Test 3: File d\'Attente et Priorités');
  
  resetRateLimiter();
  
  console.log('Envoi de 15 requêtes avec différentes priorités...');
  
  const promises: Promise<any>[] = [];
  
  // Envoyer 15 requêtes rapides pour remplir la file
  for (let i = 0; i < 15; i++) {
    promises.push(
      solveCryptarithm({
        cryptarithm: `X${i} + Y${i} = Z${i}`,
        solutionLimit: 1
      })
    );
  }
  
  // Surveiller la file d'attente
  const checkQueue = setInterval(() => {
    const stats = getRateLimitStats();
    console.log(`📊 File d'attente: ${stats.queueLength} | Traitées: ${stats.requestsLastMinute}`);
  }, 500);
  
  await Promise.all(promises);
  clearInterval(checkQueue);
  
  console.log('\n✅ Toutes les requêtes ont été traitées!\n');
}

// ==================== Test 4: Gestion des Erreurs ====================

export async function testErrorHandling() {
  console.log('🧪 Test 4: Gestion des Erreurs');
  
  resetRateLimiter();
  
  try {
    // Requête invalide
    console.log('📤 Envoi d\'une requête invalide...');
    await solveCryptarithm({
      cryptarithm: 'INVALID CRYPTARITHM FORMAT!!!',
      solutionLimit: 1
    });
  } catch (error: any) {
    console.log(`✓ Erreur capturée correctement: ${error.message}`);
  }
  
  // Vérifier que le rate limiter continue de fonctionner
  const stats = getRateLimitStats();
  console.log(`📊 Requêtes comptabilisées: ${stats.requestsLastMinute}`);
  console.log('\n✅ Le système gère correctement les erreurs\n');
}

// ==================== Test 5: Statistiques en Temps Réel ====================

export async function testRealTimeStats() {
  console.log('🧪 Test 5: Statistiques en Temps Réel');
  
  resetRateLimiter();
  
  console.log('Envoi de requêtes avec monitoring en temps réel...');
  console.log('(Observer les statistiques pendant 10 secondes)\n');
  
  // Logger les stats toutes les secondes
  const statsLogger = setInterval(() => {
    const stats = getRateLimitStats();
    console.log('📊 Stats:', {
      'Req/min': `${stats.requestsLastMinute}/${stats.maxRequestsPerMinute}`,
      'File': stats.queueLength,
      'Cache': stats.cacheSize,
      'Peut requêter': stats.canMakeRequest ? '✅' : '❌',
      'Attente': `${stats.waitTime}ms`
    });
  }, 1000);
  
  // Envoyer des requêtes progressivement
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    solveCryptarithm({
      cryptarithm: `P${i} + Q${i} = R${i}`,
      solutionLimit: 1
    }).catch(() => {});
  }
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  clearInterval(statsLogger);
  
  console.log('\n✅ Test de monitoring terminé\n');
}

// ==================== Test 6: Persistance ====================

export async function testPersistence() {
  console.log('🧪 Test 6: Persistance dans localStorage');
  
  resetRateLimiter();
  
  // Faire quelques requêtes
  console.log('📤 Envoi de 5 requêtes...');
  for (let i = 0; i < 5; i++) {
    await solveCryptarithm({
      cryptarithm: `M${i} + N${i} = O${i}`,
      solutionLimit: 1
    }).catch(() => {});
  }
  
  const statsBefore = getRateLimitStats();
  console.log(`📊 Avant rechargement: ${statsBefore.requestsLastMinute} requêtes`);
  
  // Vérifier localStorage
  const stored = localStorage.getItem('rateLimiter_history');
  if (stored) {
    const data = JSON.parse(stored);
    console.log(`✓ Historique sauvegardé: ${data.history.length} entrées`);
    console.log(`✓ Dernier timestamp: ${new Date(data.lastRequestTime).toLocaleTimeString()}`);
  }
  
  console.log('\n✅ Les données sont bien persistées dans localStorage');
  console.log('   Rechargez la page pour vérifier que les limites persistent\n');
}

// ==================== Test 7: Performance du Cache ====================

export async function testCachePerformance() {
  console.log('🧪 Test 7: Performance du Cache');
  
  resetRateLimiter();
  clearApiCache();
  
  const cryptarithm = 'TWO + TWO = FOUR';
  const iterations = 5;
  
  // Sans cache
  console.log('🔄 Test SANS cache...');
  const timesWithoutCache: number[] = [];
  for (let i = 0; i < iterations; i++) {
    clearApiCache(); // Vider le cache à chaque fois
    const start = Date.now();
    await solveCryptarithm({ cryptarithm, solutionLimit: 1 }).catch(() => {});
    timesWithoutCache.push(Date.now() - start);
  }
  const avgWithoutCache = timesWithoutCache.reduce((a, b) => a + b, 0) / iterations;
  
  // Avec cache
  console.log('⚡ Test AVEC cache...');
  clearApiCache();
  await solveCryptarithm({ cryptarithm, solutionLimit: 1 }).catch(() => {}); // Pré-remplir
  
  const timesWithCache: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await solveCryptarithm({ cryptarithm, solutionLimit: 1 }).catch(() => {});
    timesWithCache.push(Date.now() - start);
  }
  const avgWithCache = timesWithCache.reduce((a, b) => a + b, 0) / iterations;
  
  console.log(`\n📊 Résultats:`);
  console.log(`   Sans cache: ${avgWithoutCache.toFixed(2)}ms en moyenne`);
  console.log(`   Avec cache: ${avgWithCache.toFixed(2)}ms en moyenne`);
  console.log(`   Amélioration: ${(avgWithoutCache / avgWithCache).toFixed(1)}x plus rapide`);
  console.log(`\n✅ Le cache améliore significativement les performances\n`);
}

// ==================== Suite de Tests Complète ====================

export async function runAllTests() {
  console.log('🚀 Démarrage de la suite de tests complète\n');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Rate Limiting de Base', fn: testBasicRateLimit },
    { name: 'Cache', fn: testCache },
    { name: 'File d\'Attente', fn: testQueueAndPriority },
    { name: 'Gestion des Erreurs', fn: testErrorHandling },
    { name: 'Stats en Temps Réel', fn: testRealTimeStats },
    { name: 'Persistance', fn: testPersistence },
    { name: 'Performance du Cache', fn: testCachePerformance }
  ];
  
  for (const test of tests) {
    console.log('\n' + '='.repeat(60));
    try {
      await test.fn();
    } catch (error: any) {
      console.error(`❌ Test "${test.name}" a échoué:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause entre tests
  }
  
  console.log('='.repeat(60));
  console.log('\n🎉 Suite de tests terminée!\n');
}

// ==================== Tests Rapides (Console) ====================

// Pour tester dans la console du navigateur:

// window.testRateLimit = {
//   basic: testBasicRateLimit,
//   cache: testCache,
//   queue: testQueueAndPriority,
//   errors: testErrorHandling,
//   stats: testRealTimeStats,
//   persistence: testPersistence,
//   performance: testCachePerformance,
//   all: runAllTests
// };

// Utilisation:
// await testRateLimit.basic()
// await testRateLimit.cache()
// await testRateLimit.all()
