# Système de Sécurité et Rate Limiting - CryptoQuest

## Vue d'ensemble

Le système de sécurité implémenté dans CryptoQuest protège l'API Cryptator contre le bombardement de requêtes et assure une utilisation équitable des ressources.

## Fonctionnalités

### 1. Rate Limiting ⏱️

**Limites par défaut:**
- **10 requêtes par minute** maximum
- **100 requêtes par heure** maximum  
- **1 seconde** minimum entre chaque requête

Ces limites empêchent:
- Les attaques par déni de service (DoS)
- La surcharge accidentelle du serveur
- L'abus des ressources

### 2. File d'Attente Intelligente 📋

Quand les limites sont atteintes:
- Les requêtes sont automatiquement mises en file d'attente
- Traitement avec système de priorités
- Pas de perte de requêtes
- Interface transparente pour l'utilisateur

### 3. Cache des Réponses 💾

**Avantages:**
- Requêtes identiques servies depuis le cache
- Durée: 1 minute par défaut
- Réduction de la charge serveur
- Réponses instantanées

**Exemple:**
```typescript
// Première fois - appel API réel
solveCryptarithm({ cryptarithm: "SEND + MORE = MONEY" });

// Deuxième fois (dans la minute) - depuis le cache
solveCryptarithm({ cryptarithm: "SEND + MORE = MONEY" }); // Instantané!
```

### 4. Retry avec Backoff Exponentiel 🔄

En cas d'erreur 429 (Too Many Requests):
- Tentative automatique de retry
- Délai croissant: 2s, 4s, 8s...
- Maximum 3 tentatives
- Gestion gracieuse des erreurs

### 5. Persistance 💿

L'historique des requêtes est sauvegardé dans `localStorage`:
- Survit aux rechargements de page
- Limite les tentatives de contournement
- Maintient les quotas entre sessions

## Utilisation

### Pour les Développeurs

#### Import basique
```typescript
import { solveCryptarithm, generateCryptarithms } from './services/cryptatorApi';

// Le rate limiting est automatique!
const result = await solveCryptarithm({
  cryptarithm: "TWO + TWO = FOUR"
});
```

#### Vérifier les stats
```typescript
import { getRateLimitStats } from './services/cryptatorApi';

const stats = getRateLimitStats();
console.log(stats);
// {
//   requestsLastMinute: 5,
//   requestsLastHour: 23,
//   maxRequestsPerMinute: 10,
//   maxRequestsPerHour: 100,
//   queueLength: 0,
//   cacheSize: 12,
//   canMakeRequest: true,
//   waitTime: 0
// }
```

#### Actions manuelles
```typescript
import { 
  resetRateLimiter, 
  clearApiCache 
} from './services/cryptatorApi';

// Vider uniquement le cache
clearApiCache();

// Réinitialiser tout (cache + historique)
resetRateLimiter();
```

### Composant UI

Le composant `RateLimitMonitor` affiche l'utilisation en temps réel:

#### Mode Compact (barre de navigation)
```tsx
import RateLimitMonitor from './components/RateLimitMonitor';

<RateLimitMonitor compact={true} />
```

#### Mode Complet (page de paramètres)
```tsx
<RateLimitMonitor />
```

## Configuration Avancée

### Modifier les limites

Fichier: `src/services/rateLimiter.ts`

```typescript
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 10,        // Requêtes/minute
  maxRequestsPerHour: 100,         // Requêtes/heure
  minDelayBetweenRequests: 1000,   // Délai minimum (ms)
  maxRetries: 3,                   // Tentatives max
  retryDelayBase: 2000,            // Délai de base pour retry (ms)
  cacheEnabled: true,              // Activer le cache
  cacheDurationMs: 60000,          // Durée du cache (ms)
};
```

### Créer un rate limiter personnalisé

```typescript
import { RateLimiter } from './services/rateLimiter';

const customLimiter = new RateLimiter({
  maxRequestsPerMinute: 20,
  maxRequestsPerHour: 200,
  minDelayBetweenRequests: 500,
});

// Utiliser le limiter personnalisé
await customLimiter.execute(
  () => fetch('/api/endpoint'),
  '/api/endpoint',
  'cache-key'
);
```

### Système de priorités

```typescript
import { rateLimiter } from './services/cryptatorApi';

// Requête haute priorité (traitée en premier dans la file)
await rateLimiter.execute(
  requestFn,
  endpoint,
  cacheKey,
  10 // Priorité haute
);

// Requête normale
await rateLimiter.execute(
  requestFn,
  endpoint,
  cacheKey,
  0 // Priorité normale
);
```

## Gestion des Erreurs

### Erreurs courantes

#### 1. Rate Limit Exceeded
```
Erreur: Rate limit exceeded. Please wait X seconds.
```
**Solution:** Attendre le temps indiqué. Le système met automatiquement en file d'attente.

#### 2. API Unavailable
```
Erreur: Impossible de se connecter à l'API...
```
**Solution:** Vérifier que le serveur cryptator-api est démarré sur le port 8090.

#### 3. Request Timeout
```
Erreur: Request timeout
```
**Solution:** La requête a pris trop de temps. Essayer avec des paramètres plus simples.

## Monitoring

### Indicateurs à surveiller

1. **requestsLastMinute** - Doit rester < 10
2. **queueLength** - Si > 5, les utilisateurs vont attendre
3. **cacheSize** - Cache efficace si > 10
4. **waitTime** - Temps d'attente avant prochaine requête

### Alertes visuelles

Le composant `RateLimitMonitor` utilise des couleurs:
- 🟢 Vert: < 50% de la limite
- 🟡 Jaune: 50-70% de la limite
- 🟠 Orange: 70-90% de la limite
- 🔴 Rouge: > 90% de la limite

## Tests

### Test du rate limiting

```typescript
// Tester la limite par minute
for (let i = 0; i < 15; i++) {
  console.log(`Requête ${i + 1}`);
  await solveCryptarithm({ cryptarithm: "A + B = C" });
}
// Les 5 dernières seront mises en file d'attente
```

### Test du cache

```typescript
console.time('première requête');
await solveCryptarithm({ cryptarithm: "SEND + MORE = MONEY" });
console.timeEnd('première requête'); // ~500ms

console.time('deuxième requête (cache)');
await solveCryptarithm({ cryptarithm: "SEND + MORE = MONEY" });
console.timeEnd('deuxième requête (cache)'); // ~1ms
```

## Bonnes Pratiques

### ✅ À FAIRE

1. Utiliser le cache pour les requêtes répétitives
2. Ajouter des délais entre les appels massifs
3. Surveiller les stats régulièrement
4. Gérer les erreurs gracieusement

```typescript
try {
  const result = await solveCryptarithm(request);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Informer l'utilisateur
    showAlert('Limite atteinte, veuillez patienter...');
  }
}
```

### ❌ À ÉVITER

1. Appels API dans des boucles sans délai
2. Désactiver le rate limiting en production
3. Ignorer les erreurs de rate limiting
4. Faire des requêtes identiques répétées

```typescript
// ❌ MAUVAIS
for (let i = 0; i < 100; i++) {
  await solveCryptarithm(request);
}

// ✅ BON
for (let i = 0; i < 100; i++) {
  await solveCryptarithm(request);
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Architecture Technique

### Flux d'une requête

```
┌─────────────────┐
│  Composant UI   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ cryptatorApi.ts │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limiter   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Cache │ │ Queue │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
    ┌─────────┐
    │   API   │
    └─────────┘
```

### Structure des fichiers

```
src/
├── services/
│   ├── rateLimiter.ts      # Logique du rate limiting
│   └── cryptatorApi.ts     # API avec rate limiting intégré
└── components/
    └── RateLimitMonitor.tsx # UI de monitoring
```

## Sécurité Côté Serveur

**Note:** Ce rate limiting est côté CLIENT. Pour une sécurité complète:

1. **Implémenter un rate limiting côté serveur** (Spring Boot):
```java
@RateLimit(limit = 10, duration = 1, unit = TimeUnit.MINUTES)
public ResponseEntity<SolveResponse> solve(@RequestBody SolveRequest request) {
    // ...
}
```

2. **Utiliser des tokens d'authentification**
3. **Logger les tentatives d'abus**
4. **Mettre en place des règles de firewall**

## FAQ

**Q: Puis-je désactiver le rate limiting?**  
A: Techniquement oui, mais fortement déconseillé. Cela peut surcharger le serveur.

**Q: Le cache fonctionne entre plusieurs onglets?**  
A: Non, le cache est isolé par onglet. L'historique des requêtes est partagé via localStorage.

**Q: Que se passe-t-il si je dépasse les limites?**  
A: Les requêtes sont automatiquement mises en file d'attente et exécutées dès que possible.

**Q: Comment augmenter les limites pour les tests?**  
A: Modifier les valeurs dans `rateLimiter.ts` ou créer un limiter personnalisé.

**Q: Le rate limiting affecte-t-il les performances?**  
A: Non, l'overhead est minimal (~1ms). Le cache améliore même les performances.

## Support

Pour tout problème ou question:
1. Vérifier les logs de la console
2. Consulter les stats avec `getRateLimitStats()`
3. Tester avec le composant `RateLimitMonitor`
4. Contacter l'équipe de développement

---

**Version:** 1.0.0  
**Dernière mise à jour:** Février 2026
