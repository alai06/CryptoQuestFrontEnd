import { useState, useRef, useEffect } from 'react';
import { Play, Loader, Download, Plus, X, Grid3x3, Sparkles, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { solveCryptarithm as solveCryptarithmAPI, getApiLimits, cancelTask } from '../services/cryptatorApi';
import BackButtonWithProgress from './BackButtonWithProgress';
import { SelectField, NumberInput, CheckboxField } from './FormComponents';
import VerticalCryptarithm from './VerticalCryptarithm';
import CrossedCryptarithm from './CrossedCryptarithm';

interface SolverModeProps {
  onBack: () => void;
  generatedCryptarithms?: Array<{ equation: string, solution: Record<string, string> }>;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

type OperationType = 'addition' | 'multiplication' | 'crossed' | 'long-multiplication' | 'generated';

const cryptarithmExamples: Record<OperationType, string[]> = {
  addition: [
    'SEND + MORE = MONEY',
    'TWO + TWO = FOUR',
    'SO + MANY = HAPPY',
    'ABC + DEF = GHIJ',
    'CAT + DOG = PETS',
  ],
  multiplication: [
    'AB * C = DEF',
    'TWO * TWO = FOUR',
    'AB * CD = EFGH',
  ],
  crossed: [
    'A + B = C && D + E = F && G + H = I',
    'AB + CD = EF && GH + IJ = KL && MN + OP = QR',
    'ABC + DEF = GHI && JKL + MNO = PQR',
  ],
  'long-multiplication': [
    "CUT * T = BUST && CUT * I = TNNT && TNNT * '10' + BUST = TENET && TENET = CUT * IT",
    "RED * S = ARCS && RED * A = RED && RED * '10' + ARCS = CDTS && CDTS = RED * AS",
    "SEE * SO = MIMEO && MIMEO = EMOO + '10'*MESS && SEE * O = EMOO && SEE * S = MESS",
  ],
  generated: [],
};

export default function SolverMode({ onBack, generatedCryptarithms, isMobile = false, onOpenSidebar }: SolverModeProps) {
  const [equation, setEquation] = useState('');
  const [solvedEquation, setSolvedEquation] = useState(''); // équation confirmée par le serveur
  const [solving, setSolving] = useState(false);
  const [solutions, setSolutions] = useState<Array<Record<string, number>>>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [error, setError] = useState('');
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const currentTaskIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const solveGenerationRef = useRef<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<OperationType>('addition');
  
  // Advanced API options
  const [solverType, setSolverType] = useState<'SCALAR' | 'BIGNUM' | 'CRYPT' | 'ADAPT' | 'ADAPTC'>('SCALAR');
  const [solutionLimit, setSolutionLimit] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [arithmeticBase, setArithmeticBase] = useState<number>(10);
  const [allowLeadingZeros, setAllowLeadingZeros] = useState<boolean>(false);
  const [hornerScheme, setHornerScheme] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  const API_LIMITS = getApiLimits();

  // Cleanup: cancel any in-flight request when the component unmounts (e.g. user navigates away)
  useEffect(() => {
    return () => {
      solveGenerationRef.current++;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const taskId = currentTaskIdRef.current;
      if (taskId) {
        cancelTask(taskId).catch(() => {});
        currentTaskIdRef.current = null;
      }
    };
  }, []);

  const handleSolve = async () => {
    if (!equation.trim()) {
      setError('Veuillez entrer une équation');
      return;
    }

    // Abort any previous in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const previousTaskId = currentTaskIdRef.current;
    if (previousTaskId) {
      cancelTask(previousTaskId).catch(() => {});
      currentTaskIdRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentGeneration = ++solveGenerationRef.current;

    setSolving(true);
    setError('');
    setSolutions([]);
    setSolvedEquation('');
    setCurrentSolutionIndex(0);
    setIsCancelHovered(false);

    const taskId = crypto.randomUUID();
    currentTaskIdRef.current = taskId;

    try {
      const response = await solveCryptarithmAPI({
        cryptarithm: equation,
        taskId: taskId,
        solverType: solverType,
        solutionLimit: solutionLimit,
        timeLimit: timeLimit,
        arithmeticBase: arithmeticBase,
        allowLeadingZeros: allowLeadingZeros,
        hornerScheme: hornerScheme,
      }, controller.signal);

      // Ignore stale response if a newer request was started or cancel was pressed
      if (currentGeneration !== solveGenerationRef.current) return;

      if (response.success && response.solutions.length > 0) {
        // Snapshot the equation at the moment the server responds
        setSolvedEquation(equation);
        // Convert API solutions to the format expected by the UI
        const convertedSolutions = response.solutions.map(sol => {
          const assignment: Record<string, number> = {};

          if (sol.assignment.includes('\n')) {
            const lines = sol.assignment.split('\n');
            if (lines.length >= 2) {
              const keys = lines[0].split('|').map(s => s.trim()).filter(s => s);
              const values = lines[1].split('|').map(s => s.trim()).filter(s => s);
              keys.forEach((key, i) => {
                if (values[i] !== undefined) {
                  assignment[key.toUpperCase()] = parseInt(values[i], 10);
                }
              });
            }
          } else if (sol.assignment.includes('=')) {
            sol.assignment.split(',').forEach(pair => {
              const [letter, digit] = pair.trim().split('=');
              if (letter && digit) {
                assignment[letter.toUpperCase()] = parseInt(digit, 10);
              }
            });
          }
          return assignment;
        });
        setSolutions(convertedSolutions);
      } else {
        setError(response.error || 'Aucune solution trouvée pour ce cryptarithme');
      }
    } catch (err) {
      // Ignore stale errors
      if (currentGeneration !== solveGenerationRef.current) return;

      // AbortError means user cancelled — don't show any error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      const errMsg = err instanceof Error ? err.message : 'Erreur lors de la résolution';
      if (!errMsg.includes('cancelled') && !errMsg.includes('annul')) {
        setError(errMsg);
      }
    } finally {
      // Only update UI state if this is still the current request
      if (currentGeneration === solveGenerationRef.current) {
        setSolving(false);
        setIsCancelHovered(false);
        currentTaskIdRef.current = null;
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelSolve = async () => {
    // Bump generation so the in-flight request's response is ignored
    solveGenerationRef.current++;

    // Abort the fetch request immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Also tell the backend to cancel the task (fire-and-forget)
    const taskId = currentTaskIdRef.current;
    if (taskId) {
      currentTaskIdRef.current = null;
      cancelTask(taskId).catch(() => {});
    }

    // Reset UI immediately — no stale error will appear because generation was bumped
    setSolving(false);
    setIsCancelHovered(false);
    setError('');
  };

  const handleExport = () => {
    if (!solutions) return;

    const exportData = {
      equation: solvedEquation,
      solutions,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptarithm-solution-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fonction pour convertir l'équation avec les lettres en équation avec les chiffres
  const getEquationWithNumbers = (solution: Record<string, number>): string => {
    let equationWithNumbers = solvedEquation;
    
    // Remplacer chaque lettre par sa valeur numérique
    Object.keys(solution)
      .sort((a, b) => b.length - a.length) // Trier par longueur décroissante
      .forEach(letter => {
        const value = solution[letter];
        equationWithNumbers = equationWithNumbers.replace(new RegExp(letter, 'g'), value.toString());
      });
    
    return equationWithNumbers;
  };

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Mobile Header - Only on mobile */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onOpenSidebar}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
              <h1 className="text-[18px] font-bold text-[#1D1D1F]">Résolution</h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <div className={isMobile ? "" : "bg-white rounded-[12px] border border-[#E5E5E5] p-10"}>
          {/* Back Button - Mobile only */}
          {isMobile && <BackButtonWithProgress onBack={onBack} />}

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-[32px] font-bold mb-2 tracking-[-0.02em]">Mode Résolution</h1>
            <p className="text-[#86868B] text-[14px]">
              Entrez un cryptarithme et laissez le solveur trouver la solution automatiquement
            </p>
          </div>

          {/* Input Section */}
          <div className="mb-8">
            <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
              Équation du cryptarithme
            </label>
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value.toUpperCase())}
              placeholder="Ex: SEND + MORE = MONEY"
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-[12px] focus:border-[#0096BC] focus:outline-none transition-colors bg-white text-[#1D1D1F] placeholder:text-[#86868B] text-[14px]"
            />
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <p className="text-[14px] text-[#86868B] mb-4">Exemples par type d'opération</p>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'addition', label: 'Addition', icon: Plus },
                { value: 'multiplication', label: 'Multiplication', icon: X },
                { value: 'crossed', label: 'Opération croisée', icon: Grid3x3 },
                { value: 'long-multiplication', label: 'Multiplication longue', icon: Grid3x3 },
                ...(generatedCryptarithms && generatedCryptarithms.length > 0
                  ? [{ value: 'generated' as OperationType, label: 'Générés', icon: Sparkles }]
                  : []),
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value as OperationType)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all
                    ${selectedCategory === value
                      ? 'bg-[#0096BC] text-white'
                      : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E5]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Examples */}
            <div className="flex flex-wrap gap-2">
              {selectedCategory === 'generated' && generatedCryptarithms ? (
                generatedCryptarithms.map((crypto, index) => (
                  <button
                    key={index}
                    onClick={() => setEquation(crypto.equation)}
                    className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-[12px] hover:bg-[#E5E5E5] transition-colors text-[14px]"
                  >
                    {crypto.equation}
                  </button>
                ))
              ) : (
                cryptarithmExamples[selectedCategory]?.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setEquation(example)}
                    className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-[12px] hover:bg-[#E5E5E5] transition-colors text-[14px]"
                  >
                    {example}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="mb-8 border-t border-[#E5E5E5] pt-6">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F7] hover:bg-[#E5E5E5] rounded-[12px] transition-all mb-4"
            >
              <span className="text-[16px] font-semibold text-[#1D1D1F]">
                Options avancées du solver
              </span>
              <span className="text-[14px] text-[#86868B]">
                {showAdvancedOptions ? '▼' : '▶'}
              </span>
            </button>

            {showAdvancedOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-[#FAFAFA] rounded-[12px]">
                {/* Solver Type */}
                <SelectField
                  label="Type de solver"
                  value={solverType}
                  onChange={(val) => setSolverType(val as 'SCALAR' | 'BIGNUM' | 'CRYPT' | 'ADAPT' | 'ADAPTC')}
                  options={[
                    { value: 'SCALAR', label: 'SCALAR (Standard)' },
                    { value: 'BIGNUM', label: 'BIGNUM (Grands nombres)' },
                    { value: 'CRYPT', label: 'CRYPT (Spécialisé)' },
                    { value: 'ADAPT', label: 'ADAPT (Adaptatif)' },
                    { value: 'ADAPTC', label: 'ADAPTC (Adaptatif avancé)' },
                  ]}
                />

                {/* Solution Limit */}
                <div>
                  <NumberInput
                    label="Limite de solutions"
                    value={solutionLimit}
                    onChange={(val) => setSolutionLimit(val ?? 0)}
                    min={0}
                    max={API_LIMITS.maxSolutionsPerRequest}
                    helpText={`0 = toutes (max ${API_LIMITS.maxSolutionsPerRequest})`}
                  />
                  {solutionLimit > API_LIMITS.maxSolutionsPerRequest && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Maximum {API_LIMITS.maxSolutionsPerRequest} solutions par requête
                    </p>
                  )}
                </div>

                {/* Time Limit */}
                <div>
                  <NumberInput
                    label="Temps limite (secondes)"
                    value={timeLimit}
                    onChange={(val) => setTimeLimit(val ?? 0)}
                    min={0}
                    max={API_LIMITS.maxTimeLimit}
                    helpText={`0 = pas de limite (max ${API_LIMITS.maxTimeLimit}s)`}
                  />
                  {timeLimit > API_LIMITS.maxTimeLimit && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Maximum {API_LIMITS.maxTimeLimit} secondes par requête
                    </p>
                  )}
                </div>

                {/* Arithmetic Base */}
                <NumberInput
                  label="Base arithmétique"
                  value={arithmeticBase}
                  onChange={(val) => setArithmeticBase(val ?? 10)}
                  min={2}
                  max={36}
                  helpText="Par défaut : 10 (décimal)"
                />

                {/* Allow Leading Zeros */}
                <CheckboxField
                  id="solver-allowLeadingZeros"
                  label="Autoriser les zéros en début de mot"
                  checked={allowLeadingZeros}
                  onChange={setAllowLeadingZeros}
                />

                {/* Horner Scheme */}
                <CheckboxField
                  id="hornerScheme"
                  label="Utiliser le schéma de Horner"
                  checked={hornerScheme}
                  onChange={setHornerScheme}
                />
              </div>
            )}
          </div>

          {/* Solve Button */}
          <button
            onClick={solving ? handleCancelSolve : handleSolve}
            disabled={!solving && !equation.trim()}
            onMouseEnter={() => solving && setIsCancelHovered(true)}
            onMouseLeave={() => setIsCancelHovered(false)}
            className={`w-full py-4 text-white rounded-[12px] transition-colors flex items-center justify-center gap-3 mb-6 text-[14px] font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
              solving && isCancelHovered
                ? 'bg-[#FF3B30] hover:bg-[#CC2A1F] cursor-pointer'
                : solving
                ? 'bg-[#0096BC] cursor-default'
                : 'bg-[#0096BC] hover:bg-[#007EA1]'
            }`}
          >
            {solving ? (
              isCancelHovered ? (
                <>
                  <X className="w-5 h-5" strokeWidth={2} />
                  <span>Annuler la résolution</span>
                </>
              ) : (
                <>
                  <Loader className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                  <span>Résolution en cours...</span>
                </>
              )
            ) : (
              <>
                <Play className="w-5 h-5" strokeWidth={1.5} />
                <span>Résoudre</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] text-[#FF3B30] text-[14px]">
              {error}
            </div>
          )}

          {/* Solution Display */}
          {solutions.length > 0 && (
            <div className="space-y-6">
              {/* Current Solution Display */}
              <div className="bg-[#F5FFF5] border border-[#D4F4DD] rounded-[12px] p-8">
                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentSolutionIndex(Math.max(0, currentSolutionIndex - 1))}
                    disabled={currentSolutionIndex === 0}
                    className="p-2 rounded-[8px] hover:bg-[#E5E5E5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                  </button>

                  <div className="text-center">
                    <p className="text-[14px] text-[#86868B] mb-1">Solution</p>
                    <p className="text-[20px] font-semibold tracking-[-0.01em]">
                      {currentSolutionIndex + 1} / {solutions.length}
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentSolutionIndex(Math.min(solutions.length - 1, currentSolutionIndex + 1))}
                    disabled={currentSolutionIndex === solutions.length - 1}
                    className="p-2 rounded-[8px] hover:bg-[#E5E5E5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Affichage côte à côte : équation avec lettres et équation avec chiffres */}
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-6 md:p-10 border border-purple-200 mb-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Cryptarithme avec lettres */}
                    <div>
                      <p className="text-center text-[14px] text-[#86868B] mb-4 font-medium">Cryptarithme</p>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-[12px] p-6 md:p-8 border border-[#E5E5E5] shadow-sm">
                          {(() => {
                            const equation = solvedEquation;
                            const sizeForDisplay = isMobile ? 'small' : 'medium';
                            // Conversion du format API (&&) vers le format du composant (|) pour les opérations croisées
                            if (equation.includes('&&')) {
                              // Format CROSS: "AN + ODE = TUT && TA + TEL = SUT && ..."
                              // Prendre les 3 premières équations et les joindre avec |
                              const equations = equation.split('&&').map((eq: string) => eq.trim());
                              const crossEquation = equations.slice(0, 3).join(' | ');
                              return <CrossedCryptarithm equation={crossEquation} size={sizeForDisplay} />;
                            } else if (equation.includes('|')) {
                              return <CrossedCryptarithm equation={equation} size={sizeForDisplay} />;
                            } else {
                              return <VerticalCryptarithm equation={equation} size={sizeForDisplay} />;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Solution avec chiffres */}
                    <div>
                      <p className="text-center text-[14px] text-[#86868B] mb-4 font-medium">Solution</p>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-[12px] p-6 md:p-8 border-2 border-[#0096BC] shadow-sm">
                          {(() => {
                            const equationWithNumbers = getEquationWithNumbers(solutions[currentSolutionIndex]);
                            const sizeForDisplay = isMobile ? 'small' : 'medium';
                            // Conversion du format API (&&) vers le format du composant (|) pour les opérations croisées
                            if (equationWithNumbers.includes('&&')) {
                              // Format CROSS
                              const equations = equationWithNumbers.split('&&').map((eq: string) => eq.trim());
                              const crossEquation = equations.slice(0, 3).join(' | ');
                              return <CrossedCryptarithm equation={crossEquation} size={sizeForDisplay} />;
                            } else if (equationWithNumbers.includes('|')) {
                              return <CrossedCryptarithm equation={equationWithNumbers} size={sizeForDisplay} />;
                            } else {
                              return <VerticalCryptarithm equation={equationWithNumbers} size={sizeForDisplay} />;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Letter-Digit Mapping */}
                <div className="mb-8">
                  <p className="text-center text-[14px] text-[#86868B] mb-4">Correspondance lettre → chiffre</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                    {Object.entries(solutions[currentSolutionIndex])
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([letter, digit]) => (
                        <div
                          key={letter}
                          className="bg-white rounded-[12px] p-2 md:p-4 text-center border border-[#E5E5E5] hover:border-[#0096BC] transition-colors"
                        >
                          <div className="text-xs md:text-[16px] text-[#86868B] mb-0.5 md:mb-1 font-medium">{letter}</div>
                          <div className="text-lg md:text-[32px] text-[#0096BC] font-mono font-bold">{digit}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* All Solutions Grid - Compact View */}
              {solutions.length > 1 && (
                <div className="mb-8">
                  <p className="text-[14px] text-[#86868B] mb-3">Toutes les solutions ({solutions.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {solutions.map((solution, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSolutionIndex(index)}
                        className={`
                          p-3 md:p-4 rounded-[12px] border transition-all text-left
                          ${currentSolutionIndex === index
                            ? 'border-[#0096BC] bg-[#E8F7FB]'
                            : 'border-[#E5E5E5] bg-white hover:border-[#0096BC]/40'
                          }
                        `}
                      >
                        <div className="text-[11px] md:text-[12px] text-[#86868B] mb-2 font-medium">Solution {index + 1}</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(solution).slice(0, 4).map(([letter, digit]) => (
                            <span key={letter} className="text-[10px] md:text-[11px] font-mono text-[#1D1D1F] bg-[#F5F5F7] px-1.5 py-0.5 rounded">
                              {letter}={digit}
                            </span>
                          ))}
                          {Object.keys(solution).length > 4 && (
                            <span className="text-[10px] md:text-[11px] text-[#86868B]">+{Object.keys(solution).length - 4}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-colors text-[14px] font-medium"
                >
                  <Download className="w-5 h-5" strokeWidth={1.5} />
                  <span>Exporter {solutions.length > 1 ? 'les solutions' : 'la solution'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}