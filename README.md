# 🧩 CryptoQuest - Application Web de Cryptarithmes

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

CryptoQuest est une application web interactive dédiée aux cryptarithmes - des puzzles mathématiques où chaque lettre représente un chiffre unique. L'application offre une expérience ludique et éducative pour résoudre, générer et apprendre les cryptarithmes.

 **Dépôt GitHub** : [https://github.com/alai06/CryptoQuestFrontEnd](https://github.com/alai06/CryptoQuestFrontEnd)

 **Application en ligne** : [Hébergée sur Vercel](https://cryptoquestfrontend.vercel.app/)



---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Lancer l'application](#-lancer-lapplication)
- [Architecture](#-architecture)
- [API Backend](#-api-backend)
- [Tests](#-tests)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎯 Présentation

Les **cryptarithmes** (ou cryptarithmétiques) sont des puzzles mathématiques où les chiffres d'une opération arithmétique sont remplacés par des lettres. Le défi consiste à retrouver quelle lettre correspond à quel chiffre, sachant que :
- Chaque lettre représente un chiffre unique (0-9)
- Les lettres en début de mot ne peuvent pas être des zéros
- L'opération mathématique doit être valide

**Exemple classique** : `SEND + MORE = MONEY`

CryptoQuest propose une interface moderne et intuitive pour explorer ces puzzles fascinants, avec plusieurs modes de jeu adaptés à tous les niveaux.

---

## ✨ Fonctionnalités

### 🎮 Modes de jeu

1. **Mode Tutoriel**
   - Introduction progressive aux concepts des cryptarithmes
   - Explications pas à pas
   - Exemples interactifs
   - Parfait pour les débutants

2. **Mode Jeu**
   - Résolution de cryptarithmes avec système de drag & drop
   - Interface intuitive pour assigner des chiffres aux lettres
   - Vérification en temps réel des solutions
   - Système de progression avec niveaux et étoiles

3. **Mode Résolution (Solver)**
   - Saisissez votre propre cryptarithme
   - Algorithme de résolution automatique
   - Affichage de toutes les solutions possibles
   - Choix entre plusieurs types de solveurs (SCALAR, BIGNUM, CRYPT, ADAPT, ADAPTC)
   - Options avancées (limite de solutions, timeout, base arithmétique, etc.)

4. **Mode Génération**
   - Génération automatique de cryptarithmes aléatoires
   - Paramètres personnalisables (difficulté, type, etc.)
   - Sauvegarde des cryptarithmes générés
   - Exportation possible

5. **Tableau de progression**
   - Suivi des statistiques personnelles
   - Niveaux débloqués
   - Étoiles gagnées
   - Badges et récompenses
   - Historique des performances

### 🌍 Fonctionnalités générales

- **Interface bilingue** : Français et Anglais
- **Design responsive** : Compatible mobile, tablette et desktop
- **Thème moderne** : Interface soignée avec Tailwind CSS
- **Sauvegarde locale** : Progression automatiquement sauvegardée
- **Rate Limiting** : Gestion intelligente des appels API
- **Mise en cache** : Optimisation des performances
- **Visualisations multiples** : Cryptarithmes verticaux et croisés
- **Feedback en temps réel** : Alertes et notifications

---

## 🛠 Technologies utilisées

### Frontend

- **[React 18.3.1](https://reactjs.org/)** - Framework UI avec Hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique pour JavaScript
- **[Vite 6.3.5](https://vitejs.dev/)** - Build tool et dev server ultra-rapide
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitaire
- **[Lucide React](https://lucide.dev/)** - Bibliothèque d'icônes modernes
- **[clsx](https://github.com/lukeed/clsx)** - Utilitaire pour classes CSS conditionnelles
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Fusion intelligente de classes Tailwind

### Build & Développement

- **Vite SWC Plugin** - Compilation ultra-rapide avec SWC
- **TypeScript Config** - Configuration stricte pour la qualité du code



---

## � Lancer l'application

### Utiliser l'application en ligne

L'application est accessible directement sur : **[https://cryptoquestfrontend.vercel.app/](https://cryptoquestfrontend.vercel.app/)**

### Lancer localement sur votre machine

1. **Cloner le dépôt**

```bash
git clone https://github.com/alai06/CryptoQuestFrontEnd.git
cd CryptoQuestFrontEnd
```

2. **Installer les dépendances**

```bash
npm i
```

3. **Lancer le serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Backend API

Pour lancer le backend localement, consultez le README du dépôt backend :
👉 [https://github.com/BelotFlorent/cryptator-api](https://github.com/BelotFlorent/cryptator-api)

---

## 📁 Architecture

### Structure du projet

```
CryptoQuestFrontEnd/
├── public/                  # Assets publics statiques
├── src/
│   ├── assets/             # Images, icônes, medias
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants UI réutilisables
│   │   ├── HomeScreen.tsx
│   │   ├── TutorialMode.tsx
│   │   ├── GameMode.tsx
│   │   ├── SolverMode.tsx
│   │   ├── GeneratorMode.tsx
│   │   ├── ProgressDashboard.tsx
│   │   ├── DragDropBoard.tsx
│   │   ├── CrossedCryptarithm.tsx
│   │   ├── VerticalCryptarithm.tsx
│   │   ├── NavigationMenu.tsx
│   │   ├── MobileHomeScreen.tsx
│   │   ├── MobileSidebar.tsx
│   │   ├── MobilePageHeader.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── BackButtonWithProgress.tsx
│   │   ├── SolutionDisplay.tsx
│   │   ├── RateLimitMonitor.tsx
│   │   └── FormComponents.tsx
│   ├── services/           # Services API et logique métier
│   │   ├── cryptatorApi.ts      # Client API backend
│   │   └── rateLimiter.ts       # Gestion du rate limiting
│   ├── utils/              # Fonctions utilitaires
│   │   ├── cryptarithmSolver.ts  # Algorithme de résolution
│   │   ├── translations.ts       # Gestion i18n
│   │   └── storageUtils.ts       # LocalStorage helpers
│   ├── tests/              # Tests unitaires et d'intégration
│   │   └── rateLimiter.test.ts
│   ├── examples/           # Exemples de code
│   │   └── RateLimitIntegrationExamples.tsx
│   ├── styles/             # Styles globaux
│   │   └── globals.css
│   ├── App.tsx             # Composant principal
│   ├── main.tsx            # Point d'entrée React
│   ├── types.ts            # Définitions TypeScript globales
│   └── index.css           # Styles de base
├── build/                  # Build de production (généré)
├── TestUtilisateurs/       # Tests utilisateurs
├── .gitignore
├── index.html              # Template HTML
├── package.json            # Dépendances et scripts
├── tsconfig.json           # Configuration TypeScript
├── tsconfig.node.json      # Config TypeScript pour Node
├── vite.config.ts          # Configuration Vite
├── vercel.json             # Configuration Vercel
└── README.md               # Ce fichier
```

### Composants principaux

#### Écrans principaux

- **`HomeScreen`** : Page d'accueil avec sélection des modes
- **`TutorialMode`** : Mode tutoriel interactif
- **`GameMode`** : Mode jeu avec drag & drop
- **`SolverMode`** : Outil de résolution de cryptarithmes
- **`GeneratorMode`** : Générateur de cryptarithmes aléatoires
- **`ProgressDashboard`** : Tableau de bord des statistiques

#### Composants UI

- **`DragDropBoard`** : Interface drag & drop pour assigner les chiffres
- **`CrossedCryptarithm`** : Affichage de cryptarithmes croisés
- **`VerticalCryptarithm`** : Affichage de cryptarithmes verticaux
- **`SolutionDisplay`** : Affichage formaté des solutions
- **`AlertBanner`** : Bannière de notifications
- **`PrimaryButton`** : Bouton principal stylisé

#### Services

- **`cryptatorApi.ts`** : 
  - Communication avec l'API backend
  - Résolution de cryptarithmes via API
  - Génération de cryptarithmes via API
  - Gestion des erreurs et timeouts
  - Types TypeScript pour les requêtes/réponses

- **`rateLimiter.ts`** :
  - Limitation du nombre de requêtes API
  - Système de cache intelligent
  - File d'attente des requêtes
  - Monitoring de l'utilisation

#### Utilitaires

- **`cryptarithmSolver.ts`** : Algorithme de résolution local (fallback)
- **`translations.ts`** : Système de traduction FR/EN
- **`storageUtils.ts`** : Gestion sécurisée du localStorage

---

## 🔌 API Backend

CryptoQuest Frontend communique avec une API backend pour la résolution et la génération de cryptarithmes.

**Repository Backend** : [https://github.com/BelotFlorent/cryptator-api](https://github.com/BelotFlorent/cryptator-api)

### Endpoints utilisés

#### 1. Résolution de cryptarithmes

```
POST /api/v1/solve
```

**Requête** :
```typescript
{
  cryptarithm: string;          // Ex: "SEND + MORE = MONEY"
  solverType?: SolverType;      // SCALAR | BIGNUM | CRYPT | ADAPT | ADAPTC
  solutionLimit?: number;       // Limite de solutions à retourner
  timeLimit?: number;           // Timeout en millisecondes
  arithmeticBase?: number;      // Base arithmétique (défaut: 10)
  allowLeadingZeros?: boolean;  // Autoriser zéros en début
  assignments?: Record<string, number>; // Pré-assignations
}
```

**Réponse** :
```typescript
{
  success: boolean;
  cryptarithm: string;
  solutions: Solution[];
  solutionCount: number;
  executionTimeMs: number;
  error?: string;
}
```

#### 2. Génération de cryptarithmes

```
POST /api/v1/generate
```

**Requête** :
```typescript
{
  operation?: string;           // Type d'opération (+, -, *, /)
  difficulty?: number;          // Niveau de difficulté
  rightMemberType?: RightMemberType; // FREE | UNIQUE | FIXED
  wordCount?: number;           // Nombre de mots
  maxLength?: number;           // Longueur maximale
}
```

**Réponse** :
```typescript
{
  success: boolean;
  cryptarithm: string;
  solution: string;
  difficulty: number;
  error?: string;
}
```

### Rate Limiting

Le frontend implémente un système de rate limiting pour protéger l'API :
- **Limite** : 10 requêtes par seconde
- **Cache** : Les résultats sont mis en cache pour éviter les requêtes dupliquées
- **File d'attente** : Les requêtes excédentaires sont mises en attente

---


---

## 📄 Licence

Ce projet est sous licence **MIT**. 

---

## 👥 Auteurs

- **Alexis DUBARRY**
- **Florent BELOT**
- **Shanti NOEL**
- **Allah-Eddine CHERIGUI**

---

## 🙏 Remerciements

Nous souhaitons à remercier notre tuteur M. Arnaud MALAPERT, qui nous a suivi durant tout le projet et qui est l'auteur de Cryptator sur lequel nous avons basé notre application

---



<div align="center">



</div>