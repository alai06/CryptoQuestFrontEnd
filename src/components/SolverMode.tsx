import { useState } from 'react';
import { ArrowLeft, Play, Loader, Download, Plus, Minus, X, Grid3x3, Sparkles, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { solveCryptarithm as solveCryptarithmAPI } from '../services/cryptatorApi';
import BackButtonWithProgress from './BackButtonWithProgress';
import { SelectField, NumberInput, CheckboxField } from './FormComponents';

interface SolverModeProps {
  onBack: () => void;
  generatedCryptarithms?: Array<{ equation: string, solution: Record<string, string> }>;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'crossed' | 'long-multiplication' | 'generated';

const cryptarithmExamples: Record<OperationType, string[]> = {
  addition: [
    'SEND + MORE = MONEY',
    'TWO + TWO = FOUR',
    'SO + MANY = HAPPY',
    'ABC + DEF = GHIJ',
    'CAT + DOG = PETS',
  ],
  subtraction: [
    'SEVEN - TWO = FIVE',
    'NINE - ONE = EIGHT',
    'ABC - DE = FG',
    'HAPPY - SAD = JOY',
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
    'AB * CD && EFG + HIJ = KLMN',
    'ABC * DE && FGHI + JKLM = NOPQR',
    'AB * CD && EF + GHI = JKLM',
  ],
  generated: [],
};

export default function SolverMode({ onBack, generatedCryptarithms, isMobile = false, onOpenSidebar }: SolverModeProps) {
  const [equation, setEquation] = useState('');
  const [solving, setSolving] = useState(false);
  const [solutions, setSolutions] = useState<Array<Record<string, number>>>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OperationType>('addition');
  
  // Advanced API options
  const [solverType, setSolverType] = useState<'SCALAR' | 'BIGNUM' | 'CRYPT' | 'ADAPT' | 'ADAPTC'>('SCALAR');
  const [solutionLimit, setSolutionLimit] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [arithmeticBase, setArithmeticBase] = useState<number>(10);
  const [allowLeadingZeros, setAllowLeadingZeros] = useState<boolean>(false);
  const [hornerScheme, setHornerScheme] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  const handleSolve = async () => {
    if (!equation.trim()) {
      setError('Veuillez entrer une équation');
      return;
    }

    setSolving(true);
    setError('');
    setSolutions([]);
    setCurrentSolutionIndex(0);

    try {
      const response = await solveCryptarithmAPI({
        cryptarithm: equation,
        solverType: solverType,
        solutionLimit: solutionLimit,
        timeLimit: timeLimit,
        arithmeticBase: arithmeticBase,
        allowLeadingZeros: allowLeadingZeros,
        hornerScheme: hornerScheme,
      });

      if (response.success && response.solutions.length > 0) {
        // Convert API solutions to the format expected by the UI
        const convertedSolutions = response.solutions.map(sol => {
          const assignment: Record<string, number> = {};

          if (sol.assignment.includes('\n')) {
            // New format: two lines with pipes
            // Line 1:  S| E| N| D| ...
            // Line 2:  9| 5| 6| 7| ...
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
            // Old format: "s=9, e=5, n=6, d=7, m=1, o=0, r=8, y=2"
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
      setError(err instanceof Error ? err.message : 'Erreur lors de la résolution');
    } finally {
      setSolving(false);
    }
  };

  const handleExport = () => {
    if (!solutions) return;

    const exportData = {
      equation,
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

  const renderEquationWithSolution = (solution: Record<string, number>) => {
    return equation.split('').map((char, index) => {
      if (/[A-Z]/.test(char) && solution[char] !== undefined) {
        return (
          <span key={index} className="relative inline-block mx-1">
            <span className="text-[#1D1D1F]">{char}</span>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[#0096BC] text-sm font-medium">
              {solution[char]}
            </span>
          </span>
        );
      }
      return <span key={index}>{char}</span>;
    });
  };

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Main Container */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-10">
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
                { value: 'subtraction', label: 'Soustraction', icon: Minus },
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
                <NumberInput
                  label="Limite de solutions"
                  value={solutionLimit}
                  onChange={(val) => setSolutionLimit(val ?? 0)}
                  min={0}
                  max={1000}
                  helpText="0 = toutes les solutions"
                />

                {/* Time Limit */}
                <NumberInput
                  label="Temps limite (secondes)"
                  value={timeLimit}
                  onChange={(val) => setTimeLimit(val ?? 0)}
                  min={0}
                  max={300}
                  helpText="0 = pas de limite"
                />

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
            onClick={handleSolve}
            disabled={solving || !equation.trim()}
            className="w-full py-4 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6 text-[14px] font-medium"
          >
            {solving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                <span>Résolution en cours...</span>
              </>
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

                {/* Equation with solution */}
                <div className="text-2xl mb-10 font-mono text-center pb-8">
                  {renderEquationWithSolution(solutions[currentSolutionIndex])}
                </div>

                {/* Letter-Digit Mapping */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {Object.entries(solutions[currentSolutionIndex]).map(([letter, digit]) => (
                    <div
                      key={letter}
                      className="bg-white rounded-[12px] p-4 text-center border border-[#E5E5E5]"
                    >
                      <div className="text-[16px] text-[#86868B] mb-1">{letter}</div>
                      <div className="text-[24px] text-[#0096BC] font-mono font-semibold">{digit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Solutions Grid - Compact View */}
              {solutions.length > 1 && (
                <div>
                  <p className="text-[14px] text-[#86868B] mb-3">Toutes les solutions ({solutions.length})</p>
                  <div className="grid grid-cols-4 gap-3">
                    {solutions.map((solution, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSolutionIndex(index)}
                        className={`
                          p-4 rounded-[12px] border transition-all text-left
                          ${currentSolutionIndex === index
                            ? 'border-[#0096BC] bg-[#E8F7FB]'
                            : 'border-[#E5E5E5] bg-white hover:border-[#0096BC]/40'
                          }
                        `}
                      >
                        <div className="text-[12px] text-[#86868B] mb-2">Solution {index + 1}</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(solution).slice(0, 4).map(([letter, digit]) => (
                            <span key={letter} className="text-[11px] font-mono text-[#1D1D1F]">
                              {letter}={digit}
                            </span>
                          ))}
                          {Object.keys(solution).length > 4 && (
                            <span className="text-[11px] text-[#86868B]">+{Object.keys(solution).length - 4}</span>
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